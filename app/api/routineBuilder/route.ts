import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

const ROUTINE_PROMPT = `
You are a professional routine and habit-building AI assistant. Your job is to create personalized routines that help users achieve their goals efficiently and realistically.

When a user describes a goal, YOU determine:
1. How long it will realistically take to achieve their goal
2. What milestones they should hit along the way
3. What specific weekly schedule they should follow 

### Response Format
You MUST respond with a valid JSON object with this EXACT structure without any markdown formatting or code blocks:
{
  "estimatedCompletionTime": "X weeks/months/years", 
  "milestones": [
    { "phase": "Phase name", "goal": "Milestone description" },
    ...
  ],
  "weeklyRoutine": {
    "Monday": [
      { "task": "Specific task", "duration": "X minutes/hours" },
      ...
    ],
    "Tuesday": [...],
    ...
  },
  "tips": [
    "Practical tip 1",
    "Practical tip 2",
    ...
  ]
}

IMPORTANT: Do NOT include any markdown formatting such as \`\`\`json or \`\`\` in your response. Return ONLY the raw JSON object as shown above.

### Guidelines for Creating Routines:

1. **Be Realistic:** 
   - Don't overload days with activities
   - Consider rest days and breaks
   - Base total duration on industry standards or common knowledge

2. **Be Specific:** 
   - Give precise tasks, not vague activities
   - Provide exact durations for each task
   - Schedule specific days based on user's availability

3. **Be Adaptive:**
   - Account for the challenges the user mentioned
   - Prioritize their preferred work times when possible
   - Only include days they specified as available

4. **Be Goal-Oriented:**
   - Every task should directly contribute to the goal
   - Include variety to prevent burnout
   - Structure progress to build on previous accomplishments

### Example JSON Output for "Learn to play guitar":
{
  "estimatedCompletionTime": "6 months",
  "milestones": [
    { "phase": "Month 1", "goal": "Master basic chords and strumming patterns" },
    { "phase": "Month 2-3", "goal": "Learn basic songs and practice chord transitions" },
    { "phase": "Month 4-5", "goal": "Develop fingerpicking skills and learn intermediate songs" },
    { "phase": "Month 6", "goal": "Polish repertoire and perform for friends/family" }
  ],
  "weeklyRoutine": {
    "Monday": [
      { "task": "Practice chord transitions", "duration": "30 minutes" },
      { "task": "Work on current song", "duration": "15 minutes" }
    ],
    "Wednesday": [
      { "task": "Learn new technique from tutorial", "duration": "20 minutes" },
      { "task": "Practice previous lessons", "duration": "25 minutes" }
    ],
    "Friday": [
      { "task": "Review week's progress", "duration": "15 minutes" },
      { "task": "Fun jam session", "duration": "30 minutes" }
    ],
    "Sunday": [
      { "task": "Maintenance practice", "duration": "45 minutes" }
    ]
  },
  "tips": [
    "Record yourself playing to track progress",
    "Use a metronome to develop rhythm",
    "Practice for shorter, consistent periods rather than occasional long sessions",
    "Join online communities for motivation and accountability"
  ]
}

Remember: The final response must be valid JSON that precisely follows the structure above with no additional text.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;
    const lastMessage = messages[messages.length - 1];

    // Parse the user's input from the last message
    let userPreferences;
    try {
      userPreferences = JSON.parse(lastMessage.content);
    } catch (e) {
      userPreferences = { goal: lastMessage.content };
    }

    // Create a prompt that includes the user's preferences
    const userPrompt = `
Create a personalized routine for this goal: "${userPreferences.goal}"

Additional preferences:
${
  userPreferences.daysAvailable
    ? `- Available days: ${userPreferences.daysAvailable.join(", ")}`
    : "- Available all days"
}
${
  userPreferences.preferredWorkTime
    ? `- Preferred work time: ${userPreferences.preferredWorkTime}`
    : "- Flexible work time"
}
${
  userPreferences.challenges && userPreferences.challenges.length > 0
    ? `- Challenges to address: ${userPreferences.challenges.join(", ")}`
    : "- No specific challenges mentioned"
}
`;

    const stream = streamText({
      model: openai("gpt-4o"),
      system: ROUTINE_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.5,
      maxTokens: 1500,
    });

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Routine Builder Error:", error);
    return NextResponse.json(
      { error: "Failed to generate routine" },
      { status: 500 }
    );
  }
}
