"use client";

import * as React from "react";
import { Period } from "./time-picker-utils";
import { cn } from "@/lib/utils";

interface TimePeriodSelectProps {
  period: Period;
  setPeriod: (period: Period) => void;
  date: Date | null;
  setDate: (date: Date | null) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
  className?: string;
}

export const TimePeriodSelect = React.forwardRef<
  HTMLButtonElement,
  TimePeriodSelectProps
>(
  (
    { period, setPeriod, date, setDate, onLeftFocus, onRightFocus, className },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
    };

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          "flex rounded-md bg-transparent p-0.5 gap-0.5",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setPeriod("AM")}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-[48px] text-sm rounded transition-colors duration-200",
            period === "AM"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => setPeriod("PM")}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-[48px] text-sm rounded transition-colors duration-200",
            period === "PM"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          PM
        </button>
      </div>
    );
  }
);

TimePeriodSelect.displayName = "TimePeriodSelect";
