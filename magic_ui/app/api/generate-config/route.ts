import { db } from "@/config/db";
import { openrouter } from "@/config/openrouter";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/Prompt";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 30_000;

// ✅ Flexible response type (SDK-safe)
type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: any;
    };
  }[];
};

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ API key check
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OpenRouter API key" },
        { status: 500 }
      );
    }

    // 2️⃣ Parse body
    const { userInput, deviceType, projectId } = await req.json();

    if (!userInput || !deviceType || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3️⃣ AI request (SDK-CORRECT)
    const aiRequest = openrouter.chat.send({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: APP_LAYOUT_CONFIG_PROMPT.replace(
                "{deviceType}",
                deviceType
              ),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "text", text: userInput }],
        },
      ],
    });

    // 4️⃣ Timeout protection
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), TIMEOUT_MS)
    );

    const aiResult = (await Promise.race([
      aiRequest,
      timeoutPromise,
    ])) as OpenRouterResponse;

    if (!aiResult?.choices?.length) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      );
    }

    // 5️⃣ Extract text SAFELY
    const content = aiResult.choices[0]?.message?.content;

    let rawText = "";

    if (Array.isArray(content)) {
      rawText = content.find(c => c.type === "text")?.text || "";
    } else if (typeof content === "string") {
      rawText = content;
    }

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned no text content" },
        { status: 500 }
      );
    }

    // 6️⃣ Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { rawText };
    }


    // ✅ DEBUG LOG (NOW WORKS)
    console.dir(parsed, { depth: null });

    // Defensive: check for required fields and shape
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.projectName !== 'string' ||
      typeof parsed.theme !== 'string' ||
      !Array.isArray(parsed.screens)
    ) {
      console.error('AI returned invalid or empty result:', parsed);
      return NextResponse.json(
        { error: 'AI returned invalid or empty result', parsed },
        { status: 502 }
      );
    }

    // Update project table with project name, theme, and optional visual description
    await db.update(ProjectTable).set({
      projectVisualDescription: parsed.projectVisualDescription || null,
      projectName: parsed.projectName,
      theme: parsed.theme,
    }).where(eq(ProjectTable.projectId, projectId as string));

    // Insert screen configs (use for...of to await properly)
    for (const screen of parsed.screens) {
      await db.insert(ScreenConfigTable).values({
        projectId: projectId,
        purpose: screen.purpose,
        screenDescription: screen.layoutDescription,
        screenId: screen.id, // fixed: use 'id' not 'screenId'
        screenName: screen.name,
      });
    }

    // 7️⃣ Return result (FIXES EMPTY PREVIEW)
    const responseData = {
      projectName: parsed.projectName,
      theme: parsed.theme,
      screens: parsed.screens,
    };
    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "AI service failed",
        message: error?.message || "Unknown error",
      },
      { status: 502 }
    );
  }
}