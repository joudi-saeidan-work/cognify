import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListWrapper } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/list-wrapper";

describe("ListWrapper", () => {
  it("renders correctly with children", () => {
    // Render with test content
    render(
      <ListWrapper>
        <div data-testid="test-child">Test Content</div>
      </ListWrapper>
    );

    // Verify the child content is rendered
    const childElement = screen.getByTestId("test-child");
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent("Test Content");
  });

  it("has the expected styling classes", () => {
    const { container } = render(
      <ListWrapper>
        <div>Test Content</div>
      </ListWrapper>
    );

    // Get the li element (the wrapper)
    const wrapperElement = container.querySelector("li");

    // Check for expected classes
    expect(wrapperElement).toHaveClass("shrink-0");
    expect(wrapperElement).toHaveClass("h-full");
    expect(wrapperElement).toHaveClass("w-[272px]");
    expect(wrapperElement).toHaveClass("select-none");
  });

  it("maintains accessibility attributes passed to children", () => {
    render(
      <ListWrapper>
        <button aria-label="Accessible button" data-testid="accessible-element">
          Click me
        </button>
      </ListWrapper>
    );

    const accessibleElement = screen.getByTestId("accessible-element");
    expect(accessibleElement).toHaveAttribute(
      "aria-label",
      "Accessible button"
    );
  });
});
