import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { startCase } from "lodash";
import { Metadata } from "next";
import BoardNavbarContainer from "./_components/board-navbar-container";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: { boardId: string };
}): Promise<Metadata> {
  const { orgId } = await auth();

  if (!orgId) {
    return { title: "Board" };
  }

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

  if (!board) {
    notFound();
  }

  return (
    <div className="max-w-9xl mx-auto dark:bg-[#27272a] bg-muted/90 h-full relative rounded-xl overflow-y-auto">
      {/* Cover Image */}
      {/* give the user the option to remove/change the cover images  */}
      <div className="relative w-full h-[180px] bg-black/30 overflow-hidden">
        <Image
          src={board.imageFullUrl}
          alt={board.title}
          fill
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      {/* Board Content */}
      <div className="relative dark:bg-[#27272a] bg-muted/90 h-full">
        <BoardNavbarContainer data={board} />
        <div className="h-full">{children}</div>
      </div>
    </div>
  );
};

export default BoardIdLayout;
