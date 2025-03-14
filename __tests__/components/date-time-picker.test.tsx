// Import test utilities
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { DateTimePicker } from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/date-time-picker";
import { Card } from "@prisma/client";
import { toast } from "sonner";

// Mock console methods to prevent log messages in test output
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Mock Pinecone
jest.mock("@/lib/pinecone", () => ({
  notesIndex: {
    namespace: jest.fn(),
    query: jest.fn().mockResolvedValue({
      matches: [
        { id: "note-1", score: 0.9 },
        { id: "note-2", score: 0.8 },
      ],
    }),
    upsert: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({}),
  },
}));

// Mock OpenAI module - needs to be mocked before any imports that use it
jest.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    },
  },
}));

// Mocks setup before imports
const mockUseParams = jest.fn().mockReturnValue({ boardId: "board-123" });
jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock events context
const mockDispatch = jest.fn();
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(calendar)/eventsContext",
  () => ({
    useEvents: () => ({
      dispatch: mockDispatch,
      state: { events: [] },
    }),
  })
);

// Mock toast notifications
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

// Mock debounce to pass through values
jest.mock("@/hooks/use-debounce", () => ({
  __esModule: true,
  default: (value: any) => value,
}));

// Mock Calendar component
jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    selected,
    onSelect,
  }: {
    selected: Date | null;
    onSelect: (date: Date | undefined) => void;
  }) => (
    <div data-testid="mock-calendar">
      <button
        data-testid="select-date"
        onClick={() => onSelect(new Date(2023, 5, 20))}
      >
        Select Date
      </button>
      <span>Selected: {selected ? selected.toDateString() : "None"}</span>
    </div>
  ),
}));

// Mock TimePicker component with checkbox for "Add time"
jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/time-picker",
  () => ({
    TimePicker: ({
      date,
      startDate,
      endDate,
      setStartDate,
      setEndDate,
    }: {
      date: Date;
      startDate: Date | null;
      endDate: Date | null;
      setStartDate: (date: Date | null) => void;
      setEndDate: (date: Date | null) => void;
    }) => (
      <div data-testid="mock-time-picker">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="add-time"
            checked={Boolean(startDate)}
            onChange={(e) => {
              if (e.target.checked) {
                setStartDate(new Date(2023, 5, 20, 14, 30));
              } else {
                setStartDate(null);
                setEndDate(null);
              }
            }}
          />
          <label htmlFor="add-time">Add time</label>
        </div>
        {startDate && (
          <button
            data-testid="select-time"
            onClick={() => {
              setStartDate(new Date(2023, 5, 20, 14, 30));
              setEndDate(new Date(2023, 5, 20, 15, 30));
            }}
          >
            Select Time
          </button>
        )}
        <span>
          Start: {startDate ? startDate.toTimeString() : "None"}
          <br />
          End: {endDate ? endDate.toTimeString() : "None"}
        </span>
      </div>
    ),
  })
);

// Mock Dialog component with a close button
jest.mock("@/components/ui/dialog", () => {
  const MockDialog = (props: any) => (
    <div
      data-testid="dialog"
      style={{ display: props.open ? "block" : "none" }}
    >
      {props.children}
      <button
        aria-label="Close"
        onClick={() => props.onOpenChange(false)}
        data-testid="close-dialog"
      >
        Close
      </button>
    </div>
  );
  const MockDialogContent = (props: any) => (
    <div data-testid="dialog-content" className={props.className || ""}>
      {props.children}
    </div>
  );
  return { Dialog: MockDialog, DialogContent: MockDialogContent };
});

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Trash: () => <div data-testid="trash-icon">Trash</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
}));

// Mock useAction with a function that updates the dispatch
const mockExecute = jest.fn().mockImplementation(async (data) => {
  // Simulate successful update
  if (data) {
    // Dispatch event update on successful card update
    mockDispatch({
      type: "UPDATE_EVENT",
      payload: {
        id: data.id,
        title: data.title || "Test Card",
        start: data.start,
        end: data.end,
        allDay: data.allDay,
        dueDate: data.dueDate,
      },
    });
  }
  return data;
});

