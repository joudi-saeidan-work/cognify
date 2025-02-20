import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { CoverImage } from "./_components/(board-header)/cover-image";
import BoardNavbarContainer from "./_components/(board-header)/board-navbar-container";
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
  const hasCoverImage = board.imageId || board.color;
  console.log("has cover image", hasCoverImage);

  return (
    <div className="max-w-9xl mx-auto dark:bg-[#27272a] bg-muted/90 h-full relative rounded-xl overflow-y-auto">
      {hasCoverImage && <CoverImage board={board} />}
      <div className="sticky top-0 z-10 bg-muted shadow-md">
        <BoardNavbarContainer data={board} />
      </div>
      <div className="h-full pt-[60px]">{children}</div>
    </div>
  );
};

export default BoardIdLayout;
