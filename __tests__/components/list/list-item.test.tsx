import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListItem } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-item";
import { ListWithCards } from "@/types";

// Suppress console logs and errors during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console logs and errors during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods after tests
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Mock the dependencies
jest.mock("@hello-pangea/dnd", () => ({
  Draggable: ({
    children,
    draggableId,
    index,
  }: {
    children: any;
    draggableId: string;
    index: number;
  }) => {
    return children({
      draggableProps: { "data-draggable-id": draggableId },
      dragHandleProps: {
        "data-drag-handle": true,
      },
      innerRef: jest.fn(),
    });
  },
  Droppable: ({
    children,
    droppableId,
    type,
  }: {
    children: any;
    droppableId: string;
    type: string;
  }) =>
    children({
      droppableProps: { "data-droppable-id": droppableId, "data-type": type },
      innerRef: jest.fn(),
      placeholder: null,
    }),
}));

// Mock the ListHeader component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-header",
  () => ({
    ListHeader: ({
      data,
      onAddCard,
    }: {
      data: ListWithCards;
      onAddCard: () => void;
    }) => (
      <div data-testid="list-header" onClick={onAddCard}>
        {data.title}
      </div>
    ),
  })
);

// Mock the CardItem component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-item",
  () => ({
    CardItem: ({ data, index }: { data: any; index: number }) => (
      <div data-testid={`card-item-${data.id}`} data-index={index}>
        {data.title}
      </div>
    ),
  })
);

// Mock the CardForm component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-form",
  () => ({
    CardForm: React.forwardRef(
      (
        { listId, isEditing, enableEditing, disableEditing, color }: any,
        ref: any
      ) => (
        <div
          data-testid="card-form"
          data-list-id={listId}
          data-is-editing={isEditing}
          data-color={color}
        >
          <button onClick={enableEditing} data-testid="enable-editing-btn">
            Enable
          </button>
          <button onClick={disableEditing} data-testid="disable-editing-btn">
            Disable
          </button>
        </div>
      )
    ),
  })
);

// Mock the theme hook
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}));

// Mock the auth hook
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "user-123" }),
}));

describe("ListItem", () => {
  const mockList = {
    id: "list-1",
    title: "Test List",
    order: 0,
    boardId: "board-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    color: null,
    cards: [
      {
        id: "card-1",
        title: "Card 1",
        order: 0,
        listId: "list-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: "Card 1 description",
        color: null,
        labelId: null,
        dueDate: null,
        start: null,
        end: null,
        allDay: false,
      },
      {
        id: "card-2",
        title: "Card 2",
        order: 1,
        listId: "list-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: "Card 2 description",
        color: null,
        labelId: null,
        dueDate: null,
        start: null,
        end: null,
        allDay: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with list data", () => {
    render(<ListItem data={mockList} index={0} />);

    // Check if ListHeader renders correctly
    expect(screen.getByTestId("list-header")).toHaveTextContent("Test List");

    // Check if all cards are rendered
    expect(screen.getByTestId("card-item-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-item-card-2")).toBeInTheDocument();

    // Check if CardForm is rendered
    expect(screen.getByTestId("card-form")).toBeInTheDocument();
  });

  it("toggles editing state when ListHeader is clicked", async () => {
    // Spy on setTimeout
    jest.useFakeTimers();

    render(<ListItem data={mockList} index={0} />);

    // Check initial state - not editing
    expect(screen.getByTestId("card-form")).toHaveAttribute(
      "data-is-editing",
      "false"
    );

    // Click on ListHeader to enable editing
    await act(async () => {
      fireEvent.click(screen.getByTestId("list-header"));
      jest.runAllTimers(); // Run the setTimeout
    });

    // Check that editing is now enabled
    expect(screen.getByTestId("card-form")).toHaveAttribute(
      "data-is-editing",
      "true"
    );

    // Disable editing
    await act(async () => {
      fireEvent.click(screen.getByTestId("disable-editing-btn"));
    });

    // Check that editing is now disabled
    expect(screen.getByTestId("card-form")).toHaveAttribute(
      "data-is-editing",
      "false"
    );

    jest.useRealTimers();
  });

  it("passes the correct color to CardForm", () => {
    const coloredList = {
      ...mockList,
      color: "#f0f0f0",
    };

    render(<ListItem data={coloredList} index={0} />);

    // Check if the background color is passed correctly
    expect(screen.getByTestId("card-form")).toHaveAttribute(
      "data-color",
      "#f0f0f0"
    );
  });

  it("renders with the correct background color", () => {
    const coloredList = {
      ...mockList,
      color: "#f0f0f0",
    };

    const { container } = render(<ListItem data={coloredList} index={0} />);

    // Find the div with the style attribute
    const styledDiv = container.querySelector("div[style]");
    expect(styledDiv).toHaveStyle("background-color: #f0f0f0");
  });

  it("renders with correct accessibility attributes", () => {
    const { container } = render(<ListItem data={mockList} index={0} />);

    // Check the list element
    const listElement = container.querySelector("li");
    expect(listElement).toHaveAttribute(
      "aria-roledescription",
      "Draggable list"
    );
    expect(listElement).toHaveAttribute(
      "aria-label",
      "List: Test List with 2 cards"
    );

    // In the component, the div that receives dragHandleProps also gets the accessibility attributes
    // However, in our test mock, we're only adding data-drag-handle to dragHandleProps
    // So we verify that the div inside the li element has the correct tabIndex and other attributes
    const divWithDragHandleProps =
      container.querySelector("[data-drag-handle]");
    expect(divWithDragHandleProps).toBeInTheDocument();

    // The parent div of the drag handle should have these attributes
    const parentDiv = divWithDragHandleProps?.closest("div");
    expect(parentDiv).toHaveAttribute("tabIndex", "0");
  });

  it("renders with empty cards array", () => {
    const emptyCardsList = {
      ...mockList,
      cards: [],
    };

    render(<ListItem data={emptyCardsList} index={0} />);

    // List should still render without cards
    expect(screen.getByTestId("list-header")).toHaveTextContent("Test List");
    expect(screen.queryByTestId(/card-item-/)).not.toBeInTheDocument();
  });

  it("uses default background color when color is null", () => {
    render(<ListItem data={mockList} index={0} />);

    // Check if the CardForm gets the default background color
    expect(screen.getByTestId("card-form")).toHaveAttribute(
      "data-color",
      "bg-background"
    );
  });

  it("enables and focuses editing when required", async () => {
    // Create a spy for the focus method
    const focusSpy = jest.fn();

    // Mock the useRef return value
    jest.spyOn(React, "useRef").mockReturnValue({
      current: {
        focus: focusSpy,
      },
    });

    jest.useFakeTimers();

    render(<ListItem data={mockList} index={0} />);

    // Enable editing
    await act(async () => {
      fireEvent.click(screen.getByTestId("enable-editing-btn"));
      jest.runAllTimers(); // Run the setTimeout
    });

    // Check if focus was called
    expect(focusSpy).toHaveBeenCalled();

    jest.useRealTimers();
    jest.restoreAllMocks();
  });
});
