import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cards = await db.card.findMany({
      where: {
        list: {
          boardId: params.boardId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cards);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, dueDate } = await req.json();

    // Get the first list in the board to add the card to
    const firstList = await db.list.findFirst({
      where: {
        boardId: params.boardId,
      },
    });

    if (!firstList) {
      return new NextResponse("No list found", { status: 404 });
    }

    // Create the card
    const card = await db.card.create({
      data: {
        title,
        dueDate,
        listId: firstList.id,
        order: 0, // Add at the beginning of the list
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
