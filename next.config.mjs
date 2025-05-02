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
  scope: "/install/audio-recorder/",
  disable: false,
  runtimeCaching: [
    {
      urlPattern: /\/audio-recorder\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "audio-recorder-cache",
      },
    },
  ],
});

export default withPWA(nextConfig);
