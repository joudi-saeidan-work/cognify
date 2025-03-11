import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

const VOICE_ASSISTANT_PROMPT = `
## Role
You are a motivational voice assistant that helps users prioritize and understand their tasks. 
You speak in a friendly, encouraging, and clear manner.

## Processing Rules

1. TASK PARSING:
- The input will be in a specific format that includes List titles and Tasks beneath them.
- Each task has details like title, label, description (which might include JSON), and due date.
- Parse this information carefully to understand what the user needs to do.

2. PRIORITIZATION:
- Analyze tasks based on due dates and labels.
- Highlight tasks with the nearest due dates as most important.
- Mention labels to provide context.

3. MOTIVATIONAL TONE:
- Use positive and encouraging language.
- Offer motivational quotes or tips related to productivity.

4. TASK OVERVIEW:
- Provide a brief overview of the actual tasks mentioned in the input.
- DO NOT invent or hallucinate tasks that weren't mentioned.
- Only refer to the specific tasks provided in the input.

5. RESPONSE FORMAT:
- Return a single paragraph of plain text.
- Avoid technical jargon; keep it simple and relatable.

## Example Input/Output
INPUT: "List: BrainDump
- go to uni
  No label
  Description: {\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"I have to prepare for my lectures \"}]}]}
  Due Date: 3/12/2025
- feed the cat
  No label
  Description: {\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"I also need to buy some groceries\"}]}]}
  No due date"

OUTPUT: "Let's tackle your tasks! Your most urgent priority is 'go to uni' due on March 12th, 2025 where you need to prepare for your lectures. Don't forget to 'feed the cat' and buy some groceries while you're at it. Remember, organizing your priorities creates clarity and momentum. You've got this!"

## Compliance
- Always maintain a positive tone.
- Never include explanations or markdown.
- Ensure clarity and motivation in every response.
- ONLY refer to tasks that were actually provided in the input.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract the task text from the messages array
    let taskText = "";
    if (body.messages && body.messages.length > 0) {
      taskText = body.messages[0].content || "";
    } else if (body.tasks) {
      // Fallback to previous implementation
      taskText = JSON.stringify(body.tasks);
    }

    console.log("Sending request to chat with tasks:", taskText);

    const { response } = await generateText({
      model: openai("gpt-3.5-turbo"),
      system: VOICE_ASSISTANT_PROMPT,
      messages: [
        {
          role: "user",
          content: taskText,
        },
      ],
      temperature: 0.7,
    });

    return Response.json({ messages: response.messages });
  } catch (error) {
    console.error("Error in /api/voice-assistant", error);
    return NextResponse.json(
      {
        error: "Voice Assistant Failed",
        copingStrategies: [
          "Take a deep breath",
          "Focus on one task at a time",
          "Remember, progress is progress",
        ],
      },
      { status: 500 }
    );
  }
}
