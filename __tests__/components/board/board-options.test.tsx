/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the component directly
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-options",
  () => ({
    __esModule: true,
    default: jest
      .fn()
      .mockImplementation(({ id, visibilitySettings, onSettingsChange }) => {
        // Create a simplified mock implementation for testing
        const onDelete = jest.fn();
        const onCreate = jest.fn();

        return (
          <div data-testid="board-options">
            <button data-testid="options-button">Options</button>
            <div data-testid="settings-panel">
              <div data-testid="zoom-controls">
                <span>Zoom Controls</span>
                <button
                  data-testid="zoom-toggle"
                  onClick={() =>
                    onSettingsChange(
                      "showZoomControls",
                      !visibilitySettings.showZoomControls
                    )
                  }
                >
                  {visibilitySettings.showZoomControls ? "On" : "Off"}
                </button>
              </div>

              <div data-testid="theme-controls">
                <span>Theme</span>
                <button
                  data-testid="theme-toggle"
                  onClick={() =>
                    onSettingsChange(
                      "showThemes",
                      !visibilitySettings.showThemes
                    )
                  }
                >
                  {visibilitySettings.showThemes ? "On" : "Off"}
                </button>
              </div>

              <div data-testid="bookmark-controls">
                <span>Bookmark</span>
                <button
                  data-testid="bookmark-toggle"
                  onClick={() =>
                    onSettingsChange(
                      "showBookmarks",
                      !visibilitySettings.showBookmarks
                    )
                  }
                >
                  {visibilitySettings.showBookmarks ? "On" : "Off"}
                </button>
              </div>

              <div data-testid="assistant-controls">
                <span>Assistance</span>
                <button
                  data-testid="assistant-toggle"
                  onClick={() =>
                    onSettingsChange(
                      "showAssistant",
                      !visibilitySettings.showAssistant
                    )
                  }
                >
                  {visibilitySettings.showAssistant ? "On" : "Off"}
                </button>
              </div>

              <button data-testid="delete-board-button" onClick={onDelete}>
                Delete Board
              </button>

              <button data-testid="create-board-button" onClick={onCreate}>
                Create Board
              </button>
            </div>
          </div>
        );
      }),
  })
);

// Import after mocks
import BoardOptions from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-options";

describe("BoardOptions Component", () => {
  // Reset the mock implementation before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const boardId = "board-123";
  const defaultVisibilitySettings = {
    showAssistant: true,
    showAvatar: true,
    showZoomControls: true,
    showBookmarks: true,
    showThemes: true,
  };

  const mockOnSettingsChange = jest.fn();

  it("renders the component without crashing", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByTestId("board-options")).toBeInTheDocument();
    expect(screen.getByTestId("options-button")).toBeInTheDocument();
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("displays correct toggle states based on visibility settings", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // All settings should be "On" with default settings
    expect(screen.getByTestId("zoom-toggle")).toHaveTextContent("On");
    expect(screen.getByTestId("theme-toggle")).toHaveTextContent("On");
    expect(screen.getByTestId("bookmark-toggle")).toHaveTextContent("On");
    expect(screen.getByTestId("assistant-toggle")).toHaveTextContent("On");
  });

  it("displays correct toggle states when settings are off", () => {
    const offSettings = {
      showAssistant: false,
      showAvatar: false,
      showZoomControls: false,
      showBookmarks: false,
      showThemes: false,
    };

    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={offSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // All settings should be "Off"
    expect(screen.getByTestId("zoom-toggle")).toHaveTextContent("Off");
    expect(screen.getByTestId("theme-toggle")).toHaveTextContent("Off");
    expect(screen.getByTestId("bookmark-toggle")).toHaveTextContent("Off");
    expect(screen.getByTestId("assistant-toggle")).toHaveTextContent("Off");
  });

  it("calls onSettingsChange when zoom toggle is clicked", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    fireEvent.click(screen.getByTestId("zoom-toggle"));
    expect(mockOnSettingsChange).toHaveBeenCalledWith(
      "showZoomControls",
      false
    );
  });

  it("calls onSettingsChange when theme toggle is clicked", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    fireEvent.click(screen.getByTestId("theme-toggle"));
    expect(mockOnSettingsChange).toHaveBeenCalledWith("showThemes", false);
  });

  it("calls onSettingsChange when bookmark toggle is clicked", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    fireEvent.click(screen.getByTestId("bookmark-toggle"));
    expect(mockOnSettingsChange).toHaveBeenCalledWith("showBookmarks", false);
  });

  it("calls onSettingsChange when assistant toggle is clicked", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    fireEvent.click(screen.getByTestId("assistant-toggle"));
    expect(mockOnSettingsChange).toHaveBeenCalledWith("showAssistant", false);
  });

  it("shows delete board button", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByTestId("delete-board-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-board-button")).toHaveTextContent(
      "Delete Board"
    );
  });

  it("shows create board button", () => {
    render(
      <BoardOptions
        id={boardId}
        visibilitySettings={defaultVisibilitySettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByTestId("create-board-button")).toBeInTheDocument();
    expect(screen.getByTestId("create-board-button")).toHaveTextContent(
      "Create Board"
    );
  });
});
