export interface BookmarkFolder {
  id: string;
  name: string;
  bookmarks: Bookmark[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}
