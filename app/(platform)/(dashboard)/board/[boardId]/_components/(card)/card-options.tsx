"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Copy,
  Trash,
  CalendarIcon,
  NotebookPen,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { copyCard } from "@/actions/copy-card";
import { toast } from "sonner";
import { deleteCard } from "@/actions/delete-card";
import { Card } from "@prisma/client";
import { useEffect, useState } from "react";
import { useCardModal } from "@/hooks/use-card-modal";
import { DateTimePicker } from "../(date-time-picker)/date-time-picker";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "../(date-time-picker)/time-picker";
import { updateCard } from "@/actions/update-card";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";

interface CardOptionsProps {
  data: Card;
}

const CardOptions = ({ data }: CardOptionsProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const cardModal = useCardModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { dispatch } = useEvents();
  const [isOpen, setIsOpen] = useState(false);

  // Add this useEffect to update state when data changes
  useEffect(() => {
    setDate(data.dueDate ? new Date(data.dueDate) : null);
    setStartDate(data.start ? new Date(data.start) : null);
    setEndDate(data.end ? new Date(data.end) : null);
  }, [data.dueDate, data.start, data.end]);

  const [date, setDate] = useState<Date | null>(
    data.dueDate ? new Date(data.dueDate) : null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    data.start ? new Date(data.start) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    data.end ? new Date(data.end) : null
  );

  const { execute: executeCardUpdate, isLoading } = useAction(updateCard, {
    onSuccess: (data) => {
      toast.success(data.dueDate ? "Date updated!" : "Date removed!");
      dispatch({
        type: "UPDATE_EVENT",
        payload: {
          id: data.id,
          title: data.title,
          dueDate: data.dueDate || undefined,
          start: data.start || undefined,
          end: data.end || undefined,
          allDay: data.allDay,
          backgroundColor: data.color || undefined,
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to update date!");
      console.error("Failed to update date:", error);
    },
  });

  // Calculate allDay based on presence of times
  const allDay = !startDate;

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Create pure date (midnight UTC)
      newDate.setUTCHours(0, 0, 0, 0);

      // Preserve existing times but apply to new date
      const start = startDate
        ? new Date(
            newDate.getUTCFullYear(),
            newDate.getUTCMonth(),
            newDate.getUTCDate(),
            startDate.getUTCHours(),
            startDate.getUTCMinutes()
          )
        : null;
      console.log("start", start);

      const end = endDate
        ? new Date(
            newDate.getUTCFullYear(),
            newDate.getUTCMonth(),
            newDate.getUTCDate(),
            endDate.getUTCHours(),
            endDate.getUTCMinutes()
          )
        : null;
      console.log("end", end);
      console.log("updating dates.. ", {
        id: data.id,
        boardId: params.boardId as string,
        title: data.title,
        dueDate: newDate || null,
        start: start || null,
        end: end || null,
        allDay: data.allDay,
      });

      executeCardUpdate({
        id: data.id,
        boardId: params.boardId as string,
        title: data.title,
        dueDate: newDate || null,
        start: start || null,
        end: end || null,
        allDay: data.allDay,
      });
    }
  };

  const handleClear = () => {
    setIsOpen(false);
    setDate(null);
    setStartDate(null);
    setEndDate(null);

    console.log("attempting to clear fields", {
      id: data.id,
      boardId: params.boardId as string,
      title: data.title,
      dueDate: null,
      start: null,
      end: null,
      allDay: false,
    });
    executeCardUpdate({
      id: data.id,
      boardId: params.boardId as string,
      title: data.title,
      dueDate: null,
      start: null,
      end: null,
      allDay: false,
    });
  };

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
    executeCopyCard({ id: data.id, boardId });
  };

  // Handle delete
  const onDelete = () => {
    const boardId = params.boardId as string;
    executeDeleteCard({ id: data.id, boardId });
  };

  // Handle expand to note
  const handleExpandToNote = async () => {
    await queryClient.prefetchQuery(["card", data.id], () =>
      fetch(`/api/cards/${data.id}`).then((res) => res.json())
    );
    cardModal.onOpen(data.id);
  };

  const handleDatePickerOpen = (open: boolean) => {
    setDatePickerOpen(open);
  };

  return (
    <div className="absolute right-2 top-2">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={`opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white`}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-48">
          {/* Note Option */}
          <DropdownMenuItem onClick={handleExpandToNote}>
            <div className="flex items-center gap-2">
              <NotebookPen className="w-4 h-4" />
              Open as Note
            </div>
          </DropdownMenuItem>

          {/* Calendar Option - Modified to use onClick instead of onSelect */}
          <DropdownMenuSub
            open={datePickerOpen}
            onOpenChange={handleDatePickerOpen}
          >
            <DropdownMenuSubTrigger>
              <CalendarIcon className="h-4 w-4" />
              {data.dueDate ? "Edit Due Date" : "Set Due Date"}
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent
                alignOffset={-20}
                className="p-0 overflow-hidden"
                onInteractOutside={(e) => e.preventDefault()}
              >
                <div className="max-h-[350px] overflow-y-auto">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={handleDateChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {date && (
                    <>
                      <div className="p-3 border-t border-border">
                        <TimePicker
                          date={date}
                          setDate={setDate}
                          allDay={allDay}
                          startDate={startDate}
                          setStartDate={(newStartDate) => {
                            console.log("setting start date", newStartDate);
                            setStartDate(newStartDate);
                            if (!newStartDate) {
                              setEndDate(null);
                            }

                            // Combine the date from dueDate with time from newStartDate
                            let combinedStart = null;
                            if (newStartDate && date) {
                              combinedStart = new Date(date);
                              combinedStart.setHours(
                                newStartDate.getHours(),
                                newStartDate.getMinutes(),
                                0,
                                0
                              );
                            }

                            executeCardUpdate({
                              id: data.id,
                              boardId: params.boardId as string,
                              dueDate: date,
                              title: data.title,
                              start: combinedStart,
                              end: newStartDate ? endDate : null,
                              allDay: data.allDay,
                            });
                          }}
                          endDate={endDate}
                          setEndDate={(newEndDate) => {
                            setEndDate(newEndDate);

                            // Combine the date from dueDate with time from newStartDate
                            let combinedEnd = null;
                            if (newEndDate && date) {
                              combinedEnd = new Date(date);
                              combinedEnd.setHours(
                                newEndDate.getHours(),
                                newEndDate.getMinutes(),
                                0,
                                0
                              );
                            }

                            executeCardUpdate({
                              id: data.id,
                              boardId: params.boardId as string,
                              dueDate: date,
                              title: data.title,
                              start: startDate,
                              end: combinedEnd,
                              allDay: data.allDay,
                            });
                          }}
                        />
                      </div>
                      <div className="p-3 border-t border-border">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full font-medium"
                          onClick={handleClear}
                          disabled={isLoading}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Clear Selection
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Copy Option */}
          <DropdownMenuItem onClick={onCopy}>
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </div>
          </DropdownMenuItem>

          {/* Delete Option */}
          <DropdownMenuItem className="text-red-500" onClick={onDelete}>
            <div className="flex items-center gap-2">
              <Trash className="w-4 h-4" />
              Delete
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CardOptions;
