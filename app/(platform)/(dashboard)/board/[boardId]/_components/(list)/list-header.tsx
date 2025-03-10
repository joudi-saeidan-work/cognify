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

interface ListHeaderProps {
  data: List;
  onAddCard: () => void;
}
export const ListHeader = ({ data, onAddCard }: ListHeaderProps) => {
  const { theme } = useTheme();
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

  const { execute, fieldErrors, isLoading } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const disableEditing = () => {
    setIsEditing(false);
  };

  const handleSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;

    execute({ title, id, boardId });
  };

  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      formRef.current?.requestSubmit();
    }
  };
  useEventListener("keydown", onKeyDown);

  const getTextColor = () => {
    if (data.color) return "text-neutral-800";
    return "text-foreground";
  };

  return (
    <div className="pt-2 pb-2 px-2 text-sm font-semibold flex justify-between items-start gap-x-2">
      {isEditing ? (
        <form
          ref={formRef}
          action={handleSubmit}
          className="flex-1 px-[2px] relative"
        >
          <input hidden id="id" name="id" value={data.id} />
          <input hidden id="boardId" name="boardId" value={data.boardId} />
          <FormInput
            errors={fieldErrors}
            ref={inputRef}
            onBlur={onBlur}
            id="title"
            placeholder="Enter list title.."
            defaultValue={title}
            disabled={isLoading}
            className={`text-sm px-[7px] py-1 h-7 font-semibold border-transparent hover:border-input focus:border-input transition truncate bg-transparent ${getTextColor()}`}
          />
          {isLoading && (
            <div className="absolute right-1 top-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          <button type="submit" hidden />
        </form>
      ) : (
        <div
          onClick={enableEditing}
          className={`w-full text-sm px-2.5 py-1 h-7 font-semibold border-transparent ${getTextColor()}`}
        >
          {title}
        </div>
      )}
      <ListOptions onAddCard={onAddCard} data={data} />
    </div>
  );
};
