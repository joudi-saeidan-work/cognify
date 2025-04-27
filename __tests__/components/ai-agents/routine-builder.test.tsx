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

// Mock toast notifications
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn((message, options) => mockToastSuccess(message, options)),
    error: jest.fn((message, options) => mockToastError(message, options)),
  },
}));

// Mock UI components
jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      data-testid={`checkbox-${id}`}
    />
  ),
}));

// Save original console.error
const originalConsoleError = console.error;
// Setup error handling for parsing errors
beforeAll(() => {
  // Mock console.error to suppress expected errors during testing
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console.error
  console.error = originalConsoleError;
});

// Import the actual component
import RoutineBuilder from "@/app/(platform)/(dashboard)/_components/(ai-agents)/routine-builder";
import { useChat } from "ai/react";

// Helper function to trigger AI response
const simulateAIResponse = async (content: string) => {
  // Get the onFinish callback from the last useChat call
  const chatHookMock = useChat as jest.Mock;
  const lastCall = chatHookMock.mock.calls[chatHookMock.mock.calls.length - 1];
  const onFinish = lastCall[0].onFinish;

  // Call it with a mock response within act
  await act(async () => {
    onFinish({
      id: "test-response",
      role: "assistant",
      content: content,
    });
  });
};

describe("RoutineBuilder", () => {
  // Mock props
  const mockProps = {
    onClose: jest.fn(),
    open: true,
    config: {
      id: "routine-builder",
      name: "Routine Builder",
      description: "Create a customized routine",
      component: RoutineBuilder,
      icon: () => <div data-testid="routine-builder-icon" />,
      apiRoute: "/api/routine-builder",
      initialMessage: "What's your goal?",
    } as AIToolConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when open is true", () => {
    render(<RoutineBuilder {...mockProps} />);

    // Check component is visible
    expect(screen.getByText("Routine Builder")).toBeInTheDocument();
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    expect(goalInput).toBeInTheDocument();
    const generateButton = screen.getByText("Generate Smart Routine");
    expect(generateButton).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<RoutineBuilder {...mockProps} />);

    // Find the close button by its icon (X is inside an SVG)
    const closeButton = screen.getByRole("button", {
      name: "Close", // The X button has aria-label="Close"
    });

    // Make sure we're getting the right button
    expect(closeButton.innerHTML).toContain("svg");

    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("handles goal input", () => {
    render(<RoutineBuilder {...mockProps} />);

    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    expect(goalInput).toHaveValue("Run a marathon");
  });

  it("disables generate button when goal is empty", () => {
    render(<RoutineBuilder {...mockProps} />);

    const generateButton = screen.getByRole("button", {
      name: "Generate Smart Routine",
    });
    expect(generateButton).toBeDisabled();

    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    expect(generateButton).not.toBeDisabled();
  });

  it("handles challenge checkboxes", () => {
    render(<RoutineBuilder {...mockProps} />);

    // Get procrastination checkbox
    const procrastinationCheckbox = screen.getByTestId(
      "checkbox-Procrastination"
    );
    expect(procrastinationCheckbox).not.toBeChecked();

    // Check it
    fireEvent.click(procrastinationCheckbox);
    expect(procrastinationCheckbox).toBeChecked();

    // Uncheck it
    fireEvent.click(procrastinationCheckbox);
    expect(procrastinationCheckbox).not.toBeChecked();
  });

  it("submits form with correct data", async () => {
    render(<RoutineBuilder {...mockProps} />);

    // Enter goal
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    // Select challenges
    const procrastinationCheckbox = screen.getByTestId(
      "checkbox-Procrastination"
    );
    const timeManagementCheckbox = screen.getByTestId(
      "checkbox-Time management"
    );

    fireEvent.click(procrastinationCheckbox);
    fireEvent.click(timeManagementCheckbox);

    // Submit form
    const generateButton = screen.getByText("Generate Smart Routine");
    fireEvent.click(generateButton);

    // Verify setInput and handleSubmit were called with correct data
    const expectedPreferences = {
      goal: "Run a marathon",
      daysAvailable: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      challenges: ["Procrastination", "Time management"],
    };

    expect(mockSetInput).toHaveBeenCalledWith(
      JSON.stringify(expectedPreferences)
    );
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it("processes and displays AI response", async () => {
    render(<RoutineBuilder {...mockProps} />);

    // Enter goal and submit
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    const generateButton = screen.getByText("Generate Smart Routine");
    fireEvent.click(generateButton);

    // Simulate AI response
    const mockRoutineResult = {
      estimatedCompletionTime: "12 weeks",
      milestones: [
        { phase: "Week 1-4", goal: "Build base endurance" },
        { phase: "Week 5-8", goal: "Increase distance" },
      ],
      weeklyRoutine: {
        Monday: [{ task: "Easy run", duration: "30 min" }],
        Wednesday: [{ task: "Tempo run", duration: "45 min" }],
        Friday: [{ task: "Long run", duration: "60 min" }],
      },
      tips: ["Stay hydrated", "Get proper rest"],
    };

    await simulateAIResponse(JSON.stringify(mockRoutineResult));

    // Check if routine result is displayed correctly
    await waitFor(() => {
      expect(screen.getByText("Your Routine Plan")).toBeInTheDocument();
      expect(screen.getByText("12 weeks")).toBeInTheDocument();
      expect(screen.getByText("Week 1-4")).toBeInTheDocument();
      expect(screen.getByText("Build base endurance")).toBeInTheDocument();
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("Easy run")).toBeInTheDocument();
      expect(screen.getByText("30 min")).toBeInTheDocument();
      expect(screen.getByText("Pro Tips")).toBeInTheDocument();
      expect(screen.getByText("Stay hydrated")).toBeInTheDocument();
    });
  });

  it("creates a new routine after result is shown", async () => {
    render(<RoutineBuilder {...mockProps} />);

    // Enter goal and submit
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    const generateButton = screen.getByText("Generate Smart Routine");
    fireEvent.click(generateButton);

    // Simulate AI response
    const mockRoutineResult = {
      estimatedCompletionTime: "12 weeks",
      milestones: [{ phase: "Week 1-4", goal: "Build base endurance" }],
      weeklyRoutine: {
        Monday: [{ task: "Easy run", duration: "30 min" }],
      },
      tips: ["Stay hydrated"],
    };

    await simulateAIResponse(JSON.stringify(mockRoutineResult));

    // Verify routine is displayed
    await waitFor(() => {
      expect(screen.getByText("Your Routine Plan")).toBeInTheDocument();
    });

    // Using a longer timeout for this test
    jest.setTimeout(10000);

    // Click "Create Another Routine" button
    const createAnotherButton = await screen.findByText(
      "Create Another Routine",
      {},
      { timeout: 5000 }
    );
    fireEvent.click(createAnotherButton);

    // Should show the form again
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/learn piano/i)).toBeInTheDocument();
      expect(screen.getByText("Generate Smart Routine")).toBeInTheDocument();
    });
  }, 10000); // Extended timeout for this test

  it("handles markdown-formatted JSON response", async () => {
    render(<RoutineBuilder {...mockProps} />);

    // Enter goal and submit
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    const generateButton = screen.getByText("Generate Smart Routine");
    fireEvent.click(generateButton);

    // Simulate AI response with markdown formatting
    const mockResponseWithMarkdown =
      "```json\n" +
      JSON.stringify({
        estimatedCompletionTime: "12 weeks",
        milestones: [{ phase: "Week 1-4", goal: "Build base endurance" }],
        weeklyRoutine: { Monday: [{ task: "Easy run", duration: "30 min" }] },
        tips: ["Stay hydrated"],
      }) +
      "\n```";

    await simulateAIResponse(mockResponseWithMarkdown);

    // Check if parsed correctly
    await waitFor(() => {
      expect(screen.getByText("Your Routine Plan")).toBeInTheDocument();
      expect(screen.getByText("12 weeks")).toBeInTheDocument();
    });
  });

  it("shows loading state when submitting", async () => {
    // Override useChat mock for this test to show loading
    (useChat as jest.Mock).mockReturnValueOnce({
      handleSubmit: mockHandleSubmit,
      isLoading: true,
      setInput: mockSetInput,
      messages: [],
    });

    render(<RoutineBuilder {...mockProps} />);

    // Enter goal
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    // Check for loading indicator
    const button = screen.getByRole("button", {
      name: /generating|smart routine/i,
    });
    expect(button).toBeInTheDocument();
    expect(button.innerHTML).toContain("svg"); // Should contain the loader icon
  });

  it("handles API errors", async () => {
    render(<RoutineBuilder {...mockProps} />);

    // Enter goal and submit
    const goalInput = screen.getByPlaceholderText(/learn piano/i);
    fireEvent.change(goalInput, {
      target: { value: "Run a marathon" },
    });

    const generateButton = screen.getByText("Generate Smart Routine");
    fireEvent.click(generateButton);

    // Get the onError callback from the useChat mock
    const chatHookMock = useChat as jest.Mock;
    const lastCall =
      chatHookMock.mock.calls[chatHookMock.mock.calls.length - 1];
    const onError = lastCall[0].onError;

    // Simulate error
    await act(async () => {
      onError(new Error("API failure"));
    });

    // Verify error was handled - the error toast is called with message and possibly options
    expect(mockToastError).toHaveBeenCalled();
    expect(mockToastError.mock.calls[0][0]).toBe("Error: API failure");
  });
});
