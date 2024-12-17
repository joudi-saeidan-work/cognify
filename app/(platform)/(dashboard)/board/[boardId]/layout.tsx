import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { startCase } from "lodash";
import { Metadata } from "next";
import BoardNavbar from "./_components/board-navbar";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { boardId: string };
}): Promise<Metadata> {
  const { orgId } = await auth();

  if (!orgId) {
    return { title: "Board" };
  }

  // Render Board

  const board = await db.board.findUnique({
    where: {
      id: params.boardId,
      orgId,
    },
  });

  return {
    title: board?.title || "Board",
  };
}
const BoardIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { boardId: string };
}) => {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/select-org");
  }

  const board = await db.board.findUnique({
    where: {
      id: params.boardId,
      orgId,
    },
  });

  console.log(board);

  if (!board) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image applied to a fixed layer */}
      <div
        style={{ backgroundImage: `url(${board.imageFullUrl})` }}
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-2]"
      />
      {/* Fixed transparent overlay */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/10 z-[-1]" />

      {/* Board content */}
      <BoardNavbar data={board} />
      <main className="relative pt-28 h-full">{children}</main>
    </div>
  );
};
export default BoardIdLayout;
