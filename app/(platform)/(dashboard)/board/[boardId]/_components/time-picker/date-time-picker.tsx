"use client";

import * as React from "react";
import { format } from "date-fns";
import { Bell, Calendar as CalendarIcon, ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@prisma/client";
import { TimePicker } from "./time-picker";
import { useEffect } from "react";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { updateCard } from "@/actions/update-card";
import { useParams } from "next/navigation";

interface DateTimePickerProps {
  data: Card;
}
export function DateTimePicker({ data }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date>();

  const { execute, isLoading } = useAction(updateCard, {
    onSuccess: (data) => {
      toast.success("Date added!");
    },
    onError: (error) => {
      toast.error("Date not added!");
    },
  });

  const params = useParams();

  useEffect(() => {
    if (date) {
      execute({
        id: data.id,
        boardId: params.boardId as string,
        dueDate: date,
      });
    }
  }, [date]);

  const getTextColor = () => {
    if (data?.color && data?.color !== "bg-background")
      return "text-neutral-700";
    return "text-foreground";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {data.dueDate ? (
          <button
            className={`inline-flex items-center rounded-full px-1 py-0 bg-gray-100 text-gray-600`}
            style={{
              // backgroundColor: "#f5f7f9",
              // color: "#4a5568",
              width: "fit-content",
              marginLeft: "1rem",
            }}
          >
            <span className="text-sm font-medium">
              {format(data.dueDate, "MMM d, yyyy, hh:mm aaa")}
            </span>
            <Bell className="ml-1 h-3 w-3" />
          </button>
        ) : (
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date < new Date()}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <TimePicker date={date} setDate={setDate} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
