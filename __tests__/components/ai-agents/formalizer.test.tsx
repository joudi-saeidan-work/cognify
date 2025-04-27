/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { AIToolConfig } from "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config";
import { toast } from "sonner";
import { useChat } from "ai/react";
import Formalizer from "@/app/(platform)/(dashboard)/_components/(ai-agents)/formalizer";

// Create a proper mock for useChat
const mockUseChat = jest.fn();
const mockSetInput = jest.fn();
const mockHandleSubmit = jest.fn();

// Mock the AI module
jest.mock("ai/react", () => ({
  useChat: (...args: any[]) => mockUseChat(...args),
}));

// Mock Image component from next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock toast with inline functions
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the cn utility function
jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Create references to the mock functions for assertions
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

// Mock Select component and capture onValueChange
let mockSelectOnValueChange: ((value: string) => void) | null = null;

// Fix DOM nesting warnings by not using actual HTML elements in mocks
jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => {
    if (onValueChange) {
      mockSelectOnValueChange = onValueChange;
    }
    return (
      <div data-testid="select" data-value={value}>
        {children}
      </div>
    );
  },
  SelectTrigger: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({
    children,
    placeholder,
  }: {
    children: React.ReactNode;
    placeholder?: string;
  }) => (
    <div data-testid="select-value" data-placeholder={placeholder}>
      {children}
    </div>
  ),
  SelectContent: ({
    children,
    className,
    position,
    sideOffset,
  }: {
    children: React.ReactNode;
    className?: string;
    position?: string;
    sideOffset?: number;
  }) => (
    <div
      data-testid="select-content"
      className={className}
      data-position={position}
      data-side-offset={sideOffset}
    >
      {children}
    </div>
  ),
  SelectItem: ({
    value,
    children,
    className,
  }: {
    value: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      data-testid="select-item"
      data-value={value}
      className={className}
      onClick={() => mockSelectOnValueChange && mockSelectOnValueChange(value)}
    >
      {children}
    </div>
  ),
}));

