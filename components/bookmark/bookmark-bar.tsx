"use client";

import { useState } from "react";
import { Folder, Plus, ChevronLeft } from "lucide-react";
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

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Folder className="h-4 w-4 mr-2" />
            Bookmarks
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
                <Button
                  key={folder.id}
                  variant="ghost"
                  className="w-full justify-start p-2"
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {folder.title}
                  <span className="ml-auto text-muted-foreground">
                    {folder.bookmarks.length}
                  </span>
                </Button>
              ))}

            {/* loop though the bookmarks whether we are inside a folder or not */}
            {activeBookmarks?.map((bookmark: BookmarkType) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                className="flex items-center p-2 hover:bg-secondary"
                target="_blank"
                rel="noopener noreferrer"
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
                  />
                  <p className="text-blue-600 underline text-sm">
                    {bookmark.title}
                  </p>
                </div>
              </a>
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
