/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "payload.cargocollective.com" },
      { protocol: "https", hostname: "www.notion.so" },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true, // register the service worker
  skipWaiting: true, // skip waiting for the service worker to be installed
  disable: process.env.NODE_ENV === "development", // disable PWA in development
})(nextConfig);
