"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Copy,
  Trash,
  CalendarIcon,
  NotebookPen,
  WandSparkles,
  Tag,
  CalendarPlus,
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { copyCard } from "@/actions/copy-card";
import { toast } from "sonner";
import { deleteCard } from "@/actions/delete-card";
import { Card, Label } from "@prisma/client";
import { useEffect, useState } from "react";
import { useCardModal } from "@/hooks/use-card-modal";
import { DateTimePicker } from "../(date-time-picker)/date-time-picker";

import { updateCard } from "@/actions/update-card";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetcher } from "@/lib/fetcher";
import { CardWithList } from "@/types";
import { LabelPicker } from "../(label)/label-picker";

interface CardOptionsProps {
  data: Card;
  labels: Label[];
}

// Define the type for AI response
interface AIResponse {
  title: string;
  category: string;
  summary: string;
  todoList: string;
}

const CardOptions = ({ data, labels }: CardOptionsProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const cardModal = useCardModal();
  const { onOpen } = cardModal;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { dispatch } = useEvents();
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [showAiResponseDialog, setShowAiResponseDialog] = useState(false);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", data.id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${data.id}`), // Function to fetch the card data from the API.
    enabled: !!data.id, //only fetch if `id` is defined
  });

  useEffect(() => {
    if (cardData) {
      setDate(cardData.dueDate ? new Date(cardData.dueDate) : null);
      setStartDate(cardData.start ? new Date(cardData.start) : null);
      setEndDate(cardData.end ? new Date(cardData.end) : null);
    }
  }, [cardData]);

  const handleExpandToNote = async () => {
    await queryClient.prefetchQuery(["card", data.id], () =>
      fetcher(`/api/cards/${data.id}`)
    );
    onOpen(data.id);
  };
  const [date, setDate] = useState<Date | null>(
    cardData?.dueDate ? new Date(cardData.dueDate) : null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    cardData?.start ? new Date(cardData.start) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    cardData?.end ? new Date(cardData.end) : null
  );

  const { execute: executeCardUpdate, isLoading } = useAction(updateCard, {
    onSuccess: (data) => {
      if (aiResponse) {
        toast.success(`Card "${data.title}" updated with Magic ToDo!`);

        queryClient.invalidateQueries(["card"]);

        queryClient.invalidateQueries(["board"]);
      } else {
        toast.success(cardData?.dueDate ? "Date updated!" : "Date removed!");
        dispatch({
          type: "UPDATE_EVENT",
          payload: {
            id: cardData?.id,
            title: cardData?.title,
            dueDate: cardData?.dueDate || undefined,
            start: cardData?.start || undefined,
            end: cardData?.end || undefined,
            allDay: cardData?.allDay,
            backgroundColor: cardData?.color || undefined,
          },
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to update card!");
      console.error("Failed to update card:", error);
    },
  });

  // Copy card action
  const { execute: executeCopyCard } = useAction(copyCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" copied`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Delete card action
  const { execute: executeDeleteCard } = useAction(deleteCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" deleted`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Handle copy
  const onCopy = () => {
    const boardId = params.boardId as string;
    executeCopyCard({ id: cardData?.id as string, boardId });
  };

  // Handle delete
  const onDelete = () => {
    const boardId = params.boardId as string;
    executeDeleteCard({ id: cardData?.id as string, boardId });
  };

  const handleMagicTodo = async () => {
    const responseText = `Here's my transcript + \n\n + ${cardData?.title} +  \n\n + ${cardData?.description} +  \n\n + Date: ${cardData?.dueDate}`;
    const braindumpResponse = await fetch("/api/audio-recorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: responseText,
          },
        ],
      }),
    });

    if (!braindumpResponse.ok) {
      throw new Error("AI processing failed");
    }

    const braindumpData = await braindumpResponse.json();
    const contentString = braindumpData.content;

    try {
      const parsed = parseAIResponse(contentString.trim());
      setAiResponse(parsed);
      setShowAiResponseDialog(true);
    } catch (parseError) {
      console.error("Content parsing error:", parseError);
      toast.error("Failed to parse AI response content");
    }
  };

  const handleAcceptAiResponse = async () => {
    if (!aiResponse) return;

    const titleValue = aiResponse.title;
    console.log("ai title value", titleValue);
    const descriptionContent = [];

    if (Boolean(aiResponse.summary?.trim())) {
      const cleanSummary = aiResponse.summary.trim();
      descriptionContent.push(
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Summary" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: cleanSummary }],
        }
      );
    }

    if (Boolean(aiResponse.todoList?.trim())) {
      const tasks = aiResponse.todoList
        .split(/,\s*(?![^()]*\))/)
        .map((task) => task.trim())
        .filter((task) => task.length > 0);

      if (tasks.length > 0) {
        descriptionContent.push(
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "To-Do List" }],
          },
          {
            type: "bulletList",
            content: tasks.map((task) => ({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: task }],
                },
              ],
            })),
          }
        );
      }
    }

    const descriptionJSON = JSON.stringify({
      type: "doc",
      content: descriptionContent,
    });

    await executeCardUpdate({
      id: cardData?.id as string,
      title: titleValue,
      boardId: params.boardId as string,
      description: descriptionJSON,
    });

    await queryClient.invalidateQueries(["card", cardData?.id]);

    setShowAiResponseDialog(false);
  };

  const handleRejectAiResponse = () => {
    setShowAiResponseDialog(false);
  };

  const parseAIResponse = (content: string) => {
    try {
      console.log("Raw content before parsing:", content);
      const raw = JSON.parse(content);

      console.log("Raw JSON structure:", raw);

      const OrganizedThoughtsSchema = z.object({
        title: z.string().min(1).default("Untitled"),
        category: z
          .enum(["Note", "Task", "Journal Entry", "Meeting Note", "Other"])
          .default("Other"),
        summary: z.string().default(""),
        todoList: z.array(z.string()).default([]),
      });

      const parsed = OrganizedThoughtsSchema.parse(raw);
      console.log("Validated content:", parsed);

      return {
        title: parsed.title,
        category: parsed.category,
        summary: parsed.summary,
        todoList: parsed.todoList.join(", "),
      };
    } catch (error) {
      console.error("Parsing failed - Content:", content, "Error:", error);
      toast.error("Failed to process AI response");
      return {
        title: "Invalid Response",
        category: "Other",
        summary: "Could not parse AI output",
        todoList: "",
      };
    }
  };

  return (
    <div className="absolute right-2 top-2">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Card Options"
            className={`opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent dark:hover:bg-transparent -mr-2 -mt-3 ${
              data.color ? "text-neutral-700" : ""
            }`}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          className="w-48"
          aria-label="Card Options Dropdown"
        >
          {/* Magic Todo*/}
          <DropdownMenuItem
            onClick={handleMagicTodo}
            data-testid="magic-todo-item"
            aria-label="Magic ToDo"
          >
            <div className="flex items-center gap-2">
              <WandSparkles className="w-4 h-4" />
              Magic ToDo
            </div>
          </DropdownMenuItem>
          {/* Label Option */}
          <DropdownMenuItem
            onClick={() => setLabelPickerOpen(true)}
            data-testid="label-item"
            aria-label="Label Picker"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {`${cardData?.labelId ? "Edit" : "Add"} Label`}
            </div>
          </DropdownMenuItem>
          {/* Note Option */}
          <DropdownMenuItem
            onClick={handleExpandToNote}
            data-testid="note-item"
            aria-label="Note Picker"
          >
            <div className="flex items-center gap-2">
              <NotebookPen className="w-4 h-4" />
              {`${cardData?.description ? "Edit" : "Open as"} Note`}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDatePickerOpen(true)}
            data-testid="due-date-item"
            aria-label="Due Date Picker"
          >
            <CalendarPlus className="h-4 w-4" />
            {cardData?.dueDate ? "Edit Due Date" : "Set Due Date"}
          </DropdownMenuItem>
          <Separator className="my-2" />
          {/* Copy Option */}
          <DropdownMenuItem
            onClick={onCopy}
            data-testid="copy-item"
            aria-label="Copy Card"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </div>
          </DropdownMenuItem>

          {/* Delete Option */}
          <DropdownMenuItem
            className="text-red-500"
            onClick={onDelete}
            data-testid="delete-item"
            aria-label="Delete Card"
          >
            <div className="flex items-center gap-2">
              <Trash className="w-4 h-4" />
              Delete
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI Response Dialog */}
      {showAiResponseDialog && (
        <Dialog
          open={showAiResponseDialog}
          onOpenChange={setShowAiResponseDialog}
          aria-label="AI Response Dialog"
        >
          <DialogContent
            className="p-6 space-y-4"
            aria-describedby="ai-response-dialog-description"
          >
            <DialogTitle
              id="ai-response-dialog-description"
              className="sr-only"
            >
              AI Generated Response
            </DialogTitle>
            <p id="ai-response-dialog-description" className="sr-only">
              AI Generated Response for card.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Title:</p>
                <p className="text-sm text-gray-600">{aiResponse?.title}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Summary:</p>
                <p className="text-sm text-gray-600">{aiResponse?.summary}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">To-Do List:</p>
                <p className="text-sm text-gray-600">{aiResponse?.todoList}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleAcceptAiResponse}
                className="bg-blue-500 text-white"
                aria-label="Accept AI Response"
              >
                Accept
              </Button>
              <Button
                onClick={handleRejectAiResponse}
                variant="secondary"
                className="bg-gray-300 text-gray-700"
                aria-label="Reject AI Response"
              >
                Reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Label Picker Dialog */}
      <LabelPicker
        open={labelPickerOpen}
        onClose={() => setLabelPickerOpen(false)}
        cardId={data.id}
        boardId={params.boardId as string}
        currentLabel={cardData?.labelId || null}
        labels={labels}
        aria-label="Label Picker Dialog"
      />

      {/* Date Picker Dialog */}
      <DateTimePicker
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        data={data}
        aria-label="Date Picker Dialog"
      />
    </div>
  );
};

export default CardOptions;
