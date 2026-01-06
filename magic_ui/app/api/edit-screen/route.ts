import { db } from "@/config/db";
import { openrouter } from "@/config/openrouter";
import { ScreenConfigTable } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: any;
    };
  }[];
};

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Parse Body ONCE
    interface EditScreenBody {
      projectId: string;
      screenId: string;
      oldCode: string;
      userInput: string;
      screenName?: string;
    }

    const body: EditScreenBody = await req.json();
    const {
      projectId,
      screenId,
      oldCode,
      userInput,
      screenName
    } = body;

    // 2️⃣ Validation
    if (!projectId || !screenId || !oldCode || !userInput) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 3️⃣ Verify Screen exists in DB
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
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }

    // 4️⃣ Build the specific Edit Prompt
    const promptText = `
      You are an expert React developer. 
      Below is the existing code for a screen:
      ---
      ${oldCode}
      ---
      The user wants to make the following changes: "${userInput}"
      
      INSTRUCTIONS:
      1. Keep the overall design, theme, and style the same.
      2. Only modify the parts requested by the user.
      3. Return ONLY the updated code.
      4. Use Tailwind CSS for styling.
      5. Do not include markdown code blocks (like \`\`\`jsx).
    `;

    // 5️⃣ AI Request
    const aiRequest = await openrouter.chat.send({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: [{ type: "text", text: promptText }],
        },
        {
          role: "user",
          content: [{ type: "text", text: `Apply these changes: ${userInput}` }],
        },
      ],
    });

    const aiResult = aiRequest as OpenRouterResponse;

    // 6️⃣ Extract and Clean Content
    const content = aiResult?.choices?.[0]?.message?.content;
    let generatedCode = Array.isArray(content)
      ? content.find((c: any) => c.type === "text")?.text || ""
      : content || "";

    if (!generatedCode) {
      return NextResponse.json({ error: "AI returned no code" }, { status: 500 });
    }

    const cleanCode = generatedCode
      .replace(/```(?:tsx|jsx|javascript|typescript|react|html)?/gi, "")
      .replace(/```/g, "")
      .trim();

    // 7️⃣ Update Database
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
      data: updateResult[0],
    });

  } catch (error: any) {
    console.error("Critical Error in edit-screen:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}