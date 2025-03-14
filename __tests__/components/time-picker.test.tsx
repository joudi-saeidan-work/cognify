import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimePicker } from "@/components/time-picker";

// Mock the child components
jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/time-picker-input",
  () => ({
    TimePickerInput: ({
      picker,
      date,
      setDate,
      period,
      onRightFocus,
      onLeftFocus,
      className,
    }: any) => (
      <div
        data-testid={`time-picker-input-${picker}`}
        data-date={date?.toISOString()}
        data-period={period}
      >
        <input
          className={className}
          data-testid={`input-${picker}`}
          data-period={period}
          value="set"
        />
        <button
          data-testid={`mock-right-focus-${picker}`}
          onClick={onRightFocus}
        >
          Right Focus
        </button>
        <button data-testid={`mock-left-focus-${picker}`} onClick={onLeftFocus}>
          Left Focus
        </button>
        <button
          data-testid={`mock-set-date-${picker}`}
          onClick={() => setDate && setDate(new Date(2023, 0, 1, 15, 45))}
        >
          Set Date
        </button>
      </div>
    ),
  })
);

jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/period-select",
  () => ({
    TimePeriodSelect: ({
      period,
      setPeriod,
      date,
      setDate,
      onLeftFocus,
      className,
    }: any) => (
      <button
        data-testid="period-select"
        data-period={period}
        data-date={date?.toISOString()}
        className={className}
        onClick={() => {
          setPeriod(period === "AM" ? "PM" : "AM");
          if (setDate && date) {
            const newDate = new Date(date);
            const hours = newDate.getHours();
            if (period === "AM" && hours < 12) {
              newDate.setHours(hours + 12);
              setDate(newDate);
            } else if (period === "PM" && hours >= 12) {
              newDate.setHours(hours - 12);
              setDate(newDate);
            }
          }
        }}
      >
        {period}
      </button>
    ),
  })
);

// Mock the Checkbox component
jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ id, checked, onCheckedChange, className }: any) => (
    <input
      type="checkbox"
      id={id}
      data-testid={`checkbox-${id}`}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={className}
    />
  ),
}));

// Mock the Label component
jest.mock("@/components/ui/label", () => ({
  Label: ({ htmlFor, children, className }: any) => (
    <label
      htmlFor={htmlFor}
      data-testid={`label-${htmlFor}`}
      className={className}
    >
      {children}
    </label>
  ),
}));

