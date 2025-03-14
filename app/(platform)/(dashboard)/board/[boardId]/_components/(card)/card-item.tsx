"use client";

import { Card, Label } from "@prisma/client";
import { Draggable } from "@hello-pangea/dnd";
import CardOptions from "./card-options";
import { ElementRef, useEffect, useRef, useState } from "react";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { FormTextarea } from "@/components/form/form-textarea";
import { useTheme } from "next-themes";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";
import {
  CalendarIcon,
  LucideNotebookText,
  Notebook,
  NotebookPen,
  NotebookText,
  ScrollText,
} from "lucide-react";
import { format } from "date-fns";
import { DateTimePicker } from "../(date-time-picker)/date-time-picker";
import { Tooltip } from "@/components/ui/tooltip";
import { Hint } from "@/components/hint";
import { useCardModal } from "@/hooks/use-card-modal";
import { fetcher } from "@/lib/fetcher";
import { LabelPicker } from "../(label)/label-picker";

interface CardItemProps {
  data: Card;
  index: number;
}

// Determine the text color based on the background color
export const getContrastColor = (hexColor: string): string => {
  const color = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;

  // Convert the hex to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate luminance - using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "black" : "white";
};

export const CardItem = ({ data, index }: CardItemProps) => {
  const { dispatch } = useEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(data.title);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const params = useParams();
  const queryClient = useQueryClient();
  const cardModal = useCardModal();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch labels from the API
  const boardId = params.boardId as string;
  const { data: labels = [], isLoading } = useQuery<Label[]>({
    queryKey: ["labels", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/labels`),
  });

  const disableEditing = () => setIsEditing(false);

  const enableEditing = () => {
    if (data.description) {
      cardModal.onOpen(data.id);
    } else {
      setIsEditing(true);
    }
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
    if (data?.color && data?.color !== "bg-background")
      return "text-neutral-700";
    // Use Tailwind classes for theme compatibility
    return "text-foreground dark:text-gray-200";
  };

  // Get a default card background color that's different from the list
  const getCardBackground = () => {
    // If card has a specific color, use that
    if (data.color && data.color !== "bg-background") {
      return { backgroundColor: data.color };
    }

    return {
      backgroundColor: "var(--card-bg-color)",
    };
  };

  // Find the label object that matches the labelId
  const labelObj = data.labelId
    ? labels.find((label) => label.id === data.labelId)
    : null;

  if (isEditing) {
    return (
      <div
        className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 dark:hover:border-white/30 py-2 px-3 text-sm rounded-md shadow-md w-full"
        style={getCardBackground()}
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
          className="group relative flex flex-col justify-between border-2 border-transparent hover:border-black/30 dark:hover:border-white/30 pt-2 pb-3 px-4 text-sm rounded-md shadow-sm w-full"
          style={{
            ...provided.draggableProps.style,
            ...getCardBackground(),
          }}
        >
          <div className="absolute -right-1.5 -top-1.5">
            <CardOptions data={data} labels={labels} />
          </div>

          {/* Display Label if it exists */}
          {data.labelId && labelObj && (
            <Hint description="Edit label">
              <div
                className="font-semibold mb-2 px-2 text-xs rounded self-start -ml-3 cursor-pointer"
                style={{
                  backgroundColor: labelObj.color || "#61bd4f",
                  color: getContrastColor(labelObj.color || "#61bd4f"),
                }}
                onClick={() => setIsLabelPickerOpen(true)}
              >
                {labelObj.name || "Label"}
              </div>
            </Hint>
          )}

          {/* Label Picker Dialog */}
          <LabelPicker
            open={isLabelPickerOpen}
            onClose={() => setIsLabelPickerOpen(false)}
            cardId={data.id}
            boardId={boardId}
            currentLabel={data.labelId}
            labels={labels}
          />

          <div className="flex flex-col mt-3">
            <Hint description={data.description ? "Open Card" : "Rename Card"}>
              <span
                onClick={enableEditing}
                className={`whitespace-pre-wrap break-words font-medium overflow-hidden text-ellipsis  ${getTextColor()}`}
              >
                {data.title}
              </span>
            </Hint>
          </div>

          <div className={`flex items-center mt-4 gap-1`}>
            {data.description && (
              <Hint description="This card has notes">
                <NotebookPen
                  className={`h-3 w-3 text-gray-600`}
                  aria-label="This card has notes"
                  onClick={() => cardModal.onOpen(data.id)}
                />
              </Hint>
            )}
            {/* <DateTimePicker data={data} /> */}
            <div className="relative" onClick={() => setIsDatePickerOpen(true)}>
              {data.dueDate ? (
                <button
                  className={`inline-flex items-center rounded-full py-0 bg-background text-gray-600`}
                  style={{
                    width: "fit-content",
                    backgroundColor: data.color || undefined,
                  }}
                >
                  <CalendarIcon className="mr-1 h-3 w-3 -mt-[1px]" />
                  <span className="text-sm font-medium">
                    {data.start ? (
                      <>
                        {format(
                          data.dueDate,
                          data.end ? "MMM d" : "MMM d, yyyy"
                        )}
                        <span className="ml-1">
                          {format(data.start, "h:mm")}
                          {data.end && `–${format(data.end, "h:mm")}`}
                          {format(data.start, "a")}
                        </span>
                      </>
                    ) : (
                      format(data.dueDate, "MMM d, yyyy")
                    )}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
          {/* Label Picker Dialog */}
          <DateTimePicker
            data={data}
            open={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
          />
        </div>
      )}
    </Draggable>
  );
};
