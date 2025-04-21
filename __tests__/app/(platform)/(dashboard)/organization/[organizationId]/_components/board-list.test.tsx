/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import BoardList from "@/app/(platform)/(dashboard)/organization/[organizationId]/_components/board-list";
import { type Board } from "@prisma/client";

// Mock the child components
jest.mock(
  "@/app/(platform)/(dashboard)/organization/[organizationId]/_components/board-item",
  () => {
    return {
      __esModule: true,
      default: jest.fn(({ board, isLoading, onBoardClick }) => (
        <div
          data-testid={`board-item-${board.id}`}
          onClick={() => onBoardClick(board.id)}
        >
          <span>Board: {board.title}</span>
          <span data-testid={`favorite-${board.id}`}>
            {board.isFavorite ? "Favorite" : "Not Favorite"}
          </span>
          <span data-testid={`loading-${board.id}`}>
            {isLoading ? "Loading" : "Not Loading"}
          </span>
        </div>
      )),
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/organization/[organizationId]/_components/create-board",
  () => {
    return {
      __esModule: true,
      default: jest.fn(() => (
        <div data-testid="create-board">Create New Board</div>
      )),
    };
  }
);

// Mock sample board data
const mockBoards: Board[] = [
  {
    id: "board-1",
    orgId: "org-1",
    title: "Board One",
    imageId: null,
    imageThumbUrl: "https://example.com/image1-thumb.jpg",
    imageFullUrl: "https://example.com/image1-full.jpg",
    imageUserName: null,
    imageLinkHTML: null,
    color: null,
    isFavorite: true,
    lists: [],
    labels: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "board-2",
    orgId: "org-1",
    title: "Board Two",
    imageId: null,
    imageThumbUrl: "https://example.com/image2-thumb.jpg",
    imageFullUrl: "https://example.com/image2-full.jpg",
    imageUserName: null,
    imageLinkHTML: null,
    color: null,
    isFavorite: false,
    lists: [],
    labels: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "board-3",
    orgId: "org-1",
    title: "Board Three",
    imageId: null,
    imageThumbUrl: "https://example.com/image3-thumb.jpg",
    imageFullUrl: "https://example.com/image3-full.jpg",
    imageUserName: null,
    imageLinkHTML: null,
    color: null,
    isFavorite: true,
    lists: [],
    labels: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as unknown as Board[];

describe("BoardList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all boards by default", () => {
    render(<BoardList boards={mockBoards} />);

    // Check title
    expect(screen.getByText("Your Boards")).toBeInTheDocument();

    // Should render all boards
    expect(screen.getByTestId("board-item-board-1")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-2")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-3")).toBeInTheDocument();

    // Create board button should be visible
    expect(screen.getByTestId("create-board")).toBeInTheDocument();

    // All toggle should be highlighted
    const allButton = screen.getByText("All");
    expect(allButton.closest("button")).toHaveClass("text-blue-700");

    // Favorites toggle should not be highlighted
    const favoritesButton = screen.getByText("Favorites");
    expect(favoritesButton.closest("button")).toHaveClass("text-gray-700");
  });

  it("filters boards when favorites toggle is clicked", () => {
    render(<BoardList boards={mockBoards} />);

    // Initially shows all boards
    expect(screen.getByTestId("board-item-board-1")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-2")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-3")).toBeInTheDocument();

    // Click on Favorites toggle
    fireEvent.click(screen.getByText("Favorites"));

    // Now should only show favorite boards (1 and 3)
    expect(screen.getByTestId("board-item-board-1")).toBeInTheDocument();
    expect(screen.queryByTestId("board-item-board-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-3")).toBeInTheDocument();

    // Favorites toggle should be highlighted
    const favoritesButton = screen.getByText("Favorites");
    expect(favoritesButton.closest("button")).toHaveClass("text-yellow-400");

    // All toggle should not be highlighted
    const allButton = screen.getByText("All");
    expect(allButton.closest("button")).toHaveClass("text-gray-700");

    // Create board button should not be visible in favorites mode
    expect(screen.queryByTestId("create-board")).not.toBeInTheDocument();
  });

  it("switches back to all boards when All toggle is clicked", () => {
    render(<BoardList boards={mockBoards} />);

    // Switch to favorites
    fireEvent.click(screen.getByText("Favorites"));

    // Then back to all
    fireEvent.click(screen.getByText("All"));

    // Should now show all boards again
    expect(screen.getByTestId("board-item-board-1")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-2")).toBeInTheDocument();
    expect(screen.getByTestId("board-item-board-3")).toBeInTheDocument();

    // All toggle should be highlighted
    const allButton = screen.getByText("All");
    expect(allButton.closest("button")).toHaveClass("text-blue-700");
  });

  it("sets loading state when a board is clicked", () => {
    render(<BoardList boards={mockBoards} />);

    // Initially, no boards should be in loading state
    expect(screen.getByTestId("loading-board-1")).toHaveTextContent(
      "Not Loading"
    );

    // Click on a board
    fireEvent.click(screen.getByTestId("board-item-board-1"));

    // That board should now be in loading state
    expect(screen.getByTestId("loading-board-1")).toHaveTextContent("Loading");

    // Other boards should not be in loading state
    expect(screen.getByTestId("loading-board-2")).toHaveTextContent(
      "Not Loading"
    );
    expect(screen.getByTestId("loading-board-3")).toHaveTextContent(
      "Not Loading"
    );
  });

  it("displays empty state message when no favorite boards exist", () => {
    // Create a set of boards with no favorites
    const noFavoriteBoards = [
      { ...mockBoards[0], isFavorite: false },
      { ...mockBoards[1], isFavorite: false },
      { ...mockBoards[2], isFavorite: false },
    ] as unknown as Board[];

    render(<BoardList boards={noFavoriteBoards} />);

    // Switch to favorites view
    fireEvent.click(screen.getByText("Favorites"));

    // Should show the empty state message
    expect(screen.getByText("No favorite boards yet.")).toBeInTheDocument();
  });

  it("renders correctly with an empty boards array", () => {
    render(<BoardList boards={[]} />);

    // Should not show any board items
    expect(screen.queryByTestId(/board-item/)).not.toBeInTheDocument();

    // Create board button should still be visible
    expect(screen.getByTestId("create-board")).toBeInTheDocument();

    // No message should be shown in the all boards view
    expect(
      screen.queryByText("No favorite boards yet.")
    ).not.toBeInTheDocument();

    // Switch to favorites view
    fireEvent.click(screen.getByText("Favorites"));

    // Should show the empty state message
    expect(screen.getByText("No favorite boards yet.")).toBeInTheDocument();
  });
});
