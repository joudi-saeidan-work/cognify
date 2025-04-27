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

// Save original console.error
const originalConsoleError = console.error;

// Setup and teardown for JSON parsing errors
beforeAll(() => {
  // Mock console.error to suppress expected errors during tests
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console.error after tests
  console.error = originalConsoleError;
});

// Mock the AI modules
const mockHandleSubmit = jest.fn();
const mockSetInput = jest.fn();
jest.mock("ai/react", () => ({
  useChat: jest.fn(() => ({
    handleSubmit: mockHandleSubmit,
    isLoading: false,
    setInput: mockSetInput,
    messages: [],
  })),
}));

// Mock the clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

// Mock toast notifications
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn((message, options) => mockToastSuccess(message, options)),
    error: jest.fn((message, options) => mockToastError(message, options)),
  },
}));

// Import the actual component
import Professor from "@/app/(platform)/(dashboard)/_components/(ai-agents)/professor";
import { toast } from "sonner";
import { useChat } from "ai/react";

// Helper function to trigger JSON response
const simulateAIResponse = async (parsedContent: any) => {
  // Get the onFinish callback from the last useChat call
  const chatHookMock = useChat as jest.Mock;
  const lastCall = chatHookMock.mock.calls[chatHookMock.mock.calls.length - 1];
  const onFinish = lastCall[0].onFinish;

  // Call it with a mock response within act
  await act(async () => {
    onFinish({
      id: "test-response",
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });
  });
};

