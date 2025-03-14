import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import React, { ReactNode } from "react";
import { toast } from "sonner";

// Mock dependencies before imports
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the SpeechModal component
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/SpeechModal",
  () => {
    return function MockSpeechModal({
      setShowModel,
      url,
    }: {
      setShowModel: Function;
      url: string;
    }) {
      return (
        <div data-testid="speech-modal" className="speech-modal-mock">
          <h2>Playing Your Tasks</h2>
          <audio src={url} data-testid="audio-element" />
          <button onClick={() => setShowModel(false)}>Close</button>
        </div>
      );
    };
  }
);

// Mock the VoiceContext
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext",
  () => {
    // Create a mock implementation with a default selected voice
    const mockSelectedVoice = {
      id: 1,
      voice_id: "en-AU-Neural2-C",
      name: "Default Test Voice",
      gender: "Female",
      language_code: "en-US",
      language: "English",
      country: "US",
      type: "neural",
    };

    // Return a function that can be controlled by tests
    const mockSetSelectedVoice = jest.fn();
    let currentVoice = mockSelectedVoice;

    return {
      useVoice: jest.fn().mockImplementation(() => ({
        selectedVoice: currentVoice,
        setSelectedVoice: mockSetSelectedVoice,
        voices: [mockSelectedVoice],
      })),
      // Helper for tests to change the value
      __setMockVoice: (voice: any | null) => {
        currentVoice = voice;
      },
      VoiceProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    };
  }
);

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Import components after mocking
import ReadListButton from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/ReadListButton";
import { VoiceProvider } from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";

// Access the mock directly with type assertion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVoiceModule = jest.requireMock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext"
) as any;
const __setMockVoice = mockVoiceModule.__setMockVoice;

// Add renderWithVoiceContext helper function
const renderWithVoiceContext = async (ui: React.ReactNode) => {
  let result: any;
  await act(async () => {
    result = render(<VoiceProvider>{ui}</VoiceProvider>);
  });
  return result;
};

