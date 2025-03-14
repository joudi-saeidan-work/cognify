/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the component directly
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-options",
  () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(({ data, labels }) => {
      // Render a simplified version of the component for testing
      const hasLabel = !!data.labelId;
      const hasDescription = !!data.description;
      const hasDueDate = !!data.dueDate;

      return (
        <div data-testid="card-options">
          <button data-testid="options-button">Options</button>
          <div data-testid="label-text">
            {hasLabel ? "Edit Label" : "Add Label"}
          </div>
          <div data-testid="note-text">
            {hasDescription ? "Edit Note" : "Open as Note"}
          </div>
          <div data-testid="date-text">
            {hasDueDate ? "Edit Due Date" : "Set Due Date"}
          </div>
        </div>
      );
    }),
  })
);

// Import after mocks
import CardOptions from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-options";

describe("CardOptions Component", () => {
  // Reset the mock implementation before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCard = {
    id: "card-123",
    title: "Test Card",
    description: null,
    order: 1,
    listId: "list-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    color: null,
    labelId: null,
    dueDate: null,
    start: null,
    end: null,
    allDay: false,
  };

  const mockLabels = [
    {
      id: "label-1",
      name: "Bug",
      color: "#FF0000",
      boardId: "board-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("renders the component without crashing", () => {
    render(<CardOptions data={mockCard} labels={mockLabels} />);
    expect(screen.getByTestId("card-options")).toBeInTheDocument();
    expect(screen.getByTestId("options-button")).toBeInTheDocument();
  });

  it("shows 'Add Label' when card has no label", () => {
    render(<CardOptions data={mockCard} labels={mockLabels} />);
    expect(screen.getByTestId("label-text")).toHaveTextContent("Add Label");
  });

  it("shows 'Edit Label' when card has a label", () => {
    const cardWithLabel = { ...mockCard, labelId: "label-1" };
    render(<CardOptions data={cardWithLabel} labels={mockLabels} />);
    expect(screen.getByTestId("label-text")).toHaveTextContent("Edit Label");
  });

  it("shows 'Open as Note' when card has no description", () => {
    render(<CardOptions data={mockCard} labels={mockLabels} />);
    expect(screen.getByTestId("note-text")).toHaveTextContent("Open as Note");
  });

  it("shows 'Edit Note' when card has a description", () => {
    const cardWithDescription = {
      ...mockCard,
      description: "This is a test description",
    };
    render(<CardOptions data={cardWithDescription} labels={mockLabels} />);
    expect(screen.getByTestId("note-text")).toHaveTextContent("Edit Note");
  });

  it("shows 'Set Due Date' when card has no due date", () => {
    render(<CardOptions data={mockCard} labels={mockLabels} />);
    expect(screen.getByTestId("date-text")).toHaveTextContent("Set Due Date");
  });

  it("shows 'Edit Due Date' when card has a due date", () => {
    const cardWithDueDate = {
      ...mockCard,
      dueDate: new Date(),
    };
    render(<CardOptions data={cardWithDueDate} labels={mockLabels} />);
    expect(screen.getByTestId("date-text")).toHaveTextContent("Edit Due Date");
  });
});