// Mock console methods to prevent warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("TimePicker Component", () => {
  // Test setup
  const defaultProps = {
    date: new Date(2023, 0, 1, 14, 30), // 2:30 PM
    setDate: jest.fn(),
    allDay: false,
    startDate: new Date(2023, 0, 1, 10, 0), // 10:00 AM
    setStartDate: jest.fn(),
    endDate: new Date(2023, 0, 1, 14, 30), // 2:30 PM
    setEndDate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<TimePicker {...defaultProps} />);

    // Check that the add time checkbox is shown
    const addTimeCheckbox = screen.getByTestId("checkbox-add-time");
    expect(addTimeCheckbox).toBeInTheDocument();

    // Since the startDate is provided, the time picker inputs should be visible
    const timePickerInputs = screen.getAllByTestId("time-picker-input-12hours");
    expect(timePickerInputs.length).toBeGreaterThan(0);

    const minuteInputs = screen.getAllByTestId("time-picker-input-minutes");
    expect(minuteInputs.length).toBeGreaterThan(0);

    const periodSelects = screen.getAllByTestId("period-select");
    expect(periodSelects.length).toBeGreaterThan(0);

    // Since endDate is provided, the end time checkbox should be checked
    const showEndTimeCheckbox = screen.getByTestId("checkbox-show-end-time");
    expect(showEndTimeCheckbox).toBeChecked();
  });

  it("toggles the add time checkbox correctly", () => {
    const setStartDate = jest.fn();
    render(<TimePicker {...defaultProps} setStartDate={setStartDate} />);

    const addTimeCheckbox = screen.getByTestId("checkbox-add-time");

    // Initial state should be checked (true) because startDate is provided
    expect(addTimeCheckbox).toBeChecked();

    // Toggle the checkbox to false
    fireEvent.click(addTimeCheckbox);

    // setStartDate should be called with null
    expect(setStartDate).toHaveBeenCalledWith(null);
  });

  it("renders with allDay=true correctly", () => {
    render(<TimePicker {...defaultProps} allDay={true} />);

    const addTimeCheckbox = screen.getByTestId("checkbox-add-time");

    // Checkbox should be checked because startDate is set
    expect(addTimeCheckbox).toBeChecked();

    // Time pickers should be visible because addTime is true
    const timePickerInputs = screen.getAllByTestId("time-picker-input-12hours");
    expect(timePickerInputs.length).toBeGreaterThan(0);

    const minuteInputs = screen.getAllByTestId("time-picker-input-minutes");
    expect(minuteInputs.length).toBeGreaterThan(0);

    const periodSelects = screen.getAllByTestId("period-select");
    expect(periodSelects.length).toBeGreaterThan(0);
  });

  it("shows end time controls when checkbox is toggled", () => {
    // Start with null endDate
    render(<TimePicker {...defaultProps} endDate={null} />);

    // The add-time checkbox should be checked because startDate is set
    const addTimeCheckbox = screen.getByTestId("checkbox-add-time");
    expect(addTimeCheckbox).toBeChecked();

    // Show end time checkbox should not be checked
    const showEndTimeCheckbox = screen.getByTestId("checkbox-show-end-time");
    expect(showEndTimeCheckbox).not.toBeChecked();

    // End time controls should not be visible yet
    expect(screen.getAllByTestId("time-picker-input-12hours").length).toBe(1);

    // Toggle the showEndTime checkbox
    fireEvent.click(showEndTimeCheckbox);

    // End time controls should now be visible
    expect(screen.getAllByTestId("time-picker-input-12hours").length).toBe(2);
    expect(screen.getAllByTestId("time-picker-input-minutes").length).toBe(2);
    expect(screen.getAllByTestId("period-select").length).toBe(2);
  });

  it("handles focus navigation between time inputs", () => {
    render(<TimePicker {...defaultProps} />);

    // Get the focus buttons for the start time components
    const hourRightFocusButtons = screen.getAllByTestId(
      "mock-right-focus-12hours"
    );
    const minuteLeftFocusButtons = screen.getAllByTestId(
      "mock-left-focus-minutes"
    );
    const minuteRightFocusButtons = screen.getAllByTestId(
      "mock-right-focus-minutes"
    );

    // These focus methods should navigate between inputs
    // Test right focus from hours to minutes
    fireEvent.click(hourRightFocusButtons[0]);

    // Test left focus from minutes to hours
    fireEvent.click(minuteLeftFocusButtons[0]);

    // Test right focus from minutes to period
    fireEvent.click(minuteRightFocusButtons[0]);
  });

  it("updates period when clicked", () => {
    render(<TimePicker {...defaultProps} />);

    // Get the period select component for the start time (first one)
    const periodSelects = screen.getAllByTestId("period-select");
    const startPeriodSelect = periodSelects[0];

    // Click to toggle the period
    fireEvent.click(startPeriodSelect);
  });

  it("handles updating start and end times independently", () => {
    render(<TimePicker {...defaultProps} />);

    // Get the set date buttons for start and end times
    const setDateButtons = screen.getAllByTestId("mock-set-date-12hours");
    const startSetDateButton = setDateButtons[0];

    // Update start time
    fireEvent.click(startSetDateButton);

    // setStartDate should be called
    expect(defaultProps.setStartDate).toHaveBeenCalled();

    // Get end time set date button (only available when end time is shown)
    if (setDateButtons.length > 1) {
      // Update end time
      fireEvent.click(setDateButtons[1]);

      // setEndDate should be called
      expect(defaultProps.setEndDate).toHaveBeenCalled();
    }
  });

  it("renders correctly when start/end dates are null", () => {
    render(<TimePicker {...defaultProps} startDate={null} endDate={null} />);

    // The add time checkbox should not be checked
    const addTimeCheckbox = screen.getByTestId("checkbox-add-time");
    expect(addTimeCheckbox).not.toBeChecked();

    // Time pickers should not be visible
    expect(
      screen.queryByTestId("time-picker-input-12hours")
    ).not.toBeInTheDocument();

    // Enable time
    fireEvent.click(addTimeCheckbox);

    // Now time pickers should be visible
    expect(screen.getByTestId("time-picker-input-12hours")).toBeInTheDocument();
    expect(screen.getByTestId("time-picker-input-minutes")).toBeInTheDocument();
    expect(screen.getByTestId("period-select")).toBeInTheDocument();
  });

  it("handles displaying start and end times with different periods", () => {
    render(
      <TimePicker
        {...defaultProps}
        startDate={new Date(2023, 0, 1, 9, 30)} // 9:30 AM
        endDate={new Date(2023, 0, 1, 16, 45)} // 4:45 PM
      />
    );

    // Toggle show end time to make sure it's displayed
    const showEndTimeCheckbox = screen.getByTestId("checkbox-show-end-time");
    expect(showEndTimeCheckbox).toBeChecked();

    // Get all period selects (start and end)
    const periodSelects = screen.getAllByTestId("period-select");
    expect(periodSelects.length).toBe(2);

    // Check periods
    expect(periodSelects[0]).toHaveAttribute("data-period", "AM"); // Start time is AM
    expect(periodSelects[1]).toHaveAttribute("data-period", "PM"); // End time is PM
  });
});
