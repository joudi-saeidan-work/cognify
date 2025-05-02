"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AudioRecorder } from "./_components/audio-recorder";
import Head from "next/head";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Global variable to store the prompt event outside of component lifecycle
let globalPromptEvent: BeforeInstallPromptEvent | null = null;

export default function AudioRecorderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldPromptInstall = searchParams.get("install") === "true";
  const [isRedirected, setIsRedirected] = useState(false);

  useEffect(() => {
    // Set redirected state once on initial render if install param exists
    if (shouldPromptInstall && !isRedirected) {
      setIsRedirected(true);
    }
  }, [shouldPromptInstall]);

  useEffect(() => {
    // Function to handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Only prevent default if we're coming from a redirect and need to control the flow
      if (shouldPromptInstall) {
        e.preventDefault();
        globalPromptEvent = e as BeforeInstallPromptEvent;
        console.log("Install parameter detected, saved prompt event");
      } else {
        // For direct access to the audio recorder, don't prevent default
        // This allows the browser's default install prompt to appear
        console.log(
          "Audio recorder accessed directly - browser can show default prompt"
        );

        // Still save the event in case we need it later
        globalPromptEvent = e as BeforeInstallPromptEvent;
      }
    };

    // Add event listener
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [shouldPromptInstall]);

  // Handle the redirect and trigger installation
  useEffect(() => {
    if (isRedirected && globalPromptEvent) {
      // Small delay to ensure everything is ready
      const timeoutId = setTimeout(() => {
        if (globalPromptEvent) {
          console.log("Triggering install prompt after redirect");

          globalPromptEvent.prompt();
          globalPromptEvent.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
              // Successfully installed, clean up URL
              router.replace("/audio-recorder/");
            } else {
              // Installation rejected, go back to dashboard
              router.back();
            }
            globalPromptEvent = null;
          });
        } else {
          console.log("No prompt event available after redirect");
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isRedirected, router]);

  return (
    <>
      <Head>
        <title>Cognify Audio Recorder</title>
      </Head>
      <AudioRecorder />
    </>
  );
}
