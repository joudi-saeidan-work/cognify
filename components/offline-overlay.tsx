"use client";

import { useEffect, useState } from "react";

export const OfflineOverlay = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Offline Mode</h1>
          <p className="text-muted-foreground">
            You're currently offline. The audio recorder is still available, but
            other features require an internet connection.
          </p>
          <div className="h-48 w-48 mx-auto bg-gradient-to-r from-rose-400 to-orange-400 rounded-full animate-pulse opacity-50" />
        </div>
      </div>
    </div>
  );
};
