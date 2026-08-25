const CACHE = "say01-runtime-v2.4.0";
const SENTENCE_AUDIO_IDS = [
  "cafe-1", "cafe-2", "cafe-3", "cafe-4", "cafe-5",
  "travel-1", "travel-2", "travel-3", "travel-4", "travel-5",
  "social-1", "social-2", "social-3", "social-4", "social-5",
  "shopping-1", "shopping-2", "shopping-3", "shopping-4", "shopping-5",
  "work-1", "work-2", "work-3", "work-4", "work-5",
  "rescue-1", "rescue-2", "rescue-3", "rescue-4", "rescue-5"
];
const SPELLING_AUDIO_IDS = [
  "cafe-1", "cafe-2", "cafe-3", "cafe-4", "cafe-5",
  "travel-1", "travel-2", "travel-3", "travel-4", "travel-5",
  "social-1", "social-2", "social-3", "social-4", "social-5",
  "shopping-1", "shopping-2", "shopping-3", "shopping-4", "shopping-5",
  "work-1", "work-2", "work-3", "work-4", "work-5",
  "rescue-1", "rescue-2", "rescue-3", "rescue-4", "rescue-5"
];
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./ai-coach.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  ...SENTENCE_AUDIO_IDS.map(id => `./audio/${id}.m4a`),
  ...SPELLING_AUDIO_IDS.map(id => `./audio/word-${id}.m4a`)
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate" || requestUrl.pathname.endsWith("/index.html") || requestUrl.pathname.endsWith("/");
  const isLiveCore = isNavigation || /\.(?:js|css|webmanifest)$/.test(requestUrl.pathname);

  if (isLiveCore) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          const cacheKey = isNavigation ? "./index.html" : event.request;
          caches.open(CACHE).then(cache => cache.put(cacheKey, copy));
          return response;
        })
        .catch(() => caches.match(isNavigation ? "./index.html" : event.request))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) {
      event.waitUntil(fetch(event.request).then(response => {
        const copy = response.clone();
        return caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }).catch(() => {}));
      return cached;
    }
    return fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html"));
  }));
});
