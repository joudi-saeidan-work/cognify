"use client";

import { useState } from "react";
import { Folder, Plus, BookmarkIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { BookmarkFolder, Bookmark } from "@prisma/client";
import { useAction } from "@/hooks/use-actions";
import { createBookmarkFolder } from "@/actions/create-bookmark-folder";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BookmarkBarProps {
  folders: (BookmarkFolder & { bookmarks: Bookmark[] })[];
}

export const BookmarkBar = ({ folders }: BookmarkBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { execute } = useAction(createBookmarkFolder, {
    onSuccess: (data: BookmarkFolder) => {
      toast.success(`Folder "${data.name}" created`);
      setIsCreating(false);
      setNewFolderName("");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCreateFolder = () => {
    if (!newFolderName.trim()) return;
    execute({ name: newFolderName });
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Folder className="h-4 w-4 mr-2" />
            Bookmarks
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          {folders.map((folder) => (
            <DropdownMenuItem key={folder.id}>
              <BookmarkFolder folder={folder} />
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {isCreating ? (
            <div className="p-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateFolder();
                  if (e.key === "Escape") setIsCreating(false);
                }}
                autoFocus
              />
            </div>
          ) : (
            <DropdownMenuItem onSelect={() => setIsCreating(true)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add new folder
              </Button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const BookmarkFolder = ({
  folder,
}: {
  folder: BookmarkFolder & { bookmarks: Bookmark[] };
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center">
          <Folder className="h-4 w-4 mr-2" />
          {folder.name}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" className="w-60">
        {folder.bookmarks.map((bookmark) => (
          <DropdownMenuItem key={bookmark.id}>
            <a
              href={bookmark.url}
              className="flex items-center w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              {bookmark.title}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Add bookmark
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
