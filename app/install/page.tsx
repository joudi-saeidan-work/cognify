"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPage() {
  const [installStatus, setInstallStatus] = useState<
    "waiting" | "ready" | "success" | "cancelled" | "unavailable"
  >("waiting");
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    console.log("Initial installStatus:", installStatus);

    // Check if installation is already available (PWA already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("Already in standalone mode, setting unavailable");
      setInstallStatus("unavailable");
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event triggered");
      e.preventDefault();

      // Store the event for later use
      setPromptEvent(e as BeforeInstallPromptEvent);
      setInstallStatus("ready");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    console.log("Added beforeinstallprompt event listener");

    // If no prompt arrives within 3 seconds, we might be on an unsupported browser
    // or the PWA is already installed
    const timer = setTimeout(() => {
      if (installStatus === "waiting") {
        console.log("No prompt arrived after 3s, setting unavailable");
        setInstallStatus("unavailable");
      }
    }, 3000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      clearTimeout(timer);
      console.log("Cleaned up event listener and timer");
    };
  }, [installStatus]);

  // Function to handle the install button click (with user gesture)
  const handleInstallClick = () => {
    if (!promptEvent) return;

    console.log("Install button clicked, showing prompt");
    promptEvent.prompt();
    promptEvent.userChoice.then((choiceResult) => {
      console.log("Installation choice result:", choiceResult.outcome);
      if (choiceResult.outcome === "accepted") {
        console.log("Setting status to success");
        setInstallStatus("success");

        // Add a small delay before redirecting to ensure the PWA is installed
        setTimeout(() => {
          window.location.href = "/install/audio-recorder";
        }, 1500);
      } else {
        console.log("Setting status to cancelled");
        setInstallStatus("cancelled");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-6 rounded-lg border border-border shadow-sm bg-card">
        <h1 className="text-2xl font-bold mb-4">
          Cognify Audio Recorder Installation
        </h1>

        {installStatus === "waiting" && (
          <div className="space-y-4">
            <p>Preparing installation prompt...</p>
            <div className="w-full h-2 bg-secondary overflow-hidden rounded-full">
              <div className="h-full bg-primary animate-pulse rounded-full"></div>
            </div>
          </div>
        )}

        {installStatus === "ready" && (
          <div className="space-y-4">
            <p>Your app is ready to install!</p>
            <Button onClick={handleInstallClick} className="w-full">
              Install Now
            </Button>
          </div>
        )}

        {installStatus === "unavailable" && (
          <div className="space-y-4">
            <p>Installation is not available. This could be because:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>The app is already installed on your device</li>
              <li>Your browser doesn't support PWA installation</li>
              <li>You're browsing in an unsupported mode</li>
            </ul>
            <Button
              onClick={() => window.close()}
              variant="outline"
              className="w-full"
            >
              Close This Tab
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
