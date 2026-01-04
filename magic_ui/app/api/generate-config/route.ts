import { openrouter } from "@/config/openrouter";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/Prompt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const {userInput,deviceType,projectId}= await req.json();

    const aiResult = await openrouter.chat.send({
  model: "openai/gpt-5.1-codex-mini", //replace with free model
  messages: [
    {
        "role": "system",
        "content": [
            {
                type: "text",
                text:APP_LAYOUT_CONFIG_PROMPT.replace("{deviceType}",deviceType)
            }
        ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": userInput
        },
        
      ]
    }
  ],
  stream: false
});

//save to database

console.log(aiResult);

return NextResponse.json(aiResult?.choices[0]?.message?.content);
}