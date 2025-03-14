/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CoverImage } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/cover-image";
import { Board } from "@prisma/client";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => (
    <img src={src} alt={alt} className={className} data-testid="next-image" />
  ),
}));

describe("CoverImage", () => {
  // Create mock board data
  const createMockBoard = (overrides = {}): Board =>
    ({
      id: "board-123",
      title: "Test Board",
      orgId: "org123",
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageId: null,
      imageThumbUrl: null,
      imageFullUrl: null,
      imageLinkHTML: null,
      imageUserName: null,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      order: 0,
      voiceId: null,
      voiceName: null,
      voiceGender: null,
      voiceLanguage: null,
      voiceCountry: null,
      severity: null,
      ...overrides,
    } as Board);

  it("renders with a color background when board.color is provided", () => {
    const mockBoard = createMockBoard({ color: "bg-red-500" });

    const { container } = render(<CoverImage board={mockBoard} />);

    // Check if the outer container is rendered
    expect(container.querySelector(".relative")).toBeInTheDocument();

    // Check if the color background is rendered with the correct class
    const colorElement = container.querySelector(".bg-red-500");
    expect(colorElement).toBeInTheDocument();

    // Check that the image is not rendered
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();

    // Check that the gradient overlay is rendered
    expect(container.querySelector(".bg-gradient-to-b")).toBeInTheDocument();
  });

  it("renders with an image when board.imageFullUrl is provided and no color", () => {
    const mockBoard = createMockBoard({
      imageFullUrl: "https://example.com/image.jpg",
    });

    const { container } = render(<CoverImage board={mockBoard} />);

    // Check if the image is rendered
    const image = screen.getByTestId("next-image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(image).toHaveAttribute("alt", "Test Board");
    expect(image).toHaveClass("object-cover");

    // Check that the gradient overlay is rendered
    const gradientOverlay = container.querySelector(".bg-gradient-to-b");
    expect(gradientOverlay).toBeInTheDocument();
  });

  it("prefers color over image when both are provided", () => {
    const mockBoard = createMockBoard({
      color: "bg-blue-500",
      imageFullUrl: "https://example.com/image.jpg",
    });

    const { container } = render(<CoverImage board={mockBoard} />);

    // Check if the color background is rendered
    const colorElement = container.querySelector(".bg-blue-500");
    expect(colorElement).toBeInTheDocument();

    // Check that the image is not rendered
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  it("renders only the container and gradient when no color or image is provided", () => {
    const mockBoard = createMockBoard();

    const { container } = render(<CoverImage board={mockBoard} />);

    // Check if the outer container is rendered
    const outerContainer = container.querySelector(".relative");
    expect(outerContainer).toBeInTheDocument();

    // Check that no color or image elements are rendered
    expect(container.querySelector(".absolute:not(.bg-gradient-to-b)")).toBe(
      null
    );
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();

    // Check that the gradient overlay is still rendered
    expect(container.querySelector(".bg-gradient-to-b")).toBeInTheDocument();

    // Check there are exactly two divs (container and gradient)
    expect(container.querySelectorAll("div").length).toBe(2);
  });

  it("maintains the proper layout structure", () => {
    const mockBoard = createMockBoard({ color: "bg-green-500" });

    const { container } = render(<CoverImage board={mockBoard} />);

    // Check proper height and width
    const outerContainer = container.querySelector(".relative");
    expect(outerContainer).toHaveClass("w-full");
    expect(outerContainer).toHaveClass("h-[185px]");
    expect(outerContainer).toHaveClass("overflow-hidden");
  });
});
