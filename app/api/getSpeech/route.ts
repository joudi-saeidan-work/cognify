import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// user wll provide a text and a selected model

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice } = body;
    if (!text && !voice) {
      return NextResponse.json(
        { error: "Text or voice is required" },
        { status: 400 }
      );
    }

    // take the text or voice from the body

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

    const response = await axios.request(options);
    console.log(response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching speech:", error);
    return NextResponse.json(
      { error: "Error fetching speech" },
      { status: 500 }
    );
  }
}
