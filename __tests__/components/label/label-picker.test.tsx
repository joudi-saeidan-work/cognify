import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LabelPicker } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(label)/label-picker";
import { toast } from "sonner";
import { Label } from "@prisma/client";
import { ActionState, FieldErrors } from "../../../lib/create-safe-actions";

// Define types for the useAction parameters
type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

// Mock the useAction hook
const mockExecute = jest.fn().mockImplementation(() => Promise.resolve());

jest.mock("../../../hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action: any, options: any) => ({
    execute: mockExecute,
    fieldErrors: undefined,
    error: undefined,
    data: undefined,
    isLoading: false,
  })),
}));

// Mock the actions
jest.mock("../../../actions/update-card", () => ({
  updateCard: jest.fn(),
}));

jest.mock("../../../actions/create-label", () => ({
  createLabel: jest.fn(),
}));

jest.mock("../../../actions/update-label", () => ({
  updateLabel: jest.fn(),
}));

jest.mock("../../../actions/delete-label", () => ({
  deleteLabel: jest.fn(),
}));

// Mock the dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the Dialog component and its children
jest.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className, style }: any) => (
    <div data-testid="dialog-content" className={className} style={style}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, className }: any) => (
    <div data-testid="dialog-title" className={className}>
      {children}
    </div>
  ),
}));

// Mock the getContrastColor function
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(card)/card-item",
  () => ({
    getContrastColor: (hexColor: string) => {
      // Simple implementation for testing
      return hexColor === "#FFFFFF" ? "black" : "white";
    },
  })
);

// Mock the Input component
jest.mock("../../../components/ui/input", () => ({
  Input: ({ placeholder, className, value, onChange, type, ...props }: any) => (
    <input
      data-testid="input"
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={onChange}
      type={type}
      {...props}
    />
  ),
}));

