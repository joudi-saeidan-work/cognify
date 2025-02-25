"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Card } from "@prisma/client";
import { TimePicker } from "./time-picker";

import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";

interface DateTimePickerProps {
  data: Card;
}

export function DateTimePicker({ data }: DateTimePickerProps) {
  const { dispatch } = useEvents();

  const [date, setDate] = React.useState<Date | null>(
    data.dueDate ? new Date(data.dueDate) : null
  );
  const [startDate, setStartDate] = React.useState<Date | null>(
    data.start ? new Date(data.start) : null
  );
  const [endDate, setEndDate] = React.useState<Date | null>(
    data.end ? new Date(data.end) : null
  );
  const [open, setOpen] = React.useState(false);

  const params = useParams();

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
    setDate(newDate || null);
    if (!newDate) {
      setStartDate(null);
      setEndDate(null);
    }

    executeCardUpdate({
      id: data.id,
      boardId: params.boardId as string,
      dueDate: newDate || undefined,
      title: data.title,
      start: startDate || undefined,
      end: endDate || undefined,
      allDay: !startDate, // allDay is true when there's no start time
    });
  };

  const handleClear = () => {
    setDate(null);
    setStartDate(null);
    setEndDate(null);
    setOpen(false);

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

  const getTextColor = () => {
    if (data?.color && data?.color !== "bg-background")
      return "text-neutral-700";
    return "text-foreground";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* If there's a due date, show the date button */}
        {data.dueDate ? (
          <button
            className={`inline-flex items-center rounded-full px-1 py-0 bg-background text-gray-600`}
            style={{
              width: "fit-content",
              marginLeft: "0.75rem",
              backgroundColor: data.color || undefined,
            }}
          >
            <CalendarIcon className="mr-1 h-3 w-3 -mt-[1px]" />
            <span className="text-sm font-medium">
              {data.start ? (
                <>
                  {format(data.dueDate, data.end ? "MMM d" : "MMM d, yyyy")}
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
        ) : (
          // If no due date, show just the calendar icon
          <Button
            size="sm"
            variant="ghost"
            className={`opacity-0 group-hover:opacity-100 transition-opacity absolute right-7 h-4 w-4 hover:bg-transparent ${getTextColor()}`}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
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
                    setStartDate(newStartDate);
                    if (!newStartDate) {
                      setEndDate(null);
                    }
                    executeCardUpdate({
                      id: data.id,
                      boardId: params.boardId as string,
                      dueDate: date,
                      title: data.title,
                      start: newStartDate,
                      end: newStartDate ? endDate : null,
                      allDay: !newStartDate,
                    });
                  }}
                  endDate={endDate}
                  setEndDate={(newEndDate) => {
                    setEndDate(newEndDate);
                    executeCardUpdate({
                      id: data.id,
                      boardId: params.boardId as string,
                      dueDate: date,
                      title: data.title,
                      start: startDate,
                      end: newEndDate,
                      allDay: !startDate,
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
      </PopoverContent>
    </Popover>
  );
}
