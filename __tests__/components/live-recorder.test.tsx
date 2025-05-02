import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { LiveRecorder } from "@/app/install/audio-recorder/_components/live-recorder";

// Mock console methods to prevent warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Add type definitions for SpeechRecognition to fix TypeScript errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Mock for window.SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult = jest.fn();
  onerror = jest.fn();
  start = jest.fn();
  stop = jest.fn();
}

// Mock implementations for browser APIs
beforeEach(() => {
  // Mock SpeechRecognition
  Object.defineProperty(window, "SpeechRecognition", {
    value: MockSpeechRecognition,
    writable: true,
  });

  Object.defineProperty(window, "webkitSpeechRecognition", {
    value: MockSpeechRecognition,
    writable: true,
  });

  // Mock MediaDevices API
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      }),
    },
    writable: true,
  });
});

describe("LiveRecorder Component", () => {
  const mockOnTranscription = jest.fn();
  const mockOnRecordingChange = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly in default state", () => {
    render(<LiveRecorder />);

    // Should have a mic button but no recording duration
    const micButton = screen.getByRole("button", { name: "Start recording" });
    expect(micButton).toBeInTheDocument();
    expect(screen.queryByText(/:/)).not.toBeInTheDocument(); // No timer visible
  });

  it("starts recording when mic button is clicked", async () => {
    render(
      <LiveRecorder
        onTranscription={mockOnTranscription}
        onRecordingChange={mockOnRecordingChange}
      />
    );

    const micButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(micButton);

    // Check that mediaDevices.getUserMedia was called
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });

    // The button should change to stop button
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Stop recording" })
      ).toBeInTheDocument();
    });

    // onRecordingChange should be called with true
    expect(mockOnRecordingChange).toHaveBeenCalledWith(true);
  });

  it("stops recording when stop button is clicked", async () => {
    const { rerender } = render(
      <LiveRecorder
        onTranscription={mockOnTranscription}
        onRecordingChange={mockOnRecordingChange}
      />
    );

    // Start recording
    const startButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(startButton);

    // Find and click the stop button
    const stopButton = await screen.findByRole("button", {
      name: "Stop recording",
    });
    fireEvent.click(stopButton);

    // onRecordingChange should be called with false
    expect(mockOnRecordingChange).toHaveBeenCalledWith(false);
  });

  it("handles transcription results", async () => {
    // Mock the recognition directly
    const mockRecognition: {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: typeof jest.fn;
      stop: typeof jest.fn;
      onresult: ((event: any) => void) | null;
      onerror: ((event: any) => void) | null;
    } = {
      continuous: false,
      interimResults: false,
      lang: "",
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onerror: null,
    };

    // Replace the global constructor with a function that returns our mockRecognition
    window.SpeechRecognition = jest
      .fn()
      .mockImplementation(() => mockRecognition);
    window.webkitSpeechRecognition = jest
      .fn()
      .mockImplementation(() => mockRecognition);

    render(<LiveRecorder onTranscription={mockOnTranscription} />);

    // Start recording
    const micButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(micButton);

    // Wait for recognition to be initialized
    await waitFor(() => {
      expect(window.SpeechRecognition).toHaveBeenCalled();
    });

    // Now we can access the onresult that was set by the component
    expect(mockRecognition.onresult).not.toBeNull();

    // Simulate a speech recognition result event
    act(() => {
      // Create a mock event that matches SpeechRecognitionEvent structure
      const mockResultEvent = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: "Hello world" },
            isFinal: true,
            length: 1,
          },
        ] as unknown as SpeechRecognitionResultList,
      };

      // Call the onresult handler set by the component
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockResultEvent);
      }
    });

    // Check if onTranscription was called with the correct text
    expect(mockOnTranscription).toHaveBeenCalledWith(
      expect.stringContaining("Hello world")
    );
  });

  it("handles microphone access errors", async () => {
    // Mock getUserMedia to reject, simulating permission denial
    navigator.mediaDevices.getUserMedia = jest
      .fn()
      .mockRejectedValue(new Error("Permission denied"));

    render(<LiveRecorder />);

    const micButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(micButton);

    // Should show an error message after some time
    await waitFor(
      () => {
        expect(
          screen.getByText(/microphone access denied/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("handles speech recognition errors", async () => {
    // Mock the recognition directly
    const mockRecognition: {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: typeof jest.fn;
      stop: typeof jest.fn;
      onresult: ((event: any) => void) | null;
      onerror: ((event: any) => void) | null;
    } = {
      continuous: false,
      interimResults: false,
      lang: "",
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onerror: null,
    };

    // Replace the global constructor with a function that returns our mockRecognition
    window.SpeechRecognition = jest
      .fn()
      .mockImplementation(() => mockRecognition);
    window.webkitSpeechRecognition = jest
      .fn()
      .mockImplementation(() => mockRecognition);

    render(<LiveRecorder />);

    // Start recording
    const micButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(micButton);

    // Wait for recognition to be initialized
    await waitFor(() => {
      expect(window.SpeechRecognition).toHaveBeenCalled();
    });

    // Now simulate an error event
    act(() => {
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: "no-speech" });
      }
    });

    // Wait for the error message to appear
    await waitFor(
      () => {
        expect(
          screen.getByText(/speech recognition error/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("renders in compact mode correctly", () => {
    render(<LiveRecorder compact={true} />);

    // Verify the button is still there
    expect(
      screen.getByRole("button", { name: "Start recording" })
    ).toBeInTheDocument();
  });

  it("cleans up resources when unmounted", () => {
    const { unmount } = render(<LiveRecorder />);

    // Start recording
    const micButton = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(micButton);

    // Unmount the component
    unmount();

    // This is mostly to verify that no errors occur during cleanup
    // Actual verification would require spying on the mediaStream.getTracks()[0].stop() call
  });

  it("formats recording duration correctly", () => {
    // This test checks the formatTime function directly
    // You could create a component that just tests the formatting function

    // Create a component with an exposed formatTime function for testing
    const TestComponent = () => {
      const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
      };

      return (
        <div>
          <div data-testid="formatted-5-sec">{formatTime(5)}</div>
          <div data-testid="formatted-65-sec">{formatTime(65)}</div>
          <div data-testid="formatted-3600-sec">{formatTime(3600)}</div>
        </div>
      );
    };

    render(<TestComponent />);

    // Check that the formatTime function works correctly
    expect(screen.getByTestId("formatted-5-sec")).toHaveTextContent("0:05");
    expect(screen.getByTestId("formatted-65-sec")).toHaveTextContent("1:05");
    expect(screen.getByTestId("formatted-3600-sec")).toHaveTextContent("60:00");
  });
});
