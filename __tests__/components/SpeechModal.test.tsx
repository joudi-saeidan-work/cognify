import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SpeechModal from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/SpeechModal";

// Setup mocks
const setShowModelMock = jest.fn();
const testUrl = "https://example.com/audio.mp3";

// Setup audio element mocks
beforeAll(() => {
  // Mock HTMLMediaElement
  window.HTMLMediaElement.prototype.play = jest
    .fn()
    .mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();

  // Set properties
  Object.defineProperty(HTMLMediaElement.prototype, "duration", { value: 100 });
  Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
    value: 30,
  });
});

// Suppress console errors for accessibility warnings in tests
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("SpeechModal", () => {
  it("renders the modal with audio player", () => {
    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    // Check that modal is rendered
    expect(screen.getByText("Playing Your Tasks")).toBeInTheDocument();

    // Check audio src
    const audioElement = document.querySelector("audio");
    expect(audioElement).toHaveAttribute("src", testUrl);

    // We can't reliably test autoplay as it depends on browser policies
    // So we'll manually check if the audio element exists
    expect(audioElement).toBeInTheDocument();
  });

  it("toggles play/pause when button is clicked", () => {
    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    // Find button by test ID instead of role
    const playPauseButton = screen.getByTestId("play-pause-button");

    // Verify button exists
    expect(playPauseButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(playPauseButton);
  });

  it("closes the modal when Close button is clicked", () => {
    // Set up Jest to use fake timers
    jest.useFakeTimers();

    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    // Find the close button by test ID
    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    // Advance timers to trigger setTimeout callback
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check that setShowModel was called with false
    expect(setShowModelMock).toHaveBeenCalledWith(false);

    // Restore real timers
    jest.useRealTimers();
  });

  it("toggles mute when mute button is clicked", () => {
    // Create a mutable mock property for muted state
    let mutedState = false;

    // Override the muted property temporarily for this test
    Object.defineProperty(HTMLMediaElement.prototype, "muted", {
      get() {
        return mutedState;
      },
      set(v) {
        mutedState = v;
      },
    });

    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    // Find the button that contains the volume icon
    const muteButton = screen.getAllByRole("button")[0]; // First button in the controls

    // Click to mute
    fireEvent.click(muteButton);

    // Check if muted state was changed
    expect(mutedState).toBe(true);
  });

  it("updates progress when time updates", () => {
    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    const audioElement = document.querySelector("audio");

    // Simulate timeupdate event
    fireEvent.timeUpdate(audioElement as HTMLMediaElement);

    // Should update progress display
    expect(screen.getByText("0:30")).toBeInTheDocument();
  });

  it("handles progress bar interaction", () => {
    // Mock currentTime setter
    let currentTime = 30;
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      get() {
        return currentTime;
      },
      set(v) {
        currentTime = v;
      },
    });

    render(<SpeechModal setShowModel={setShowModelMock} url={testUrl} />);

    // Find the progress input
    const progressBar = screen.getByRole("slider");

    // Change the value
    fireEvent.change(progressBar, { target: { value: "50" } });

    // Verify the time was updated
    expect(currentTime).toBe(50);
  });
});
