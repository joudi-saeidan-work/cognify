"use client";

import { updateList } from "@/actions/update-list";
import { FormInput } from "@/components/form/form-input";
import { useAction } from "@/hooks/use-actions";
import { List } from "@prisma/client";
import { ElementRef, useRef, useState } from "react";
import { toast } from "sonner";
import { useEventListener } from "usehooks-ts";
import { ListOptions } from "./list-options";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ListWithCards } from "@/types";
import { deleteList } from "@/actions/delete-list";
import { copyList } from "@/actions/copy-list";
import ReadListButton from "../(text-to-speech)/ReadListButton";
import { Hint } from "@/components/hint";

interface ListHeaderProps {
  data: ListWithCards;
  onAddCard: () => void;
}

export const ListHeader = ({ data, onAddCard }: ListHeaderProps) => {
  const [title, setTitle] = useState(data.title);
  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<ElementRef<"form">>(null);
  const inputRef = useRef<ElementRef<"input">>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const {
    execute: executeUpdateList,
    execute,
    fieldErrors,
    isLoading,
  } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDeleteList } = useAction(deleteList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" deleted`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeCopyList } = useAction(copyList, {
    onSuccess: (data) => {
      toast.success(`List "${data.title}" copied`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      formRef.current?.requestSubmit();
    }
  };

  useEventListener("keydown", onKeyDown);

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    if (title === data.title) {
      return disableEditing();
    }

    executeUpdateList({
      title,
      id,
      boardId,
    });
  };

  const onDelete = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    executeDeleteList({ id, boardId });
  };

  const onCopy = (formData: FormData) => {
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    executeCopyList({ id, boardId });
  };

  const getTextColor = () => {
    if (data?.color) return "text-neutral-700 dark:text-neutral-800";
    return "text-neutral-700 dark:text-neutral-200";
  };

  return (
    <div className="pt-2 px-2 text-sm font-semibold flex items-start gap-x-2">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <form ref={formRef} action={onSubmit} className="flex-1">
            <input hidden id="id" name="id" value={data.id} />
            <input hidden id="boardId" name="boardId" value={data.boardId} />
            <div
              style={
                data.color
                  ? ({ "--list-color": data.color } as React.CSSProperties)
                  : undefined
              }
              className="w-full"
            >
              <FormInput
                ref={inputRef}
                onBlur={() => formRef.current?.requestSubmit()}
                id="title"
                placeholder="Enter list title..."
                defaultValue={title}
                className={`text-sm px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate ${
                  data.color ? "bg-[var(--list-color)]" : "bg-transparent"
                }`}
              />
            </div>
            <button type="submit" hidden />
          </form>
        ) : (
          <div
            onClick={enableEditing}
            className={`w-full text-sm px-2.5 py-1 h-7 font-semibold border-transparent truncate  ${getTextColor()}`}
            title={data.title}
          >
            <Hint description={`Rename ${title}`}>
              <p>{title}</p>
            </Hint>
          </div>
        )}
      </div>

      <div className="flex items-center shrink-0">
        <ReadListButton username="User" listData={data} />
        <ListOptions data={data} onAddCard={onAddCard} />
      </div>
    </div>
  );
};
