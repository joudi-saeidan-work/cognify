"use client";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useVoice } from "./VoiceContext";
import SpeechModal from "./SpeechModal";
import { toast } from "sonner";
import { Hint } from "@/components/hint";

interface ReadTasksButtonProps {
  username: string;
  boardId: string;
}

// Shared function to format board data - same as in WelcomeModal
function formatCurrentBoard(board: any) {
  if (!board.lists || board.lists.length === 0) {
    return "No tasks found on this board.";
  }

  const lists = board.lists
    .map((list: any) => {
      const cards = list.cards
        .map((card: any) => {
          const label = card.label ? `Label: ${card.label}` : "No label";
          const description = card.description
            ? `Description: ${card.description}`
            : "No description";
          const dueDate = card.dueDate
            ? `Due Date: ${new Date(card.dueDate).toLocaleDateString()}`
            : "No due date";
          return `- ${card.title}\n  ${label}\n  ${description}\n  ${dueDate}`;
        })
        .join("\n");
      return `List: ${list.title}\n${cards}`;
    })
    .join("\n\n");
  return lists;
}

const ReadTasksButton = ({ username, boardId }: ReadTasksButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const { selectedVoice } = useVoice();

  const onReadTask = async () => {
    if (!selectedVoice) {
      toast.error("No voice selected", {
        description: "Please select a voice in Board Settings first.",
      });
      return;
    }

    try {
      setLoading(true);

      // Fetch the current board content
      const boardResponse = await fetch(`/api/boards/${boardId}/content`);
      const board = await boardResponse.json();

      // Format the board content
      const formattedTasks = formatCurrentBoard(board);
      const taskText = `Hello ${username}, here are your tasks on ${board.title}:\n\n${formattedTasks}`;

      // Get AI assistant response
      const assistantResponse = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: taskText }],
        }),
      });

      if (!assistantResponse.ok) {
        throw new Error("Failed to fetch assistant response");
      }

      const assistantData = await assistantResponse.json();
      const content = assistantData.messages[0].content[0].text || "";

      if (!content.trim()) {
        throw new Error("AI assistant did not return a valid response");
      }

      // Generate speech
      const voiceForAPI = {
        id: selectedVoice.id,
        voice_id: selectedVoice.voice_id,
        gender: selectedVoice.gender,
        language_code: selectedVoice.language_code,
        language: selectedVoice.language,
        country: selectedVoice.country,
        name: selectedVoice.name,
        type: selectedVoice.type,
      };

      const response = await fetch("/api/getSpeech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          voice: voiceForAPI,
        }),
      });

      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        if (data && Array.isArray(data) && data.length > 0 && data[0]?.link) {
          setAudioUrl(data[0].link);
          setShowSpeechModal(true);
        } else if (data && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setShowSpeechModal(true);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (parseError) {
        // Fallback for parse errors
        const fallbackUrl =
          "https://s3.us-east-1.amazonaws.com/invideo-uploads-us-east-1/speechfr-FR-Neural2-A17416860464130.mp3";
        setAudioUrl(fallbackUrl);
        setShowSpeechModal(true);
      }
    } catch (error) {
      console.error("Speech generation error:", error);
      toast.error("Could not read tasks", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={onReadTask}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-transparent transition-colors relative overflow-hidden"
          disabled={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-4 w-4 text-blue-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <Hint description="Read my tasks">
              <span>
                <Volume2 className="h-4 w-4 " />
              </span>
            </Hint>
          )}
          <span className="sr-only">Read my tasks</span>
        </Button>
      </motion.div>

      {showSpeechModal && audioUrl && (
        <SpeechModal setShowModel={setShowSpeechModal} url={audioUrl} />
      )}
    </>
  );
};

export default ReadTasksButton;
