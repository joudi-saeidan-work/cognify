"use client";

import { Card } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import CardOptions from "./card-options";
import { ElementRef, useEffect, useRef, useState } from "react";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { FormTextarea } from "@/components/form/form-textarea";
import { useTheme } from "next-themes";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";
import { CalendarIcon, LucideNotebookText, NotebookPen } from "lucide-react";
import { format } from "date-fns";
import { DateTimePicker } from "../(date-time-picker)/date-time-picker";

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

  const formRef = useRef<HTMLFormElement>(null);
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
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      toast.success(`Renamed to "${updatedCard.title}"`);
      setNewTitle(updatedCard.title);
      disableEditing();

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
      toast.error("Failed to update card");
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
    return data.color && data.color !== "bg-background"
      ? "text-black font-medium"
      : "text-black font-medium";
  };

  if (isEditing) {
    return (
      <div
        className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-2 px-3 text-sm rounded-md shadow-md w-full"
        style={data.color ? { backgroundColor: data.color } : undefined}
      >
        <form ref={formRef} action={onSubmit} className="w-full">
          <FormTextarea
            color={data.color}
            ref={textareaRef}
            placeholder="Edit title"
            id="title"
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            defaultValue={data.title}
            errors={fieldErrors}
            className="whitespace-pre-wrap break-words overflow-hidden text-ellipsis px-2 py-1 text-sm font-medium w-full bg-transparent border-none outline-none resize-none shadow-none"
          />
        </form>
      </div>
    );
  }

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="input"
          className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 py-3 px-4 text-sm rounded-md shadow-sm w-full bg-background"
          style={{
            ...provided.draggableProps.style,
            ...(data.color && data.color !== "bg-background"
              ? { backgroundColor: data.color }
              : {}),
          }}
        >
          <div className="flex flex-col gap-2">
            <span
              onClick={enableEditing}
              className={`whitespace-pre-wrap break-words overflow-hidden text-ellipsis px-2 ${getTextColor()}`}
            >
              {data.title}
            </span>

            <DateTimePicker data={data} />
          </div>

          <div className="flex justify-between items-center mt-2">
            {data.description && (
              <LucideNotebookText
                className="h-4 w-4 text-blue-500"
                aria-label="Has notes"
              />
            )}
            <CardOptions data={data} />
          </div>
        </div>
      )}
    </Draggable>
  );
};
