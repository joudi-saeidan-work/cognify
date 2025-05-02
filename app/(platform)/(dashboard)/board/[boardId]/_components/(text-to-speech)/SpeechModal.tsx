"use client";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useVoice } from "./VoiceContext";

interface SpeechModalProps {
  setShowModel: (value: boolean) => void;
  url: string;
}

const SpeechModal = ({ setShowModel, url }: SpeechModalProps) => {
  const { selectedVoice } = useVoice();
  const [open, setOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Auto-play the audio when modal opens
    const audioElement = audioRef.current;
    if (audioElement) {
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Auto-play was prevented:", error);
            setIsPlaying(false);
          });
      }
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setShowModel(false);
    }, 300); // Wait for animation to complete
  };

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    setProgress(audioElement.currentTime);
    setDuration(audioElement.duration);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    const newTime = parseFloat(e.target.value);
    audioElement.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 overflow-hidden bg-white dark:bg-gray-900 border-0 rounded-xl shadow-xl max-w-sm w-full"
        aria-describedby="speech-modal-description"
      >
        <p id="speech-modal-description" className="sr-only">
          Playing tasks for today.
        </p>
        <DialogTitle className="sr-only">Playing Tasks</DialogTitle>
        <div className="relative p-6 space-y-5" id="speech-modal-description">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
            data-reduced-motion-disable="true"
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 dark:from-blue-600 dark:to-indigo-800">
              <Volume2 className="h-12 w-12 text-white" />
            </div>
          </motion.div>

          <div className="text-center space-y-1">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
              Playing Your Tasks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sit back while I read your tasks for today
            </p>
            {selectedVoice && (
              <div className="mt-2 inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {selectedVoice.name} ({selectedVoice.gender},{" "}
                  {selectedVoice.language})
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              ></div>

              <input
                type="range"
                min="0"
                max={duration || 100}
                value={progress}
                onChange={handleProgressChange}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Audio progress"
                aria-valuemin={0}
                aria-valuemax={duration || 100}
                aria-valuenow={progress}
                aria-valuetext={`${formatTime(progress)} of ${formatTime(
                  duration
                )}`}
              />

              <div
                className="absolute h-3 w-3 bg-white border-2 border-blue-500 dark:border-blue-400 rounded-full top-[-3px] shadow-md"
                style={{
                  left: `calc(${(progress / (duration || 1)) * 100}% - 4px)`,
                  display: duration > 0 ? "block" : "none",
                }}
              ></div>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              <button
                data-testid="volume-button"
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                aria-pressed={isMuted}
              >
                {isMuted ? (
                  <VolumeX
                    className="h-5 w-5 text-gray-600 dark:text-gray-300"
                    aria-hidden="true"
                  />
                ) : (
                  <Volume2
                    className="h-5 w-5 text-gray-600 dark:text-gray-300"
                    aria-hidden="true"
                  />
                )}
              </button>
              <button
                data-testid="play-pause-button"
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Play className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
              <div className="w-9"></div> {/* Placeholder for balance */}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30">
          <Button
            data-testid="close-button"
            onClick={handleClose}
            variant="outline"
            className="w-full border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            Close
          </Button>
        </div>

        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
          aria-label="Audio Player"
        />
      </DialogContent>
    </Dialog>
  );
};

export default SpeechModal;
