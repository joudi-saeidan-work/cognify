"use client";

import { useEffect, useState } from "react";
import { AudioRecorder } from "./_components/audio-recorder";

const AudioRecorderPage = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch(console.error);
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      localStorage.setItem("installAvailable", "true");
    });
  }, []);

  return (
    <div className="instant-recorder">
      {!isOnline && (
        <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm">
          Working offline - recordings will sync when online
        </div>
      )}
      <AudioRecorder />
    </div>
  );
};

export default AudioRecorderPage;
