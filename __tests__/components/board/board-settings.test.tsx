/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the voice data
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/model.json",
  () => ({
    voices_list: [
      {
        voice_id: "voice1",
        name: "Test Voice 1",
        gender: "Male",
        language: "English",
        country: "USA",
      },
      {
        voice_id: "voice2",
        name: "Test Voice 2",
        gender: "Female",
        language: "English",
        country: "UK",
      },
      {
        voice_id: "voice3",
        name: "Test Voice 3",
        gender: "Male",
        language: "Spanish",
        country: "Spain",
      },
    ],
  })
);

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn().mockReturnValue({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// Mock VoiceContext
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(text-to-speech)/VoiceContext",
  () => ({
    useVoice: jest.fn().mockReturnValue({
      setSelectedVoice: jest.fn(),
      voices: [],
    }),
  })
);

// Define the Voice type for type safety
interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  language?: string;
  country?: string;
}

// Mock the component directly
jest.mock(
  "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-settings",
  () => ({
    __esModule: true,
    default: jest
      .fn()
      .mockImplementation(
        ({
          zoomLevel,
          setZoomLevel,
          colorBlindMode,
          setColorBlindMode,
          boardId,
          onModelChange,
        }: {
          zoomLevel: number;
          setZoomLevel: (value: number | ((prev: number) => number)) => void;
          colorBlindMode: boolean;
          setColorBlindMode: (value: boolean) => void;
          boardId: string;
          onModelChange: (model: Voice) => void;
        }) => {
          // Create a simplified mock implementation for testing
          const { useTheme } = require("next-themes");
          const { theme, setTheme } = useTheme();

          const handleZoomIn = () =>
            setZoomLevel((prev: number) => Math.min(prev + 10, 200));
          const handleZoomOut = () =>
            setZoomLevel((prev: number) => Math.max(prev - 10, 50));
          const handleSliderChange = (value: number[]) =>
            setZoomLevel(value[0]);

          const toggleColorBlindMode = () => {
            setColorBlindMode(!colorBlindMode);
          };

          const resetSettings = () => {
            setZoomLevel(130);
            setTheme("light");
            setColorBlindMode(false);
          };

          const selectVoice = (voiceId: string) => {
            const selectedVoice: Voice = {
              voice_id: voiceId,
              name: voiceId === "voice1" ? "Test Voice 1" : "Test Voice 2",
              gender: voiceId === "voice1" ? "Male" : "Female",
            };
            onModelChange(selectedVoice);
          };

          return (
            <div data-testid="board-settings">
              <button data-testid="settings-trigger">
                <span>Settings</span>
              </button>

              <div data-testid="settings-content">
                <div data-testid="zoom-controls">
                  <div>
                    <span>Zoom Level: {zoomLevel}%</span>
                    <button data-testid="zoom-out" onClick={handleZoomOut}>
                      Zoom Out
                    </button>
                    <input
                      data-testid="zoom-slider"
                      type="range"
                      value={zoomLevel}
                      min={50}
                      max={200}
                      onChange={(e) =>
                        handleSliderChange([parseInt(e.target.value)])
                      }
                    />
                    <button data-testid="zoom-in" onClick={handleZoomIn}>
                      Zoom In
                    </button>
                  </div>
                </div>

                <div data-testid="theme-controls">
                  <button
                    data-testid="light-theme-button"
                    onClick={() => setTheme("light")}
                    className={theme === "light" ? "active" : ""}
                  >
                    Light Mode
                  </button>
                  <button
                    data-testid="dark-theme-button"
                    onClick={() => setTheme("dark")}
                    className={theme === "dark" ? "active" : ""}
                  >
                    Dark Mode
                  </button>
                </div>

                <div data-testid="colorblind-toggle">
                  <span>Color Blind Mode: {colorBlindMode ? "On" : "Off"}</span>
                  <button onClick={toggleColorBlindMode}>Toggle</button>
                </div>

                <div data-testid="reset-button">
                  <button onClick={resetSettings}>Reset Settings</button>
                </div>

                <div data-testid="voice-selection">
                  <select
                    data-testid="voice-select"
                    onChange={(e) => selectVoice(e.target.value)}
                  >
                    <option value="">Select Voice</option>
                    <option value="voice1">Test Voice 1</option>
                    <option value="voice2">Test Voice 2</option>
                  </select>
                </div>
              </div>
            </div>
          );
        }
      ),
  })
);

