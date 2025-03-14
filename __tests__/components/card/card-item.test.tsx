import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Card, Label } from "@prisma/client";
import { ActionState, FieldErrors } from "../../../lib/create-safe-actions";

// Define types for the useAction parameters
type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

// Extend the Card type to include boardId for testing
interface CardWithBoardId extends Card {
  boardId: string;
}

// Mock all dependencies first
jest.mock("@hello-pangea/dnd", () => ({
  Draggable: ({
    children,
    draggableId,
    index,
  }: {
    children: (provided: any) => React.ReactNode;
    draggableId: string;
    index: number;
  }) => {
    const provided = {
      draggableProps: {
        style: {},
      },
      dragHandleProps: {},
      innerRef: jest.fn(),
    };
    return children(provided);
  },
}));

// Mock actions
jest.mock("../../../actions/update-card", () => ({
  updateCard: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({
    boardId: "board1",
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn().mockReturnValue({
    data: [
      {
        id: "label1",
        name: "Bug",
        color: "#FF0000",
        boardId: "board1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isLoading: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock form requestSubmit method since it's not implemented in jsdom
const mockRequestSubmit = jest.fn();
HTMLFormElement.prototype.requestSubmit = mockRequestSubmit;

// Create mock for useAction
const executeUpdateCardMock = jest
  .fn()
  .mockImplementation((data) => Promise.resolve(data));
jest.mock("../../../hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action, options) => ({
    execute: executeUpdateCardMock,
    fieldErrors: undefined,
    error: undefined,
    data: undefined,
    isLoading: false,
  })),
}));

// Create mock for useCardModal with a mockable function
const onOpenMock = jest.fn();
jest.mock("../../../hooks/use-card-modal", () => ({
  useCardModal: jest.fn().mockImplementation(() => ({
    id: undefined,
    isOpen: false,
    onOpen: onOpenMock,
    onClose: jest.fn(),
  })),
}));

jest.mock(
  "../../../app/(platform)/(dashboard)/_components/(calendar)/eventsContext",
  () => ({
    useEvents: () => ({
      dispatch: jest.fn(),
    }),
  })
);

jest.mock("../../../components/hint", () => ({
  Hint: ({
    children,
    description,
  }: {
    children: React.ReactNode;
    description: string;
  }) => (
    <div data-testid="hint" data-description={description}>
      {children}
    </div>
  ),
}));

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/date-time-picker",
  () => ({
    DateTimePicker: jest.fn().mockReturnValue(null),
  })
);

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(label)/label-picker",
  () => ({
    LabelPicker: jest.fn().mockReturnValue(null),
  })
);

jest.mock("../../../lib/fetcher", () => ({
  fetcher: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

jest.mock("date-fns", () => ({
  format: jest.fn().mockImplementation((date, formatStr) => {
    if (formatStr === "MMM d, yyyy") return "Jan 1, 2023";
    if (formatStr === "MMM d") return "Jan 1";
    if (formatStr === "h:mm") return "10:00";
    if (formatStr === "a") return "AM";
    return "Jan 1, 2023";
  }),
}));

// Mock form component to avoid action prop warning
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    createElement: (
      type: React.ElementType,
      props: any,
      ...children: React.ReactNode[]
    ) => {
      if (type === "form" && props && props.action !== undefined) {
        const newProps = { ...props, action: "#" };
        return originalReact.createElement(type, newProps, ...children);
      }
      return originalReact.createElement(type, props, ...children);
    },
  };
});

jest.mock("../../../components/form/form-textarea", () => ({
  FormTextarea: React.forwardRef(
    (
      {
        onBlur,
        onKeyDown,
        defaultValue,
        className,
        placeholder,
        id,
        errors,
      }: {
        onBlur?: () => void;
        onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
        defaultValue?: string;
        className?: string;
        placeholder?: string;
        id?: string;
        errors?: Record<string, string[] | undefined>;
      },
      ref: React.Ref<HTMLTextAreaElement>
    ) => (
      <textarea
        ref={ref}
        defaultValue={defaultValue}
        placeholder={placeholder}
        id={id}
        className={className}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        data-testid="form-textarea"
      />
    )
  ),
}));

// Mock the card-options module - order is important
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-options",
  () => {
    const CardOptions = () => <div data-testid="card-options"></div>;
    return {
      __esModule: true,
      default: CardOptions,
    };
  }
);

// Now import the component after all mocks are set up
const {
  CardItem,
} = require("../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-item");

describe("CardItem Component", () => {
  // Test data
  const mockCard: CardWithBoardId = {
    id: "card1",
    title: "Test Card",
    description: null,
    order: 1,
    listId: "list1",
    boardId: "board1",
    createdAt: new Date(),
    updatedAt: new Date(),
    color: null,
    labelId: null,
    dueDate: null,
    start: null,
    end: null,
    allDay: false,
  };

  // Set up tests
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress React warnings during tests
    const originalConsoleError = console.error;
    jest.spyOn(console, "error").mockImplementation((...args) => {
      // Check if first argument is a string containing the action prop warning
      const firstArg = args[0];
      if (
        typeof firstArg === "string" &&
        firstArg.includes("Invalid value for prop `action`")
      ) {
        return;
      }
      // Otherwise pass through to original console.error
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the card with correct title", () => {
    render(<CardItem data={mockCard} index={0} />);
    expect(screen.getByText("Test Card")).toBeInTheDocument();
  });

  it("renders card options", () => {
    render(<CardItem data={mockCard} index={0} />);
    expect(screen.getByTestId("card-options")).toBeInTheDocument();
  });

  it("enters edit mode on title click if card has no description", () => {
    render(<CardItem data={mockCard} index={0} />);
    fireEvent.click(screen.getByText("Test Card"));
    expect(screen.getByTestId("form-textarea")).toBeInTheDocument();
  });

  it("saves edited title on blur", async () => {
    render(<CardItem data={mockCard} index={0} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Test Card"));

    // Change title
    const textarea = screen.getByTestId("form-textarea");
    fireEvent.change(textarea, { target: { value: "Updated Card Title" } });

    // Submit form on blur
    fireEvent.blur(textarea);

    // Check if our mocked requestSubmit was called
    await waitFor(() => {
      expect(mockRequestSubmit).toHaveBeenCalled();
    });
  });

  it("enters edit mode and submits on Enter key", async () => {
    render(<CardItem data={mockCard} index={0} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Test Card"));

    // Change title and press Enter
    const textarea = screen.getByTestId("form-textarea");
    fireEvent.change(textarea, { target: { value: "Updated Card Title" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    // Check if our mocked requestSubmit was called
    await waitFor(() => {
      expect(mockRequestSubmit).toHaveBeenCalled();
    });
  });

  it("renders card with a label when labelId is provided", () => {
    const cardWithLabel: CardWithBoardId = {
      ...mockCard,
      labelId: "label1",
    };

    render(<CardItem data={cardWithLabel} index={0} />);

    // The label should be rendered but might be null in the test environment
    // due to the mocked useQuery not returning proper label data
    // We can at least verify the LabelPicker is called with correct props
    expect(
      require("../../../app/(platform)/(dashboard)/board/[boardId]/_components/(label)/label-picker")
        .LabelPicker
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        cardId: "card1",
        currentLabel: "label1",
      }),
      expect.anything()
    );
  });

  it("renders card with due date when provided", () => {
    const date = new Date("2023-01-01T10:00:00Z");
    const cardWithDueDate: CardWithBoardId = {
      ...mockCard,
      dueDate: date,
    };

    render(<CardItem data={cardWithDueDate} index={0} />);
    // Find text content within a span element
    const dateElement = screen.getByText("Jan 1, 2023");
    expect(dateElement).toBeInTheDocument();
  });

  it("renders card with due date and time when start time is provided", () => {
    const date = new Date("2023-01-01T10:00:00Z");
    const cardWithDateTime: CardWithBoardId = {
      ...mockCard,
      dueDate: date,
      start: date,
    };

    render(<CardItem data={cardWithDateTime} index={0} />);

    // Use getByRole to find the button that contains the date and time
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // Check that the button contains the formatted date
    expect(button).toHaveTextContent("Jan 1");
    expect(button).toHaveTextContent("10:00");
    expect(button).toHaveTextContent("AM");
  });

  it("renders card with note icon when description is provided", () => {
    const cardWithDescription: CardWithBoardId = {
      ...mockCard,
      description: "This is a test description",
    };

    render(<CardItem data={cardWithDescription} index={0} />);

    // Find all hints and filter to find the one with notes description
    const hints = screen.getAllByTestId("hint");
    const noteHint = hints.find(
      (hint) => hint.getAttribute("data-description") === "This card has notes"
    );

    expect(noteHint).toBeInTheDocument();
    expect(noteHint).toHaveAttribute("data-description", "This card has notes");
  });

  it("opens card modal when clicking on card with description", () => {
    // useCardModal is already mocked at the top level

    const cardWithDescription: CardWithBoardId = {
      ...mockCard,
      description: "This is a test description",
    };

    render(<CardItem data={cardWithDescription} index={0} />);

    // Click on title
    fireEvent.click(screen.getByText("Test Card"));

    // Check if onOpen was called with card id
    expect(onOpenMock).toHaveBeenCalledWith("card1");
  });

  it("opens date picker when clicking on date button", () => {
    const date = new Date("2023-01-01T10:00:00Z");
    const cardWithDueDate: CardWithBoardId = {
      ...mockCard,
      dueDate: date,
    };

    render(<CardItem data={cardWithDueDate} index={0} />);

    // Click on the date button
    fireEvent.click(screen.getByText("Jan 1, 2023"));

    // Check if DateTimePicker was called with open=true
    expect(
      require("../../../app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/date-time-picker")
        .DateTimePicker
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: cardWithDueDate,
        open: true,
      }),
      expect.anything()
    );
  });

  it("uses colored background when card has color", () => {
    const cardWithColor: CardWithBoardId = {
      ...mockCard,
      color: "#FF5733",
    };

    const { container } = render(<CardItem data={cardWithColor} index={0} />);

    // Find the main card div
    const cardDiv = container.querySelector('div[role="input"]');
    expect(cardDiv).toHaveStyle("background-color: #FF5733");
  });
});
