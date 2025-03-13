import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ReadListButton from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/ReadListButton";
import { VoiceProvider } from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";
import { toast } from "sonner";
import React, { ReactNode } from "react";
import { useVoice } from "../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";

// Mock dependencies
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the VoiceContext at the module level (not inside a test)
jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext",
  () => {
    const useVoiceMock = jest.fn();
    return {
      useVoice: useVoiceMock,
      VoiceProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    };
  }
);

// Mock fetch
global.fetch = jest.fn();

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

    // Suppress console warnings
    jest.spyOn(console, "warn").mockImplementation(() => {});

    // Setup successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/voice-assistant") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              messages: [{ content: [{ text: "Reading your tasks" }] }],
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
      return Promise.reject(new Error("Unknown URL"));
    });
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
  });

  it("processes list data and displays speech modal on success", async () => {
    render(
      <VoiceProvider>
        <ReadListButton username="TestUser" listData={mockListData} />
      </VoiceProvider>
    );

    // Wrap all state changes in act
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Wait for API calls and modal to appear
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/voice-assistant",
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Playing Your Tasks")).toBeInTheDocument();
    });
  });

  it("uses default voice when user hasn't selected one", async () => {
    // Create a mock implementation that matches your actual code
    const mockVoiceData = {
      voices_list: [
        {
          id: 1,
          voice_id: "en-AU-Neural2-C", // This is your default voice
          name: "Default Test Voice",
          gender: "Female",
          language_code: "en-US",
          language: "English",
          country: "US",
          type: "neural",
        },
      ],
    };

    // Mock the voice data import
    jest.mock(
      "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/model.json",
      () => mockVoiceData,
      { virtual: true }
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
});

test.todo("should allow selecting different voices");
test.todo("should persist voice preferences");
