import { useEffect, useRef, useState, JSX } from "react";
import { openDB, DBSchema, IDBPDatabase } from "idb"; // wrapper for indexedDB
import { z } from "zod";
import { toast } from "sonner";
import { Board, List } from "@prisma/client";
import { useAction } from "@/hooks/use-actions";
import { createCard } from "@/actions/create-card";
import { Settings } from "lucide-react";

// indexedDB is a low-level API for storing data locally in the browser
// it's not as easy to use as localStorage, but it's more powerful and flexible
// we're using it here to store the audio recordings and the transcription results

// AudioDB is the schema for the database with two tables:
// - recordings: to store the audio recordings
// - audioQueue: to store the audio recordings when the user is offline
interface AudioDB extends DBSchema {
  recordings: {
    key: number;
    value: {
      id: number;
      blob: Blob;
      status: string;
      created: number;
    };
  };
  audioQueue: {
    key: number;
    value: {
      id: number;
      blob: Blob;
    };
  };
}

// part of the Background Sync API, which is a feature of the Service Worker API
// it allows us to register a sync event that will be triggered when the user comes online
// we're using it here to process the audio recordings when the user comes online
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register: (tag: string) => Promise<void>;
    };
  }
}

export const AudioRecorder = (): JSX.Element => {
  const [error, setError] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // whether the user is recording
  const [processing, setProcessing] = useState(false); // whether the audio is being processed
  const [recordingDuration, setRecordingDuration] = useState(0); // tracks the duration of the current recording
  const [db, setDb] = useState<IDBPDatabase<AudioDB> | null>(null); // holds the IndexedDB instance
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // reference to the MediaRecorder instance
  const timerRef = useRef<NodeJS.Timeout>(); // reference to a timer for updating the recording duration

  const [editableContent, setEditableContent] = useState({
    title: "",
    category: "",
    summary: "",
    todoList: "",
  });
  const [boards, setBoards] = useState<(Board & { lists: List[] })[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [selectedList, setSelectedList] = useState<string>("");
  const [organizations, setOrganizations] = useState<
    Array<{
      id: string;
      name: string;
      boards: Array<{ id: string; title: string; lists: List[] }>;
    }>
  >([]);
  const [selectedOrganization, setSelectedOrganization] = useState<
    string | null
  >(null);

  const [isCardCreationComplete, setIsCardCreationComplete] = useState(true);

  const [showSettings, setShowSettings] = useState(
    !selectedOrganization || !selectedBoard || !selectedList
  );

  // Add this useEffect to maintain the auto-open behavior
  useEffect(() => {
    if (!selectedOrganization || !selectedBoard || !selectedList) {
      setShowSettings(true);
    }
  }, [selectedOrganization, selectedBoard, selectedList]);

  // Move this to the top level with your other hooks
  const { execute: executeCreateCard } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created`);
      console.log(`Card "${data.title}" created`);
    },
    onError: (error) => {
      toast.error(error);
      console.log("something happened", error);
    },
  });

  // initialize the IndexedDB instance when the component mounts. It creates two tables:
  // - recordings: to store the audio recordings
  // - audioQueue: to store the audio recordings when the user is offline
  useEffect(() => {
    const initDb = async () => {
      const dbInstance = await openDB<AudioDB>("audioDatabase", 1, {
        // this function is called when the database is upgraded or created for the first time
        upgrade(db) {
          // create the recordings table with a keyPath of id
          db.createObjectStore("recordings", { keyPath: "id" });
          // create the audioQueue table with a keyPath of id
          db.createObjectStore("audioQueue", { keyPath: "id" });
        },
      });
      // set the IndexedDB instance to the state
      setDb(dbInstance);
    };

    // initialize the IndexedDB instance
    initDb();
  }, []);

  // update the recording duration every second while the user is recording
  useEffect(() => {
    if (isRecording) {
      // setInterval runs the function every second
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // stops a running setInterval
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    async function fetchOrganizationsWithBoards() {
      try {
        const response = await fetch("/api/get-organizations-with-boards");
        const data = await response.json();
        console.log("Organizations loaded:", data); // Debug
        setOrganizations(data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    }

    // Fetch data initially
    fetchOrganizationsWithBoards();

    // Set up polling to fetch data every 60 seconds
    const intervalId = setInterval(fetchOrganizationsWithBoards, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // handles the tap event to start or stop the recording
  const handleTap = async () => {
    if (!selectedOrganization || !selectedBoard || !selectedList) {
      toast.error(
        "Please select an organization, board, and list before recording."
      );
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setProcessing(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        let chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const audioURL = URL.createObjectURL(blob);

          const audio = new Audio(audioURL);
          audio.volume = 0.8;
          await audio.play();

          await processRecording(blob);

          chunks = [];
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Recording failed:", error);
      }
    }
  };

  // ToDo
  const processRecording = async (blob: Blob) => {
    if (!db) {
      console.error("Database is not initialized.");
      return;
    }

    setIsCardCreationComplete(false);

    const id = Date.now();
    await db.add("recordings", {
      id,
      blob,
      status: "pending",
      created: Date.now(),
    });

    try {
      await transcribeAudio(blob);

      const recording = await db.get("recordings", id);
      if (recording) {
        recording.status = "processed";
        await db.put("recordings", recording);
      }
    } catch (error) {
      const recording = await db.get("recordings", id);
      if (recording) {
        recording.status = navigator.onLine ? "failed" : "pending";
        await db.put("recordings", recording);
      }

      if (!navigator.onLine) {
        await db.add("audioQueue", { id, blob });
        toast.info(
          "Recording added to queue. It will be processed when online."
        );
        navigator.serviceWorker.ready.then((registration) => {
          if ("sync" in registration) {
            registration.sync.register("sync-recordings").catch((error) => {
              console.error("Sync registration failed:", error);
            });
          } else {
            console.warn("Background Sync is not supported in this browser.");
          }
        });
      }
    } finally {
      setProcessing(false);
      setIsCardCreationComplete(true);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    const audioFile = new File([blob], "recording.wav", { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      // Step 1: Transcribe audio
      const transcribeResponse = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      console.log("Transcription response status:", transcribeResponse.status);

      if (!transcribeResponse.ok) {
        const errorBody = await transcribeResponse.text();
        console.error("Transcription failed with response:", errorBody);
        throw new Error(
          `Transcription failed: ${transcribeResponse.statusText}`
        );
      }

      const responseData = await transcribeResponse.json();
      console.log("Raw transcription response:", responseData);

      const responseText = responseData.text;
      if (!responseText) {
        throw new Error("Transcription response missing text field");
      }

      console.log("Transcribed text:", responseText);

      // Step 2: Process with audio recorder
      const braindumpResponse = await fetch("/api/audio-recorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: responseText,
            },
          ],
        }),
      });

      if (!braindumpResponse.ok) {
        throw new Error("AI processing failed");
      }

      // Parse the response as JSON to get the object
      const braindumpData = await braindumpResponse.json();
      console.log("Raw braindump response:", braindumpData);

      // Extract the content string from the object
      const contentString = braindumpData.content;
      console.log("Raw content string:", contentString);

      // Parse the extracted content
      try {
        const parsed = parseAIResponse(contentString.trim());
        console.log("Parsed content: ", parsed);
        const titleValue = parsed.title;
        console.log("Title value: ", titleValue);
        const descriptionContent = [];

        // Summary section with proper validation
        if (Boolean(parsed.summary?.trim())) {
          const cleanSummary = parsed.summary.trim();
          descriptionContent.push(
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Summary" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: cleanSummary }],
            }
          );
        }

        // Todo list section with improved parsing
        if (Boolean(parsed.todoList?.trim())) {
          const tasks = parsed.todoList
            .split(/,\s*(?![^()]*\))/)
            .map((task) => task.trim())
            .filter((task) => task.length > 0);

          if (tasks.length > 0) {
            descriptionContent.push(
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "To-Do List" }],
              },
              {
                type: "bulletList",
                content: tasks.map((task) => ({
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: task }],
                    },
                  ],
                })),
              }
            );
          }
        }

        // Fallback content if both sections failed
        if (descriptionContent.length === 0) {
          descriptionContent.push({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "No actionable content found in recording",
              },
            ],
          });
        }

        const descriptionJSON = JSON.stringify({
          type: "doc",
          content: descriptionContent,
        });

        if (!selectedOrganization || !selectedBoard || !selectedList) {
          toast.error("Please select both a board and list");
          return;
        }

        console.log("Creating card with:", {
          title: titleValue,
          boardId: selectedBoard,
          listId: selectedList,
          organizationId: selectedOrganization,
          description: descriptionJSON,
        });

        executeCreateCard({
          title: titleValue,
          boardId: selectedBoard,
          listId: selectedList,
          organizationId: selectedOrganization,
          description: descriptionJSON,
        });
      } catch (parseError) {
        console.error("Content parsing error:", parseError);
        toast.error("Failed to parse AI response content");
        return;
      }

      return responseText;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Processing failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (content: string) => {
    try {
      console.log("Raw content before parsing:", content);
      const raw = JSON.parse(content);

      console.log("Raw JSON structure:", raw);

      const OrganizedThoughtsSchema = z.object({
        title: z.string().min(1).default("Untitled"),
        category: z
          .enum(["Note", "Task", "Journal Entry", "Meeting Note", "Other"])
          .default("Other"),
        summary: z.string().default(""),
        todoList: z.array(z.string()).default([]),
      });

      const parsed = OrganizedThoughtsSchema.parse(raw);
      console.log("Validated content:", parsed);

      return {
        title: parsed.title,
        category: parsed.category,
        summary: parsed.summary,
        todoList: parsed.todoList.join(", "),
      };
    } catch (error) {
      console.error("Parsing failed - Content:", content, "Error:", error);
      toast.error("Failed to process AI response");
      return {
        title: "Invalid Response",
        category: "Other",
        summary: "Could not parse AI output",
        todoList: "",
      };
    }
  };

  // Return JSX directly, not inside a nested function
  return (
    <>
      <div className="instant-container">
        {/* Add settings gear button at top */}
        <button
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Settings"
        >
          <Settings />
        </button>

        <button
          className={`instant-record ${isRecording ? "recording" : ""} ${
            processing ? "processing" : ""
          }`}
          onClick={handleTap}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          disabled={
            !selectedOrganization ||
            !selectedBoard ||
            !selectedList ||
            !isCardCreationComplete
          }
          title={
            !selectedOrganization || !selectedBoard || !selectedList
              ? "Please select an organization, board, and list before recording"
              : "Click to start recording"
          }
        >
          <div className="pulse-ring"></div>
          {isRecording && <div className="timer">{recordingDuration}s</div>}
        </button>

        {/* Add a visible message explaining why recording is disabled */}
        {(!selectedOrganization || !selectedBoard || !selectedList) && (
          <div className="recording-disabled-message">
            Please select{" "}
            {!selectedOrganization
              ? "an organization"
              : !selectedBoard
              ? "a board"
              : "a list"}{" "}
            to enable recording
          </div>
        )}

        {showSettings && (
          <div className="mobile-settings-panel">
            <button
              className="close-button"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
            <div className="organization-selectors">
              <select
                value={selectedOrganization || ""}
                onChange={(e) => setSelectedOrganization(e.target.value)}
              >
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              {selectedOrganization && (
                <>
                  {organizations.find((org) => org.id === selectedOrganization)
                    ?.boards.length ? (
                    <select
                      value={selectedBoard}
                      onChange={(e) => setSelectedBoard(e.target.value)}
                    >
                      <option value="">Select Board</option>
                      {organizations
                        .find((org) => org.id === selectedOrganization)
                        ?.boards.map((board) => (
                          <option key={board.id} value={board.id}>
                            {board.title}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="validation-message">
                      No boards available in this organization
                    </div>
                  )}

                  {selectedBoard && (
                    <>
                      {organizations
                        .find((org) => org.id === selectedOrganization)
                        ?.boards.find((b) => b.id === selectedBoard)?.lists
                        .length ? (
                        <select
                          value={selectedList}
                          onChange={(e) => setSelectedList(e.target.value)}
                        >
                          <option value="">Select List</option>
                          {organizations
                            .find((org) => org.id === selectedOrganization)
                            ?.boards.find((board) => board.id === selectedBoard)
                            ?.lists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.title}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="validation-message">
                          No lists available in this board
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .instant-container {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
        }

        .settings-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 1000;
        }

        .instant-record {
          width: 64px;
          height: 64px;
          font-size: 32px;
          border-radius: 50%;
          background: #ff5252;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .instant-record:disabled {
          background: #666;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .instant-record.recording {
          background: #ff0000;
          animation: pulse 1.5s infinite;
        }

        .instant-record.processing {
          background: #ffd700;
          animation: none;
        }

        .timer {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .pulse-ring {
          border: 3px solid #ff5252;
          border-radius: 50%;
          height: 100%;
          width: 100%;
          position: absolute;
          animation: none;
          opacity: 0;
        }

        .recording .pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1)
            infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.33);
            opacity: 0;
          }
          80%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 0.3;
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
          }
        }

        .mobile-settings-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #2d2d2d;
          padding: 1rem;
          border-radius: 12px 12px 0 0;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
          z-index: 999;
          max-height: 70vh;
          overflow-y: auto;
        }

        .close-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .organization-selectors {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-top: 1rem;
        }

        select {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          background: #3a3a3a;
          color: white;
          border: 1px solid #555;
          font-size: 1rem;
          -webkit-appearance: none;
          appearance: none;
        }

        .validation-message {
          color: #ff5252;
          padding: 12px;
          background: rgba(255, 82, 82, 0.1);
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
          margin: 8px 0;
        }

        .recording-disabled-message {
          position: absolute;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          color: #ff5252;
          text-align: center;
          width: 80%;
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
};
