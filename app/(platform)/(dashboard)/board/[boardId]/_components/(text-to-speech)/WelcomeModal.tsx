import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useVoice } from "./VoiceContext";
import SpeechModal from "./SpeechModal";
import { motion } from "framer-motion";
import { Sparkles, Flame } from "lucide-react";
import { Board as PrismaBoard } from "@prisma/client";

interface WelcomeModalProps {
  username: string;
  boardId: string;
}

// Extended interface for boards with lists and cards
interface ExtendedBoard extends PrismaBoard {
  lists: {
    title: string;
    cards: {
      title: string;
      label?: string;
      description?: string;
      dueDate?: string;
    }[];
  }[];
}

const motivationalQuotes = [
  {
    quote:
      "Stay hard! When you think you're done, you're only at 40% of your capacity.",
    author: "David Goggins",
  },
  {
    quote: "Don't stop when you're tired. Stop when you're done.",
    author: "David Goggins",
  },
  {
    quote:
      "The most important conversations you'll ever have are the ones you'll have with yourself.",
    author: "David Goggins",
  },
  {
    quote: "It's not about having time, it's about making time. No excuses.",
    author: "Jocko Willink",
  },
  {
    quote: "The obstacle is the way. Turn barriers into launching pads.",
    author: "Ryan Holiday",
  },
  {
    quote: "Your mind is the battlefield. Win there first.",
    author: "Discipline",
  },
  {
    quote:
      "Comfort is the enemy of achievement. Get comfortable being uncomfortable.",
    author: "Growth Mindset",
  },
  {
    quote:
      "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    quote:
      "Small daily improvements are the key to staggering long-term results.",
    author: "Consistency",
  },
  {
    quote: "The pain you feel today will be the strength you feel tomorrow.",
    author: "Resilience",
  },
];

