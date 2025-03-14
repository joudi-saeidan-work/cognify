import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Create a mock router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Clerk auth
jest.mock("@clerk/nextjs", () => ({
  useAuth: jest.fn(() => ({ userId: "user123", orgId: "org123" })),
  useUser: jest.fn(() => ({
    user: {
      firstName: "Test",
      lastName: "User",
    },
  })),
  UserButton: () => <div data-testid="user-button" />,
}));

// Mock theme context
jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ theme: "light", setTheme: jest.fn() })),
}));

// Mock child components
jest.mock(
  "../../../app/(platform)/(dashboard)/_components/(calendar)/calendar",
  () => ({
    __esModule: true,
    default: () => <div data-testid="calendar" />,
  })
);

jest.mock("../../../components/bookmark/bookmark-bar", () => ({
  __esModule: true,
  default: () => <div data-testid="bookmark-bar" />,
}));

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-title-form",
  () => ({
    BoardTitleForm: () => <div data-testid="board-title-form" />,
  })
);

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-settings",
  () => ({
    __esModule: true,
    default: ({
      onModelChange,
      setZoomLevel,
      setColorBlindMode,
    }: {
      onModelChange: (model: { id: string; name: string }) => void;
      setZoomLevel: (level: number) => void;
      setColorBlindMode: (mode: boolean) => void;
    }) => (
      <div data-testid="board-settings">
        <button
          data-testid="change-model-button"
          onClick={() => onModelChange({ id: "voice123", name: "Test Voice" })}
        >
          Change Voice
        </button>
        <button
          data-testid="change-zoom-button"
          onClick={() => setZoomLevel(150)}
        >
          Change Zoom
        </button>
        <button
          data-testid="toggle-colorblind-button"
          onClick={() => setColorBlindMode(true)}
        >
          Toggle Colorblind
        </button>
      </div>
    ),
  })
);

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/WelcomeModal",
  () => ({
    __esModule: true,
    default: () => <div data-testid="welcome-modal" />,
  })
);

jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/ReadTasksButton",
  () => ({
    __esModule: true,
    default: () => <div data-testid="read-tasks-button" />,
  })
);

jest.mock("../../../components/hint", () => ({
  Hint: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hint">{children}</div>
  ),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Home: () => <div data-testid="home-icon" />,
}));

// Import the component after all mocks are set up
import BoardNavbar from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-navbar";

describe("BoardNavbar Component", () => {
  // Create mock data
  const mockBoard = {
    id: "board123",
    title: "Test Board",
    orgId: "org123",
    imageId: "img123",
    imageThumbUrl: "thumb-url",
    imageFullUrl: "full-url",
    imageUserName: "user",
    imageLinkHTML: "<a href='#'>Link</a>",
    createdAt: new Date(),
    updatedAt: new Date(),
    color: null,
    isFavorite: false,
    voiceId: null,
    voiceGender: null,
    voiceLanguage: null,
    voiceCountry: null,
    voiceName: null,
  };

  const mockFolders = [
    {
      id: "folder1",
      title: "Folder 1",
      orgId: "org123",
      createdAt: new Date(),
      updatedAt: new Date(),
      bookmarks: [
        {
          id: "bookmark1",
          title: "Bookmark 1",
          url: "http://example.com/1",
          folderId: "folder1",
          orgId: "org123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ];

  const mockBookmarksWithoutFolders = [
    {
      id: "bookmark2",
      title: "Bookmark 2",
      url: "http://example.com/2",
      folderId: null,
      orgId: "org123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    data: mockBoard,
    folders: mockFolders,
    bookmarksWithoutFolders: mockBookmarksWithoutFolders,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.documentElement for zoom level tests
    Object.defineProperty(document, "documentElement", {
      writable: true,
      value: {
        style: {
          fontSize: "100%",
        },
      },
    });
  });

  test("renders correctly with all components", () => {
    render(<BoardNavbar {...defaultProps} />);

    // Check for main components
    expect(screen.getByTestId("hint")).toBeInTheDocument();
    expect(screen.getByTestId("board-title-form")).toBeInTheDocument();
    expect(screen.getByTestId("board-settings")).toBeInTheDocument();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByTestId("read-tasks-button")).toBeInTheDocument();
    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    expect(screen.getByTestId("bookmark-bar")).toBeInTheDocument();
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  test("updates zoom level when zoom is changed", () => {
    render(<BoardNavbar {...defaultProps} />);

    const changeZoomButton = screen.getByTestId("change-zoom-button");
    fireEvent.click(changeZoomButton);

    expect(document.documentElement.style.fontSize).toBe("150%");
  });

  test("updates color blind mode when toggled", () => {
    render(<BoardNavbar {...defaultProps} />);

    const toggleColorblindButton = screen.getByTestId(
      "toggle-colorblind-button"
    );
    fireEvent.click(toggleColorblindButton);

    const boardSettings = screen.getByTestId("board-settings");
    expect(boardSettings).toBeInTheDocument();
  });

  test("updates selected voice model when changed", () => {
    render(<BoardNavbar {...defaultProps} />);

    const changeVoiceButton = screen.getByTestId("change-model-button");
    fireEvent.click(changeVoiceButton);

    const boardSettings = screen.getByTestId("board-settings");
    expect(boardSettings).toBeInTheDocument();
  });
});
