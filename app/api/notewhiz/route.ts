import { getEmbedding } from "@/lib/openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { notesIndex } from "@/lib/pinecone";
import openai from "@/lib/openai";
import { db } from "@/lib/db"; // ✅ Import Prisma Client

import {
  ChatCompletionSystemMessageParam,
  ChatCompletionMessage,
} from "openai/resources/index.mjs";

import { streamText } from "ai"; // ✅ New streaming helpers
import { createOpenAI } from "@ai-sdk/openai";

// the request to this endpoint is automatically done by the useChatHook
const openaiObect = createOpenAI({
  apiKey: process.env.OPENAPI_API_KEY || "",
  compatibility: "strict",
});

export async function POST(req: Request) {
  try {
    const body = await req.json(); // the body are the messages that vercel ai sends to this route

    console.log("Message body received");

    const messages = body.messages; //  ChatCompletionMessage is a type from openai it contains the role of whoever sent the message and the text of the message

    // only send last 6 notes user messages & ai answers to make our request cheaper and because we want to retrieve the notes that are relevant for our chat history
    // chat historu
    const messagesTruncated = messages.slice(-6);

    // turn all the chat history into vector embedding so that we can search for the relevant notes that fits the current chat history
    // take the text of each message and join them together with a line break into one big string then we create a vector embedding for it
    // Resulting message
    // hey whats my wifi password
    // your wifi pass is ..
    // thank u whats my phone numbers pin? ..
    // your phone pin is ...

    // Todo: is there a better way to do this? Maybe send the request to gbt to have a more solid quetion to get the answers to create a ,pre exact vector embedding
    const embedding = await getEmbedding(
      messagesTruncated
        .map((message: ChatCompletionMessage) => message.content)
        .join("\n")
    );

    const { userId } = await auth();

    // query pinecone to find the notes that have embeddings that are close to the embeddings of our chat history (meaning is similar)
    // vector embeddings from pinecone
    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 4, // how many results we want to return. the higher the value the higher the notes we want to return (4 is a good value)
      filter: { userId }, // only fetch the notes that belongs to the user
    });

    // vectorEmbedding does not return the notes themselves just the id of the note so we have to make a request to our database
    // the way we have defined it is that our id in our database contains the same id as pinecone soo we will only return the relevant notes using this id
    const relevantNotes = await db.card.findMany({
      where: {
        id: { in: vectorQueryResponse.matches.map((match) => match.id) }, // creates an array of the ids of the results that we get back from pinecone
      },
    });
    // creates an array of the ids that are relevant to notes. returns 1 note if k is one - returns 2 notes if k is 2
    console.log("relevant notes found:", relevantNotes);

    // now make a request to chatgb t and send the relevant notes to it
    // system message gives the ai instructions
    // each chat completion message would have a role
    // assistent -> ai , system -> what we use to give instructions
    // each message needs a content which is the message itself

    // Title: Passwords
    // Content:
    // somepassword
    // somepasswords

    // now we will make a request to gbt using the completions endpoint
    // make a request to chatgbt

    console.log("Sending request to chat..");

    // const response = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo", //this is good enough much cheaper and still good
    //   stream: true, // enables the response streaming
    //   messages: [systemMessage, ...messagesTruncated], // we send the isntrusctions + the last 6 messages (chat history)
    // });

    console.log("streaming data..");

    const systemMessageContent =
      messagesTruncated +
      `You are an intelligent note-taking assistant. Answer based on user notes.\n` +
      (relevantNotes?.length
        ? `Relevant Notes:\n` +
          relevantNotes
            .map(
              (note) =>
                `Title: ${note.title}\n\nDescription:\n${note.description}`
            )
            .join("\n\n")
        : "No relevant notes found.");

    // need to find a way to handle the rate limiting

    const stream = streamText({
      model: openaiObect("gpt-3.5-turbo"),
      system: systemMessageContent,
      messages: messagesTruncated,
      temperature: 1,
    });
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Error in /api/chat:", error); // ✅ Now logs the exact error
    return new NextResponse("Internal Error", { status: 500 });
  }
}
