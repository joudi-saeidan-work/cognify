"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Upload,
  Loader2,
  StopCircle,
  Volume2,
  FileAudio,
} from "lucide-react";

import TranscribeResult from "./transcriptionResult";
import { useHasBrowser } from "@/hooks/useHasBrowser";

const AudioUploader = () => {
  // Browser detection
  const hasBrowser = useHasBrowser();

  //States
  const [file, setFile] = useState<File | null>(null);
  const [audioURl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  // manages speech recognition instance
  const recognitionRef = useRef<any>(null);

  // Check for spech recognition support using webspeech api so that it captures ongoing speech and give real time transcription
  useEffect(() => {
    const speechSupported =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setIsSpeechSupported(speechSupported);
  }, [hasBrowser]);

  // Initialise speech recognition
  useEffect(() => {
    if (!hasBrowser) return;

    // attach event handlers to manage transcription process
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.internResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + "";
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscription(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasBrowser]);
  // ToDo - file handling functions

  // live audio recording
  const handleStartRecording = async () => {
    // uses the media api to request access to the users microphone
    if (recognitionRef.current && !isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMediaStream(stream);
        // start speech regonition process
        recognitionRef.current.start();
        // starts recording users speech
        setIsRecording(true);
        // clear any previous transcriptions
        setTranscription("");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setError("Microphone access denied or not available");
      }
    }
  };
  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      // stops speech recognition process
      recognitionRef.current.stop();
      setIsRecording(false);

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    }
  };
};
