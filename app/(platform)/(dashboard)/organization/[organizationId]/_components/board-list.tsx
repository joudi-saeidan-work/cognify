import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FormPopOver } from "@/components/form/form-popover";
import { Hint } from "@/components/hint";
import { HelpCircle, User2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const BoardList = async () => {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/select-org");
  }

  const boards = await db.board.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-2xl text-neutral-700">
        <User2 className="h-10 w-10 mr-2" />
        Your Boards
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
            className="group relative aspect-video bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm h-full w-full p-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
            <p className="relative  font-semibold text-white">{board.title}</p>
          </Link>
        ))}
        <FormPopOver sideOffset={10} side="right">
          <div
            role="button"
            className="aspect-video relative h-full w-full bg-muted rounded-sm flex flex-col gap-y-1 justify-center items-center hover:opacity-75 transition"
          >
            <p className="text-sm">Create new board</p>
            <span className="text-xs">5 remaining</span>
            <Hint
              sideOffset={40}
              description={`Free Workspaces can have up tp 5 open boards. For unlimited boards upgrade this workspace. `}
            >
              <HelpCircle className="absolute bottom-2 right-2 h-[14px] w-[14px]" />
            </Hint>
          </div>
        </FormPopOver>
      </div>
    </div>
  );
};

BoardList.Skeleton = function SkeletonBoardList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
      <Skeleton className="aspect-video h-full w-full p-2"></Skeleton>
    </div>
  );
};
