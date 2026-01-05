import { openrouter } from "@/config/openrouter";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/Prompt";
import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ API key check
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "sk-REPLACE_ME") {
      console.error("Missing or invalid OPENROUTER_API_KEY");
      return NextResponse.json(
        { error: "Missing OpenRouter API key" },
        { status: 500 }
      );
    }

    // 2️⃣ Parse body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { userInput, deviceType, projectId } = body || {};
    if (!userInput || !deviceType || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: userInput, deviceType, projectId" },
        { status: 400 }
      );
    }

    const model = "openai/gpt-3.5-turbo";

    // 3️⃣ AI request promise (NO signal)
    const aiRequest = openrouter.chat.send({
      model,
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

    // 4️⃣ Timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), TIMEOUT_MS)
    );

    // 5️⃣ Race
    const aiResult = await Promise.race([
      aiRequest,
      timeoutPromise,
    ]);

    if (!aiResult) {
      return NextResponse.json(
        { error: "No result from AI service" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aiResult,
    });

  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    const message = error?.message || String(error);
    const providerData =
      error?.response?.data || error?.data || null;

    let errorType = "unknown";
    if (message.includes("timed out")) errorType = "timeout";
    else if (status === 401) errorType = "auth";
    else if (status === 429) errorType = "quota";
    else if (status === 404) errorType = "model";
    else if (/network/i.test(message)) errorType = "network";

    console.error("AI provider error:", {
      status,
      message,
      providerData,
      errorType,
    });

    return NextResponse.json(
      {
        error: "AI service failed",
        errorType,
        status,
        message,
        providerData,
      },
      { status: errorType === "timeout" ? 504 : 502 }
    );
  }
}
