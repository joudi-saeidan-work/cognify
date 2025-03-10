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
  const handleTimeChange = (
    newDate: Date | null,
    type: "start" | "end" | "dueDate"
  ) => {
    // If updating start time, ensure it's not after end time
    if (type === "start" && newDate && endDate) {
      if (newDate > endDate) {
        // If new start time is after current end time, adjust end time
        const adjustedEnd = new Date(newDate);
        adjustedEnd.setMinutes(adjustedEnd.getMinutes() + 30); // Add 30 minutes as buffer
        setEndDate(adjustedEnd);

        // Update timeState with both the new start and adjusted end
        setTimeState({
          ...timeState,
          start: newDate,
          end: adjustedEnd,
        });
        return;
      }
    }

    // If updating end time, ensure it's not before start time
    if (type === "end" && newDate && startDate) {
      if (newDate < startDate) {
        toast.error("End time cannot be before start time");
        return; // Don't update state with invalid end time
      }
    }

    // Normal flow for valid time updates
    if (type === "start") {
      setStartDate(newDate);
    } else if (type === "end") {
      setEndDate(newDate);
    } else {
      setDate(newDate);
    }

    // Update timeState with the new values
    setTimeState({
      ...timeState,
      [type]: newDate,
    });
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

  const handleDateSelect = (newDate: Date | undefined) => {
    handleTimeChange(newDate || null, "dueDate");
  };

  const handleStartChange = (date: Date | null) => {
    handleTimeChange(date, "start");
  };

  const handleEndChange = (date: Date | null) => {
    handleTimeChange(date, "end");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-auto p-0">
        <div className="pt-6">
          <div className="max-h-[350px] overflow-y-auto">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={handleDateSelect}
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
                    setStartDate={handleStartChange}
                    endDate={endDate}
                    setEndDate={handleEndChange}
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
