"use client";

import { Card } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import CardExpand from "./card-expand";
import CardOptions from "./card-options";
import { ElementRef, useEffect, useRef, useState } from "react";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";

interface CardItemProps {
  data: Card;
  index: number;
}

export const CardItem = ({ data, index }: CardItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(data.title);

  const params = useParams();
  const queryClient = useQueryClient();

  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const disableEditing = () => setIsEditing(false);

  const enableEditing = () => {
    setIsEditing(true);
  };

  // auto focus when the user is editing
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  // rename Card Action
  const { execute: executeUpdateCard, fieldErrors } = useAction(updateCard, {
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      queryClient.invalidateQueries({ queryKey: ["card-logs", data.id] });
      toast.success(`Renamed to "${updatedCard.title}"`);
      setNewTitle(updatedCard.title); // update title
      disableEditing(); // exit editing mode
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // handle form submit
  const onSubmit = (formData: FormData) => {
    const updatedTitle = formData.get("title") as string;
    const boardId = params.boardId as string;
    if (updatedTitle === data.title) {
      setIsEditing(false); // exit editing mode if title hasn't changed
      return;
    }
    executeUpdateCard({ title: updatedTitle, boardId, id: data.id });
  };

  // handle onkeydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };
  // handle exit editing mode
  const onBlur = () => {
    formRef.current?.requestSubmit();
  };

  if (isEditing) {
    return (
      <>
        <div
          className="relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm rounded-md shadow-none w-full "
          style={{ backgroundColor: data.color || "#FFFFFF" }}
        >
          <form ref={formRef} action={onSubmit} className="bg-red">
            <FormTextarea
              color={data.color}
              ref={textareaRef}
              placeholder="Edit title"
              id="title"
              onBlur={onBlur}
              onKeyDown={handleKeyDown}
              defaultValue={data.title}
              errors={fieldErrors}
              className="whitespace-pre-wrap break-words overflow-hidden text-ellipsis pr-8 pl-4 text-sm font-medium w-full bg-transparent border-none outline-none resize-none shadow-none"
            />
            <div />
          </form>
        </div>
      </>
    );
  }

  return (
    // When a color gets added  the drag and drop feature breaks
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="input"
          // TODO: condiser updating the card items if
          className="relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm rounded-md shadow-sm w-full"
          style={{
            ...provided.draggableProps.style,
            backgroundColor: data.color || "#FFFFFF",
          }}
        >
          <span
            onClick={enableEditing}
            className="whitespace-pre-wrap break-words overflow-hidden text-ellipsis pr-8 pl-4"
          >
            {data.title}
          </span>
          <CardExpand id={data.id} />
          {/* Render Card Options Here */}
          <CardOptions data={data} />
        </div>
      )}
    </Draggable>
  );
};
