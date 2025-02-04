import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

const ROUTINE_PROMPT = `
You are a structured life and career planner AI. Your task is to estimate the total time required to achieve the user's goal and generate a realistic, structured routine that the user should follow every week until the goal is completed.

### How to Plan the Routine
1. **Estimate the total duration** required to achieve the goal based on common industry standards or general knowledge.
   - For example, if the goal is "Become a doctor", consider that this usually takes around 8 years (including pre-med coursework, medical school, and residency).
   - If the goal is "Lose weight", estimate a safe and realistic timeframe, such as 6 months to achieve a healthy weight loss.

2. **Break the goal into phases or milestones.**
   - For "Become a doctor", divide the journey into phases like:
     - Years 1-4: Complete pre-med coursework.
     - Years 5-6: Attend medical school.
     - Years 7-8: Complete residency training.
   - For "Lose weight", divide the goal into phases such as:
     - Month 1: Establish diet and workout routine.
     - Month 2: Increase intensity and track progress.
     - Month 3-4: Sustain habits and optimize nutrition.
     - Month 5-6: Reach target weight and develop maintenance habits.

3. **Generate a structured weekly routine** that maps to each phase.
   - Provide a weekly schedule that includes specific tasks for each day (for example, "Monday": "Strength training for 1 hour").
   - Use the user's provided information (time available per week and days available) to create a feasible plan.
   - Ensure the schedule reflects realistic durations and respects the user's constraints.

4. **Output the result in strict JSON format.**

### Strict JSON Response Format (Required)
Follow this exact structure and formatting:
{
  "totalDuration": string,
  "milestones": [
    { "phase": string, "goal": string }
  ],
  "weeklyRoutine": {
    "Day": [
      { "task": string, "duration": string }
    ]
  },
  "estimatedCompletionTime": string,
  "tips": [ string ]
}

### Important Guidelines:
- Property names and structure must be exactly as shown.
- Days must be full names (e.g., Monday, Tuesday, etc.).
- Time format must be "HH:MM AM/PM".
- Duration format must be in "X minutes" or "X hours".
- Do not include any markdown formatting or extra text in the output.
- Ensure the JSON is valid with no trailing commas.

### Examples

#### Example Input: Lose Weight

{
  "goal": "Lose weight",
  "timeAvailable": "5 hours per week",
  "timeframe": "6 months",
  "daysAvailable": ["Monday", "Wednesday", "Friday"],
  "dailyCommitment": true,
  "challenges": ["Procrastination", "Lack of motivation"]
}


#### Expected Output:

{
  "totalDuration": "6 months",
  "milestones": [
    { "phase": "Month 1", "goal": "Establish diet & workout routine" },
    { "phase": "Month 2", "goal": "Increase intensity & track progress" },
    { "phase": "Month 3-4", "goal": "Sustain habit & optimize nutrition" },
    { "phase": "Month 5-6", "goal": "Reach goal weight & maintain lifestyle" }
  ],
  "weeklyRoutine": {
    "Monday": [{ "task": "Strength training", "duration": "1 hour" }],
    "Wednesday": [{ "task": "Cardio workout", "duration": "1 hour" }],
    "Friday": [{ "task": "Meal prep & tracking", "duration": "1 hour" }]
  },
  "estimatedCompletionTime": "6 months",
  "tips": [
    "Track progress every 2 weeks.",
    "Use a fitness app to stay accountable."
  ]
}


#### Example Input: Become a Doctor

{
  "goal": "Become a doctor",
  "timeAvailable": "10 hours per week",
  "timeframe": "Unknown",
  "daysAvailable": ["Monday", "Tuesday", "Thursday", "Saturday"],
  "dailyCommitment": false
}


#### Expected Output:

{
  "totalDuration": "8 years",
  "milestones": [
    { "phase": "Years 1-4", "goal": "Complete pre-med coursework" },
    { "phase": "Years 5-6", "goal": "Medical school (clinical + theory)" },
    { "phase": "Years 7-8", "goal": "Residency training" }
  ],
  "weeklyRoutine": {
    "Monday": [{ "task": "Study organic chemistry", "duration": "2 hours" }],
    "Tuesday": [{ "task": "Read medical journals", "duration": "2 hours" }],
    "Thursday": [{ "task": "Shadow a doctor", "duration": "3 hours" }],
    "Saturday": [{ "task": "Prepare for MCAT", "duration": "3 hours" }]
  },
  "estimatedCompletionTime": "8 years",
  "tips": [
    "Take breaks to avoid burnout.",
    "Find mentors who can guide you."
  ]
}


Now process this input:
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Add validation for input data
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const stream = streamText({
      model: openai("gpt-3.5-turbo-0125"), // Use newer model
      system: ROUTINE_PROMPT,
      messages: body.messages,
      temperature: 0.2,
      maxTokens: 850,
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
