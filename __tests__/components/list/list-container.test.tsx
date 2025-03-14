import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListContainer } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-container";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Mock the required modules
jest.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: any) => void;
  }) => {
    // Store the onDragEnd callback so we can call it in our tests
    (global as any).mockOnDragEnd = onDragEnd;
    return <div data-testid="drag-drop-context">{children}</div>;
  },
  Droppable: ({
    children,
    droppableId,
    type,
  }: {
    children: (provided: any) => React.ReactNode;
    droppableId: string;
    type: string;
  }) =>
    children({
      innerRef: () => {},
      droppableProps: { "data-droppable-id": droppableId, "data-type": type },
      placeholder: null,
    }),
  Draggable: ({
    children,
    draggableId,
    index,
  }: {
    children: (provided: any) => React.ReactNode;
    draggableId: string;
    index: number;
  }) =>
    children({
      innerRef: () => {},
      draggableProps: { "data-draggable-id": draggableId },
      dragHandleProps: {},
    }),
}));

// Mock the toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Move all jest.mock() calls to the top (Jest hoists these)
jest.mock("../../../actions/update-list-order", () => ({
  updateListOrder: jest.fn(),
}));

jest.mock("../../../actions/update-card-order", () => ({
  updateCardOrder: jest.fn(),
}));

jest.mock("../../../hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action, options) => ({
    execute: async (data: any) => {
      try {
        await action(data);
        if (options?.onSuccess) options.onSuccess();
      } catch (error: unknown) {
        if (options?.onError) options.onError((error as Error).message);
      }
    },
  })),
}));

// Get references to the mocks for use in your tests
const { updateListOrder } = jest.requireMock(
  "../../../actions/update-list-order"
);
const { updateCardOrder } = jest.requireMock(
  "../../../actions/update-card-order"
);

// Mock the ListItem component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-item",
  () => ({
    ListItem: ({ data, index }: { data: any; index: number }) => (
      <div data-testid={`list-item-${data.id}`} data-index={index}>
        {data.title}
        <ul>
          {data.cards?.map((card: any) => (
            <li key={card.id} data-testid={`card-${card.id}`}>
              {card.title}
            </li>
          ))}
        </ul>
      </div>
    ),
  })
);

// Mock the ListForm component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-form",
  () => ({
    ListForm: () => <div data-testid="list-form">Add a list</div>,
  })
);

describe("ListContainer", () => {
  const mockBoardId = "board-123";
  const mockLists = [
    {
      id: "list-1",
      title: "To Do",
      order: 0,
      boardId: mockBoardId,
      createdAt: new Date(),
      updatedAt: new Date(),
      color: null,
      cards: [
        {
          id: "card-1",
          title: "Task 1",
          order: 0,
          listId: "list-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          color: null,
          description: null,
          labelId: null,
          dueDate: null,
          start: null,
          end: null,
          allDay: false,
        },
        {
          id: "card-2",
          title: "Task 2",
          order: 1,
          listId: "list-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          color: null,
          description: null,
          labelId: null,
          dueDate: null,
          start: null,
          end: null,
          allDay: false,
        },
      ],
    },
    {
      id: "list-2",
      title: "In Progress",
      order: 1,
      boardId: mockBoardId,
      createdAt: new Date(),
      updatedAt: new Date(),
      color: null,
      cards: [
        {
          id: "card-3",
          title: "Task 3",
          order: 0,
          listId: "list-2",
          createdAt: new Date(),
          updatedAt: new Date(),
          color: null,
          description: null,
          labelId: null,
          dueDate: null,
          start: null,
          end: null,
          allDay: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders lists correctly", () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Check if lists are rendered
    expect(screen.getByTestId("list-item-list-1")).toBeInTheDocument();
    expect(screen.getByTestId("list-item-list-2")).toBeInTheDocument();

    // Check if the list form is rendered
    expect(screen.getByTestId("list-form")).toBeInTheDocument();
  });

  it("updates list order when a list is dragged", async () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Simulate a list drag end event
    const dragEndEvent = {
      destination: { index: 1, droppableId: "lists" },
      source: { index: 0, droppableId: "lists" },
      type: "list",
    };

    (global as any).mockOnDragEnd(dragEndEvent);

    // Check if updateListOrder was called with the correct arguments
    await waitFor(() => {
      expect(updateListOrder).toHaveBeenCalledWith({
        boardId: mockBoardId,
        items: expect.arrayContaining([
          expect.objectContaining({ id: "list-2", order: 0 }),
          expect.objectContaining({ id: "list-1", order: 1 }),
        ]),
      });
    });
  });

  it("updates card order when a card is dragged within the same list", async () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Simulate a card drag end event within the same list
    const dragEndEvent = {
      destination: { index: 1, droppableId: "list-1" },
      source: { index: 0, droppableId: "list-1" },
      type: "card",
    };

    (global as any).mockOnDragEnd(dragEndEvent);

    // Check if updateCardOrder was called with the correct arguments
    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledWith({
        boardId: mockBoardId,
        items: expect.arrayContaining([
          expect.objectContaining({ id: "card-2", order: 0 }),
          expect.objectContaining({ id: "card-1", order: 1 }),
        ]),
      });
    });
  });

  it("updates card order when a card is moved to another list", async () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Simulate a card drag end event to another list
    await act(async () => {
      (global as any).mockOnDragEnd({
        destination: { index: 1, droppableId: "list-2" },
        source: { index: 0, droppableId: "list-1" },
        type: "card",
      });
    });

    // Check if updateCardOrder was called with the correct arguments
    await waitFor(() => {
      expect(updateCardOrder).toHaveBeenCalledWith({
        boardId: mockBoardId,
        items: expect.arrayContaining([
          expect.objectContaining({ id: "card-3", order: 0 }),
          expect.objectContaining({ id: "card-2", order: 1, listId: "list-2" }),
        ]),
      });
    });
  });

  it("does nothing when destination is null", async () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Simulate a drag end event with no destination
    const dragEndEvent = {
      destination: null,
      source: { index: 0, droppableId: "list-1" },
      type: "card",
    };

    (global as any).mockOnDragEnd(dragEndEvent);

    // Check that no update actions were called
    expect(updateListOrder).not.toHaveBeenCalled();
    expect(updateCardOrder).not.toHaveBeenCalled();
  });

  it("does nothing when dropped in the same position", async () => {
    render(<ListContainer boardId={mockBoardId} data={mockLists} />);

    // Simulate a drag end event with same source and destination
    const dragEndEvent = {
      destination: { index: 0, droppableId: "list-1" },
      source: { index: 0, droppableId: "list-1" },
      type: "card",
    };

    (global as any).mockOnDragEnd(dragEndEvent);

    // Check that no update actions were called
    expect(updateListOrder).not.toHaveBeenCalled();
    expect(updateCardOrder).not.toHaveBeenCalled();
  });
});
