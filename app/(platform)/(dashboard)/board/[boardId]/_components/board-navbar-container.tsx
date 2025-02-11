import { auth } from "@clerk/nextjs/server";
import BoardNavbar from "./board-navbar";
import { Board, BookmarkFolder, Bookmark } from "@prisma/client";
import { db } from "@/lib/db";

interface BoardNavBarProps {
  data: Board;
}

interface NavbarProps extends BoardNavBarProps {
  folders: (BookmarkFolder & { bookmarks: Bookmark[] })[];
}

const BoardNavbarContainer = async ({ data }: BoardNavBarProps) => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return null;
  }

  const folders = await db.bookmarkFolder.findMany({
    where: { orgId },
    include: {
      bookmarks: true,
    },
  });

  return <BoardNavbar data={data} folders={folders} />;
};

export default BoardNavbarContainer;
