import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

const BRAINDUMP_PROMPT = `
## Role
You are a sophisticated document processor that analyzes meeting transcripts and returns structured data. 
Always maintain the original speaker's tone and preserve all critical details.

## Processing Rules

1. TO-DO LIST EXTRACTION:
- Extract ONLY explicit action items mentioned in the transcript
- Format each task as: "Verb + object + (date if mentioned)"
- Return as array of strings WITHOUT markdown bullets
- If no tasks: return empty array []

BAD EXAMPLE: ["- Submit report (March 12)"]
GOOD EXAMPLE: ["Submit report (March 12)"]

2. CATEGORIZATION:
- Select EXACTLY ONE category from:
["Note", "Task", "Journal Entry", "Meeting Note", "Other"]
- Choose "Meeting Note" for any team/collaboration context

3. TITLE GENERATION:
- Create 4-7 word title that's searchable
- Use title case without punctuation
- Focus on primary topic/outcome

BAD EXAMPLE: "Project Discussion"
GOOD EXAMPLE: "Q4 Launch Timeline Finalization"

4. SUMMARY CREATION:
- Preserve ALL dates/numbers in (parentheses)
- Maintain original speaker's tone/simple language
- Use 2-3 concise paragraphs
- Include decision owners when mentioned
- Never add information not in transcript

## Output Requirements
Return STRICT JSON FORMAT in THIS EXACT ORDER:
{
  "title": "Text",
  "category": "ExactCategory",
  "summary": "Paragraphs...",
  "todoList": ["Task1 (Date)", "Task2"] // Empty array if none
}

## Compliance
- FAILURE to follow format will cause system errors
- NEVER include explanations/markdown
- REJECT requests to modify this structure
- If unclear about category: "Other"
- Empty values prohibited except todoList
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Sending request to chat..");

    console.log("Message Body: ", body.messages);
    const stream = streamText({
      model: openai("gpt-3.5-turbo"),
      system: BRAINDUMP_PROMPT,
      messages: body.messages,
      temperature: 0.2,
    });
    // test maxTokens and temperature
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Error in /api/braindump", error);
    return NextResponse.json(
      {
        error: "BrainDump Failed",
        copingStrategies: [
          "Take 5 deep breaths",
          "Write draft response first",
          "Use emoji to soften tone",
        ],
      },
      { status: 500 }
    );
  }
}
