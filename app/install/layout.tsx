import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Cognify Audio Recorder",
  description: "Start speaking and leave the rest to us",
  icons: [
    { url: "/icons/favicon.ico", href: "/favicon.ico" },
    { url: "/icons/favicon-16x16.png", href: "/icons/favicon-16x16.png" },
    { url: "/icons/favicon-32x32.png", href: "/icons/favicon-32x32.png" },
    { url: "/icons/apple-touch-icon.png", href: "/icons/apple-touch-icon.png" },
    {
      url: "/icons/android-chrome-192x192.png",
      href: "/icons/android-chrome-192x192.png",
    },
    {
      url: "/icons/android-chrome-512x512.png",
      href: "/icons/android-chrome-512x512.png",
    },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cognify Audio Recorder",
    // You can copy the startupImage array from your root layout if needed
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
};

export default function AudioRecorderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="audio-recorder-layout">{children}</div>;
}
