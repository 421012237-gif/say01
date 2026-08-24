const CACHE = "say01-runtime-v2.3";
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./audio/cafe-1.m4a",
  "./audio/cafe-2.m4a",
  "./audio/cafe-3.m4a",
  "./audio/cafe-4.m4a",
  "./audio/cafe-5.m4a",
  "./audio/travel-1.m4a",
  "./audio/travel-2.m4a",
  "./audio/travel-3.m4a",
  "./audio/travel-4.m4a",
  "./audio/travel-5.m4a",
  "./audio/social-2.m4a",
  "./audio/social-3.m4a",
  "./audio/social-4.m4a",
  "./audio/social-5.m4a",
  "./audio/shopping-1.m4a",
  "./audio/shopping-2.m4a",
  "./audio/shopping-3.m4a",
  "./audio/shopping-4.m4a",
  "./audio/shopping-5.m4a",
  "./audio/work-2.m4a",
  "./audio/work-3.m4a",
  "./audio/work-4.m4a",
  "./audio/work-5.m4a",
  "./audio/rescue-1.m4a",
  "./audio/rescue-2.m4a",
  "./audio/rescue-3.m4a",
  "./audio/rescue-4.m4a",
  "./audio/rescue-5.m4a"
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
