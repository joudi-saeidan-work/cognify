import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const labels = await db.label.findMany({
      where: {
        boardId: params.boardId,
        board: {
          orgId,
        },
      },
    });

    return NextResponse.json(labels);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