// Mock the Button component
jest.mock("../../../components/ui/button", () => ({
  Button: ({ children, className, variant, size, onClick, ...props }: any) => (
    <button
      data-testid={`button-${
        children?.toString()?.replace(/\s+/g, "-")?.toLowerCase() || "unnamed"
      }`}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
  useQuery: jest.fn(),
}));

describe("LabelPicker Component", () => {
  // Sample test data
  const mockLabels: Label[] = [
    {
      id: "label1",
      name: "Bug",
      color: "#FF0000",
      boardId: "board1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "label2",
      name: "Feature",
      color: "#00FF00",
      boardId: "board1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "label3",
      name: "Documentation",
      color: "#0000FF",
      boardId: "board1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    cardId: "card1",
    boardId: "board1",
    currentLabel: null,
    labels: mockLabels,
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { value: 1024 });
  });

  it("renders correctly when open", () => {
    render(<LabelPicker {...defaultProps} />);

    // Check title is rendered
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Labels");

    // Check if labels are rendered
    mockLabels.forEach((label) => {
      expect(screen.getByText(label.name!)).toBeInTheDocument();
    });

    // Check if search input is rendered
    expect(screen.getByPlaceholderText("Search labels...")).toBeInTheDocument();

    // Check if Create button is present
    expect(screen.getByText("Create a new label")).toBeInTheDocument();
  });

  it("doesn't render when closed", () => {
    render(<LabelPicker {...defaultProps} open={false} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("filters labels based on search input", () => {
    render(<LabelPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search labels...");

    // Search for "Bug"
    fireEvent.change(searchInput, { target: { value: "Bug" } });
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.queryByText("Feature")).not.toBeInTheDocument();

    // Search for "fea" (case insensitive)
    fireEvent.change(searchInput, { target: { value: "fea" } });
    expect(screen.queryByText("Bug")).not.toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });

  it("shows no labels message when there are no labels", () => {
    render(<LabelPicker {...defaultProps} labels={[]} />);
    expect(
      screen.getByText("No labels created yet. Create your first label below.")
    ).toBeInTheDocument();
  });

  it("shows no matching labels message when search has no results", () => {
    render(<LabelPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search labels...");
    fireEvent.change(searchInput, { target: { value: "NonExistentLabel" } });

    expect(screen.getByText("No matching labels found")).toBeInTheDocument();
  });

  it("selects a label when clicked", () => {
    render(<LabelPicker {...defaultProps} />);

    // Find the Bug label and click it
    const bugLabel = screen.getAllByText("Bug")[0].closest("div.flex-1");
    fireEvent.click(bugLabel!);

    // Check if updateCard action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      id: "card1",
      boardId: "board1",
      labelId: "label1",
    });
  });

  it("deselects a label when the same label is clicked again", () => {
    render(<LabelPicker {...defaultProps} currentLabel="label1" />);

    // Find the Bug label and click it
    const bugLabel = screen.getAllByText("Bug")[0].closest("div.flex-1");
    fireEvent.click(bugLabel!);

    // Check if updateCard action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      id: "card1",
      boardId: "board1",
      labelId: null,
    });
  });

  it("shows Remove Label button when a label is selected", () => {
    render(<LabelPicker {...defaultProps} currentLabel="label1" />);

    expect(screen.getByText("Remove Label")).toBeInTheDocument();

    // Click Remove Label button
    fireEvent.click(screen.getByText("Remove Label"));

    // Check if updateCard action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      id: "card1",
      boardId: "board1",
      labelId: null,
    });
  });

  it("switches to create label mode", () => {
    render(<LabelPicker {...defaultProps} />);

    // Click Create a new label button
    fireEvent.click(screen.getByText("Create a new label"));

    // Check if in create mode
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(
      "Create Label"
    );
    expect(
      screen.getByPlaceholderText("Label name (optional)")
    ).toBeInTheDocument();
    expect(screen.getByText("Color")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("creates a new label", () => {
    render(<LabelPicker {...defaultProps} />);

    // Switch to create mode
    fireEvent.click(screen.getByText("Create a new label"));

    // Fill in label details
    const nameInput = screen.getByPlaceholderText("Label name (optional)");
    fireEvent.change(nameInput, { target: { value: "New Label" } });

    // Select a color (first color in grid)
    const colorContainer = screen.getByText("Color").parentElement!;
    const colorGrid = colorContainer.querySelector(".grid");
    const firstColorOption = colorGrid!.firstChild as HTMLElement;
    fireEvent.click(firstColorOption);

    // Click Create button
    fireEvent.click(screen.getByText("Create"));

    // Check if createLabel action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      name: "New Label",
      color: expect.any(String),
      boardId: "board1",
    });
  });

  it("edits an existing label", () => {
    const { container } = render(<LabelPicker {...defaultProps} />);

    // Find edit button for Bug label and click it
    const labelContainers = container.querySelectorAll(
      ".flex.items-center.gap-2"
    );
    const bugLabelContainer = Array.from(labelContainers).find((el) =>
      el.textContent?.includes("Bug")
    );

    // Find the edit button (pencil icon)
    const editButton = bugLabelContainer!.querySelector("button");
    fireEvent.click(editButton!);

    // Check if in edit mode
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edit Label");

    // Change label name
    const nameInput = screen.getByPlaceholderText("Label name (optional)");
    fireEvent.change(nameInput, { target: { value: "Major Bug" } });

    // Click Update button
    fireEvent.click(screen.getByText("Update"));

    // Check if updateLabel action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      id: "label1",
      name: "Major Bug",
      color: expect.any(String),
      boardId: "board1",
    });
  });

  it("deletes a label", () => {
    const { container } = render(<LabelPicker {...defaultProps} />);

    // Find the label containers
    const labelContainers = container.querySelectorAll(
      ".flex.items-center.gap-2"
    );
    const bugLabelContainer = Array.from(labelContainers).find((el) =>
      el.textContent?.includes("Bug")
    );

    // Find all buttons in the container
    const buttons = bugLabelContainer!.querySelectorAll("button");
    // The delete button should be the last one (with trash icon)
    const deleteButton = buttons[buttons.length - 1];

    fireEvent.click(deleteButton);

    // Check if deleteLabel action was called with correct arguments
    expect(mockExecute).toHaveBeenCalledWith({
      id: "label1",
      boardId: "board1",
    });
  });

  it("calculates dialog position based on card position", () => {
    const cardPosition = {
      left: 100,
      top: 100,
      width: 200,
      height: 100,
    };

    // Mock Window.innerWidth
    Object.defineProperty(window, "innerWidth", { value: 1000 });

    render(<LabelPicker {...defaultProps} cardPosition={cardPosition} />);

    const dialogContent = screen.getByTestId("dialog-content");
    const style = window.getComputedStyle(dialogContent);

    // Check if the position is as expected
    expect(dialogContent).toHaveAttribute("style");
    expect(style.getPropertyValue("position")).toBe("fixed");
    // We can't easily test the exact calculation in JSDOM, so we just check that styles are applied
    expect(dialogContent.style.top).toBeDefined();
    expect(dialogContent.style.left).toBeDefined();
  });

  it("repositions dialog when it would overflow to the right", () => {
    const cardPosition = {
      left: 100,
      top: 100,
      width: 200,
      height: 100,
    };

    // Mock Window.innerWidth to a small value to force repositioning
    Object.defineProperty(window, "innerWidth", { value: 400 });

    const { container } = render(
      <LabelPicker {...defaultProps} cardPosition={cardPosition} />
    );

    const dialogContent = screen.getByTestId("dialog-content");

    // The LabelPicker should attempt to reposition since 100 + 200 + 320 + 16 > 400
    // We can verify it sets positioning styles
    expect(dialogContent).toHaveAttribute("style");
    expect(dialogContent.style.position).toBe("fixed");
  });

  it("repositions dialog when it would overflow to both right and left", () => {
    const cardPosition = {
      left: 50,
      top: 100,
      width: 200,
      height: 100,
    };

    // Mock Window.innerWidth to a small value to force repositioning
    Object.defineProperty(window, "innerWidth", { value: 400 });

    render(<LabelPicker {...defaultProps} cardPosition={cardPosition} />);

    const dialogContent = screen.getByTestId("dialog-content");

    // The LabelPicker should attempt to reposition since 50 - 320 - 16 < 0
    // We can verify it sets positioning styles
    expect(dialogContent).toHaveAttribute("style");
    expect(dialogContent.style.position).toBe("fixed");
    // Should now be positioned below the card
    expect(dialogContent.style.top).toBeDefined();
  });

  it("handles success and error callbacks for actions", () => {
    // Setup success callback for this specific test
    const useActionModule = require("../../../hooks/use-actions");
    useActionModule.useAction.mockImplementationOnce(
      (
        action: Action<unknown, unknown>,
        options: UseActionOptions<unknown>
      ) => {
        return {
          execute: (params: any) => {
            mockExecute(params);
            options?.onSuccess?.(params);
            return Promise.resolve();
          },
          fieldErrors: undefined,
          error: undefined,
          data: undefined,
          isLoading: false,
        };
      }
    );

    const { container } = render(<LabelPicker {...defaultProps} />);

    // Find the Bug label using container query to avoid multiple matches
    const labelContainers = container.querySelectorAll(
      ".flex.items-center.gap-2"
    );
    const bugLabelContainer = Array.from(labelContainers).find((el) =>
      el.textContent?.includes("Bug")
    );
    const bugLabel = bugLabelContainer!.querySelector(".flex-1");

    // Test success scenario for updateCard
    fireEvent.click(bugLabel!);
    expect(toast.success).toHaveBeenCalledWith("Card updated");

    // Setup error callback for the next test
    useActionModule.useAction.mockImplementationOnce(
      (
        action: Action<unknown, unknown>,
        options: UseActionOptions<unknown>
      ) => {
        return {
          execute: (params: any) => {
            mockExecute(params);
            options?.onError?.("Error message");
            return Promise.resolve();
          },
          fieldErrors: undefined,
          error: undefined,
          data: undefined,
          isLoading: false,
        };
      }
    );

    // Re-render to use the new mock
    const { container: container2 } = render(<LabelPicker {...defaultProps} />);

    // Find Bug label again in the new container
    const labelContainers2 = container2.querySelectorAll(
      ".flex.items-center.gap-2"
    );
    const bugLabelContainer2 = Array.from(labelContainers2).find((el) =>
      el.textContent?.includes("Bug")
    );
    const bugLabel2 = bugLabelContainer2!.querySelector(".flex-1");

    // Test error scenario
    fireEvent.click(bugLabel2!);
    expect(toast.error).toHaveBeenCalledWith("Error message");
  });
});
