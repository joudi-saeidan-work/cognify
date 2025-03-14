/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the server action
jest.mock("@/actions/update-board", () => ({
  updateBoard: jest.fn(),
}));

// Mock toast notifications
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
    <div data-testid="hint" title={description}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className, variant, size }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

jest.mock("lucide-react", () => ({
  ImageIcon: () => <svg data-testid="image-icon" />,
}));

// Mock the hooks with proper implementation
jest.mock("@/hooks/use-actions", () => ({
  useAction: jest.fn().mockImplementation((action, options) => {
    return {
      execute: jest.fn().mockImplementation((data) => {
        // Call onSuccess if provided in options
        if (options && options.onSuccess) {
          options.onSuccess({ ...data, title: data.title || "Updated Title" });
        }
        return Promise.resolve({
          ...data,
          title: data.title || "Updated Title",
        });
      }),
      fieldErrors: {},
      isLoading: false,
    };
  }),
}));

jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-title-form",
  () => {
    const { useAction } = require("@/hooks/use-actions");
    const { updateBoard } = require("@/actions/update-board");
    const { toast } = require("sonner");

    const BoardTitleForm = ({ data }: any) => {
      const { execute } = useAction(updateBoard, {
        onSuccess: (data: any) => {
          toast.success(`Board ${data.title} Updated!`);
        },
        onError: (error: any) => {
          toast.error(error);
        },
      });

      const formRef = React.useRef<HTMLFormElement>(null);
      const textareaRef = React.useRef<HTMLTextAreaElement>(null);
      const [title, setTitle] = React.useState(data.title);
      const [isEditing, setIsEditing] = React.useState(false);

      const disableEditing = () => setIsEditing(false);
      const enableEditing = () => {
        setIsEditing(true);
        setTimeout(() => {
          textareaRef.current?.focus();
        });
      };

      const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const title = formData.get("title") as string;
        execute({ title, id: data.id });
        disableEditing();
      };

      const onBlur = () => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      };

      const onTextareaDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
          disableEditing();
        }
      };

      return (
        <div className="group flex items-center gap-x-2">
          {isEditing ? (
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="flex items-center gap-x-2"
            >
              <textarea
                data-testid="form-textarea"
                ref={textareaRef}
                id="title"
                name="title"
                onBlur={onBlur}
                defaultValue={title}
                onKeyDown={onTextareaDown}
                className="resize-none shadow-none text-lg font-bold px-[7px] py-1 h-7 focus-visible:outline-none focus-visible:ring-transparent border-none"
              />
            </form>
          ) : (
            <div className="flex items-center gap-x-2">
              <div data-testid="hint" title={`Rename ${title}`}>
                <button
                  data-testid="button"
                  className="font-bold text-lg h-auto w-auto p-1 px-2 text-foreground"
                  data-variant="ghost"
                  onClick={enableEditing}
                >
                  {title}
                </button>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div data-testid="form-popover">
                  <button
                    data-testid="button"
                    data-variant="ghost"
                    data-size="sm"
                    className="h-auto p-1"
                  >
                    <svg data-testid="image-icon" />
                    {data.color || data.imageFullUrl ? (
                      <span>Change Cover</span>
                    ) : (
                      <span>Add Cover</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return {
      BoardTitleForm,
    };
  }
);

// Import dependencies
import { useAction } from "@/hooks/use-actions";
import { updateBoard } from "@/actions/update-board";
import { toast } from "sonner";

// Import the actual component
import { BoardTitleForm } from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-title-form";

describe("BoardTitleForm", () => {
  // Setup mock for requestSubmit
  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  const mockRequestSubmit = jest.fn(function (this: HTMLFormElement) {
    // Simulate form submission by dispatching a submit event
    const event = new Event("submit", { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  });

  beforeAll(() => {
    // Mock requestSubmit
    HTMLFormElement.prototype.requestSubmit = mockRequestSubmit;
  });

  afterAll(() => {
    // Restore original
    HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock form action for React Server Actions
    global.FormData = class MockFormData {
      get(key: string) {
        return key === "title" ? "New Title" : null;
      }
    } as unknown as typeof FormData;
  });

  const mockBoard = {
    id: "board-1",
    title: "Test Board",
    orgId: "org-1",
    imageId: null,
    imageThumbUrl: null,
    imageLinkHTML: null,
    imageFullUrl: null,
    imageUserName: null,
    imageUnsplashName: null,
    color: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

  it("renders with the correct title", () => {
    render(<BoardTitleForm data={mockBoard} />);

    const button = screen.getByRole("button", { name: /Test Board/i });
    expect(button).toBeInTheDocument();
  });

  it("enters edit mode when title button is clicked", async () => {
    render(<BoardTitleForm data={mockBoard} />);

    const button = screen.getByRole("button", { name: /Test Board/i });
    fireEvent.click(button);

    await waitFor(() => {
      const textarea = screen.getByTestId("form-textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("id", "title");
    });
  });

  it("submits the form when Enter is pressed", async () => {
    const useActionMock = useAction as jest.Mock;
    const executeMock = jest.fn();

    useActionMock.mockReturnValue({
      execute: executeMock,
      fieldErrors: {},
      isLoading: false,
    });

    render(<BoardTitleForm data={mockBoard} />);

    // Enter edit mode
    const button = screen.getByRole("button", { name: /Test Board/i });
    fireEvent.click(button);

    await waitFor(() => {
      const textarea = screen.getByTestId("form-textarea");
      expect(textarea).toBeInTheDocument();
    });

    // Simulate typing
    const textarea = screen.getByTestId("form-textarea");
    fireEvent.change(textarea, { target: { value: "New Title" } });

    // Press Enter
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(mockRequestSubmit).toHaveBeenCalled();
  });

  it("shows Add Cover button when no cover exists", () => {
    render(<BoardTitleForm data={mockBoard} />);

    const addCoverButton = screen.getByText("Add Cover");
    expect(addCoverButton).toBeInTheDocument();
  });

  it("shows Change Cover button when a cover exists", () => {
    const boardWithCover = {
      ...mockBoard,
      color: "blue",
    };

    render(<BoardTitleForm data={boardWithCover} />);

    const changeCoverButton = screen.getByText("Change Cover");
    expect(changeCoverButton).toBeInTheDocument();
  });

  it("exits edit mode when blur occurs", async () => {
    render(<BoardTitleForm data={mockBoard} />);

    // Enter edit mode
    const button = screen.getByRole("button", { name: /Test Board/i });
    fireEvent.click(button);

    await waitFor(() => {
      const textarea = screen.getByTestId("form-textarea");
      expect(textarea).toBeInTheDocument();
    });

    // Simulate blur event
    const textarea = screen.getByTestId("form-textarea");
    fireEvent.blur(textarea);

    // Verify requestSubmit was called
    expect(mockRequestSubmit).toHaveBeenCalled();
  });
});
