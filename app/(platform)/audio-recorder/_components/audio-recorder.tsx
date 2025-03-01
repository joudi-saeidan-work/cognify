import { useEffect, useRef, useState } from "react";
import { openDB, DBSchema, IDBPDatabase } from "idb";

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

declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register: (tag: string) => Promise<void>;
    };
  }
}

export const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [db, setDb] = useState<IDBPDatabase<AudioDB> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const initDb = async () => {
      const dbInstance = await openDB<AudioDB>("audioDatabase", 1, {
        upgrade(db) {
          db.createObjectStore("recordings", { keyPath: "id" });
          db.createObjectStore("audioQueue", { keyPath: "id" });
        },
      });
      setDb(dbInstance);
    };

    initDb();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleTap = async () => {
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

          // Play preview
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
      const text = await transcribeAudio(blob);
      await createTaskFromText(text);

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
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    return response.json().then((data) => data.text);
  };

  const createTaskFromText = async (text: string) => {
    // Implement your ADHD-specific task creation logic here
    const task = {
      text: text.trim(),
      created: new Date().toISOString(),
      priority: text.includes("urgent") ? "high" : "normal",
    };

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  };

  return (
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
  );
};
