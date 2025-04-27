/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BoardItem from "@/app/(platform)/(dashboard)/organization/[organizationId]/_components/board-item";
import { type Board } from "@prisma/client";

// Mock the necessary dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action, options) => ({
    execute: jest.fn().mockImplementation((data) => {
      if (options?.onSuccess) {
        options.onSuccess({
          ...data,
          id: "board-id",
        });
      }
    }),
    isLoading: false,
  })),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, className, onClick, style }: any) => (
      <a
        href={href}
        className={className}
        onClick={onClick}
        data-testid="board-link"
        style={{ backgroundImage: "url(test-image.jpg)" }}
      >
        {children}
      </a>
    ),
  };
});

// Create a mock Board type that matches the Prisma schema
const mockBoard = {
  id: "board-id",
  orgId: "org-id",
  title: "Test Board",
  imageId: null,
  imageThumbUrl: "https://example.com/image-thumb.jpg",
  imageFullUrl: "https://example.com/image-full.jpg",
  imageUserName: null,
  imageLinkHTML: null,
  color: null,
  isFavorite: false,
  lists: [],
  labels: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Board;

describe("BoardItem", () => {
  const onBoardClickMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with board data", () => {
    render(<BoardItem board={mockBoard} onBoardClick={onBoardClickMock} />);

    // Check if the title is rendered
    expect(screen.getByText("Test Board")).toBeInTheDocument();

    // Check if the link has the correct href
    expect(screen.getByTestId("board-link")).toHaveAttribute(
      "href",
      "/board/board-id"
    );

    // Check if the link has a style attribute (we can't check the exact style value in jest-dom)
    const link = screen.getByTestId("board-link");
    expect(link).toHaveAttribute("style");
  });

  it("calls onBoardClick when clicked", () => {
    render(<BoardItem board={mockBoard} onBoardClick={onBoardClickMock} />);

    fireEvent.click(screen.getByTestId("board-link"));

    expect(onBoardClickMock).toHaveBeenCalledWith(mockBoard.id);
  });

  it("renders with favorite star highlighted when board is favorite", () => {
    const favoriteBoard = { ...mockBoard, isFavorite: true };
    render(<BoardItem board={favoriteBoard} onBoardClick={onBoardClickMock} />);

    const starIcon = screen.getByRole("button");
    expect(starIcon).toBeInTheDocument();

    const svgParent = starIcon.querySelector("svg");
    expect(svgParent).toHaveClass("text-yellow-400");
  });

  it("calls updateBoard action when star is clicked", () => {
    const { useAction } = require("@/hooks/use-actions");
    const executeUpdateBoard = jest.fn();

    useAction.mockImplementationOnce(() => ({
      execute: executeUpdateBoard,
      isLoading: false,
    }));

    render(<BoardItem board={mockBoard} onBoardClick={onBoardClickMock} />);

    const starButton = screen.getByRole("button");

    // Click on the star button
    fireEvent.click(starButton);

    // Prevent event propagation should have been called
    expect(executeUpdateBoard).toHaveBeenCalledWith({
      id: mockBoard.id,
      title: mockBoard.title,
      isFavorite: true,
    });
  });

  it("shows loading state when isLoading prop is true", () => {
    render(
      <BoardItem
        board={mockBoard}
        onBoardClick={onBoardClickMock}
        isLoading={true}
      />
    );

    // Check for loading indicator
    expect(screen.getByText("Preparing your board...")).toBeInTheDocument();

    // Check that the link has the opacity and pointer-events classes
    const link = screen.getByTestId("board-link");
    expect(link).toHaveClass("opacity-70");
    expect(link).toHaveClass("pointer-events-none");
  });

  it("shows updating state when the board is being updated", () => {
    const { useAction } = require("@/hooks/use-actions");

    useAction.mockImplementationOnce(() => ({
      execute: jest.fn(),
      isLoading: true,
    }));

    render(<BoardItem board={mockBoard} onBoardClick={onBoardClickMock} />);

    // Check for updating indicator
    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("handles error when updating board fails", () => {
    const { useAction } = require("@/hooks/use-actions");
    const { toast } = require("sonner");

    let options: any;

    const executeUpdateBoard = jest.fn().mockImplementation((data) => {
      // Call onError callback
      options.onError("Failed to update board");
    });

    useAction.mockImplementationOnce((action: any, opts: any) => {
      options = opts;
      return {
        execute: executeUpdateBoard,
        isLoading: false,
      };
    });

    render(<BoardItem board={mockBoard} onBoardClick={onBoardClickMock} />);

    const starButton = screen.getByRole("button");

    // Click on the star button
    fireEvent.click(starButton);

    // Check that toast.error was called with the error message
    expect(toast.error).toHaveBeenCalledWith("Failed to update board");
  });
});
