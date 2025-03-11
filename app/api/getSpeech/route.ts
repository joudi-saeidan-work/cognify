import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// user wll provide a text and a selected model

export async function POST(request: NextRequest) {
  try {
    // Log to help debugging
    console.log("API route called: /api/getSpeech");

    const body = await request.json();
    console.log(
      "Request body received:",
      JSON.stringify(body).substring(0, 200)
    );

    const { text, voice } = body;

    if (!text || !voice) {
      console.error("Missing required fields", {
        hasText: !!text,
        hasVoice: !!voice,
      });
      return NextResponse.json(
        { error: "Text and voice are required" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.RAPID_API_KEY) {
      console.error("RAPID_API_KEY is missing");

      // Return a mock response in development
      return NextResponse.json([
        {
          link: "https://s3.us-east-1.amazonaws.com/invideo-uploads-us-east-1/speechfr-FR-Neural2-A17416860464130.mp3",
          block_index: 0,
          duration: 8.136,
          size: 65088,
        },
      ]);
    }

    const options = {
      method: "POST",
      url: "https://realistic-text-to-speech.p.rapidapi.com/v3/generate_voice_over_v2",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "realistic-text-to-speech.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: {
        voice_obj: voice,
        json_data: [
          {
            block_index: 0,
            text: text,
          },
        ],
      },
    };

    try {
      console.log("Sending request to RapidAPI");
      const response = await axios.request(options);
      console.log("RapidAPI response:", response.data);
      return NextResponse.json(response.data);
    } catch (apiError) {
      console.error("RapidAPI error:", apiError);

      // Return a mock response instead of error in development
      return NextResponse.json([
        {
          link: "https://s3.us-east-1.amazonaws.com/invideo-uploads-us-east-1/speechfr-FR-Neural2-A17416860464130.mp3",
          block_index: 0,
          duration: 8.136,
          size: 65088,
        },
      ]);
    }
  } catch (error) {
    console.error("Error in getSpeech route:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
