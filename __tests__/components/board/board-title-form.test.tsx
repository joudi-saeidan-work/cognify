/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the actions and dependencies
jest.mock("@/actions/update-board", () => ({
  updateBoard: {
    id: "updateBoard",
  },
}));

jest.mock("@/hooks/use-actions", () => ({
  useAction: jest.fn().mockReturnValue({
    execute: jest.fn(),
    fieldErrors: {},
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock only the specific components
jest.mock("@/components/form/form-textarea", () => ({
  FormTextarea: React.forwardRef(
    (
      { onKeyDown, onBlur, defaultValue, id, className, color, errors }: any,
      ref: any
    ) => (
      <textarea
        data-testid="form-textarea"
        ref={ref}
        id={id}
        defaultValue={defaultValue}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={className}
      />
    )
  ),
}));

jest.mock("@/components/form/form-popover", () => ({
  FormPopOver: ({ children, board }: any) => (
    <div data-testid="form-popover">{children}</div>
  ),
}));

jest.mock("@/components/hint", () => ({
  Hint: ({ children, description }: any) => (
    <div data-hint={description}>{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock("lucide-react", () => ({
  ImageIcon: () => <svg className="lucide lucide-image" />,
}));

// Import the actual component
import { BordTitleForm } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-title-form";

describe("BoardTitleForm", () => {
  // Setup mock for requestSubmit
  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  const mockRequestSubmit = jest.fn();

  beforeAll(() => {
    // Replace the requestSubmit method with a mock function
    HTMLFormElement.prototype.requestSubmit = mockRequestSubmit;
  });

  afterAll(() => {
    // Restore the original requestSubmit method after tests
    HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
  });

  const mockBoard = {
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
    imageUnsplashName: null,
    order: 0,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    voiceId: null,
    voiceName: null,
    voiceGender: null,
    voiceLanguage: null,
    voiceCountry: null,
    severity: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the board title correctly", () => {
    render(<BordTitleForm data={mockBoard} />);
    expect(screen.getByText("Test Board")).toBeInTheDocument();
  });

  it("shows edit form when title is clicked", () => {
    render(<BordTitleForm data={mockBoard} />);
    const titleButton = screen.getByText("Test Board");
    fireEvent.click(titleButton);
    expect(screen.getByTestId("form-textarea")).toBeInTheDocument();
  });

  it("submits form when Enter is pressed", async () => {
    render(<BordTitleForm data={mockBoard} />);

    // Click to edit
    const titleButton = screen.getByText("Test Board");
    fireEvent.click(titleButton);

    // Get the textarea
    const textarea = screen.getByTestId("form-textarea");

    // Press Enter to submit
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    // Verify requestSubmit was called
    expect(mockRequestSubmit).toHaveBeenCalled();
  });

  it("submits form when textarea loses focus", async () => {
    render(<BordTitleForm data={mockBoard} />);

    // Click to edit
    const titleButton = screen.getByText("Test Board");
    fireEvent.click(titleButton);

    // Get the textarea
    const textarea = screen.getByTestId("form-textarea");

    // Blur the textarea
    fireEvent.blur(textarea);

    // Verify requestSubmit was called
    expect(mockRequestSubmit).toHaveBeenCalled();
  });

  it("shows cover button on hover", () => {
    render(<BordTitleForm data={mockBoard} />);
    const groupContainer = screen.getByText("Test Board").closest(".group");
    if (groupContainer) {
      fireEvent.mouseEnter(groupContainer);
    }

    // Find button with "Add Cover" text
    const addCoverButton = screen.getByText("Add Cover");
    expect(addCoverButton).toBeInTheDocument();
  });

  it("shows 'Change Cover' when board has a cover", () => {
    const boardWithCover = {
      ...mockBoard,
      color: "#000000",
    };
    render(<BordTitleForm data={boardWithCover} />);

    // Find button with "Change Cover" text
    const changeCoverButton = screen.getByText("Change Cover");
    expect(changeCoverButton).toBeInTheDocument();
  });

  it("calls useAction with correct parameters", async () => {
    const { useAction } = require("@/hooks/use-actions");
    const mockExecute = jest.fn();
    useAction.mockReturnValue({
      execute: mockExecute,
      fieldErrors: {},
    });

    // Simulate form submission by simulating the onSubmit handler
    render(<BordTitleForm data={mockBoard} />);

    // Click to edit
    const titleButton = screen.getByText("Test Board");
    fireEvent.click(titleButton);

    // Get the form and submit it directly
    const form = screen.getByTestId("form-textarea").closest("form");

    // Create a FormData object with the title
    const formData = new FormData();
    formData.append("title", "Test Board");

    // Manually call the onSubmit handler
    const onSubmitHandler = jest.fn();
    if (form) {
      form.onsubmit = onSubmitHandler;
      fireEvent.submit(form, { formData });
    }

    // Verify useAction was called
    expect(useAction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it("handles successful updates with correct toast message", async () => {
    const { useAction } = require("@/hooks/use-actions");
    const { toast } = require("sonner");
    const mockExecute = jest.fn();

    // Create a mock implementation that calls the onSuccess callback immediately
    useAction.mockReturnValue({
      execute: mockExecute,
      fieldErrors: {},
      onSuccess: jest.fn((data) => {
        toast.success(`Board ${data.title} Updated!`);
      }),
    });

    render(<BordTitleForm data={mockBoard} />);

    // Get the mock onSuccess handler
    const onSuccessHandler = useAction.mock.calls[0][1].onSuccess;

    // Call the onSuccess handler
    onSuccessHandler({ title: "Updated Title", id: mockBoard.id });

    // Verify toast was called with the right message
    expect(toast.success).toHaveBeenCalledWith("Board Updated Title Updated!");
  });
});
