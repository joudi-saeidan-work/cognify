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
  saveVoiceSelection: (voice: Voice) => void;
}

const STORAGE_KEY = "selectedVoice";

const VoiceContext = createContext<VoiceContextType>({
  selectedVoice: null,
  setSelectedVoice: () => {},
  voices: [],
  saveVoiceSelection: () => {},
});

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);

  // Load voices from data file
  useEffect(() => {
    setVoices(voiceData.voices_list);
  }, []);

  // Load initial voice from localStorage on first render
  useEffect(() => {
    try {
      const savedVoice = localStorage.getItem(STORAGE_KEY);

      if (savedVoice) {
        const parsedVoice = JSON.parse(savedVoice);
        setSelectedVoice(parsedVoice);
      } else {
        // Set default voice if nothing in localStorage
        const defaultVoice = voiceData.voices_list.find(
          (v) => v.voice_id === "en-AU-Neural2-C"
        );
        setSelectedVoice(defaultVoice || null);

        // Save default to localStorage if it exists
        if (defaultVoice) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultVoice));
        }
      }
    } catch (error) {
      console.error("Error loading voice from localStorage:", error);
      // Fall back to default voice on error
      const defaultVoice = voiceData.voices_list.find(
        (v) => v.voice_id === "en-AU-Neural2-C"
      );
      setSelectedVoice(defaultVoice || null);
    }
  }, []);

  // Function to update voice and persist to localStorage
  const saveVoiceSelection = (voice: Voice) => {
    setSelectedVoice(voice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voice));
  };

  return (
    <VoiceContext.Provider
      value={{
        selectedVoice,
        setSelectedVoice,
        voices,
        saveVoiceSelection,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};
