import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DragInstructions } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(list)/drag-instructions";

describe("DragInstructions", () => {
  it("renders screen reader instructions correctly", () => {
    render(<DragInstructions />);

    // Get the container element
    const container = screen
      .getByText(/You can rearrange lists and cards/i)
      .closest("div");

    // Check for correct accessibility attributes
    expect(container).toHaveClass("sr-only");
    expect(container).toHaveAttribute("aria-live", "polite");

    // Check for the instruction text
    expect(
      screen.getByText(
        /You can rearrange lists and cards using drag and drop\./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /To move a list or card, press Space or Enter to start dragging/i
      )
    ).toBeInTheDocument();
  });

  it("provides complete keyboard instructions", () => {
    render(<DragInstructions />);

    // Check that the specific keyboard instructions are complete
    const keyboardInstructions = screen.getByText(/To move a list or card/i);
    expect(keyboardInstructions).toHaveTextContent(
      "press Space or Enter to start dragging"
    );
    expect(keyboardInstructions).toHaveTextContent(
      "use arrow keys to navigate"
    );
    expect(keyboardInstructions).toHaveTextContent(
      "press Space or Enter again to drop"
    );
  });

  it("is hidden visually but available to screen readers", () => {
    render(<DragInstructions />);

    const container = screen
      .getByText(/You can rearrange lists and cards/i)
      .closest("div");

    // sr-only class in Tailwind makes content visually hidden but accessible to screen readers
    expect(container).toHaveClass("sr-only");

    // Ensure content is still in the DOM for screen readers
    expect(container).toBeInTheDocument();
    expect(container).not.toHaveStyle("display: none");
  });

  it("follows accessibility best practices for live regions", () => {
    const { container } = render(<DragInstructions />);

    // Get the main container
    const instructionsContainer = screen
      .getByText(/You can rearrange lists and cards/i)
      .closest("div");

    // Check for proper aria-live attribute
    expect(instructionsContainer).toHaveAttribute("aria-live", "polite");

    // Verify the polite value which is best for instructions (not interrupting user)
    expect(instructionsContainer).not.toHaveAttribute("aria-live", "assertive");

    // Check that instructions are organized in separate paragraphs for better screen reading
    const paragraphs = instructionsContainer?.querySelectorAll("p");
    expect(paragraphs?.length).toBe(2);

    // Instructions should be concise and clear
    expect(paragraphs?.[0].textContent?.length).toBeLessThan(100);
    expect(paragraphs?.[1].textContent?.length).toBeLessThan(150);

    // Verify no other accessibility attributes that might conflict
    expect(instructionsContainer).not.toHaveAttribute("aria-hidden");
    expect(instructionsContainer).not.toHaveAttribute("role", "presentation");
  });
});
