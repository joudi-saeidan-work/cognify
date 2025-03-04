import { NextResponse, NextRequest } from "next/server";
import Groq from "groq-sdk";
import { writeFile } from "fs/promises";
import { unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
  // keeps track of the temporary file path where the audio gets stored
  let tempFilePath: string | null = null;

  try {
    // server process the incoming request by extracting the form data sentfrom the user
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: { message: "No file provided" } },
        { status: 400 }
      );
    }
    // convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // create temp file path using os.tmpdir()
    const tempDir = os.tmpdir();
    // create a unique temp file name
    const uniqueFileName = `upload-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.name)}`;

    tempFilePath = path.join(tempDir, uniqueFileName);

    // write buffer to the temp file
    await writeFile(tempFilePath, buffer);

    // initialise groq

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // generate transcription by sending audio file to groq api
    const transcription = await groq.audio.transcriptions.create({
      file: require("fs").createReadStream(tempFilePath), // path to audio file
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
      temperature: 0.0,
    });

    // Clean up: Delete the temporary file
    if (tempFilePath) {
      await unlink(tempFilePath);
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Transcription error: ", error);
    // Clean up: Make sure we delete the temp file even if there's an error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temportary file:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to transcribe audio",
        },
      },
      { status: 500 }
    );
  }
}
