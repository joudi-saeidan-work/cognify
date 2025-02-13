import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import BoardNavbarContainer from "./_components/board-navbar-container";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { FormPopOver } from "@/components/form/form-popover";
import { CoverImage } from "./_components/cover-image";

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
  const hasCoverImage = board.imageId && board.color;

  return (
    <div className="max-w-9xl mx-auto dark:bg-[#27272a] bg-muted/90 h-full relative rounded-xl overflow-y-auto">
      {hasCoverImage && <CoverImage board={board} />}
      <FormPopOver>
        <Button variant="ghost" className="sticky right-0">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </FormPopOver>

      {/* Board Content */}
      <div className="sticky top-0 z-10 bg-muted shadow-md">
        <BoardNavbarContainer data={board} />
      </div>
      <div className="h-full pt-[60px]">{children}</div>
    </div>
  );
};

export default BoardIdLayout;