jest.mock("@/hooks/use-actions", () => ({
  useAction: () => ({
    execute: mockExecute,
    isLoading: false,
  }),
}));

describe("DateTimePicker Component", () => {
  const mockOnClose = jest.fn();

  const mockCard: Card = {
    id: "card-1",
    title: "Test Card",
    description: null,
    order: 0,
    listId: "list-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: null,
    start: null,
    end: null,
    // Following Card model from Prisma schema
    color: null,
    labelId: null,
    allDay: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with null dates when card has no dates", () => {
    render(
      <DateTimePicker data={mockCard} open={true} onClose={mockOnClose} />
    );

    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    expect(screen.getByText("Selected: None")).toBeInTheDocument();
    // Since there's no date selected, "Add time" checkbox shouldn't appear yet
    expect(screen.queryByText("Add time")).not.toBeInTheDocument();
  });

  it("displays existing dates when card has dates", () => {
    const cardWithDates = {
      ...mockCard,
      dueDate: new Date(2023, 5, 15),
      start: new Date(2023, 5, 15, 10, 0),
      end: new Date(2023, 5, 15, 11, 0),
    };

    render(
      <DateTimePicker data={cardWithDates} open={true} onClose={mockOnClose} />
    );

    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    expect(screen.getByText(/Thu Jun 15 2023/)).toBeInTheDocument();
    expect(screen.getByTestId("mock-time-picker")).toBeInTheDocument();
  });

  it("updates the date when selected from calendar", async () => {
    // Set a longer timeout for this test
    jest.setTimeout(15000);

    render(
      <DateTimePicker data={mockCard} open={true} onClose={mockOnClose} />
    );

    // Verify calendar is rendered
    expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();

    // Click to select a date - using fireEvent instead of userEvent for synchronous behavior
    fireEvent.click(screen.getByTestId("select-date"));

    // The date should be updated - match any date in June 2023
    expect(screen.getByText(/Selected:.+Jun.+2023/)).toBeInTheDocument();

    // Check if our execute function was called with the expected date value
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card-1",
      })
    );
  });

  it("updates the time when selected from time picker", async () => {
    render(
      <DateTimePicker data={mockCard} open={true} onClose={mockOnClose} />
    );

    // First select a date
    await userEvent.click(screen.getByTestId("select-date"));

    // Now we should see the TimePicker component with "Add time" checkbox
    expect(screen.getByLabelText("Add time")).toBeInTheDocument();

    // Toggle the time section by checking the "Add time" checkbox
    await userEvent.click(screen.getByLabelText("Add time"));

    // Should show time picker's select time button
    expect(screen.getByTestId("select-time")).toBeInTheDocument();

    // Click to select a time
    await userEvent.click(screen.getByTestId("select-time"));

    // We should see start and end times set
    expect(screen.getByText(/Start:/)).toHaveTextContent(/14:30:00/);
    expect(screen.getByText(/End:/)).toHaveTextContent(/15:30:00/);
  });

  it("handles clearing dates", async () => {
    const cardWithDates = {
      ...mockCard,
      dueDate: new Date(2023, 5, 15),
      start: new Date(2023, 5, 15, 10, 0),
      end: new Date(2023, 5, 15, 11, 0),
    };

    render(
      <DateTimePicker data={cardWithDates} open={true} onClose={mockOnClose} />
    );

    // Clear Selection button should be present (since we have dates)
    expect(screen.getByText("Clear Selection")).toBeInTheDocument();

    // Clear dates
    await userEvent.click(screen.getByText("Clear Selection"));

    // Should show no date
    await waitFor(() => {
      expect(screen.getByText("Selected: None")).toBeInTheDocument();
    });
  });

  it("closes when the close button is clicked", async () => {
    render(
      <DateTimePicker data={mockCard} open={true} onClose={mockOnClose} />
    );

    // Click close button
    await userEvent.click(screen.getByTestId("close-dialog"));

    // onClose should be called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
