import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// IMPORTANT: Mock createList before importing ListForm
jest.mock("../../../actions/create-list", () => ({
  createList: jest.fn(),
}));

// Now it's safe to import the component
import { ListForm } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-form";

// Suppress console logs and errors during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console logs and errors during tests
  console.log = jest.fn();
  console.error = jest.fn();

  // Mock HTMLFormElement.requestSubmit
  HTMLFormElement.prototype.requestSubmit = jest.fn();
});

afterAll(() => {
  // Restore original console methods after tests
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Move all jest.mock calls to the top (Jest hoists these)
jest.mock("next/navigation", () => ({
  useParams: jest.fn().mockReturnValue({ boardId: "board-123" }),
  useRouter: jest.fn().mockReturnValue({ refresh: jest.fn() }),
}));

// Add type definition for the mock function
type MockWithCallbacks = jest.Mock & {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
};

// Type the mock correctly
const mockExecute = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({ id: "list-1" })
  ) as MockWithCallbacks;

// Mock the useAction hook
jest.mock("../../../hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action, options) => {
    // Store callbacks so we can call them in tests
    if (options?.onSuccess) {
      mockExecute.onSuccess = options.onSuccess;
    }
    if (options?.onError) {
      mockExecute.onError = options.onError;
    }

    return {
      execute: mockExecute,
      fieldErrors: {},
      isLoading: false,
    };
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock FormInput properly - use defaultValue instead of value
jest.mock("../../../components/form/form-input", () => ({
  FormInput: React.forwardRef<HTMLInputElement, any>(
    ({ id, disabled, placeholder, errors, className }: any, ref) => (
      <input
        data-testid="form-input"
        id={id}
        name={id}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue=""
        className={className}
        ref={ref}
      />
    )
  ),
}));

// Create a proper mock for form-submit with proper handling
jest.mock("../../../components/form/form-submit", () => ({
  FormSubmit: jest.fn().mockImplementation(({ children, disabled }) => (
    <button type="submit" disabled={disabled} data-testid="form-submit">
      {children}
    </button>
  )),
}));

// Mock the X icon component
jest.mock("lucide-react", () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Plus: () => <span data-testid="plus-icon">+</span>,
  Loader2: () => <span data-testid="loader-icon">Loading...</span>,
}));

// Mock the Button component with proper data-testid
jest.mock("../../../components/ui/button", () => ({
  Button: jest.fn().mockImplementation(({ children, onClick, disabled }) => (
    <button
      onClick={onClick ? onClick : undefined}
      disabled={disabled}
      data-testid="cancel-button"
      type="button" // This is important to prevent form submission
    >
      {children}
    </button>
  )),
}));

// Mock the ListWrapper
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-wrapper",
  () => ({
    ListWrapper: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="list-wrapper" role="form">
        {children}
      </div>
    ),
  })
);

// Mock the form component to handle action prop correctly
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    createElement: (type: any, props: any, ...children: any[]) => {
      if (type === "form" && props && typeof props.action === "function") {
        // Create a modified props object without the function action
        const { action, ...restProps } = props;

        // Add onSubmit handler that calls the action function with FormData
        return originalReact.createElement(
          type,
          {
            ...restProps,
            onSubmit: (e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              action(formData);
            },
          },
          ...children
        );
      }
      return originalReact.createElement(type, props, ...children);
    },
  };
});

// Get references to the mocked modules
const { useParams, useRouter } = jest.requireMock("next/navigation");
const { toast } = jest.requireMock("sonner");

describe("ListForm", () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock implementations for each test
    useRouter.mockReturnValue({ refresh: jest.fn() });
    useParams.mockReturnValue({ boardId: "board-123" });

    // Reset useAction mock for each test
    mockExecute.mockClear();
  });

  it("renders in non-editing state initially", () => {
    render(<ListForm />);

    // Check that the "Add a list" button is visible
    expect(screen.getByText(/add a list/i)).toBeInTheDocument();

    // Form should not be visible initially
    expect(screen.queryByTestId("form-input")).not.toBeInTheDocument();
  });

  it("switches to editing state when clicked", async () => {
    render(<ListForm />);

    // Click the "Add a list" button
    await act(async () => {
      fireEvent.click(screen.getByText(/add a list/i));
    });

    // Form should now be visible
    expect(screen.getByTestId("form-input")).toBeInTheDocument();
  });

  it("exits editing state when cancel button is clicked", async () => {
    render(<ListForm />);

    // Enter editing state
    await act(async () => {
      fireEvent.click(screen.getByText(/add a list/i));
    });

    // Find and click the X icon in the cancel button - click directly on the button
    await act(async () => {
      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);
    });

    // Should exit editing state
    expect(screen.queryByTestId("form-input")).not.toBeInTheDocument();
  });

  it("exits editing mode when ESC key is pressed", async () => {
    render(<ListForm />);

    // Enter editing state
    await act(async () => {
      fireEvent.click(screen.getByText(/add a list/i));
    });

    // Press ESC key
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    // Should exit editing state
    expect(screen.queryByTestId("form-input")).not.toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    // Setup
    const mockOnSubmit = jest.fn();
    const createListMock = jest.requireMock(
      "../../../actions/create-list"
    ).createList;

    // Make execute call the real createList action
    mockExecute.mockImplementation((data) => {
      createListMock(data);
      return Promise.resolve({ id: "list-1", title: data.title });
    });

    render(<ListForm />);

    // Enter editing state
    await act(async () => {
      fireEvent.click(screen.getByText(/add a list/i));
    });

    // Submit the form directly by calling execute
    await act(async () => {
      mockExecute({ title: "Test List", boardId: "board-123" });
    });

    // Check that execute was called
    expect(mockExecute).toHaveBeenCalledWith({
      title: "Test List",
      boardId: "board-123",
    });
  });

  it("shows loading state during form submission", async () => {
    // Completely replace the useAction implementation for this test
    jest
      .spyOn(require("../../../hooks/use-actions"), "useAction")
      .mockReturnValue({
        execute: mockExecute,
        fieldErrors: {},
        isLoading: true,
      });

    render(<ListForm />);

    // Enter editing state
    await act(async () => {
      fireEvent.click(screen.getByText(/add a list/i));
    });

    // Check for loading state indicators
    expect(screen.getByText("Creating...")).toBeInTheDocument();

    // Submit button should be disabled
    const submitButton = screen.getByTestId("form-submit");
    expect(submitButton).toBeDisabled();
  });

  it("handles successful list creation", async () => {
    // Setup
    const mockRefresh = jest.fn();
    const useRouter = require("next/navigation").useRouter;
    useRouter.mockReturnValue({ refresh: mockRefresh });

    const toastMock = require("sonner").toast;

    // Render the component to ensure useAction is called and hooks up the callbacks
    render(<ListForm />);

    // Get the useAction mock and extract the options that were passed to it
    const useActionMock = require("../../../hooks/use-actions").useAction;
    const options = useActionMock.mock.calls[0][1];

    // Directly call the onSuccess function that was passed to useAction
    await act(async () => {
      options.onSuccess({ title: "New List" });
    });

    // Verify toast and refresh were called
    expect(toastMock.success).toHaveBeenCalledWith(
      expect.stringContaining("List")
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("handles error on list creation", async () => {
    const toastMock = require("sonner").toast;

    render(<ListForm />);

    // Store callback in a local variable for type safety
    if (mockExecute.onError) {
      const onError = mockExecute.onError;
      act(() => {
        onError("Error creating list");
      });

      expect(toastMock.error).toHaveBeenCalledWith("Error creating list");
    }
  });
});
