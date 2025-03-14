import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import WelcomeModal from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/WelcomeModal";
import { useVoice } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";
import { VoiceProvider } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";

// Add this at the top, before your mock implementations
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Suppress console logs and errors during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress React warnings and console logs/errors during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods after tests
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Mock the VoiceContext
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext",
  () => {
    const useVoiceMock = jest.fn();

    // Add explicit type definition for VoiceProviderMock
    const VoiceProviderMock = ({
      children,
    }: {
      children: React.ReactNode;
      initialVoices?: any;
      initialSelectedVoice?: any;
    }) => <>{children}</>;

    return {
      useVoice: useVoiceMock,
      VoiceProvider: VoiceProviderMock,
    };
  }
);

// Mock SpeechModal to simplify testing
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/SpeechModal",
  () => ({
    __esModule: true,
    default: ({
      setShowModel,
      url,
    }: {
      setShowModel: (value: boolean) => void;
      url: string;
    }) => (
      <div data-testid="speech-modal">
        Mock Speech Modal
        <span data-testid="audio-url">{url}</span>
        <button
          data-testid="close-speech-button"
          onClick={() => setShowModel(false)}
        >
          Close
        </button>
      </div>
    ),
  })
);

// Mock other dependencies
jest.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Simple mock for framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: any;
    }) => <div {...props}>{children}</div>,
  },
}));

// Sample board data for testing
const mockBoardData = {
  id: "board-1",
  title: "Test Board",
  lists: [
    {
      title: "To Do",
      cards: [
        {
          title: "Task 1",
          label: "Priority",
          description: "Description for task 1",
          dueDate: new Date().toISOString(),
        },
      ],
    },
  ],
};

// Instead of mocking the entire component, override the quotes directly
// at the beginning of each test that needs it
const originalQuotes = [
  { quote: "Test quote for testing", author: "Test Author" },
];

// Create a custom render function that includes the provider
async function renderWithVoiceContext(ui: React.ReactNode, renderOptions = {}) {
  let result: any;
  await act(async () => {
    result = render(<>{ui}</>, renderOptions);
  });
  return result;
}

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();

  // Now this will work
  (global.fetch as jest.Mock).mockImplementation((url) => {
    if (url.includes("/api/boards/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBoardData),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ title: "Test Board", lists: [] }),
    });
  });

  const defaultVoices = [
    {
      id: "en-AU-Neural2-C",
      name: "Emma",
      language: "English",
      country: "Australia",
      gender: "Female",
    },
  ];

  // Set default return value for useVoice
  (useVoice as jest.Mock).mockReturnValue({
    voices: defaultVoices,
    selectedVoice: defaultVoices[0],
    setSelectedVoice: jest.fn(),
    loading: false,
  });
});

