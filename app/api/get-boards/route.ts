import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("Unauthorized", { status: 400 });
    }

    const boards = await db.board.findMany({
      where: { orgId },
      include: {
        lists: true,
      },
    });

    if (!boards.length) {
      return new NextResponse("No boards found", { status: 404 });
    }

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
