"use client";

import { useState } from "react";
import {
  Folder,
  Plus,
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash,
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
} from "@/components/ui/dropdown-menu";
import { updateBookmark } from "@/actions/update-bookmark";
import { deleteBookmark } from "@/actions/delete-bookmark";
import { updateBookmarkFolder } from "@/actions/update-bookmark-folder";
import { deleteBookmarkFolder } from "@/actions/delete-bookmark-folder";
import { Hint } from "@/components/hint";

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
          <Button variant="ghost" size="sm" aria-label="Open Bookmarks">
            <Hint description="Open Bookmarks">
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4 mr-2" />
                Bookmarks
              </span>
            </Hint>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          {/* Navigation header */}
          <div className="flex items-center gap-2 p-2 border-b">
            {/* show back button when there is an active folder */}
            {activeFolder ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFolder(null)}
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <span className="text-muted-foreground font-semibold text-sm">
                All Bookmarks
              </span>
            )}
          </div>

          {/* Main content */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* if we are not inside a folder then we will show all folders */}
            {!activeFolder &&
              folders.map((folder) => (
                <div key={folder.id} className="flex items-center w-full">
                  {editingItem?.id === folder.id ? (
                    // Edit mode for folder
                    <div className="p-2 space-y-2 w-full">
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
                    </div>
                  ) : (
                    // Normal display mode
                    <>
                      <Button
                        variant="ghost"
                        className="flex-grow justify-start p-2"
                        onClick={() => setActiveFolder(folder.id)}
                        aria-label={`Open ${folder.title}`}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {folder.title}
                        <span className="ml-auto text-muted-foreground">
                          {folder.bookmarks.length}
                        </span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => startEditing(folder.id, "folder")}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteFolder(folder.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}

            {/* loop though the bookmarks whether we are inside a folder or not */}
            {activeBookmarks?.map((bookmark: BookmarkType) => (
              <div key={bookmark.id} className="flex items-center w-full">
                {editingItem?.id === bookmark.id ? (
                  // Edit mode for bookmark
                  <div className="p-2 space-y-2 w-full">
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
                  </div>
                ) : (
                  <>
                    <a
                      href={bookmark.url}
                      className="flex items-center p-2 hover:bg-secondary flex-grow"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${bookmark.title}`}
                    >
                      <div className="flex items-center">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                            bookmark.url
                          )}&sz=32`}
                          alt=""
                          className="h-4 w-4 mr-2"
                          onError={(e) => {
                            // Fallback to the default Link icon if favicon fails to load
                            e.currentTarget.style.display = "none";
                            const linkIcon = document.createElement("span");
                            linkIcon.className = "h-4 w-4 mr-2";
                            linkIcon.innerHTML =
                              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                            e.currentTarget.parentNode?.insertBefore(
                              linkIcon,
                              e.currentTarget
                            );
                          }}
                          aria-label="Favicon"
                        />
                        <p
                          className="text-blue-600 underline text-sm"
                          aria-label={bookmark.title}
                        >
                          {bookmark.title}
                        </p>
                      </div>
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => startEditing(bookmark.id, "bookmark")}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteBookmark(bookmark.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Creation controls - Fixed styling */}
          <div className="border-t pt-2">
            {isCreating ? (
              <div className="p-2 space-y-2">
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
                    aria-label={
                      isCreating === "folder" ? "Folder name" : "Bookmark title"
                    }
                  />
                  {/* Show folder or bookmark title errors */}
                  {isCreating === "folder" && fieldErrorsFolder?.title && (
                    <p className="text-sm text-destructive mt-1">
                      {fieldErrorsFolder.title}
                    </p>
                  )}
                  {isCreating === "bookmark" && fieldErrorsBookmark?.title && (
                    <p className="text-sm text-destructive mt-1">
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
                      aria-label="Bookmark URL"
                    />
                    {/* Show URL validation errors */}
                    {fieldErrorsBookmark?.url && (
                      <p className="text-sm text-destructive mt-1">
                        {fieldErrorsBookmark.url}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      isCreating === "folder"
                        ? onCreateFolder()
                        : onCreateBookmark();
                      setNewItemData({ title: "", url: "" });
                    }}
                    size="sm"
                    aria-label="Add"
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(null);
                      setNewItemData({ title: "", url: "" });
                    }}
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-1/2 rounded-none hover:bg-secondary"
                  onClick={() => setIsCreating("folder")}
                  aria-label="New Folder"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <div className="w-[1px] h-6 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-1/2 rounded-none hover:bg-secondary"
                  onClick={() => setIsCreating("bookmark")}
                  aria-label="New Bookmark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Bookmark
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BookmarkBar;
