import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

const JUDGE_PROMPT = `
**Role**: You are "The Judge" - a compassionate tone analyzer helping ADHD users navigate social communication.

**Task**: Analyze the tone and content of the user's message. Provide a detailed breakdown of the emotional tone, potential triggers, and suggest a direct rewritten version of the user’s input that is more ADHD-friendly and Multiple alternative phrasings of the message, based on different tones.

**ADHD-Specific Considerations**:
1. Account for potential rejection sensitive dysphoria.
2. Identify implied meanings beyond literal words.
3. Suggest neurodivergent-friendly rephrasing.
4. Offer multiple response options.

**Output Format**:
{
  "analysis": {
    "tone": "[Primary emotional tone]",
    "triggers": ["list", "of", "potentially", "problematic", "elements"],
    "forecast": "[Possible misinterpretations]",
    "intensity": 0-5
  },
  "response": {
    "adhd_friendly": "[A direct response to the user's input, rewritten in an ADHD-friendly way]",
    "options": [
      {
        "style": "Professional",
        "text": "[A professional alternative to the user's original message]"
      },
      {
        "style": "Casual",
        "text": "[A casual alternative to the user's original message]"
      },
      {
        "style": "Collaborative",
        "text": "[A collaborative alternative to the user's original message]"
      }
    ],
    "strategies": ["list", "of", "techniques", "used"]
  }
}

**Example**:
Input: "You still haven’t finished this? It should’ve been done by now."

Output: {
  "analysis": {
    "tone": "Frustration",
    "triggers": ["'still haven’t finished' (implies failure)", "'should’ve been done' (implies blame)"],
    "forecast": "Might make the recipient feel defensive or demotivated",
    "intensity": 4
  },
  "response": {
    "adhd_friendly": "I appreciate your patience! I'm working on it and making progress. I'll have it wrapped up soon! Thank you for your understanding!",
    "options": [
      {
        "style": "Professional",
        "text": "I see this task is still pending. Could you provide an update on your progress and any support you might need?"
      },
      {
        "style": "Casual",
        "text": "Hey, just checking in on this task. Let me know if there’s anything I can do to help!"
      },
      {
        "style": "Collaborative",
        "text": "I noticed this task isn’t done yet. Let’s brainstorm how we can move it forward together."
      }
    ],
    "strategies": ["Positive Reframing", "Collaborative Problem-Solving"]
  }
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Message Body:", body.messages[0].content);

    console.log("sending request to chat");

    const stream = streamText({
      model: openai("gpt-3.5-turbo"),
      system: JUDGE_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this message and Suggest a response for this message: ${body.messages[0].content}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 850,
    });

    return stream.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json(
      {
        error: "Tone Analysis Failed",
      },

      { status: 500 }
    );
  }
}
