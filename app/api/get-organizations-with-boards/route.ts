import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch organizations using Clerk's public API directly
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}/organization_memberships`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const organizations = await response.json();

    // Map to get organization details including boards
    const organizationsWithBoards = await Promise.all(
      organizations.data.map(
        async (membership: {
          organization: {
            id: string;
            name: string;
          };
        }) => {
          const org = membership.organization;
          const boards = await db.board.findMany({
            where: { orgId: org.id },
            include: {
              lists: true,
            },
          });
          return {
            id: org.id,
            name: org.name,
            boards,
          };
        }
      )
    );

    return NextResponse.json(organizationsWithBoards);
  } catch (error) {
    console.error("Error fetching organizations with boards:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
