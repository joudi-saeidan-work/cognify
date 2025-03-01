"use client";

import { useEffect } from "react";
import { AudioRecorder } from "./_components/audio-recorder";

const AudioRecorderPage = () => {
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
      <AudioRecorder />
      <link rel="manifest" href="/audio-recorder-manifest.json" />
    </div>
  );
};

export default AudioRecorderPage;
