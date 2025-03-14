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

// Mock the AI chat hook
const mockHandleSubmit = jest.fn();
const mockHandleInputChange = jest.fn();
const mockSetMessages = jest.fn();
jest.mock("ai/react", () => ({
  useChat: jest.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: mockHandleInputChange,
    handleSubmit: mockHandleSubmit,
    setMessages: mockSetMessages,
    isLoading: false,
    error: null,
  })),
  Message: {},
}));

// Mock clerk user hook
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(() => ({
    user: {
      imageUrl: "https://example.com/avatar.jpg",
    },
  })),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

// Import the actual component
import NoteWhiz from "@/app/(platform)/(dashboard)/_components/(ai-agents)/note-whiz";
import { useChat } from "ai/react";

describe("NoteWhiz", () => {
  // Mock props
  const mockProps = {
    onClose: jest.fn(),
    open: true,
    config: {
      id: "note-whiz",
      name: "NoteWhiz",
      description: "Ask about your notes",
      icon: () => <div data-testid="note-whiz-icon" />,
      component: NoteWhiz,
      apiRoute: "/api/note-whiz",
      initialMessage: "Ask me questions about your notes",
    } as AIToolConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when open is true", () => {
    render(<NoteWhiz {...mockProps} />);

    // Check component is visible
    expect(screen.getByText("NoteWhiz")).toBeInTheDocument();
    const inputElement = screen.getByPlaceholderText("Type your message...");
    expect(inputElement).toBeInTheDocument();
    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(<NoteWhiz {...mockProps} open={false} />);
    // When open=false, the div should have the 'hidden' class
    const hiddenDiv = container.querySelector(".hidden");
    expect(hiddenDiv).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<NoteWhiz {...mockProps} />);

    // Find the close button with X icon
    const closeButtons = screen.getAllByRole("button");
    const closeButton = closeButtons.find((button) =>
      button.innerHTML.includes("lucide-x")
    );

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    } else {
      fail("Close button not found");
    }
  });

  it("shows empty state with config initialMessage when no messages", () => {
    render(<NoteWhiz {...mockProps} />);

    // Should display the initialMessage
    expect(
      screen.getByText("Ask me questions about your notes")
    ).toBeInTheDocument();
  });

  it("handles input change", () => {
    render(<NoteWhiz {...mockProps} />);

    const inputElement = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(inputElement, {
      target: { value: "What are my notes about?" },
    });

    expect(mockHandleInputChange).toHaveBeenCalled();
  });

  it("submits the form when Send button is clicked", () => {
    render(<NoteWhiz {...mockProps} />);

    // Get the form element by its class
    const formElement = document.querySelector("form");
    expect(formElement).toBeInTheDocument();

    if (formElement) {
      fireEvent.submit(formElement);
      expect(mockHandleSubmit).toHaveBeenCalled();
    }
  });

  it("clears messages when Trash button is clicked", () => {
    render(<NoteWhiz {...mockProps} />);

    // Find the button with the Trash icon
    const buttons = screen.getAllByRole("button");
    const trashButton = buttons.find((btn) =>
      btn.innerHTML.includes("lucide-trash")
    );

    if (trashButton) {
      fireEvent.click(trashButton);
      expect(mockSetMessages).toHaveBeenCalledWith([]);
    } else {
      fail("Trash button not found");
    }
  });

  it("renders messages correctly", () => {
    // Override useChat mock to include messages
    (useChat as jest.Mock).mockReturnValueOnce({
      messages: [
        { id: "1", role: "user", content: "What are my notes about?" },
        {
          id: "2",
          role: "assistant",
          content: "Your notes are about React hooks.",
        },
      ],
      input: "",
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      setMessages: mockSetMessages,
      isLoading: false,
      error: null,
    });

    render(<NoteWhiz {...mockProps} />);

    // Should display both messages
    expect(screen.getByText("What are my notes about?")).toBeInTheDocument();
    expect(
      screen.getByText("Your notes are about React hooks.")
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    // Override useChat mock to show loading state
    (useChat as jest.Mock).mockReturnValueOnce({
      messages: [
        { id: "1", role: "user", content: "What are my notes about?" },
      ],
      input: "",
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      setMessages: mockSetMessages,
      isLoading: true,
      error: null,
    });

    render(<NoteWhiz {...mockProps} />);

    // Should display loading indicator
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    // Override useChat mock to include error
    (useChat as jest.Mock).mockReturnValueOnce({
      messages: [],
      input: "",
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      setMessages: mockSetMessages,
      isLoading: false,
      error: new Error("Failed to process request"),
    });

    render(<NoteWhiz {...mockProps} />);

    // Should display error message
    expect(
      screen.getByText("Error: Failed to process request")
    ).toBeInTheDocument();
  });

  it("disables input and send button when loading", () => {
    // Override useChat mock to show loading state
    (useChat as jest.Mock).mockReturnValueOnce({
      messages: [],
      input: "",
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      setMessages: mockSetMessages,
      isLoading: true,
      error: null,
    });

    render(<NoteWhiz {...mockProps} />);

    // Input should be disabled
    const inputElement = screen.getByPlaceholderText("Type your message...");
    expect(inputElement).toBeDisabled();

    // Send button should be disabled
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find(
      (btn) => btn.getAttribute("type") === "submit"
    );

    if (sendButton) {
      expect(sendButton).toBeDisabled();
    } else {
      fail("Send button not found");
    }
  });
});