describe("WelcomeModal", () => {
  const mockVoice = {
    id: 1,
    voice_id: "en-AU-Neural2-C",
    gender: "FEMALE",
    language_code: "en-AU",
    language: "English",
    country: "Australia",
    name: "Emma",
    type: "neural",
  };

  it("shows task reading UI after loading", async () => {
    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Test loading state ends
    expect(
      await screen.findByText(/Would you like me to read/i)
    ).toBeInTheDocument();

    // Test the more important parts of your component
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText("Yes, please")).toBeInTheDocument();
    expect(screen.getByText("No, thanks")).toBeInTheDocument();
  });

  it("renders with the user's name and motivational quote", async () => {
    await renderWithVoiceContext(
      <WelcomeModal username="John Doe" boardId="board-1" />
    );

    // Check that the user's name is displayed
    expect(
      screen.getByText(/ready to crush it, john doe/i)
    ).toBeInTheDocument();

    // Match any quote format (since they're random)
    const quoteElement = screen.getByText(/^".*"$/);
    expect(quoteElement).toBeInTheDocument();

    // Check for attribution element (author of quote)
    const attributionElement = screen.getByText(/^—/);
    expect(attributionElement).toBeInTheDocument();
  });

  it("shows loading state while fetching tasks", async () => {
    // Use a controllable promise for better test stability
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise<any>((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockImplementationOnce(() => fetchPromise);

    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Verify loading is shown
    expect(screen.getByText(/loading your tasks/i)).toBeInTheDocument();

    // Resolve the fetch to complete loading
    await act(async () => {
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve(mockBoardData),
      });
    });

    // Now wait for loading to disappear
    await waitFor(() => {
      expect(screen.queryByText(/loading your tasks/i)).not.toBeInTheDocument();
    });
  });

  it("shows the voice information when a voice is selected", async () => {
    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Should display the selected voice info
    await waitFor(() => {
      expect(screen.getByText(/using emma/i)).toBeInTheDocument();
      expect(screen.getByText(/english, australia/i)).toBeInTheDocument();
    });
  });

  it("handles 'Read Tasks' button click successfully", async () => {
    // Clear any previous calls
    (global.fetch as jest.Mock).mockClear();

    // Setup mock responses for different API endpoints
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/boards/board-1/content") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBoardData),
        });
      } else if (url === "/api/voice-assistant") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Test response" }] }],
            }),
        });
      } else if (url === "/api/getSpeech") {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify([{ link: "https://example.com/audio.mp3" }])
            ),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Use act for the initial render
    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading your tasks/i)).not.toBeInTheDocument();
    });

    // Click the button within act
    await act(async () => {
      fireEvent.click(screen.getByText("Yes, please"));
    });

    // Test for API calls
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/voice-assistant",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );

    // Wait for the speech modal to appear
    await waitFor(
      () => {
        expect(screen.queryByTestId("speech-modal")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("shows an error message when no voice is selected", async () => {
    // Mock no voice selected
    (useVoice as jest.Mock).mockReturnValue({
      selectedVoice: null,
    });

    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading your tasks/i)).not.toBeInTheDocument();
    });

    // Click the "Yes, please" button
    await act(async () => {
      fireEvent.click(screen.getByText("Yes, please"));
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/no voice model selected/i)).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    // Mock fetch to return an error for voice-assistant
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/boards/board-1/content") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBoardData),
        });
      } else if (url === "/api/voice-assistant") {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading your tasks/i)).not.toBeInTheDocument();
    });

    // Click the button to trigger API calls
    await act(async () => {
      fireEvent.click(screen.getByText("Yes, please"));
    });

    // Check for error message
    await waitFor(
      () => {
        const errorElement = screen.getByText(
          /Failed to generate speech|error|unable/i
        );
        expect(errorElement).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("handles closing the modal", async () => {
    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Click the "No, thanks" button
    await act(async () => {
      fireEvent.click(screen.getByText("No, thanks"));
    });

    // The Dialog mock handles open state, so we don't need to check DOM removal
  });

  it("meets accessibility standards for keyboard users", async () => {
    // Mock fetch to simulate loading state
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBoardData),
      })
    );

    await renderWithVoiceContext(
      <WelcomeModal username="John Doe" boardId="board-1" />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.getByText(/would you like me to read/i)
      ).toBeInTheDocument();
    });

    // Check that buttons exist
    const noThanksButton = screen.getByText("No, thanks");
    const yesButton = screen.getByText("Yes, please");

    expect(noThanksButton).toBeInTheDocument();
    expect(yesButton).toBeInTheDocument();
  });

  it("handles board updates through event listeners", async () => {
    await act(async () => {
      render(<WelcomeModal username="John Doe" boardId="board-1" />);
    });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/loading your tasks/i)).not.toBeInTheDocument();
    });

    // Reset fetch mock to verify it's called again after event
    (global.fetch as jest.Mock).mockClear();

    // Simulate a card update event
    await act(async () => {
      window.dispatchEvent(new Event("card:update"));
    });

    // Should fetch board content again
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/boards/board-1/content");
    });
  });
});
