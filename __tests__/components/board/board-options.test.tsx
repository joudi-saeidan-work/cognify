/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BoardOptions from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-options";
import { useRouter } from "next/navigation";

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock actions
jest.mock("../../../hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
    isLoading: false,
  })),
}));

// Mock delete-board and create-board
jest.mock("../../../actions/delete-board", () => ({
  deleteBoard: { name: "deleteBoard" },
}));

jest.mock("../../../actions/create-board", () => ({
  createBoard: { name: "createBoard" },
}));

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { useAction } from "../../../hooks/use-actions";
import { deleteBoard } from "../../../actions/delete-board";
import { createBoard } from "../../../actions/create-board";

describe("BoardOptions Component", () => {
  const mockExecuteDeleteBoard = jest.fn();
  const mockExecuteCreateBoard = jest.fn();
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock the first call to useAction (for deleteBoard)
    (useAction as jest.Mock).mockImplementationOnce(() => ({
      execute: mockExecuteDeleteBoard,
      isLoading: false,
    }));

    // Mock the second call to useAction (for createBoard)
    (useAction as jest.Mock).mockImplementationOnce(() => ({
      execute: mockExecuteCreateBoard,
      isLoading: false,
    }));
  });

  const defaultVisibilitySettings = {
    showAssistant: true,
    showAvatar: true,
    showZoomControls: true,
    showBookmarks: true,
    showThemes: true,
  };

  it("renders without crashing", () => {
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={() => {}}
      />
    );

    // Should render a button with MoreHorizontal icon
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays settings content when clicked", () => {
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={() => {}}
      />
    );

    // Click the options button to open the popover
    fireEvent.click(screen.getByRole("button"));

    // Content should be visible
    expect(screen.getByText("Board Settings")).toBeInTheDocument();
    expect(screen.getByText("Zoom Controls")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Bookmark")).toBeInTheDocument();
    expect(screen.getByText("Assistance")).toBeInTheDocument();
  });

  it("calls onSettingsChange when zoom toggle is clicked", () => {
    const mockOnSettingsChange = jest.fn();
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Find all checkboxes and click the first one (Zoom Controls)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(mockOnSettingsChange).toHaveBeenCalledWith(
      "showZoomControls",
      false
    );
  });

  it("calls onSettingsChange when theme toggle is clicked", () => {
    const mockOnSettingsChange = jest.fn();
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Find all checkboxes and click the second one (Theme)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    expect(mockOnSettingsChange).toHaveBeenCalledWith("showThemes", false);
  });

  it("calls onSettingsChange when bookmark toggle is clicked", () => {
    const mockOnSettingsChange = jest.fn();
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Find all checkboxes and click the third one (Bookmark)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[2]);

    expect(mockOnSettingsChange).toHaveBeenCalledWith("showBookmarks", false);
  });

  it("calls onSettingsChange when assistant toggle is clicked", () => {
    const mockOnSettingsChange = jest.fn();
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Find all checkboxes and click the fourth one (Assistant)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[3]);

    expect(mockOnSettingsChange).toHaveBeenCalledWith("showAssistant", false);
  });

  it("renders delete and create board buttons", () => {
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={() => {}}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Delete Board")).toBeInTheDocument();
    expect(screen.getByText("Create Board")).toBeInTheDocument();
  });

  it("calls executeDeleteBoard when delete button is clicked", () => {
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={() => {}}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Click the delete button
    fireEvent.click(screen.getByText("Delete Board"));

    expect(mockExecuteDeleteBoard).toHaveBeenCalledWith({
      id: "test-board-123",
    });
  });

  it("calls executeCreateBoard when create button is clicked", () => {
    render(
      <BoardOptions
        id="test-board-123"
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={() => {}}
      />
    );

    // Open the popover
    fireEvent.click(screen.getByRole("button"));

    // Click the create button
    fireEvent.click(screen.getByText("Create Board"));

    expect(mockExecuteCreateBoard).toHaveBeenCalledWith({ title: "Untitled" });
  });
});
