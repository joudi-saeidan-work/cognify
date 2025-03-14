/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Suppress React DOM ref warnings that come from Radix UI
// Save original console.error
const originalConsoleError = console.error;

// Setup and teardown for the entire file
beforeAll(() => {
  // Mock console.error to suppress expected warnings
  console.error = jest.fn((message, ...args) => {
    // Filter out the specific React ref warning from Radix UI components
    if (
      typeof message === "string" &&
      message.includes("Function components cannot be given refs")
    ) {
      return;
    }
    // Otherwise pass through to the original console.error
    return originalConsoleError(message, ...args);
  });
});

afterAll(() => {
  // Restore original console.error after tests
  console.error = originalConsoleError;
});

// Mock AI related modules first
jest.mock("ai/react", () => ({
  useChat: jest.fn(),
  useAssistant: jest.fn(),
}));

// Mock the AI tools config module directly with component definitions inline
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config",
  () => {
    // Define mock components directly
    const MockNoteWhiz = ({ open, onClose, config }: any) => (
      <div data-testid="notewhiz-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="notewhiz-close">
              Close
            </button>
          </>
        )}
      </div>
    );

    const MockMagicTodo = ({ open, onClose, config }: any) => (
      <div data-testid="magic-todo-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="magic-todo-close">
              Close
            </button>
          </>
        )}
      </div>
    );

    // Define the mock tools array with the components defined above
    const mockTools = [
      {
        id: "notewhiz",
        name: "NoteWhiz",
        description: "Got questions about your notes?",
        icon: () => <svg data-testid="notewhiz-icon" />,
        component: MockNoteWhiz,
        apiRoute: "/api/notewhiz",
        initialMessage: "Ask me questions about your notes",
      },
      {
        id: "magic-todo",
        name: "Magic Todo",
        description: "Need help organizing your thoughts?",
        icon: () => <svg data-testid="magic-todo-icon" />,
        component: MockMagicTodo,
        apiRoute: "/api/magictodo",
        initialMessage: "Start dumping your thoughts here...",
      },
    ];

    return {
      AI_TOOLS: mockTools,
    };
  }
);

// Mock the AI tool components to avoid initialization issues
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/note-whiz",
  () => ({
    __esModule: true,
    default: ({ open, onClose, config }: any) => (
      <div data-testid="notewhiz-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="notewhiz-close">
              Close
            </button>
          </>
        )}
      </div>
    ),
  })
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/magic-todo",
  () => ({
    __esModule: true,
    default: ({ open, onClose, config }: any) => (
      <div data-testid="magic-todo-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="magic-todo-close">
              Close
            </button>
          </>
        )}
      </div>
    ),
  })
);

// Mock framer-motion to avoid animation-related issues in tests
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      button: ({ children, onClick, className }: any) => (
        <button onClick={onClick} className={className}>
          {children}
        </button>
      ),
    },
  };
});

// Import after mocks
import AssistanceButton from "@/app/(platform)/(dashboard)/_components/(ai-agents)/assitance-button";
import { AI_TOOLS } from "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config";

// Set longer timeout for all tests in this file
jest.setTimeout(10000);

describe("AssistanceButton", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("renders the main button", () => {
    render(<AssistanceButton />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens the dropdown menu when button is clicked", async () => {
    render(<AssistanceButton />);

    // Get and click the main button
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check if dropdown content appears
    await waitFor(() => {
      const menuTitle = screen.getByText("AI Assistance");
      expect(menuTitle).toBeInTheDocument();
    });

    // Check if all tools are listed in the dropdown
    AI_TOOLS.forEach((tool) => {
      const toolOption = screen.getByText(tool.description);
      expect(toolOption).toBeInTheDocument();
    });
  });

  it("opens a tool when clicked in the dropdown", async () => {
    render(<AssistanceButton />);

    // Open the dropdown
    const mainButton = screen.getByRole("button");
    fireEvent.click(mainButton);

    // Select the first tool
    const firstTool = AI_TOOLS[0];
    const toolOption = screen.getByText(firstTool.description);
    fireEvent.click(toolOption);

    // Check if the tool component is rendered
    await waitFor(() => {
      const toolComponent = screen.getByTestId(`${firstTool.id}-component`);
      expect(toolComponent).toBeInTheDocument();

      // Since we set open to true in our mock, the name should be visible
      const toolName = screen.getByText(firstTool.name);
      expect(toolName).toBeInTheDocument();
    });
  });

  it("closes the tool when close is clicked", async () => {
    render(<AssistanceButton />);

    // Open the dropdown
    const mainButton = screen.getByRole("button");
    fireEvent.click(mainButton);

    // Wait for dropdown to open
    await screen.findByText("AI Assistance");

    // Select the first tool
    const firstTool = AI_TOOLS[0];
    const toolOption = screen.getByText(firstTool.description);
    fireEvent.click(toolOption);

    // Wait for tool to open and close button to appear
    const closeButton = await screen.findByTestId(
      `${firstTool.id}-close`,
      {},
      { timeout: 5000 }
    );
    expect(closeButton).toBeInTheDocument();

    // Click close button
    fireEvent.click(closeButton);

    // The tool content should be gone since open is false
    await waitFor(() => {
      const toolName = screen.queryByText(firstTool.name);
      expect(toolName).not.toBeInTheDocument();
    });
  }, 10000); // Extra timeout for this test
});
