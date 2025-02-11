"use client";

import { CardWithList } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ElementRef, KeyboardEventHandler, useRef, useState } from "react";
import { useAction } from "@/hooks/use-actions";
import { updateCard } from "@/actions/update-card";
import { toast } from "sonner";
import { FormTextarea } from "@/components/form/form-textarea";

interface HeaderProps {
  data: CardWithList;
}

export const CardHeader = ({ data }: HeaderProps) => {
  const queryClient = useQueryClient();
  const params = useParams();

  const formRef = useRef<ElementRef<"form">>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(data.title);

  const { execute } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      queryClient.invalidateQueries({ queryKey: ["card-logs", data.id] });

      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // ToDo implement this bahaviour when you want to create/rename a card
  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  const onTextareaDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const boardId = params.boardId as string;
    if (title === data.title) {
      return;
    }
    execute({ title, boardId, id: data.id });
  };

  return (
    <div className="w-full">
      <form action={onSubmit} ref={formRef}>
        <FormTextarea
          ref={textAreaRef}
          onBlur={onBlur}
          onKeyDown={onTextareaDown}
          id="title"
          defaultValue={title}
          color={"bg-background"}
          className="resize-none mb-0 shadow-none font-semibold text-xl px-1 bg-transparent border-transparent relative -left-1.5 w-[95%] focus-visible:bg-background focus-visible:border-input truncate"
        />
      </form>
      <p className="text-xs text-muted-foreground mt-0 mb-1">
        in list <span className="underline">{data.list.title}</span>
      </p>
    </div>
  );
};
