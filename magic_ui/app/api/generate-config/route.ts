import { db } from "@/config/db";
import { openrouter } from "@/config/openrouter";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import { APP_LAYOUT_CONFIG_PROMPT, GENRATE_NEW_SCREEN_IN_EXISITING_PROJECT_PROJECT } from "@/data/Prompt";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 30_000;

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: any;
    };
  }[];
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const { userInput, deviceType, projectId, oldScreenDescription, theme } = await req.json();

    if (!userInput || !deviceType || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine the correct prompt
    const systemPrompt = oldScreenDescription
      ? GENRATE_NEW_SCREEN_IN_EXISITING_PROJECT_PROJECT
          .replace("{deviceType}", deviceType)
          .replace("{theme}", theme || "AURORA_INK")
      : APP_LAYOUT_CONFIG_PROMPT.replace("{deviceType}", deviceType);

    const userPrompt = oldScreenDescription
      ? `${userInput}. Context of existing screens: ${oldScreenDescription}`
      : userInput;

    const aiRequest = openrouter.chat.send({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: [{ type: "text", text: systemPrompt }] },
        { role: "user", content: [{ type: "text", text: userPrompt }] },
      ],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), TIMEOUT_MS)
    );

    const aiResult = (await Promise.race([aiRequest, timeoutPromise])) as OpenRouterResponse;

    // Extract content safely
    const content = aiResult?.choices?.[0]?.message?.content;
    let rawText = Array.isArray(content) ? content.find(c => c.type === "text")?.text || "" : content || "";

    if (!rawText) {
      return NextResponse.json({ error: "AI returned no text" }, { status: 500 });
    }

    // 1️⃣ CLEAN JSON (Essential for gpt-3.5)
    const cleanJsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJsonText);
    } catch (e) {
      console.error("JSON Parse Error:", cleanJsonText);
      return NextResponse.json({ error: "AI output was not valid JSON", raw: cleanJsonText }, { status: 502 });
    }

    // 2️⃣ FLEXIBLE VALIDATION
    // If it's a new screen for existing project,projectName might be optional
    const hasScreens = Array.isArray(parsed.screens) && parsed.screens.length > 0;
    
    if (!hasScreens) {
      return NextResponse.json({ error: "AI failed to generate screen configs", parsed }, { status: 502 });
    }

    // 3️⃣ DATABASE UPDATES
    // Update project meta ONLY if it's a new project (not adding a screen)
    if (!oldScreenDescription) {
      await db.update(ProjectTable).set({
        projectVisualDescription: parsed.projectVisualDescription || null,
        projectName: parsed.projectName || "New Project",
        theme: parsed.theme || "AURORA_INK",
      }).where(eq(ProjectTable.projectId, projectId));
    }

    // Insert new screen configs
    const insertedScreens = [];
    for (const screen of parsed.screens) {
      const result = await db.insert(ScreenConfigTable).values({
        projectId: projectId,
        purpose: screen.purpose,
        screenDescription: screen.layoutDescription || screen.description,
        screenId: screen.id || screen.screenId, 
        screenName: screen.name || screen.screenName,
      }).returning();
      insertedScreens.push(result[0]);
    }

    return NextResponse.json({
      success: true,
      data: {
        projectName: parsed.projectName,
        theme: parsed.theme,
        screens: insertedScreens, // Return the DB records
      }
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "AI service failed", message: error?.message }, { status: 502 });
  }
}

// DELETE remains same but added null-safety for searchParams
export async function DELETE(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const screenId = req.nextUrl.searchParams.get("screenId");

  if (!projectId || !screenId) {
    return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
  }

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(ScreenConfigTable).where(
    and(
      eq(ScreenConfigTable.screenId, screenId),
      eq(ScreenConfigTable.projectId, projectId)
    )
  );

  return NextResponse.json({ message: "Screen Deleted Successfully" });
}