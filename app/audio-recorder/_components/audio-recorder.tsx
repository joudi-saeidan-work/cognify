import { useEffect, useRef, useState, JSX } from "react";
import { openDB, DBSchema, IDBPDatabase } from "idb"; // wrapper for indexedDB
import { z } from "zod";
import { toast } from "sonner";
import { Board, List } from "@prisma/client";

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
    const intervalId = setInterval(fetchOrganizationsWithBoards, 50000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // handles the tap event to start or stop the recording
  const handleTap = async () => {
    if (isRecording) {
      // stops the recording because it's recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setProcessing(true);
    } else {
      // if isRecording is false, it means that the user is not currently recording
      try {
        // request access to the users microphone to capture audio
        // uses media stream api
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // Initialised the MediaRecorder instance to capture the audio
        const recorder = new MediaRecorder(stream);
        // stored the media recorder instance in the ref for later use
        mediaRecorderRef.current = recorder;

        // Data handling -> chunks are the audio data that is captured from the microphone
        let chunks: Blob[] = [];

        // ondataavailable is triggered when a new chunk of audio is captured
        recorder.ondataavailable = (e) => chunks.push(e.data);

        // When the recording is stopped
        // onstop is triggered when the recording is stopped
        recorder.onstop = async () => {
          // create a blob from the captured audio data
          const blob = new Blob(chunks, { type: "audio/webm" });
          // create a URL for the blob to play the audio
          // we can use this URL to play the audio in the browser or download it
          const audioURL = URL.createObjectURL(blob);

          // Play preview (optional)
          const audio = new Audio(audioURL);
          audio.volume = 0.8;
          await audio.play();

          // process the recording
          await processRecording(blob);

          // reset the chunks and stop the stream
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

    // 1. Store locally immediately
    const id = Date.now();
    await db.add("recordings", {
      id,
      blob,
      status: "pending",
      created: Date.now(),
    });

    // 2. Try to process immediately
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

      const { text } = await transcribeResponse.json();
      console.log("Transcribed text:", text);

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

      const braindumpText = await braindumpResponse.text();
      console.log("Raw braindump response:", braindumpText);

      // Step 3: Parse and update UI - adjust based on your API's actual response structure
      const parsed = parseAIResponse(braindumpText);
      setEditableContent(parsed);
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
        >
          <div className="pulse-ring"></div>
        </button>

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
        `}</style>
      </div>
      <div className="organization-selectors">
        <select
          onChange={(e) => setSelectedOrganization(e.target.value || null)}
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {selectedOrganization && (
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
        )}

        {selectedBoard && (
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
        )}
      </div>
    </>
  );
};
