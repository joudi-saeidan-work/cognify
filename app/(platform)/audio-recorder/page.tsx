"use client";

import { useEffect, useState } from "react";
import { AudioRecorder } from "./_components/audio-recorder";

const HomePage = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/audio-recorder-sw.js");
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

export default HomePage;
