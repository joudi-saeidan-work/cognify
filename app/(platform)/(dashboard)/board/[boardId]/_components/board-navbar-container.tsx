import { auth } from "@clerk/nextjs/server";
import BoardNavbar from "./board-navbar";
import { Board, BookmarkFolder, Bookmark } from "@prisma/client";
import { db } from "@/lib/db";

interface BoardNavBarProps {
  data: Board;
}

const BoardNavbarContainer = async ({ data }: BoardNavBarProps) => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return null;
  }

  const [folders, bookmarksWithoutFolders] = await Promise.all([
    db.bookmarkFolder.findMany({
      where: { orgId },
      include: {
        bookmarks: true,
      },
    }),
    db.bookmark.findMany({
      where: {
        orgId: orgId,
        folderId: null, // This finds bookmarks that don't belong to any folder
      },
    }),
  ]);

  return (
    <BoardNavbar
      data={data}
      folders={folders}
      bookmarksWithoutFolders={bookmarksWithoutFolders}
    />
  );
};

export default BoardNavbarContainer;
