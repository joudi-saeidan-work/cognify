"use client";

import { FormTextarea } from "@/components/form/form-textarea";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  ElementRef,
  forwardRef,
  KeyboardEventHandler,
  useRef,
  useState,
  useEffect,
} from "react";
import { useAction } from "@/hooks/use-actions";
import { createCard } from "@/actions/create-card";
import { useParams } from "next/navigation";
import { useOnClickOutside, useEventListener } from "usehooks-ts";
import { toast } from "sonner";
import { LiveRecorder } from "@/app/audio-recorder/_components/live-recorder";
import { Hint } from "@/components/hint";

interface CardFormProps {
  listId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  isEditing: boolean;
  color: string | null;
}

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(
  ({ listId, color, disableEditing, enableEditing, isEditing }, ref) => {
    const params = useParams();
    const formRef = useRef<ElementRef<"form">>(null);
    const [transcription, setTranscription] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [shouldSubmitOnStop, setShouldSubmitOnStop] = useState(false);
    const [wasRecording, setWasRecording] = useState(false);

    const { execute, isLoading: isCreating } = useAction(createCard, {
      onSuccess: (data) => {
        toast.success(`Card "${data.title}" created `);
        formRef.current?.reset();
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        disableEditing();
      }
    };
    useOnClickOutside(formRef, disableEditing);
    useEventListener("keydown", onKeyDown);

    const onTextareaDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
        disableEditing();
      }
    };

    const onTextareaFocus = () => {
      // If recording, stop it when user focuses on textarea
      if (isRecording) {
        setIsRecording(false);
      }

      // If was recording and now user clicked on textarea, clear the transcription
      if (wasRecording) {
        // Clear transcript only if user manually focuses
        setTranscription("");
        if (ref && "current" in ref && ref.current) {
          ref.current.value = "";
        }
        setWasRecording(false);
      }
    };

    const onSubmit = (formData: FormData) => {
      const title = formData.get("title") as string;
      const listId = formData.get("listId") as string;
      const boardId = params.boardId as string;

      execute({ title, boardId, listId });
    };

    // Effect to handle submission when recording stops
    useEffect(() => {
      // Only trigger when recording stops AND we have transcription AND shouldSubmitOnStop is true
      if (
        !isRecording &&
        transcription.trim().length > 0 &&
        shouldSubmitOnStop
      ) {
        // Small delay to ensure the transcription is fully processed
        const timer = setTimeout(() => {
          if (ref && "current" in ref && ref.current) {
            ref.current.value = transcription.trim();
          }
          formRef.current?.requestSubmit();
          disableEditing();
          // Reset the flag
          setShouldSubmitOnStop(false);
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [isRecording, transcription, shouldSubmitOnStop, disableEditing]);

    // Track when recording state changes
    useEffect(() => {
      if (!isRecording && wasRecording !== true) {
        setWasRecording(true);
      }
    }, [isRecording]);

    const getTextColor = () => {
      // Special case for when recording is active
      if (isRecording) {
        return "text-neutral-900 dark:text-white";
      }

      // For colored cards, determine text color based on background brightness
      if (color && color !== "bg-background") {
        // Helper function to determine if a color is light or dark
        const isLightColor = (hexColor: string) => {
          // If it's a hex color
          if (hexColor.startsWith("#")) {
            const hex = hexColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16) || 0;
            const g = parseInt(hex.substring(2, 4), 16) || 0;
            const b = parseInt(hex.substring(4, 6), 16) || 0;

            // Calculate perceived brightness (weighted RGB values)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128;
          }

          // For named colors or RGB/HSL values, we'll use a simple mapping
          // of known light colors used in the app
          const lightColors = ["#F28D8D", "#9F9F9F", "#FFD700", "#FFEC8B"];
          return lightColors.some(
            (lc) =>
              color.includes(lc) ||
              (color.toLowerCase &&
                color.toLowerCase().includes(lc.toLowerCase()))
          );
        };

        // Use dark text on light backgrounds, light text on dark backgrounds
        return isLightColor(color) ? "text-neutral-900" : "text-white";
      }

      // For non-colored cards, use Tailwind's dark mode
      return "text-neutral-800 dark:text-gray-200";
    };

    // Get recording background color using Tailwind's dark mode
    const getRecordingBackground = () => {
      return "bg-red-50 dark:bg-red-900/20";
    };

    // Get the textarea background color
    const getTextareaBackground = () => {
      // If color was provided, use that
      if (color && color !== "bg-background") {
        return { backgroundColor: color };
      }

      // if editing with no color, use the list background color
      if (isEditing) {
        return {
          backgroundColor: "var(--list-bg-color)",
        };
      }
    };

    const handleTranscriptionUpdate = (text: string) => {
      setTranscription(text);
      if (ref && "current" in ref && ref.current) {
        ref.current.value = text;
      }

      // If we have valid transcription, set flag to submit when recording stops
      if (text.trim().length > 0) {
        setShouldSubmitOnStop(true);
      }
    };

    const handleRecordingStateChange = (recording: boolean) => {
      setIsRecording(recording);

      // When recording starts, make sure the textarea shows transcription
      if (recording && ref && "current" in ref && ref.current) {
        ref.current.value = transcription;
        ref.current.readOnly = true; // Disable typing while recording
      } else if (!recording && ref && "current" in ref && ref.current) {
        ref.current.readOnly = false; // Enable typing when not recording
      }
    };

    if (isEditing) {
      return (
        <form className="m-1 py-0.5 space-y-4" action={onSubmit} ref={formRef}>
          <div className={`relative ${isRecording ? "recording-active" : ""}`}>
            <FormTextarea
              color={color}
              id="title"
              onKeyDown={onTextareaDown}
              onFocus={onTextareaFocus}
              ref={ref}
              placeholder={
                isRecording ? "Listening..." : "Write anything or speak..."
              }
              className={`resize-none relative flex flex-col justify-between border-none hover:border-black/20 py-2 px-3 pb-10 text-sm rounded-md shadow-none w-full ${getTextColor()} ${
                isRecording ? getRecordingBackground() : ""
              }`}
              readOnly={isRecording}
            />
            <div className="absolute right-2 bottom-2 flex items-center">
              <LiveRecorder
                onTranscription={handleTranscriptionUpdate}
                onRecordingChange={handleRecordingStateChange}
                compact={true}
              />
            </div>
          </div>
          <input hidden id="listId" name="listId" value={listId} readOnly />
        </form>
      );
    }

    return (
      <div className="pt-2 px-2 ">
        <Button
          className={`whitespace-pre-wrap h-auto px-2 py-1.5 w-full justify-start text-sm ${getTextColor()} hover:${getTextColor()} hover:bg-transparent`}
          style={getTextareaBackground()}
          size="sm"
          variant="ghost"
          onClick={enableEditing}
          disabled={isCreating}
          aria-label="Add Card"
        >
          {
            <>
              <Plus className="h-4 w-4" />
              write anything or speak
            </>
          }
        </Button>
      </div>
    );
  }
);

CardForm.displayName = "CardForm";
