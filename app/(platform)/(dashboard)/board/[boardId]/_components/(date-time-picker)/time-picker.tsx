"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";
import { TimePeriodSelect } from "./period-select";
import { Period } from "./time-picker-utils";
import { Checkbox } from "@/components/ui/checkbox";

interface TimePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  allDay: boolean;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
}

export function TimePicker({
  date,
  setDate,
  allDay,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: TimePickerProps) {
  // Initialize periods based on existing dates
  const [startPeriod, setStartPeriod] = React.useState<Period>(() => {
    if (!startDate) return "PM";
    const hours = startDate.getHours();
    return hours >= 12 ? "PM" : "AM";
  });

  const [endPeriod, setEndPeriod] = React.useState<Period>(() => {
    if (!endDate) return "PM";
    const hours = endDate.getHours();
    return hours >= 12 ? "PM" : "AM";
  });

  // Initialize showEndTime based on existing data
  const [showEndTime, setShowEndTime] = React.useState(() => Boolean(endDate));
  const [addTime, setAddTime] = React.useState(() =>
    Boolean(startDate || endDate)
  );

  const startHourRef = React.useRef<HTMLInputElement>(null);
  const startMinuteRef = React.useRef<HTMLInputElement>(null);
  const startPeriodRef = React.useRef<HTMLButtonElement>(null);

  const endHourRef = React.useRef<HTMLInputElement>(null);
  const endMinuteRef = React.useRef<HTMLInputElement>(null);
  const endPeriodRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="w-full py-2 px-1">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="add-time"
            checked={addTime}
            onCheckedChange={(checked) => {
              setAddTime(checked as boolean);
              if (!checked) {
                setStartDate(null);
                setShowEndTime(false);
              }
            }}
            className="h-4 w-4"
          />
          <Label htmlFor="add-time">Add time</Label>
        </div>

        {addTime && (
          <div className="space-y-2">
            {/* Start Time */}
            <div className="w-full rounded-md bg-muted/50 p-2">
              <div className="flex items-center gap-1">
                <TimePickerInput
                  picker="12hours"
                  period={startPeriod}
                  date={startDate}
                  setDate={setStartDate}
                  ref={startHourRef}
                  onRightFocus={() => startMinuteRef.current?.focus()}
                  className="w-[48px] text-sm bg-transparent"
                />
                <span className="text-muted-foreground">:</span>
                <TimePickerInput
                  picker="minutes"
                  date={startDate}
                  setDate={setStartDate}
                  ref={startMinuteRef}
                  onLeftFocus={() => startHourRef.current?.focus()}
                  onRightFocus={() => startPeriodRef.current?.focus()}
                  className="w-[48px] text-sm bg-transparent"
                />
                <TimePeriodSelect
                  period={startPeriod}
                  setPeriod={setStartPeriod}
                  date={startDate}
                  setDate={setStartDate}
                  ref={startPeriodRef}
                  onLeftFocus={() => startMinuteRef.current?.focus()}
                  className="ml-1"
                />
              </div>
            </div>

            {/* End Time Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-end-time"
                checked={showEndTime}
                onCheckedChange={(checked) => {
                  setShowEndTime(checked as boolean);
                  if (!checked) {
                    setEndDate(null);
                  }
                }}
                className="h-4 w-4"
              />
              <Label
                htmlFor="show-end-time"
                className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                Add end time
              </Label>
            </div>

            {/* End Time */}
            {showEndTime && (
              <>
                <div className="px-2 text-xs text-muted-foreground">to</div>
                <div className="w-full rounded-md bg-muted/50 p-2">
                  <div className="flex items-center gap-1">
                    <TimePickerInput
                      picker="12hours"
                      period={endPeriod}
                      date={endDate}
                      setDate={setEndDate}
                      ref={endHourRef}
                      onRightFocus={() => endMinuteRef.current?.focus()}
                      className="w-[48px] text-sm bg-transparent"
                    />
                    <span className="text-muted-foreground">:</span>
                    <TimePickerInput
                      picker="minutes"
                      date={endDate}
                      setDate={setEndDate}
                      ref={endMinuteRef}
                      onLeftFocus={() => endHourRef.current?.focus()}
                      onRightFocus={() => endPeriodRef.current?.focus()}
                      className="w-[48px] text-sm bg-transparent"
                    />
                    <TimePeriodSelect
                      period={endPeriod}
                      setPeriod={setEndPeriod}
                      date={endDate}
                      setDate={setEndDate}
                      ref={endPeriodRef}
                      onLeftFocus={() => endMinuteRef.current?.focus()}
                      className="ml-1"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