// Clean up after tests
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// Mock the listData props
const mockListData = {
  id: "list-1",
  title: "Test List",
  color: "#f5f5f5",
  order: 1,
  boardId: "board-1",
  cards: [
    {
      id: "card-1",
      title: "Test Card",
      labelId: "label-1",
      description: "Test description",
      order: 1,
      listId: "list-1",
      dueDate: new Date(),
      start: null,
      end: null,
      allDay: true,
      color: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock empty list for testing empty list scenario
const emptyListData = {
  ...mockListData,
  cards: [],
};

beforeAll(() => {
  // Create a proper mock that tracks calls
  window.HTMLMediaElement.prototype.play = jest
    .fn()
    .mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();

  // Mock properties that can't be called as functions
  Object.defineProperty(HTMLMediaElement.prototype, "duration", { value: 100 });
  Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
    value: 0,
  });
});

describe("ReadListButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock voice to default
    if (__setMockVoice) {
      __setMockVoice({
        id: 1,
        voice_id: "en-AU-Neural2-C",
        name: "Default Test Voice",
        gender: "Female",
        language_code: "en-US",
        language: "English",
        country: "US",
        type: "neural",
      });
    }

    // Suppress console warnings
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Clear and set new fetch mocks for each test
    global.fetch = jest.fn();
  });

  it("renders the button correctly", () => {
    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Should render a button with an icon
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Read Test List tasks aloud");
  });

  it("renders with the correct color based on list color", () => {
    const coloredListData = {
      ...mockListData,
      color: "#FF5733",
    };

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={coloredListData} />
      </VoiceProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-neutral-800");
  });

  it("processes list data and displays speech modal on success", async () => {
    // Setup fetch mocks with explicit resolved promises
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify([{ link: "https://example.com/audio.mp3" }])
            ),
        })
      );

    // Render component with necessary context
    await renderWithVoiceContext(
      <ReadListButton username="TestUser" listData={mockListData} />
    );

    // Find and click the button
    const button = screen.getByRole("button");

    // Using act to ensure all updates are processed
    await act(async () => {
      fireEvent.click(button);
    });

    // Wait for loading to complete and verify the modal is displayed
    // Using findByTestId because it waits for the element to appear
    const speechModal = await screen.findByTestId("speech-modal");
    expect(speechModal).toBeInTheDocument();

    // Verify the audio URL is correctly set
    const audioElement = screen.getByTestId("audio-element");
    expect(audioElement).toHaveAttribute(
      "src",
      "https://example.com/audio.mp3"
    );
  }, 15000); // Use reasonable timeout

  it("handles empty list data correctly", async () => {
    // Setup fetch mocks
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify([{ link: "https://example.com/audio.mp3" }])
            ),
        })
      );

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={emptyListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Verify API call included "No tasks found" message
    await waitFor(() => {
      const firstCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(firstCall[1].body);
      expect(requestBody.messages[0].content).toContain(
        "No tasks found in this list"
      );
    });
  });

  it("handles alternative response format from API", async () => {
    // Setup fetch mocks returning different format
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                audioUrl: "https://example.com/direct-audio.mp3",
              })
            ),
        })
      );

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Wait for modal to appear with the audioUrl
    await waitFor(
      () => {
        const audio = screen.getByTestId("audio-element");
        expect(audio).toHaveAttribute(
          "src",
          "https://example.com/direct-audio.mp3"
        );
      },
      { timeout: 10000 }
    );
  });

  it("shows error when no voice is selected", async () => {
    // Set mock voice to null
    if (__setMockVoice) {
      __setMockVoice(null);
    }

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Check error toast was shown
    expect(toast.error).toHaveBeenCalledWith("No voice selected", {
      description: "Please select a voice in Board Settings first.",
    });

    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses default voice when user hasn't selected one", async () => {
    // Setup fetch mocks
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify([{ link: "https://example.com/audio.mp3" }])
            ),
        })
      );

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Verify API was called (no error shown)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/voice-assistant",
        expect.any(Object)
      );
    });

    // Verify the default voice was used in the API call
    await waitFor(() => {
      // Get the second fetch call which should be to getSpeech
      const speechCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[0] === "/api/getSpeech"
      );

      expect(speechCall).toBeTruthy();
      const requestBody = JSON.parse(speechCall[1].body);
      expect(requestBody.voice.voice_id).toBe("en-AU-Neural2-C");
    });
  });

  it("handles API error from voice-assistant endpoint", async () => {
    // Mock the fetch to reject with an error
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch"));

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/voice-assistant",
        expect.any(Object)
      );
    });

    // Verify error message is displayed
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not read list tasks", {
        description: "Failed to fetch",
      });
    });
  });

  it("handles non-ok response from voice-assistant endpoint", async () => {
    // Mock non-ok response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Verify error message is displayed
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not read list tasks", {
        description: "Failed to fetch assistant response",
      });
    });
  });

  it("shows loading state while fetching", async () => {
    // Setup a promise that won't resolve right away
    let resolvePromise: (value: any) => void;
    const waitPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = jest.fn().mockImplementation(() => waitPromise);

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    fireEvent.click(screen.getByRole("button"));

    // Check that loading spinner is shown
    const loadingSpinner = screen
      .getByRole("button")
      .querySelector("svg.animate-spin");
    expect(loadingSpinner).toBeInTheDocument();

    // Now resolve the promise
    resolvePromise!({
      ok: false,
      status: 500,
    });

    // Wait for loading state to end
    await waitFor(() => {
      const button = screen.queryByRole("button");
      expect(button).not.toBeNull();
      const spinner = button?.querySelector("svg.animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  it("handles JSON parse error from speech API", async () => {
    // Setup fetch mocks with the second returning invalid JSON
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve("Not valid JSON"),
        })
      );

    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Click the read button
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Should use fallback URL
    await waitFor(
      () => {
        const audio = screen.getByTestId("audio-element");
        // Should use the fallback URL
        expect(audio.getAttribute("src")).toContain(
          "s3.us-east-1.amazonaws.com"
        );
      },
      { timeout: 10000 }
    );
  });
});

test.todo("should allow selecting different voices");
test.todo("should persist voice preferences");
