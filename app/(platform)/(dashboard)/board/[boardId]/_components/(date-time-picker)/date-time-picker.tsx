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

  // Add this useEffect to update state when data changes
  React.useEffect(() => {
    setDate(data.dueDate ? new Date(data.dueDate) : null);
    setStartDate(data.start ? new Date(data.start) : null);
    setEndDate(data.end ? new Date(data.end) : null);
  }, [data.dueDate, data.start, data.end]);

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
        <div className="relative">
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
          ) : null}
        </div>
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
      </PopoverContent>
    </Popover>
  );
}
