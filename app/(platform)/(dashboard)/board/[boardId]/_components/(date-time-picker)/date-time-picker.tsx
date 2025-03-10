"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@prisma/client";
import { TimePicker } from "./time-picker";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";
import { useEvents } from "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import useDebounce from "@/hooks/use-debounce";

interface DateTimePickerProps {
  data: Card;
  open: boolean;
  onClose: () => void;
}

export function DateTimePicker({ data, open, onClose }: DateTimePickerProps) {
  const { dispatch } = useEvents();
  const params = useParams();

  // Local state for date/time values
  const [date, setDate] = React.useState<Date | null>(
    data.dueDate ? new Date(data.dueDate) : null
  );
  const [startDate, setStartDate] = React.useState<Date | null>(
    data.start ? new Date(data.start) : null
  );
  const [endDate, setEndDate] = React.useState<Date | null>(
    data.end ? new Date(data.end) : null
  );

  // This object will track the complete state of our date/time values
  const [timeState, setTimeState] = React.useState({
    dueDate: date,
    start: startDate,
    end: endDate,
    allDay: !startDate,
  });

  // Debounce the state changes to prevent multiple server actions
  const debouncedTimeState = useDebounce(timeState, 500);

  // Effect to update the server when the debounced state changes
  React.useEffect(() => {
    // Only send updates if something actually changed and we have a date
    const hasChanges =
      JSON.stringify(debouncedTimeState) !==
      JSON.stringify({
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        start: data.start ? new Date(data.start) : null,
        end: data.end ? new Date(data.end) : null,
        allDay: !data.start,
      });

    if (
      hasChanges &&
      (debouncedTimeState.dueDate !== null || data.dueDate !== null)
    ) {
      executeCardUpdate({
        id: data.id,
        boardId: params.boardId as string,
        title: data.title,
        dueDate: debouncedTimeState.dueDate,
        start: debouncedTimeState.start,
        end: debouncedTimeState.end,
        allDay: debouncedTimeState.allDay,
      });
    }
  }, [debouncedTimeState]);

  // Update local state and timeState together
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Create pure date (midnight UTC)
      newDate.setUTCHours(0, 0, 0, 0);
      setDate(newDate);

      // Preserve existing times but apply to new date
      let newStart = null;
      let newEnd = null;

      if (startDate) {
        newStart = new Date(newDate);
        newStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      }

      if (endDate) {
        newEnd = new Date(newDate);
        newEnd.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
      }

      setStartDate(newStart);
      setEndDate(newEnd);

      // Update the timeState (this will eventually trigger the server action after debounce)
      setTimeState({
        dueDate: newDate,
        start: newStart,
        end: newEnd,
        allDay: !newStart,
      });
    }
  };

  const handleStartTimeChange = (newStartDate: Date | null) => {
    setStartDate(newStartDate);

    // If clearing start time, also clear end time
    if (!newStartDate) {
      setEndDate(null);
    }

    // Combine the date with time
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

    // Update the timeState
    setTimeState((prev) => ({
      ...prev,
      start: combinedStart,
      end: newStartDate ? prev.end : null,
      allDay: !newStartDate,
    }));
  };

  const handleEndTimeChange = (newEndDate: Date | null) => {
    setEndDate(newEndDate);

    // Combine the date with time
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

    // Update the timeState
    setTimeState((prev) => ({
      ...prev,
      end: combinedEnd,
    }));
  };

  const handleClear = () => {
    // Update state once
    const clearedState = {
      dueDate: null,
      start: null,
      end: null,
      allDay: false,
    };

    setDate(null);
    setStartDate(null);
    setEndDate(null);
    setTimeState(clearedState);

    // Don't call executeCardUpdate here - let the effect handle it
  };

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

  // Sync with incoming data changes
  React.useEffect(() => {
    setDate(data.dueDate ? new Date(data.dueDate) : null);
    setStartDate(data.start ? new Date(data.start) : null);
    setEndDate(data.end ? new Date(data.end) : null);

    setTimeState({
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      start: data.start ? new Date(data.start) : null,
      end: data.end ? new Date(data.end) : null,
      allDay: !data.start,
    });
  }, [data.dueDate, data.start, data.end]);

  const getTextColor = () => {
    if (data?.color && data?.color !== "bg-background")
      return "text-neutral-700";
    return "text-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-auto p-0">
        <div className="pt-6">
          <div className="max-h-[350px] overflow-y-auto">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={handleDateChange}
              initialFocus
            />
            {date && (
              <>
                <div className="p-3 border-t border-border">
                  <TimePicker
                    date={date}
                    setDate={setDate}
                    allDay={!startDate}
                    startDate={startDate}
                    setStartDate={handleStartTimeChange}
                    endDate={endDate}
                    setEndDate={handleEndTimeChange}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