describe("Formalizer", () => {
  // Mock props
  const mockProps = {
    onClose: jest.fn(),
    open: true,
    config: {
      id: "formalizer",
      name: "Text Formalizer",
      description: "Formalize your text",
      apiRoute: "/api/formalizer",
      initialMessage: "Enter your text here...",
    } as AIToolConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Get references to the mocked functions
    Object.assign(mockToastSuccess, toast.success);
    Object.assign(mockToastError, toast.error);
    mockSelectOnValueChange = null;

    // Reset the useChat mock to default behavior
    mockSetInput.mockClear();
    mockHandleSubmit.mockClear();
    mockUseChat.mockReturnValue({
      messages: [],
      append: jest.fn().mockResolvedValue({}),
      isLoading: false,
      error: null,
      setMessages: jest.fn(),
      setInput: mockSetInput,
      handleSubmit: mockHandleSubmit,
    });
  });

  afterEach(() => {
    // Clean up any pending timeouts or promises after each test
    jest.useRealTimers();
  });

  it("renders correctly when open is true", () => {
    render(<Formalizer {...mockProps} />);

    // Check component is visible
    expect(screen.getByText("Text Formalizer")).toBeInTheDocument();
    expect(screen.getByText("Make my text...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Convert/i })
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(<Formalizer {...mockProps} open={false} />);
    // When open=false, the div should have the 'hidden' class
    const hiddenDiv = container.querySelector(".hidden");
    expect(hiddenDiv).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<Formalizer {...mockProps} />);
    // Find the close button by its SVG icon
    const closeButton = screen.getByRole("button", {
      name: "Close", // The button has aria-label="Close"
    });
    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("handles text input", () => {
    render(<Formalizer {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Enter your text here...");

    act(() => {
      fireEvent.change(textarea, {
        target: { value: "Hello world" },
      });
    });

    expect(textarea).toHaveValue("Hello world");
  });

  it("disables the Convert button when input or style is empty", () => {
    render(<Formalizer {...mockProps} />);

    const button = screen.getByRole("button", { name: /convert/i });
    const textarea = screen.getByPlaceholderText("Enter your text here...");

    // Initially button should be disabled
    expect(button).toBeDisabled();

    // Add text but no style selected yet
    act(() => {
      fireEvent.change(textarea, { target: { value: "Hello world" } });
    });

    // The button remains disabled until style is selected
    expect(button).toBeDisabled();
  });

  it("enables button when both text and style are selected", async () => {
    render(<Formalizer {...mockProps} />);

    const button = screen.getByRole("button", { name: /convert/i });
    const textarea = screen.getByPlaceholderText("Enter your text here...");

    // Add text
    act(() => {
      fireEvent.change(textarea, { target: { value: "Hello world" } });
    });

    // Simulate style selection
    await act(async () => {
      if (mockSelectOnValueChange) {
        mockSelectOnValueChange("More professional");
      }
    });

    // Now button should be enabled
    expect(button).not.toBeDisabled();
  });

  it("submits form and calls setInput and handleSubmit with correct data", async () => {
    // Set longer timeout for this test
    jest.setTimeout(15000);

    // Create handler function mocks
    const mockSetInputFn = jest.fn();
    const mockHandleSubmitFn = jest.fn((e) => e.preventDefault());

    // Setup useChat mock with the handler functions
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      setMessages: jest.fn(),
      setInput: mockSetInputFn,
      handleSubmit: mockHandleSubmitFn,
    });

    render(<Formalizer {...mockProps} />);

    // Get form elements directly by tag name
    const form = document.querySelector("form");
    const textarea = screen.getByPlaceholderText("Enter your text here...");
    const convertButton = screen.getByRole("button", { name: /convert/i });

    // Fill the textarea
    fireEvent.change(textarea, { target: { value: "Hello world" } });

    // Set the style option by triggering the mockSelectOnValueChange directly
    act(() => {
      if (mockSelectOnValueChange) {
        mockSelectOnValueChange("More professional");
      }
    });

    // Make sure button is enabled after setting the style
    expect(convertButton).not.toBeDisabled();

    // Click the button instead of submitting the form
    fireEvent.click(convertButton);

    // Verify that setInput was called with the text
    expect(mockSetInputFn).toHaveBeenCalledWith("Hello world");

    // Verify the form submission handler was called
    expect(mockHandleSubmitFn).toHaveBeenCalled();
  });

  it("shows loading state when submitting", async () => {
    // Mock loading state
    mockUseChat.mockReturnValue({
      messages: [],
      append: jest.fn(),
      isLoading: true,
      error: null,
      setMessages: jest.fn(),
      setInput: mockSetInput,
      handleSubmit: mockHandleSubmit,
    });

    render(<Formalizer {...mockProps} />);

    // Check button text changes to "Converting..."
    const button = screen.getByRole("button", { name: "Convert Text" });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("displays converted text when processing finishes", async () => {
    // Mock a successful response
    const onFinishMock = jest.fn();

    // Setup the mock to capture the onFinish callback
    mockUseChat.mockImplementation((config) => {
      if (config && config.onFinish) {
        onFinishMock.mockImplementation(config.onFinish);
      }
      return {
        messages: [],
        isLoading: false,
        error: null,
        setMessages: jest.fn(),
        setInput: mockSetInput,
        handleSubmit: mockHandleSubmit,
      };
    });

    render(<Formalizer {...mockProps} />);

    // Simulate successful conversion
    await act(async () => {
      onFinishMock({ content: "Professionally formatted text" });
    });

    // Check if converted text is displayed
    await waitFor(() => {
      expect(screen.getByText("Converted Text")).toBeInTheDocument();
      expect(
        screen.getByText("Professionally formatted text")
      ).toBeInTheDocument();
    });
  });

  it("handles clipboard operations", async () => {
    jest.useFakeTimers();

    // Setup with converted text already present
    mockUseChat.mockImplementation((config) => {
      if (config && config.onFinish) {
        // Immediately call onFinish to set the converted text
        setTimeout(() => {
          if (config.onFinish) {
            config.onFinish({ content: "Professional version of the input" });
          }
        }, 0);
      }
      return {
        messages: [],
        isLoading: false,
        error: null,
        setMessages: jest.fn(),
        setInput: mockSetInput,
        handleSubmit: mockHandleSubmit,
      };
    });

    await act(async () => {
      render(<Formalizer {...mockProps} />);
      // Advance timers to trigger the setTimeout
      jest.advanceTimersByTime(10);
    });

    // Wait for the converted text to appear
    await waitFor(() => {
      expect(screen.getByText("Converted Text")).toBeInTheDocument();
    });

    // Find and click the copy button
    await act(async () => {
      const copyButton = screen.getByRole("button", { name: /copy/i });
      fireEvent.click(copyButton);
    });

    // Verify clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Professional version of the input"
    );

    // Verify toast was shown
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard!", {
      duration: 1500,
    });
  });

  it("handles form submission errors", async () => {
    // Mock error case
    const onErrorMock = jest.fn();

    // Setup the mock to capture the onError callback
    mockUseChat.mockImplementation((config) => {
      if (config && config.onError) {
        onErrorMock.mockImplementation(config.onError);
      }
      return {
        messages: [],
        isLoading: false,
        error: null,
        setMessages: jest.fn(),
        setInput: mockSetInput,
        handleSubmit: mockHandleSubmit,
      };
    });

    render(<Formalizer {...mockProps} />);

    // Simulate an error
    await act(async () => {
      onErrorMock({ message: "API call failed" });
    });

    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith(
      "Processing failed: API call failed"
    );
  });

  it("validates style selection before form submission", async () => {
    render(<Formalizer {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Enter your text here...");

    // Add text without selecting a style
    act(() => {
      fireEvent.change(textarea, { target: { value: "Hello world" } });
    });

    // Create a mock event
    const mockEvent = { preventDefault: jest.fn() };

    // Directly call handleFormSubmit by triggering form submission
    await act(async () => {
      const form = screen
        .getByRole("button", { name: /convert/i })
        .closest("form");
      if (form) {
        fireEvent.submit(form, mockEvent);
      }
    });

    // Verify error toast was shown for missing style
    expect(toast.error).toHaveBeenCalledWith(
      "Please select a style option first"
    );

    // Verify that handleSubmit was not called
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it("renders all style options in the dropdown", () => {
    render(<Formalizer {...mockProps} />);

    // Find all SelectItem components
    const selectItems = screen.getAllByTestId("select-item");

    // Check that there are the expected number of style options
    expect(selectItems.length).toBe(15); // There are 15 style options defined

    // Check specific style options exist
    const styleValues = selectItems.map((item) =>
      item.getAttribute("data-value")
    );
    expect(styleValues).toContain("More professional");
    expect(styleValues).toContain("Grammatically correct");
    expect(styleValues).toContain("More polite");
    expect(styleValues).toContain("Less emotional");
    expect(styleValues).toContain("More passionate");
  });
});
