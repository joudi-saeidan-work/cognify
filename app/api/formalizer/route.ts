import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;
    const style = body.style || "More professional";

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content;

    const systemPrompt = `
You are a text formalizer assistant. Your task is to rewrite text according to a specific style preference.
The user will provide a text and a style preference.

When rewriting the text:
1. Maintain the original meaning and intent
2. Adjust the tone, vocabulary, and structure to match the specified style
3. Provide only the rewritten text without explanations or additional commentary
4. If the style is "Grammatically correct", focus on fixing grammar issues while preserving the original style

Be concise and direct in your output.
`;

    const stream = streamText({
      model: openai("gpt-3.5-turbo"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Rewrite the following text to make it "${style}":\n\n${userText}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Error in formalizer API:", error);
    return NextResponse.json(
      {
        error: "Text formalization failed",
      },
      { status: 500 }
    );
  }
}
