"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import voiceData from "./model.json";

export type Voice = {
  id: number;
  voice_id: string;
  gender: string;
  language_code: string;
  language: string;
  country: string;
  name: string;
  sample_text: string;
  sample_audio_url: string;
  status: number;
  rank: number;
  type: string;
};

interface VoiceContextType {
  selectedVoice: Voice | null;
  setSelectedVoice: (voice: Voice | null) => void;
  voices: Voice[];
}

const VoiceContext = createContext<VoiceContextType>({
  selectedVoice: null,
  setSelectedVoice: () => {},
  voices: [],
});

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    // Set default voice
    const defaultVoice = voiceData.voices_list.find(
      (v) => v.voice_id === "en-AU-Neural2-C"
    );
    setSelectedVoice(defaultVoice || null);
    setVoices(voiceData.voices_list);
  }, []);

  return (
    <VoiceContext.Provider value={{ selectedVoice, setSelectedVoice, voices }}>
      {children}
    </VoiceContext.Provider>
  );
};
