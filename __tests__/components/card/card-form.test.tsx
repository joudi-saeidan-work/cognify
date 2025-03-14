import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// Simple mocks for dependencies
jest.mock("next/navigation", () => ({
  useParams: () => ({ boardId: "board123" }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Create mock for action and hook
const mockExecute = jest
  .fn()
  .mockImplementation((data: any) => Promise.resolve(data));
jest.mock("../../../actions/create-card", () => ({
  createCard: jest.fn(),
}));

jest.mock("../../../hooks/use-actions", () => ({
  useAction: () => ({
    execute: mockExecute,
    fieldErrors: undefined,
    error: undefined,
    data: undefined,
    isLoading: false,
  }),
}));

// Store handlers for testing
const handlers: Record<string, any> = {};

// Mock hooks - store handlers for testing
jest.mock("usehooks-ts", () => ({
  useOnClickOutside: jest.fn((ref, handler) => {
    handlers.clickOutside = handler;
  }),
  useEventListener: jest.fn((event, handler) => {
    if (event === "keydown") {
      handlers.keydown = handler;
    }
  }),
}));

// Mock components with very basic implementation
jest.mock("../../../app/audio-recorder/_components/live-recorder", () => ({
  LiveRecorder: ({ onTranscription, onRecordingChange }: any) => {
    // Store the callbacks in our handlers object
    handlers.onRecordingChange = onRecordingChange;
    handlers.onTranscription = onTranscription;

    return (
      <div data-testid="live-recorder">
        <button data-testid="mock-button">Test Button</button>
      </div>
    );
  },
}));

jest.mock("../../../components/hint", () => ({
  Hint: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hint">{children}</div>
  ),
}));

// Mock FormTextarea to track state updates
jest.mock("../../../components/form/form-textarea", () => {
  return {
    FormTextarea: React.forwardRef(
      (
        {
          placeholder,
          color,
          onKeyDown,
          onFocus,
          readOnly,
        }: {
          placeholder?: string;
          color?: string | null;
          onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
          onFocus?: () => void;
          readOnly?: boolean;
        },
        ref: React.Ref<HTMLTextAreaElement>
      ) => {
        // Store handlers for direct testing
        if (onKeyDown) handlers.textareaKeyDown = onKeyDown;
        if (onFocus) handlers.textareaFocus = onFocus;

        return (
          <textarea
            ref={ref}
            data-testid="form-textarea"
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
            placeholder={placeholder}
            data-color={color}
          />
        );
      }
    ),
  };
});

// Mock HTML Form requestSubmit
const mockRequestSubmit = jest.fn();
HTMLFormElement.prototype.requestSubmit = mockRequestSubmit;

// Import the component
import { CardForm } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-form";

describe("CardForm Component", () => {
  const defaultProps = {
    listId: "list123",
    enableEditing: jest.fn(),
    disableEditing: jest.fn(),
    isEditing: false,
    color: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset handlers between tests
    Object.keys(handlers).forEach((key) => {
      delete handlers[key];
    });
  });

  test("renders add button when not editing", () => {
    render(<CardForm {...defaultProps} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("enables editing when button is clicked", () => {
    render(<CardForm {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(defaultProps.enableEditing).toHaveBeenCalledTimes(1);
  });

  test("shows form when in editing mode", () => {
    render(<CardForm {...defaultProps} isEditing={true} />);

    expect(screen.getByTestId("form-textarea")).toBeInTheDocument();
    expect(screen.getByTestId("live-recorder")).toBeInTheDocument();
  });

  test("submits form when Enter key is pressed", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<CardForm {...defaultProps} isEditing={true} ref={ref} />);

    // Simulate Enter keydown
    const event = { key: "Enter", preventDefault: jest.fn() };
    handlers.textareaKeyDown(event);

    expect(mockRequestSubmit).toHaveBeenCalled();
    expect(defaultProps.disableEditing).toHaveBeenCalled();
  });

  test("doesn't submit form when Shift+Enter is pressed", () => {
    render(<CardForm {...defaultProps} isEditing={true} />);

    // Simulate Shift+Enter keydown
    const event = { key: "Enter", shiftKey: true, preventDefault: jest.fn() };
    handlers.textareaKeyDown(event);

    expect(mockRequestSubmit).not.toHaveBeenCalled();
  });

  test("disables editing when Escape is pressed", () => {
    render(<CardForm {...defaultProps} isEditing={true} />);

    // Simulate Escape keydown
    handlers.keydown({ key: "Escape" });

    expect(defaultProps.disableEditing).toHaveBeenCalled();
  });

  test("disables editing when clicked outside", () => {
    render(<CardForm {...defaultProps} isEditing={true} />);

    // Simulate outside click
    handlers.clickOutside();

    expect(defaultProps.disableEditing).toHaveBeenCalled();
  });

  test("applies custom color", () => {
    render(<CardForm {...defaultProps} isEditing={true} color="#FF5733" />);
    expect(screen.getByTestId("form-textarea")).toHaveAttribute(
      "data-color",
      "#FF5733"
    );
  });

  test("changes placeholder when recording", () => {
    // Render component
    const { rerender } = render(
      <CardForm {...defaultProps} isEditing={true} />
    );

    // Initial state
    const textarea = screen.getByTestId("form-textarea");
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Write anything or speak..."
    );

    // Set recording state to true and rerender to observe updated state
    act(() => {
      // We need to manually set recording state by calling the callback
      const onRecordingChange = handlers.onRecordingChange;
      if (onRecordingChange) {
        onRecordingChange(true);
      }
    });

    // We need to rerender to see the updated state
    rerender(<CardForm {...defaultProps} isEditing={true} />);

    // Check placeholder has changed
    expect(screen.getByTestId("form-textarea")).toHaveAttribute(
      "placeholder",
      "Listening..."
    );
    expect(screen.getByTestId("form-textarea")).toHaveAttribute("readonly");
  });
});
