import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  VoiceProvider,
  useVoice,
  type Voice,
} from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext";

// Mock the voice data instead of importing the actual model.json
jest.mock(
  "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/model.json",
  () => ({
    voices_list: [
      {
        id: 1001,
        voice_id: "en-AU-Neural2-C", // Default voice in the component
        gender: "Female",
        language_code: "en-AU",
        language: "English",
        country: "Australia",
        name: "Olivia",
        sample_text:
          "Hello, I hope you are having a great time creating your video.",
        sample_audio_url: "https://example.com/sample1.mp3",
        status: 2,
        rank: 0,
        type: "google_tts",
      },
      {
        id: 1002,
        voice_id: "en-US-Neural2-A",
        gender: "Male",
        language_code: "en-US",
        language: "English",
        country: "United States",
        name: "Michael",
        sample_text:
          "Hello, I hope you are having a great time creating your video.",
        sample_audio_url: "https://example.com/sample2.mp3",
        status: 2,
        rank: 0,
        type: "google_tts",
      },
    ],
  })
);

// Mock console methods to prevent warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Helper components for testing
const TestComponent = () => {
  const { selectedVoice, voices } = useVoice();
  return (
    <div>
      <div data-testid="selected-voice-id">
        {selectedVoice ? selectedVoice.voice_id : "No voice selected"}
      </div>
      <div data-testid="voices-count">{voices.length}</div>
    </div>
  );
};

const TestSetterComponent = () => {
  const { selectedVoice, setSelectedVoice, voices } = useVoice();

  const selectSecondVoice = () => {
    if (voices.length > 1) {
      setSelectedVoice(voices[1]);
    }
  };

  return (
    <div>
      <div data-testid="selected-voice-id">
        {selectedVoice ? selectedVoice.voice_id : "No voice selected"}
      </div>
      <button data-testid="change-voice" onClick={selectSecondVoice}>
        Change Voice
      </button>
    </div>
  );
};

describe("VoiceContext", () => {
  // Clear the document before each test to avoid element conflicts
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders children correctly", () => {
    render(
      <VoiceProvider>
        <div data-testid="child-component">Child component</div>
      </VoiceProvider>
    );

    expect(screen.getByTestId("child-component")).toBeInTheDocument();
  });

  it("sets default voice on mount", async () => {
    await act(async () => {
      render(
        <VoiceProvider>
          <TestComponent />
        </VoiceProvider>
      );
    });

    expect(screen.getByTestId("selected-voice-id")).toHaveTextContent(
      "en-AU-Neural2-C"
    );
  });

  it("loads voice list correctly", async () => {
    await act(async () => {
      render(
        <VoiceProvider>
          <TestComponent />
        </VoiceProvider>
      );
    });

    expect(screen.getByTestId("voices-count")).toHaveTextContent("2");
  });

  it("allows changing the selected voice", async () => {
    await act(async () => {
      render(
        <VoiceProvider>
          <TestSetterComponent />
        </VoiceProvider>
      );
    });

    // Check initial voice
    expect(screen.getByTestId("selected-voice-id")).toHaveTextContent(
      "en-AU-Neural2-C"
    );

    // Change the voice
    act(() => {
      screen.getByTestId("change-voice").click();
    });

    // Check updated voice
    expect(screen.getByTestId("selected-voice-id")).toHaveTextContent(
      "en-US-Neural2-A"
    );
  });

  it("verifies context default exports", () => {
    // Test the context shape through TypeScript types and existence
    const {
      useVoice,
      VoiceProvider,
    } = require("@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext");

    // Verify the provider component exists
    expect(typeof VoiceProvider).toBe("function");

    // Verify the hook exists
    expect(typeof useVoice).toBe("function");
  });

  it("initializes selectedVoice and voices when provider mounts", async () => {
    const ProviderTester = () => {
      const { selectedVoice, voices } = useVoice();
      return (
        <div>
          <div data-testid="provider-voice">
            {selectedVoice ? selectedVoice.voice_id : "none"}
          </div>
          <div data-testid="provider-voices-length">{voices.length}</div>
        </div>
      );
    };

    await act(async () => {
      render(
        <VoiceProvider>
          <ProviderTester />
        </VoiceProvider>
      );
    });

    expect(screen.getByTestId("provider-voice")).toHaveTextContent(
      "en-AU-Neural2-C"
    );
    expect(screen.getByTestId("provider-voices-length")).toHaveTextContent("2");
  });
});
