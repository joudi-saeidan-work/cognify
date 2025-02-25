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
import { FormTextarea } from "@/components/form/form-textarea";
import { useTheme } from "next-themes";
import { DateTimePicker } from "../(date-time-picker)/date-time-picker";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";

interface CardItemProps {
  data: Card;
  index: number;
}

export const CardItem = ({ data, index }: CardItemProps) => {
  const { dispatch } = useEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(data.title);

  const params = useParams();
  const queryClient = useQueryClient();

  const formRef = useRef<ElementRef<"form">>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { theme } = useTheme();

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
      toast.success(`Renamed to "${updatedCard.title}"`);
      setNewTitle(updatedCard.title); // update title
      disableEditing(); // exit editing mode

      // Dispatch update to shared state
      dispatch({
        type: "UPDATE_EVENT",
        payload: {
          id: data.id,
          title: updatedCard.title,
          start: updatedCard.dueDate
            ? new Date(updatedCard.dueDate)
            : undefined,
          end: updatedCard.dueDate ? new Date(updatedCard.dueDate) : undefined,
          allDay: false,
          backgroundColor: data.color || undefined,
          dueDate: updatedCard.dueDate,
        },
      });
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
      setIsEditing(false);
      return;
    }

    // Include existing time values in the update
    executeUpdateCard({
      title: updatedTitle,
      boardId,
      id: data.id,
    });
    dispatch({
      type: "UPDATE_EVENT",
      payload: {
        id: data.id,
        title: updatedTitle,
        start: data.start || undefined,
        end: data.end || undefined,
        dueDate: data.dueDate || undefined,
        allDay: data.allDay || false,
      },
    });
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

  const getTextColor = () => {
    // Only apply dark text if we have a custom color set
    if (data.color && data.color !== "bg-background") {
      return "text-black font-medium";
    }
    // Otherwise use theme-aware text color
    return "text-black font-medium";
  };

  if (isEditing) {
    return (
      <>
        <div
          className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm rounded-md shadow-none w-full"
          style={data.color ? { backgroundColor: data.color } : undefined}
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
          className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm rounded-md shadow-sm w-full bg-background"
          style={{
            ...provided.draggableProps.style,
            ...(data.color && data.color !== "bg-background"
              ? { backgroundColor: data.color }
              : {}),
          }}
        >
          <span
            onClick={enableEditing}
            className={`whitespace-pre-wrap break-words overflow-hidden text-ellipsis pr-8 pl-4 ${getTextColor()}`}
          >
            {data.title}
          </span>
          <DateTimePicker data={data} />
          <CardExpand id={data.id} />
          <CardOptions data={data} />
        </div>
      )}
    </Draggable>
  );
};
