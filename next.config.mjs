/** @type {import('next').NextConfig} */
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

export default nextConfig;
