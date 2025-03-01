import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "./theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: [
    { url: "/icons/favicon.ico", href: "/favicon.ico" },
    {
      url: "/icons/favicon-16x16.png",
      href: "/icons/favicon-16x16.png",
      type: "image/png",
      sizes: "16x16",
    },
    {
      url: "/icons/favicon-32x32.png",
      href: "/icons/favicon-32x32.png",
      type: "image/png",
      sizes: "32x32",
    },
    {
      url: "/icons/apple-touch-icon.png",
      href: "/icons/apple-touch-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
    {
      url: "/icons/android-chrome-192x192.png",
      href: "/icons/android-chrome-192x192.png",
      type: "image/png",
      sizes: "192x192",
    },
    {
      url: "/icons/android-chrome-512x512.png",
      href: "/icons/android-chrome-512x512.png",
      type: "image/png",
      sizes: "512x512",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
