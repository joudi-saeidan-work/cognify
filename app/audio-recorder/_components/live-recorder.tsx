"use client";
import React, { useState, useRef, useEffect } from "react";
import { Mic, StopCircle } from "lucide-react";

interface LiveRecorderProps {
  onTranscription?: (text: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const LiveRecorder = ({
  onTranscription,
  onRecordingChange,
  onClose,
  compact = false,
}: LiveRecorderProps) => {
  const [transcription, setTranscription] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscription = finalTranscript + interimTranscript;
        setTranscription(currentTranscription);

        if (onTranscription) {
          onTranscription(currentTranscription);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        stopRecording();
      };

      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition not supported in this browser");
    }

    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Notify parent component about recording state changes
  useEffect(() => {
    if (onRecordingChange) {
      onRecordingChange(isRecording);
    }
  }, [isRecording, onRecordingChange]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      try {
        setError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMediaStream(stream);
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscription(""); // Clear previous transcription
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setError("Microphone access denied or not available");
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      setIsRecording(false);

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 pl-1 pr-1">
      <button
        className={`flex items-center justify-center h-6 w-6 rounded-full focus:outline-none transition-all duration-200 ${
          isRecording
            ? "bg-red-400/90 text-white hover:bg-red-500/90 shadow-sm"
            : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-500"
        }`}
        onClick={isRecording ? stopRecording : startRecording}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isRecording ? (
          <StopCircle className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </button>

      {isRecording && (
        <span className="text-xs font-medium text-slate-400 tracking-wide animate-pulse">
          {formatTime(recordingDuration)}
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
};

export default LiveRecorder;
