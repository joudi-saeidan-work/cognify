"use client";

import { useState } from "react";
import { Folder, Plus, BookmarkIcon, Link } from "lucide-react";
import { useAction } from "@/hooks/use-actions";
import { createBookmark } from "@/actions/create-bookmark";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type {
  BookmarkFolder as BookmarkFolderType,
  Bookmark,
} from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

interface BookmarkFolderProps {
  folder: BookmarkFolderType & { bookmarks: Bookmark[] };
}

export const BookmarkFolder = ({ folder }: BookmarkFolderProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { execute } = useAction(createBookmark, {
    onSuccess: (data) => {
      toast.success(`Bookmark "${data.title}" created`);
      setIsCreating(false);
      setTitle("");
      setUrl("");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCreateBookmark = () => {
    if (!title.trim() || !url.trim()) return;
    execute({ title, url, folderId: folder.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center">
          <Folder className="h-4 w-4 mr-2" />
          {folder.name}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" className="w-72">
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
        {isCreating ? (
          <div className="p-2 space-y-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <div className="flex gap-x-2">
              <Input
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={onCreateBookmark} size="sm" variant="secondary">
                Add
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem onSelect={() => setIsCreating(true)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Add bookmark
            </Button>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
