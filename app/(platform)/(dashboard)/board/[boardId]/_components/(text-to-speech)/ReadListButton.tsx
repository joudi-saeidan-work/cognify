"use client";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useVoice } from "./VoiceContext";
import SpeechModal from "./SpeechModal";
import { toast } from "sonner";
import { Hint } from "@/components/hint";
import { ListWithCards } from "@/types";

interface ReadListButtonProps {
  username: string;
  listData: ListWithCards;
}

// Function to format list data for speech
function formatListData(list: ListWithCards) {
  if (!list.cards || list.cards.length === 0) {
    return "No tasks found in this list.";
  }

  const cards = list.cards
    .map((card) => {
      const label = card.labelId ? `Label ID: ${card.labelId}` : "No label";
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
}

const ReadListButton = ({ username, listData }: ReadListButtonProps) => {
  const getTextColor = () => {
    if (listData.color) return "text-neutral-800";
    return "text-foreground";
  };
  const [loading, setLoading] = useState(false);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const { selectedVoice } = useVoice();

  const onReadList = async () => {
    if (!selectedVoice) {
      toast.error("No voice selected", {
        description: "Please select a voice in Board Settings first.",
      });
      return;
    }

    try {
      setLoading(true);

      // Format the list content
      const formattedTasks = formatListData(listData);
      const taskText = `Hello ${username}, here are your tasks in the list "${listData.title}":\n\n${formattedTasks}`;

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
      toast.error("Could not read list tasks", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-reduced-motion-disable="true"
      >
        <Button
          onClick={onReadList}
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-full transition-colors bg-transparent hover:bg-transparent hover:${getTextColor()} ${getTextColor()}`}
          disabled={loading}
          aria-label={`Read ${listData.title} tasks aloud`}
          aria-busy={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-3 w-3 text-blue-700"
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
            <Hint description={`Read ${listData.title} tasks`} side="top">
              <span>
                <Volume2 className="h-3 w-3" />
              </span>
            </Hint>
          )}
          <span className="sr-only">Read list tasks</span>
        </Button>
      </motion.div>

      {showSpeechModal && audioUrl && (
        <SpeechModal setShowModel={setShowSpeechModal} url={audioUrl} />
      )}
    </>
  );
};

export default ReadListButton;
