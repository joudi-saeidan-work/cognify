import { useEffect, useRef, useState, JSX } from "react";
import { openDB, DBSchema, IDBPDatabase } from "idb"; // wrapper for indexedDB
import { z } from "zod";
import { toast } from "sonner";
import { Board, List } from "@prisma/client";
import { useAction } from "@/hooks/use-actions";
import { createCard } from "@/actions/create-card";

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

  // Move this to the top level with your other hooks
  const { execute: executeCreateCard } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created`);
      console.log(`Card "${data.title}" created`);
    },
    onError: (error) => {
      toast.error(error);
      console.log("something happened");
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

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }
      //ToDo uncomment this after testing
      // const { text } = await transcribeResponse.json();
      // console.log("Transcribed text:", text);

      // TODO: remove this after testing
      const text = `
      Alright, so here's the plan. I've been thinking about this for a while, and I finally decided I'm gonna start my own podcast. Nothing too crazy at first—just something casual, maybe once a week, where I talk about tech, creativity, and whatever random things come to mind.

First step, I need to get my setup right. I already have a decent mic, but I might need some better soundproofing—probably just some foam panels or even some blankets to reduce echo. I also need to figure out which recording software I want to use. Audacity is free, but I might try Adobe Audition if I want more control over the sound.

Next, I'll need to come up with a solid format. I don't want it to just be me rambling, so I'll probably structure it around specific topics each week—maybe do some interviews later on. I should also work on an intro, maybe some background music to make it feel polished.

And of course, promotion. No point in making a podcast if nobody listens, right? So I'll start posting clips on social media—probably TikTok and Instagram since short-form content does well there. Might even make a YouTube channel if it picks up.

      Anyway, that's where I'm at right now. I'm excited to see how it goes! Hopefully, in a few months, I'll have something solid to show for it
      `;
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
              content: text,
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

      // Parse the extracted content
      const parsed = parseAIResponse(contentString.trim());
      console.log("Parsed content: ", parsed);
      setEditableContent(parsed);
      console.log("editable content after parsing", contentString);
      createTask();
      return text;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Processing failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (content: string) => {
    try {
      const raw = JSON.parse(content);
      const OrganizedThoughtsSchema = z.object({
        title: z.string().min(1).default("Untitled"),
        category: z
          .enum(["Note", "Task", "Journal Entry", "Meeting Note", "Other"])
          .default("Other"),
        summary: z.string().default(""),
        todoList: z.array(z.string()).default([]),
      });
      const parsed = OrganizedThoughtsSchema.parse(raw);
      return {
        title: parsed.title,
        category: parsed.category,
        summary: parsed.summary,
        todoList: parsed.todoList.join(", "),
      };
    } catch (error) {
      console.error("Parsing failed:", error);
      toast.error("Failed to process AI response");
      return {
        title: "Invalid Response",
        category: "Other",
        summary: "Could not parse AI output",
        todoList: "",
      };
    }
  };

  const createTask = () => {
    const descriptionContent = [];

    if (editableContent.summary) {
      descriptionContent.push(
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Summary" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: editableContent.summary }],
        }
      );
    }

    if (editableContent.todoList) {
      descriptionContent.push(
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "To-Do List" }],
        },
        {
          type: "bulletList",
          content: editableContent.todoList
            .split(/,\s*(?=[^\]]*(?:\[|$))/)
            .filter((task) => task.trim())
            .map((task) => ({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: task.trim() }],
                },
              ],
            })),
        }
      );
    }
    console.log("descriptionContent", descriptionContent);

    const descriptionJSON = JSON.stringify({
      type: "doc",
      content: descriptionContent,
    });

    if (!selectedOrganization || !selectedBoard || !selectedList) {
      toast.error("Please select both a board and list");
      return;
    }

    console.log("Creating card with:", {
      title: editableContent.title,
      boardId: selectedBoard,
      listId: selectedList,
      organizationId: selectedOrganization,
      description: descriptionJSON,
    });

    executeCreateCard({
      title: editableContent.title,
      boardId: selectedBoard,
      listId: selectedList,
      organizationId: selectedOrganization,
      description: descriptionJSON,
    });
  };

  // Return JSX directly, not inside a nested function
  return (
    <>
      <div className="instant-container">
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

        <style jsx>{`
          .instant-container {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
            position: relative;
          }

          .instant-record {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: none;
            background: #4caf50;
            transition: all 0.3s;
            position: relative;
            cursor: pointer;
          }

          .instant-record.recording {
            background: #f44336;
            transform: scale(1.1);
          }

          .instant-record.processing {
            background: #ffc107;
            animation: pulse 1s infinite;
          }

          .instant-record:disabled {
            background: #9e9e9e;
            cursor: not-allowed;
          }

          .pulse-ring {
            position: absolute;
            border: 2px solid #fff;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            animation: ripple 1.5s infinite;
            opacity: 0;
          }

          ${isRecording &&
          `
        .instant-container::after {
          content: "${Math.floor(recordingDuration / 60)}:${String(
            recordingDuration % 60
          ).padStart(2, "0")}";
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.8);
          font-family: monospace;
          font-size: 1.2rem;
        }
      `}

          @keyframes ripple {
            0% {
              transform: scale(0.9);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          .recording-disabled-message {
            position: absolute;
            bottom: 30%;
            left: 50%;
            transform: translateX(-50%);
            color: #ff5252;
            font-size: 0.9rem;
            text-align: center;
            background: rgba(0, 0, 0, 0.7);
            padding: 8px 12px;
            border-radius: 4px;
            max-width: 80%;
          }
        `}</style>
      </div>
      <div className="organization-selectors">
        <select onChange={(e) => setSelectedOrganization(e.target.value)}>
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {selectedOrganization && (
          <>
            <select onChange={(e) => setSelectedBoard(e.target.value)}>
              <option value="">Select Board</option>
              {organizations
                .find((org) => org.id === selectedOrganization)
                ?.boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
            </select>

            {/* Message when no boards are available */}
            {organizations.find((org) => org.id === selectedOrganization)
              ?.boards.length === 0 && (
              <div className="error-message">
                No boards available for this organization
              </div>
            )}
          </>
        )}

        {selectedBoard && (
          <>
            <select onChange={(e) => setSelectedList(e.target.value)}>
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

            {/* Message when no lists are available */}
            {!organizations
              .find((org) => org.id === selectedOrganization)
              ?.boards.find((board) => board.id === selectedBoard)?.lists
              .length && (
              <div className="error-message">
                No lists available in this board
              </div>
            )}
          </>
        )}

        <style jsx>{`
          .organization-selectors {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            background: #2d2d2d;
            border-radius: 8px;
            margin-top: 1rem;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }

          select {
            padding: 8px;
            border-radius: 4px;
            background: #3a3a3a;
            color: white;
            border: 1px solid #555;
          }

          .error-message {
            color: #ff5252;
            font-size: 0.8rem;
            margin-top: 4px;
            background: rgba(255, 82, 82, 0.1);
            padding: 6px;
            border-radius: 4px;
            text-align: center;
          }
        `}</style>
      </div>
    </>
  );
};
