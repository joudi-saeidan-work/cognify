// Mock implementation of db.ts
export const db = {
  bookmarkFolder: {
    findMany: jest.fn().mockResolvedValue([
      {
        id: "folder1",
        title: "Folder 1",
        orgId: "org123",
        bookmarks: [{ id: "bookmark1", title: "Bookmark 1" }],
      },
    ]),
  },
  bookmark: {
    findMany: jest.fn().mockResolvedValue([
      {
        id: "bookmark2",
        title: "Bookmark 2",
        folderId: null,
      },
    ]),
  },
};
