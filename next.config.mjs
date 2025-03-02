/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

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

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  scope: "/audio-recorder",
  disable: false,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/audio-recorder\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "audio-pages-cache",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