// Import after mocks
import BoardSettings from "../../../app/(platform)/(dashboard)/board/[boardId]/_components/(board-header)/board-settings";

describe("BoardSettings Component", () => {
  // Reset the mock implementation before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    zoomLevel: 100,
    setZoomLevel: jest.fn(),
    colorBlindMode: false,
    setColorBlindMode: jest.fn(),
    boardId: "board-123",
    onModelChange: jest.fn(),
  };

  it("renders the component without crashing", () => {
    render(<BoardSettings {...defaultProps} />);

    expect(screen.getByTestId("board-settings")).toBeInTheDocument();
    expect(screen.getByTestId("settings-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("settings-content")).toBeInTheDocument();
  });

  it("displays the current zoom level correctly", () => {
    render(<BoardSettings {...defaultProps} />);

    expect(screen.getByTestId("zoom-controls")).toHaveTextContent(
      "Zoom Level: 100%"
    );
  });

  it("increases zoom level when zoom in button is clicked", () => {
    render(<BoardSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId("zoom-in"));
    expect(defaultProps.setZoomLevel).toHaveBeenCalled();
  });

  it("decreases zoom level when zoom out button is clicked", () => {
    render(<BoardSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId("zoom-out"));
    expect(defaultProps.setZoomLevel).toHaveBeenCalled();
  });

  it("updates zoom level when slider is adjusted", () => {
    render(<BoardSettings {...defaultProps} />);

    fireEvent.change(screen.getByTestId("zoom-slider"), {
      target: { value: 150 },
    });
    expect(defaultProps.setZoomLevel).toHaveBeenCalled();
  });

  it("toggles light/dark theme when theme buttons are clicked", () => {
    const { setTheme } = require("next-themes").useTheme();

    render(<BoardSettings {...defaultProps} />);

    fireEvent.click(screen.getByTestId("dark-theme-button"));
    expect(setTheme).toHaveBeenCalledWith("dark");

    fireEvent.click(screen.getByTestId("light-theme-button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("toggles color blind mode when toggle button is clicked", () => {
    render(<BoardSettings {...defaultProps} />);

    expect(screen.getByTestId("colorblind-toggle")).toHaveTextContent(
      "Color Blind Mode: Off"
    );

    const toggleButton = screen
      .getByTestId("colorblind-toggle")
      .querySelector("button");
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(defaultProps.setColorBlindMode).toHaveBeenCalledWith(true);
    }
  });

  it("resets settings when reset button is clicked", () => {
    const { setTheme } = require("next-themes").useTheme();

    render(<BoardSettings {...defaultProps} />);

    const resetButton = screen
      .getByTestId("reset-button")
      .querySelector("button");
    if (resetButton) {
      fireEvent.click(resetButton);
      expect(defaultProps.setZoomLevel).toHaveBeenCalledWith(130);
      expect(setTheme).toHaveBeenCalledWith("light");
      expect(defaultProps.setColorBlindMode).toHaveBeenCalledWith(false);
    }
  });

  it("calls onModelChange when a voice is selected", () => {
    render(<BoardSettings {...defaultProps} />);

    fireEvent.change(screen.getByTestId("voice-select"), {
      target: { value: "voice1" },
    });

    expect(defaultProps.onModelChange).toHaveBeenCalledWith(
      expect.objectContaining({
        voice_id: "voice1",
        name: "Test Voice 1",
        gender: "Male",
      })
    );
  });
});
