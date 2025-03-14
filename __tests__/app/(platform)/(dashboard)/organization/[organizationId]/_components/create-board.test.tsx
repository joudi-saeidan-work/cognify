/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateBoard from "../../../../../../../app/(platform)/(dashboard)/organization/[organizationId]/_components/create-board";
import * as useActionsModule from "@/hooks/use-actions";
import { toast } from "sonner";

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock toast notifications
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Loader2 icon
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader-icon" className="animate-spin" />,
}));

// Mock the useAction hook
jest.mock("@/hooks/use-actions", () => ({
  useAction: jest.fn(),
}));

// Mock createBoard action
jest.mock("@/actions/create-board", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("CreateBoard", () => {
  const mockExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the useAction hook implementation
    (useActionsModule.useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      isLoading: false,
    });
  });

  it("renders the create board button", () => {
    render(<CreateBoard />);

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    expect(createButton).toBeInTheDocument();
    expect(createButton).not.toBeDisabled();
  });

  it("shows loading state when isLoading is true", () => {
    // Mock loading state
    (useActionsModule.useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      isLoading: true,
    });

    render(<CreateBoard />);

    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    expect(screen.getByText(/creating your board/i)).toBeInTheDocument();
    expect(screen.queryByText(/create new board/i)).not.toBeInTheDocument();
  });

  it("calls execute with title when clicked", async () => {
    mockExecute.mockResolvedValue({ id: "test-id" });

    render(<CreateBoard />);

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    fireEvent.click(createButton);

    expect(mockExecute).toHaveBeenCalledWith({ title: "Untitled" });
  });

  it("handles successful board creation", async () => {
    // Mock the success callback
    (useActionsModule.useAction as jest.Mock).mockImplementation(
      (action, options) => {
        // Simulate successful board creation when execute is called
        const mockSuccessExecute = jest.fn().mockImplementation(() => {
          if (options && options.onSuccess) {
            options.onSuccess({ id: "new-board-123" });
          }
          return Promise.resolve({ id: "new-board-123" });
        });

        return {
          execute: mockSuccessExecute,
          isLoading: false,
        };
      }
    );

    render(<CreateBoard />);

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    fireEvent.click(createButton);

    // Check if toast.success was called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Board Created!");
    });

    // Check if router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith("/board/new-board-123");
  });

  it("handles error during board creation", async () => {
    const errorMsg = "Failed to create board";

    // Mock the error callback
    (useActionsModule.useAction as jest.Mock).mockImplementation(
      (action, options) => {
        // Simulate error during board creation when execute is called
        const mockErrorExecute = jest.fn().mockImplementation(async () => {
          if (options && options.onError) {
            options.onError(errorMsg);
          }
          // Return a resolved promise to avoid Jest error
          return Promise.resolve();
        });

        return {
          execute: mockErrorExecute,
          isLoading: false,
        };
      }
    );

    render(<CreateBoard />);

    const createButton = screen.getByRole("button", {
      name: /create new board/i,
    });
    fireEvent.click(createButton);

    // Check if toast.error was called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMsg);
    });
  });

  it("disables the button during loading state", () => {
    // Mock loading state
    (useActionsModule.useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      isLoading: true,
    });

    render(<CreateBoard />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
