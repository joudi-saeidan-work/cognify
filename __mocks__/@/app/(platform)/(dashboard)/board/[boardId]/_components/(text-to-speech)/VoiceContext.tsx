import React, { ReactNode } from "react";

export const useVoice = jest.fn().mockReturnValue({
  selectedVoice: {
    id: 1,
    voice_id: "en-AU-Neural2-C",
    name: "Test Voice",
    gender: "Female",
    language_code: "en-US",
    language: "English",
    country: "US",
    type: "neural",
  },
  setSelectedVoice: jest.fn(),
  voices: [],
});

export const VoiceProvider = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
);