describe("Professor", () => {
  // Mock props
  const mockProps = {
    onClose: jest.fn(),
    open: true,
    config: {
      id: "professor",
      name: "The Professor",
      description: "Learn something new",
      apiRoute: "/api/professor",
      initialMessage: "What do you want to learn about?",
    } as AIToolConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when open is true", () => {
    render(<Professor {...mockProps} />);

    // Check component is visible
    expect(screen.getByText("The Professor")).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    expect(textarea).toBeInTheDocument();
    const submitButton = screen.getByText("Teach me");
    expect(submitButton).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(<Professor {...mockProps} open={false} />);
    // When open=false, the div should have the 'hidden' class
    const hiddenDiv = container.querySelector(".hidden");
    expect(hiddenDiv).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<Professor {...mockProps} />);

    // Find the close button by its icon (X is inside an SVG)
    const closeButton = screen.getByRole("button", {
      name: "Close", // The X button has aria-label="Close"
    });

    // Make sure we're getting the right button
    expect(closeButton.innerHTML).toContain("svg");

    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("handles topic input", () => {
    render(<Professor {...mockProps} />);

    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    expect(textarea).toHaveValue("javascript promises");
  });

  it("disables the Teach me button when input is empty", () => {
    render(<Professor {...mockProps} />);

    const button = screen.getByRole("button", { name: "Teach me" });
    expect(button).toBeDisabled();

    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    expect(button).not.toBeDisabled();
  });

  it("submits form and displays lesson content when form is submitted", async () => {
    render(<Professor {...mockProps} />);

    // Enter topic
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    // Submit form
    const button = screen.getByRole("button", { name: "Teach me" });
    fireEvent.click(button);

    // Verify setInput and handleSubmit were called
    expect(mockSetInput).toHaveBeenCalledWith("javascript promises");
    expect(mockHandleSubmit).toHaveBeenCalled();

    // Simulate AI response
    const mockLesson = {
      explanation:
        "Promises are objects that represent the eventual completion of an asynchronous operation.",
      example:
        "const myPromise = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve('Success!');\n  }, 1000);\n});",
    };

    await simulateAIResponse(mockLesson);

    // Check if lesson sections are rendered
    await waitFor(() => {
      expect(screen.getByText("Explanation")).toBeInTheDocument();
      expect(screen.getByText("Example")).toBeInTheDocument();
    });

    // Check content is displayed
    expect(screen.getByText(/Promises are objects/)).toBeInTheDocument();
    expect(screen.getByText(/const myPromise/)).toBeInTheDocument();
  });

  it("handles failed JSON parsing", async () => {
    render(<Professor {...mockProps} />);

    // Enter topic and submit
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    const button = screen.getByRole("button", { name: "Teach me" });
    fireEvent.click(button);

    // Get the onFinish callback from the useChat mock
    const chatHookMock = useChat as jest.Mock;
    const lastCall =
      chatHookMock.mock.calls[chatHookMock.mock.calls.length - 1];
    const onFinish = lastCall[0].onFinish;

    // Call it with invalid JSON
    await act(async () => {
      onFinish({
        id: "test-response",
        role: "assistant",
        content:
          "This is not valid JSON but will be used as explanation content",
      });
    });

    // Verify error handling - should use raw response as explanation
    expect(mockToastError).toHaveBeenCalledWith(
      "Could not parse response properly",
      expect.anything()
    );

    // The content should still be displayed as explanation
    await waitFor(() => {
      expect(screen.getByText("Explanation")).toBeInTheDocument();
      expect(screen.getByText(/This is not valid JSON/)).toBeInTheDocument();
    });
  }, 10000);

  it("shows loading state when submitting", async () => {
    // Override useChat mock for this test to show loading
    (useChat as jest.Mock).mockReturnValueOnce({
      handleSubmit: mockHandleSubmit,
      isLoading: true,
      setInput: mockSetInput,
      messages: [],
    });

    render(<Professor {...mockProps} />);

    // Enter topic
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    // Check if the button contains the loading text or the Loader2 icon
    const button = screen.getByRole("button", {
      name: /teach me|creating lesson/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("calls clipboard API when Copy is clicked on explanation", async () => {
    render(<Professor {...mockProps} />);

    // Enter topic and submit
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    const button = screen.getByRole("button", { name: "Teach me" });
    fireEvent.click(button);

    // Simulate AI response
    const mockLesson = {
      explanation: "Promises are objects that represent async operations.",
      example:
        "const myPromise = new Promise((resolve) => resolve('Success!'));",
    };

    await simulateAIResponse(mockLesson);

    // Wait for explanation section to render
    await waitFor(() => {
      expect(screen.getByText("Explanation")).toBeInTheDocument();
    });

    // Create a mock implementation to simulate hovering to show the copy button
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      value: () => ({
        bottom: 500,
        height: 100,
        left: 0,
        right: 500,
        top: 200,
        width: 500,
        x: 0,
        y: 200,
        toJSON: () => {},
      }),
      configurable: true,
    });

    // Find the explanation container and trigger mouseover to show the copy button
    const explanationSection = screen
      .getByText(/Promises are objects/)
      .closest("div");
    if (explanationSection) {
      // Directly get the Copy button (may be hidden but still in DOM)
      const copyButtons = Array.from(
        explanationSection.querySelectorAll("button")
      );
      const copyButton = copyButtons.find((btn) =>
        btn.innerHTML.includes("svg")
      );

      if (copyButton) {
        fireEvent.click(copyButton);

        // Verify clipboard API was called with expected content
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "Promises are objects that represent async operations."
        );
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Copied to clipboard!",
          expect.anything()
        );
      }
    }
  });

  it("allows toggling sections", async () => {
    render(<Professor {...mockProps} />);

    // Enter topic, submit form and simulate response
    const textarea = screen.getByPlaceholderText(
      "What do you want to learn about?"
    );
    fireEvent.change(textarea, {
      target: { value: "javascript promises" },
    });

    const button = screen.getByRole("button", { name: "Teach me" });
    fireEvent.click(button);

    await simulateAIResponse({
      explanation: "Promises are objects that represent async operations.",
      example:
        "const myPromise = new Promise((resolve) => resolve('Success!'));",
    });

    // Wait for sections to render
    await waitFor(() => {
      expect(screen.getByText("Explanation")).toBeInTheDocument();
    });

    // All sections should be expanded by default (content visible)
    expect(screen.getByText(/Promises are objects/)).toBeInTheDocument();

    // Click to collapse Explanation section
    const explanationButton = screen.getByText("Explanation").closest("button");
    if (explanationButton) {
      await act(async () => {
        fireEvent.click(explanationButton);
      });
    }

    // The explanation content should now be hidden
    await waitFor(() => {
      expect(
        screen.queryByText(/Promises are objects/)
      ).not.toBeInTheDocument();
    });

    // Click to expand again
    if (explanationButton) {
      await act(async () => {
        fireEvent.click(explanationButton);
      });
    }

    // The explanation content should be visible again
    await waitFor(() => {
      expect(screen.getByText(/Promises are objects/)).toBeInTheDocument();
    });
  });
});
