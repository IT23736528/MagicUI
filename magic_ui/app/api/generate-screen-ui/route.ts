import { db } from "@/config/db";
import { openrouter } from "@/config/openrouter";
import { ScreenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT } from "@/data/Prompt";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 60_000;

// ✅ SDK-Safe Response Type
type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: any;
    };
  }[];
};

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ API Key Check
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 2️⃣ Parse Body
    const {
      projectId,
      screenId,
      screenName,
      purpose,
      screenDescription,
      projectVisualDescription,
    } = await req.json();

    if (!projectId || !screenId || !screenName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3️⃣ Verify Screen exists BEFORE calling AI (Prevents wasted API credits)
    const existingScreen = await db
      .select()
      .from(ScreenConfigTable)
      .where(
        and(
          eq(ScreenConfigTable.projectId, projectId),
          eq(ScreenConfigTable.screenId, screenId)
        )
      )
      .limit(1);

    if (!existingScreen.length) {
      return NextResponse.json({ error: "Screen not found in database" }, { status: 404 });
    }

    // 4️⃣ Build UI Prompt
    const userInput = `
      Screen Name: ${screenName}
      Purpose: ${purpose || "Not specified"}
      Description: ${screenDescription || "Not specified"}
      Project Context: ${projectVisualDescription || "Not specified"}
      Generate a complete, functional React component using Tailwind CSS.
    `.trim();

    const promptText = GENERATE_SCREEN_PROMPT?.replace("{deviceType}", "mobile") || 
      "Generate a functional React component with Tailwind CSS. Return ONLY code.";

    // 5️⃣ AI Request (Using your specific SDK .chat.send)
    const aiRequest = openrouter.chat.send({
      model: "openai/gpt-3.5-turbo", // Note: Ensure your credits allow GPT-4
      messages: [
        {
          role: "system",
          content: [{ type: "text", text: promptText }],
        },
        {
          role: "user",
          content: [{ type: "text", text: userInput }],
        },
      ],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), TIMEOUT_MS)
    );

    const aiResult = (await Promise.race([aiRequest, timeoutPromise])) as OpenRouterResponse;

    // 6️⃣ Extract Content Safely
    const content = aiResult?.choices?.[0]?.message?.content;
    let generatedCode = "";

    if (Array.isArray(content)) {
      generatedCode = content.find((c: any) => c.type === "text")?.text || "";
    } else {
      generatedCode = content || "";
    }

    if (!generatedCode) {
      return NextResponse.json({ error: "AI returned no code content" }, { status: 500 });
    }

    // 7️⃣ CLEANING THE CODE BLOCK
    // This regex removes ```jsx, ```tsx, etc., and the closing ```
    const cleanCode = generatedCode
      .replace(/```(?:tsx|jsx|javascript|typescript|react|html)?/gi, "")
      .replace(/```/g, "")
      .trim();

    // 8️⃣ Update Database
    const updateResult = await db
      .update(ScreenConfigTable)
      .set({ code: cleanCode })
      .where(
        and(
          eq(ScreenConfigTable.projectId, projectId),
          eq(ScreenConfigTable.screenId, screenId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      screenName,
      data: updateResult[0],
    });

  } catch (error: any) {
    console.error("Critical Error in generate-screen-ui:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}