const WelcomeModal = ({ username, boardId }: WelcomeModalProps) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingTasks, setFetchingTasks] = useState(true);
  const [message, setMessage] = useState("");
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const { selectedVoice } = useVoice();
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  const [taskText, setTaskText] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Function to trigger a refresh of the board content
  const refreshBoardContent = () => {
    setLastRefresh(Date.now());
  };

  // Subscribe to board updates
  useEffect(() => {
    // Event listener for card updates
    const handleCardUpdate = () => {
      console.log("Card updated, refreshing board content...");
      refreshBoardContent();
    };

    // Event listener for list updates
    const handleListUpdate = () => {
      console.log("List updated, refreshing board content...");
      refreshBoardContent();
    };

    // Add event listeners
    window.addEventListener("card:update", handleCardUpdate);
    window.addEventListener("list:update", handleListUpdate);
    window.addEventListener("card:create", handleCardUpdate);
    window.addEventListener("card:delete", handleCardUpdate);
    window.addEventListener("list:create", handleListUpdate);
    window.addEventListener("list:delete", handleListUpdate);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener("card:update", handleCardUpdate);
      window.removeEventListener("list:update", handleListUpdate);
      window.removeEventListener("card:create", handleCardUpdate);
      window.removeEventListener("card:delete", handleCardUpdate);
      window.removeEventListener("list:create", handleListUpdate);
      window.removeEventListener("list:delete", handleListUpdate);
    };
  }, []);

  function formatCurrentBoard(board: ExtendedBoard) {
    if (!board.lists || board.lists.length === 0) {
      return "No tasks found on this board.";
    }

    const lists = board.lists
      .map((list) => {
        const cards = list.cards
          .map((card) => {
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

  useEffect(() => {
    async function fetchBoardContent() {
      setFetchingTasks(true);
      try {
        const response = await fetch(`/api/boards/${boardId}/content`);
        const board = await response.json();

        const formattedTasks = formatCurrentBoard(board);
        setTaskText(
          `Hello ${username}, here are your tasks on ${board.title}:\n\n${formattedTasks}`
        );
        console.log("Task text:", taskText);
      } catch (error) {
        console.error("Error fetching board content:", error);
        setTaskText(
          `Hello ${username}, I'm ready to read your tasks when you create some.`
        );
      } finally {
        setFetchingTasks(false);
      }
    }

    if (boardId) {
      fetchBoardContent();
    }
  }, [boardId, username, lastRefresh]);

  useEffect(() => {
    // Pick a random motivational quote when component mounts
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
  }, []);

  const onReadTask = async () => {
    if (!selectedVoice) {
      setMessage(
        "No voice model selected. Please select a voice in Board Settings."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Ensure taskText is ready before calling the AI assistant
      if (!taskText) {
        console.error("Task text is not ready");
        setMessage("Task text is not ready. Please try again later.");
        return;
      }

      const maxRetries = 5;
      const delay = 1000; // 1 second delay
      let attempts = 0;
      let content = "";

      while (attempts < maxRetries) {
        // Fetch motivational and prioritized response from the AI assistant
        const assistantResponse = await fetch("/api/voice-assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: taskText, // Use the formatted board content
              },
            ],
          }),
        });

        if (!assistantResponse.ok) {
          throw new Error("Failed to fetch assistant response");
        }

        const assistantData = await assistantResponse.json();
        console.log("Assistant response:", assistantData);

        // Assuming the response has a 'content' field that is a string
        content = assistantData.messages[0].content[0].text || ""; // Ensure it's a string

        // Check if the assistant message is non-empty
        if (content.trim()) {
          break; // Exit the loop if we have a valid response
        }

        attempts += 1;
        console.log(
          `Attempt ${attempts}: AI assistant response is empty. Retrying...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      }

      if (!content.trim()) {
        setMessage(
          "AI assistant did not return a valid response. Please try again."
        );
        return;
      }

      setAssistantMessage(content);

      // Now send the AI assistant's response to the voice assistant
      console.log(
        "Starting speech request with voice:",
        selectedVoice.voice_id
      );
      console.log("Reading taskText:", taskText);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: content, // Use the AI assistant's response
          voice: voiceForAPI,
        }),
      });

      const responseText = await response.text();
      console.log("Raw response text:", responseText); // Log the raw response

      if (!response.ok) {
        console.error(
          "API response error:",
          response.status,
          responseText.substring(0, 200)
        );

        if (responseText.includes("<!DOCTYPE html>")) {
          throw new Error("Received HTML response instead of JSON");
        }

        throw new Error(`API error: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText);
        console.log("Speech API response:", data);

        if (data && Array.isArray(data) && data.length > 0 && data[0]?.link) {
          setAudioUrl(data[0].link);
          setShowSpeechModal(true);
          setOpen(false);
        } else if (data && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setShowSpeechModal(true);
          setOpen(false);
        } else {
          console.error("Unexpected response format:", data);
          throw new Error("Invalid response format from API");
        }
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          responseText.substring(0, 200)
        );

        const fallbackUrl =
          "https://s3.us-east-1.amazonaws.com/invideo-uploads-us-east-1/speechfr-FR-Neural2-A17416860464130.mp3";
        console.log("Using fallback audio URL");
        setAudioUrl(fallbackUrl);
        setShowSpeechModal(true);
        setOpen(false);
      }
    } catch (error) {
      console.error("Speech generation error:", error);
      setMessage(
        `Failed to generate speech: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden bg-white dark:bg-gray-900 border-0 rounded-xl shadow-xl max-w-sm w-full">
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Sparkles className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-medium m-0">
                Ready to crush it, {username}!
              </DialogTitle>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="py-4 px-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-500 dark:border-blue-400"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                  "{quote.quote}"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-right italic">
                  — {quote.author}
                </p>
              </motion.div>

              <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {fetchingTasks ? (
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <svg
                      className="animate-spin h-4 w-4 text-blue-500"
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
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      Loading your tasks...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {"Would you like me to read out your tasks for today?"}
                  </p>
                )}

                {selectedVoice && (
                  <div className="flex items-center mt-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Using {selectedVoice.name} ({selectedVoice.language},{" "}
                      {selectedVoice.country})
                    </p>
                  </div>
                )}
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded"
                >
                  {message}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30">
            <div className="flex gap-x-2">
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                No, thanks
              </Button>
              <Button
                onClick={onReadTask}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                disabled={loading || fetchingTasks}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Loading...
                  </span>
                ) : (
                  "Yes, please"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showSpeechModal && audioUrl && (
        <SpeechModal setShowModel={setShowSpeechModal} url={audioUrl} />
      )}
    </>
  );
};

export default WelcomeModal;
