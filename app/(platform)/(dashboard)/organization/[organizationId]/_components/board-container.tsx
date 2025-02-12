import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import BoardList from "./board-list";

export const BoardContainer = async () => {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/select-org");
  }

  // Fetch boards from the database
  const boards = await db.board.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return <BoardList boards={boards} />;
};
