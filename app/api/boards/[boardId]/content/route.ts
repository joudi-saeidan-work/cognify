import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const board = await db.board.findUnique({
      where: {
        id: params.boardId,
        orgId,
      },
      include: {
        lists: {
          orderBy: {
            order: "asc",
          },
          include: {
            cards: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARD_CONTENT_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
