"use client";

import { useState } from "react";
import {
  Folder,
  Plus,
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash,
  FolderIcon,
  PlusCircle,
  BookmarkIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-actions";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBookmarkFolder } from "@/actions/create-bookmark-folder/index";
import { createBookmark } from "@/actions/create-bookmark";
import type { BookmarkFolder, Bookmark as BookmarkType } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { updateBookmark } from "@/actions/update-bookmark";
import { deleteBookmark } from "@/actions/delete-bookmark";
import { updateBookmarkFolder } from "@/actions/update-bookmark-folder";
import { deleteBookmarkFolder } from "@/actions/delete-bookmark-folder";
import { Hint } from "@/components/hint";
import { cn } from "@/lib/utils";

interface BookmarkBarProps {
  folders: (BookmarkFolder & { bookmarks: BookmarkType[] })[];
  bookmarks: BookmarkType[];
}

const BookmarkBar = ({ folders, bookmarks }: BookmarkBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<"folder" | "bookmark" | null>(
    null
  );
  const [newItemData, setNewItemData] = useState({ title: "", url: "" });
  const [editingItem, setEditingItem] = useState<{
    id: string;
    type: "folder" | "bookmark";
  } | null>(null);
  const [editData, setEditData] = useState({ title: "", url: "" });

  // determines which bookmarks to show
  const activeBookmarks = activeFolder
    ? folders.find((f) => f.id === activeFolder)?.bookmarks
    : bookmarks;

  // create new folder
  const { execute: executeBookmarkFolder, fieldErrors: fieldErrorsFolder } =
    useAction(createBookmarkFolder, {
      onSuccess: (data: BookmarkFolder) => {
        toast.success(`Folder "${data.title}" created`);
        setIsCreating(null);
        setNewItemData({ title: "", url: "" });
      },
      onError: (error) => {
        toast.error(error);
      },
    });

  const onCreateFolder = () => {
    executeBookmarkFolder({
      title: newItemData.title,
    });
  };

  // create new bookmark
  const { execute: executeCreateBookmark, fieldErrors: fieldErrorsBookmark } =
    useAction(createBookmark, {
      onSuccess: (data: BookmarkType) => {
        toast.success(`Bookmark "${data.title}" created`);
        setIsCreating(null);
        setNewItemData({ title: "", url: "" });
      },
      onError: (error) => {
        toast.error(error);
      },
    });

  const onCreateBookmark = () => {
    executeCreateBookmark({
      title: newItemData.title,
      url: newItemData.url,
      folderId: activeFolder || undefined,
    });
  };

  // Add these new action hooks inside your component
  const {
    execute: executeUpdateBookmark,
    fieldErrors: fieldErrorsUpdateBookmark,
  } = useAction(updateBookmark, {
    onSuccess: (data: BookmarkType) => {
      toast.success(`Bookmark "${data.title}" updated`);
      setEditingItem(null);
      setEditData({ title: "", url: "" });
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDeleteBookmark } = useAction(deleteBookmark, {
    onSuccess: (data: BookmarkType) => {
      toast.success(`Bookmark "${data.title}" deleted`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateFolder, fieldErrors: fieldErrorsUpdateFolder } =
    useAction(updateBookmarkFolder, {
      onSuccess: (data: BookmarkFolder) => {
        toast.success(`Folder "${data.title}" updated`);
        setEditingItem(null);
        setEditData({ title: "", url: "" });
      },
      onError: (error) => {
        toast.error(error);
      },
    });

  const { execute: executeDeleteFolder } = useAction(deleteBookmarkFolder, {
    onSuccess: (data: BookmarkFolder) => {
      toast.success(`Folder deleted`);
      // If we're in the folder that was deleted, go back to root
      if (activeFolder === data.id) {
        setActiveFolder(null);
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Add these handler functions
  const onUpdateBookmark = () => {
    if (!editingItem) return;

    executeUpdateBookmark({
      id: editingItem.id,
      title: editData.title,
      url: editData.url,
      folderId: activeFolder || undefined,
    });
  };

  const onDeleteBookmark = (id: string) => {
    executeDeleteBookmark({
      id,
    });
  };

  const onUpdateFolder = () => {
    if (!editingItem) return;

    executeUpdateFolder({
      id: editingItem.id,
      title: editData.title,
    });
  };

  const onDeleteFolder = (id: string) => {
    executeDeleteFolder({
      id,
    });
  };

  const startEditing = (id: string, type: "folder" | "bookmark") => {
    // Find the item to edit
    if (type === "folder") {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        setEditData({ title: folder.title, url: "" });
        setEditingItem({ id, type });
      }
    } else {
      // Find the bookmark
      const bookmark = activeFolder
        ? folders
            .find((f) => f.id === activeFolder)
            ?.bookmarks.find((b) => b.id === id)
        : bookmarks.find((b) => b.id === id);

      if (bookmark) {
        setEditData({ title: bookmark.title, url: bookmark.url });
        setEditingItem({ id, type });
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <FolderIcon className="h-4 w-4" />
            <span className="font-medium">Bookmarks</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="w-80 p-0 shadow-md border rounded-md"
          sideOffset={10}
        >
          {/* Header with improved spacing */}
          <div className="py-4 px-6 border-b flex items-center justify-between bg-secondary/30">
            {activeFolder ? (
              <div className="flex items-center gap-4 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFolder(null)}
                  className="p-1 hover:bg-secondary/80"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                {/* Center the folder title */}
                <h3 className="font-semibold text-lg flex-grow text-center mr-5">
                  {folders.find((f) => f.id === activeFolder)?.title}
                </h3>
              </div>
            ) : (
              <h3 className="text-xl font-semibold w-full text-center">
                All Bookmarks
              </h3>
            )}
          </div>

          {/* Content area - folders and bookmarks lists */}
          <div className="max-h-[350px] overflow-y-auto py-3 px-2">
            {/* Folders section - only show at root level */}
            {!activeFolder && folders.length > 0 && (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center group hover:bg-secondary/60 rounded-md mx-1"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2.5 px-4 h-auto text-left rounded-md"
                      onClick={() => setActiveFolder(folder.id)}
                    >
                      <div className="flex items-center w-full">
                        <FolderIcon className="h-4 w-4 mr-3 text-primary/70" />
                        <span className="flex-grow font-medium">
                          {folder.title}
                        </span>
                        <span className="text-muted-foreground bg-secondary/80 rounded-full px-2.5 py-0.5 min-w-[24px] text-center">
                          {folder.bookmarks.length}
                        </span>
                      </div>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Folder actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem
                          onClick={() => startEditing(folder.id, "folder")}
                        >
                          Edit folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteFolder(folder.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Root level bookmarks - only show when at root level */}
            {!activeFolder && bookmarks && bookmarks.length > 0 && (
              <div className="space-y-2 px-1 mt-4">
                <h4 className="px-4 text-sm font-semibold text-muted-foreground mb-1">
                  Root Bookmarks
                </h4>
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group flex items-center hover:bg-secondary/60 rounded-md mx-1"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow py-2.5 px-4 rounded-md flex items-center"
                    >
                      <div className="flex items-center w-full">
                        <div className="h-6 w-6 mr-3 flex items-center justify-center">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                              bookmark.url
                            )}&sz=32`}
                            alt=""
                            className="h-5 w-5"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
                              }
                            }}
                          />
                        </div>
                        <span className="flex-grow text-sm text-primary/90 hover:underline">
                          {bookmark.title}
                        </span>
                      </div>
                    </a>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Bookmark actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem
                          onClick={() => startEditing(bookmark.id, "bookmark")}
                        >
                          Edit bookmark
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteBookmark(bookmark.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete bookmark
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Folder bookmarks - only show when inside a specific folder */}
            {activeFolder && activeBookmarks && activeBookmarks.length > 0 && (
              <div className="space-y-2 px-1">
                {activeBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group flex items-center hover:bg-secondary/60 rounded-md mx-1"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow py-2.5 px-4 rounded-md flex items-center"
                    >
                      <div className="flex items-center w-full">
                        <div className="h-6 w-6 mr-3 flex items-center justify-center">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                              bookmark.url
                            )}&sz=32`}
                            alt=""
                            className="h-5 w-5"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
                              }
                            }}
                          />
                        </div>
                        <span className="flex-grow text-sm text-primary/90 hover:underline">
                          {bookmark.title}
                        </span>
                      </div>
                    </a>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Bookmark actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem
                          onClick={() => startEditing(bookmark.id, "bookmark")}
                        >
                          Edit bookmark
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteBookmark(bookmark.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete bookmark
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* ONLY show this message when INSIDE a folder with no bookmarks */}
            {activeFolder &&
              (!activeBookmarks || activeBookmarks.length === 0) && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No bookmarks found in this folder
                </div>
              )}

            {/* ONLY show this when at root with NO folders AND NO bookmarks */}
            {!activeFolder &&
              folders.length === 0 &&
              (!bookmarks || bookmarks.length === 0) && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No bookmarks or folders found
                </div>
              )}

            {/* If we're editing an item, show the edit form */}
            {editingItem && (
              <div className="p-4 space-y-3 border-t">
                {/* Form content based on what we're editing */}
                {editingItem.type === "folder" ? (
                  <>
                    <div>
                      <Input
                        placeholder="Folder name"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        autoFocus
                        aria-label="Folder name"
                      />
                      {fieldErrorsUpdateFolder?.title && (
                        <p className="text-sm text-destructive mt-1">
                          {fieldErrorsUpdateFolder.title}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={onUpdateFolder}
                        size="sm"
                        aria-label="Update"
                      >
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setEditData({ title: "", url: "" });
                        }}
                        aria-label="Cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Input
                        placeholder="Bookmark title"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        autoFocus
                        aria-label="Bookmark title"
                      />
                      {fieldErrorsUpdateBookmark?.title && (
                        <p className="text-sm text-destructive mt-1">
                          {fieldErrorsUpdateBookmark.title}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="URL"
                        value={editData.url}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            url: e.target.value,
                          }))
                        }
                        aria-label="Bookmark URL"
                      />
                      {fieldErrorsUpdateBookmark?.url && (
                        <p className="text-sm text-destructive mt-1">
                          {fieldErrorsUpdateBookmark.url}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={onUpdateBookmark}
                        size="sm"
                        aria-label="Update"
                      >
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setEditData({ title: "", url: "" });
                        }}
                        aria-label="Cancel"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer with action buttons - more padding and better spacing */}
          <div className="border-t py-4 px-6 flex items-center gap-3 bg-secondary/20">
            {isCreating ? (
              <div className="space-y-3 w-full">
                <div>
                  <Input
                    placeholder={
                      isCreating === "folder" ? "Folder name" : "Bookmark title"
                    }
                    value={newItemData.title}
                    onChange={(e) =>
                      setNewItemData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    autoFocus
                    className="w-full"
                  />
                  {isCreating === "folder" && fieldErrorsFolder?.title && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrorsFolder.title}
                    </p>
                  )}
                  {isCreating === "bookmark" && fieldErrorsBookmark?.title && (
                    <p className="text-xs text-destructive mt-1">
                      {fieldErrorsBookmark.title}
                    </p>
                  )}
                </div>

                {isCreating === "bookmark" && (
                  <div>
                    <Input
                      placeholder="URL"
                      value={newItemData.url}
                      onChange={(e) =>
                        setNewItemData((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                    />
                    {fieldErrorsBookmark?.url && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldErrorsBookmark.url}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      isCreating === "folder"
                        ? onCreateFolder()
                        : onCreateBookmark();
                    }}
                    size="sm"
                    className="w-full"
                  >
                    {isCreating === "folder" ? "Create folder" : "Add bookmark"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(null);
                      setNewItemData({ title: "", url: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Only show New Folder button when at root level (not inside a folder) */}
                {!activeFolder ? (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full flex items-center justify-center gap-2 py-5"
                      onClick={() => setIsCreating("folder")}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>New Folder</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full flex items-center justify-center gap-2 py-5"
                      onClick={() => setIsCreating("bookmark")}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>New Bookmark</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 py-5"
                    onClick={() => setIsCreating("bookmark")}
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>New Bookmark</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BookmarkBar;
