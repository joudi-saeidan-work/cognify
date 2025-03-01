const CACHE_NAME = "cognify-audio-v2";
const QUEUE_NAME = "audio-queue";
const ASSETS = [
  // Root path for the audio recording page
  "/audio-recorder",

  // PWA manifest
  "/audio-recorder-manifest.json",

  // PWA icons (these are required)
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon.ico",
  // Sound effects
  // "/sounds/start-recording.mp3",
  // "/sounds/stop-recording.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        // Only cache GET requests
        if (event.request.method !== "GET") {
          return fetch(event.request);
        }

        // Try to get from cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, try to fetch it
        const response = await fetch(event.request);

        // Cache successful GET responses
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        // Handle API requests with a JSON response
        if (event.request.url.includes("/api")) {
          return new Response('{ "status": "offline" }', {
            headers: { "Content-Type": "application/json" },
          });
        }

        // For other resources, return a fallback response or the error
        console.log(`Fetch failed for: ${event.request.url}`, error);
        throw error;
      }
    })()
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-recordings") {
    event.waitUntil(processQueue());
  }
});

async function processQueue() {
  const db = await openDB("audioQueue", 1, {
    upgrade(db) {
      db.createObjectStore("recordings", { keyPath: "id" });
    },
  });

  const recordings = await db.getAll("recordings");
  for (const recording of recordings) {
    try {
      await uploadRecording(recording);
      await db.delete("recordings", recording.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}
