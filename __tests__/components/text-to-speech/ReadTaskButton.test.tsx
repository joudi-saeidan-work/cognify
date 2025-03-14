import React, { ReactNode } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ReadTasksButton from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/ReadTasksButton";
import { toast } from "sonner";

// Manual mock setup
const mockSelectedVoice = {
  id: "1",
  voice_id: "en-US-Wavenet-D",
  gender: "MALE",
  language_code: "en-US",
  language: "English",
  country: "US",
  name: "John",
  type: "Wavenet",
};

// Mock the VoiceContext at the module level (not inside a test)
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext",
  () => ({
    useVoice: jest.fn(),
  })
);

// Import the mock after defining it
const {
  useVoice,
} = require("../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext");

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock SpeechModal
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/SpeechModal",
  () => {
    // Import your mock directly
    return require("../../../__mocks__/SpeechModal").default;
  }
);

describe("ReadTasksButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch to prevent actual network requests
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/voice-assistant")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Mocked assistant response" }] }],
            }),
        });
      } else if (url.includes("/api/getSpeech")) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                audioUrl: "https://example.com/mock-audio.mp3",
              })
            ),
        });
      }

      // Fallback for any other fetch calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("{}"),
      });
    });

    // Set default mock implementation
    useVoice.mockImplementation(() => ({
      selectedVoice: mockSelectedVoice,
    }));
  });

  afterEach(() => {
    // Restore the global fetch
    jest.restoreAllMocks();
  });

  it("renders correctly", () => {
    render(<ReadTasksButton username="John Doe" boardId="123" />);
    expect(
      screen.getByRole("button", { name: /read my tasks/i })
    ).toBeInTheDocument();
  });

  it("shows error if no voice is selected", async () => {
    // Override for this test
    useVoice.mockImplementation(() => ({
      selectedVoice: null,
    }));

    render(<ReadTasksButton username="John Doe" boardId="123" />);
    fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No voice selected", {
        description: "Please select a voice in Board Settings first.",
      });
    });
  });

  it("makes API calls and shows SpeechModal on success", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Test Board", lists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ content: [{ text: "Test response" }] }],
        }),
      })
      .mockResolvedValueOnce({
        text: async () =>
          JSON.stringify([{ link: "http://example.com/audio.mp3" }]),
      });

    render(<ReadTasksButton username="John Doe" boardId="123" />);
    fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(screen.getByTestId("speech-modal")).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it("handles API error from voice-assistant endpoint", async () => {
    // Temporarily silence console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Setup globals first
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Test Board", lists: [] }),
      })
      .mockRejectedValueOnce(new Error("Failed to fetch")); // Simulate error

    render(<ReadTasksButton username="John Doe" boardId="123" />);

    // Need to use act to handle async state updates
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));
    });

    // Need to wait for the toast to be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Could not read tasks", // This should match your component error message
        expect.objectContaining({
          description: expect.any(String),
        })
      );
    });

    // Verify error was logged (but silenced)
    expect(console.error).toHaveBeenCalled();

    // Restore original console.error
    console.error = originalConsoleError;
  });

  it("handles invalid response format from getSpeech API", async () => {
    // Temporarily silence console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Setup mocks correctly
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Test Board", lists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ content: [{ text: "Reading your tasks" }] }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "Invalid JSON", // Invalid response
      });

    render(<ReadTasksButton username="John Doe" boardId="123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));
    });

    // Check for the speech modal instead of text
    await waitFor(() => {
      expect(screen.getByTestId("speech-modal")).toBeInTheDocument();
    });

    // Restore original console.error
    console.error = originalConsoleError;
  });

  it("formats board data correctly with lists and cards", async () => {
    const mockBoardWithContent = {
      title: "Test Board",
      lists: [
        {
          title: "First List",
          cards: [
            {
              title: "Card 1",
              label: "Important",
              description: "Test description",
              dueDate: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoardWithContent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ content: [{ text: "Response" }] }],
        }),
      })
      .mockResolvedValueOnce({
        text: async () =>
          JSON.stringify([{ link: "http://example.com/audio.mp3" }]),
      });

    render(<ReadTasksButton username="John Doe" boardId="123" />);
    fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));

    await waitFor(() => {
      // Check the fetch call contained proper formatted text
      const call = (global.fetch as jest.Mock).mock.calls[1];
      const body = JSON.parse(call[1].body);
      // Verify the request contains formatted task data
      expect(body.messages[0].content).toContain("Test Board");
      expect(body.messages[0].content).toContain("First List");
    });
  });

  it("formats board data correctly when no lists exist", async () => {
    const emptyBoard = {
      title: "Empty board",
      lists: [],
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => emptyBoard,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [{ content: [{ text: "Empty board response" }] }],
        }),
      })
      .mockResolvedValueOnce({
        text: async () =>
          JSON.stringify([{ link: "http://example.com/audio.mp3" }]),
      });

    render(<ReadTasksButton username="John Doe" boardId="123" />);
    fireEvent.click(screen.getByRole("button", { name: /read my tasks/i }));

    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls[1];
      const body = JSON.parse(call[1].body);
      expect(body.messages[0].content).toContain(
        "No tasks found on this board"
      );
    });
  });
});
