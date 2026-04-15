/// <reference lib="webworker" />

import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
CacheFirst,
NetworkFirst,
NetworkOnly,
StaleWhileRevalidate,
} from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope & {
__WB_MANIFEST: Array<{
url: string;
revision: string | null;
}>;
};

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 🔁 Allow SW update
self.addEventListener("message", (event) => {
if (event.data?.type === "SKIP_WAITING") {
void self.skipWaiting();
}
});

// 🌐 API routes
registerRoute(
({ url }) => url.pathname.startsWith("/api/"),
new NetworkOnly(),
);

// 📄 Pages
registerRoute(
({ request }) => request.mode === "navigate",
async (options) => {
const strategy = new NetworkFirst({
cacheName: "app-pages",
networkTimeoutSeconds: 5,
plugins: [
new ExpirationPlugin({
maxEntries: 20,
maxAgeSeconds: 60 * 60 * 24,
}),
new CacheableResponsePlugin({
statuses: [0, 200],
}),
],
});

```
try {
  return await strategy.handle(options);
} catch {
  const offline = await caches.match("/offline.html");
  return offline ?? Response.error();
}
```

},
);

// 📦 Static assets
registerRoute(
({ request, sameOrigin }) =>
sameOrigin && ["style", "script", "worker"].includes(request.destination),
new StaleWhileRevalidate({
cacheName: "static-assets",
plugins: [
new ExpirationPlugin({
maxEntries: 80,
maxAgeSeconds: 60 * 60 * 24 * 30,
}),
new CacheableResponsePlugin({
statuses: [0, 200],
}),
],
}),
);

// 🖼 Images
registerRoute(
({ request }) => request.destination === "image",
new CacheFirst({
cacheName: "image-assets",
plugins: [
new ExpirationPlugin({
maxEntries: 120,
maxAgeSeconds: 60 * 60 * 24 * 30,
}),
new CacheableResponsePlugin({
statuses: [0, 200],
}),
],
}),
);

// 🔤 Fonts
registerRoute(
({ request }) =>
request.destination === "font" || //fonts?//.test(request.url),
new CacheFirst({
cacheName: "font-assets",
plugins: [
new ExpirationPlugin({
maxEntries: 30,
maxAgeSeconds: 60 * 60 * 24 * 365,
}),
new CacheableResponsePlugin({
statuses: [0, 200],
}),
],
}),
);

// 🔥 MAIN FIX: Smart Push Handling
self.addEventListener("push", (event) => {
event.waitUntil(handlePush(event));
});

async function handlePush(event: PushEvent) {
const payload = readPushPayload(event);

// 🔍 Get all app clients (tabs / PWA instances)
const clientsList = await self.clients.matchAll({
type: "window",
includeUncontrolled: true,
});

// ✅ Check if app is visible
const isVisible = clientsList.some(
(client) => client.visibilityState === "visible",
);

// 🔥 Check recent activity (mobile-safe)
let isRecentlyActive = false;

try {
for (const client of clientsList) {
const channel = new MessageChannel();

```
  client.postMessage({ type: "get-last-active" }, [channel.port2]);

  const lastActive = await new Promise<number | null>((resolve) => {
    channel.port1.onmessage = (e) => resolve(e.data);
    setTimeout(() => resolve(null), 200);
  });

  if (lastActive && Date.now() - lastActive < 3000) {
    isRecentlyActive = true;
    break;
  }
}
```

} catch {
// ignore safely
}

// 🚫 FINAL SUPPRESSION
if (isVisible || isRecentlyActive) {
return;
}

// ✅ Show notification only if truly inactive
const title =
typeof payload.title === "string" && payload.title.trim()
? payload.title
: "Axodesk";

const options: NotificationOptions = {
body: typeof payload.body === "string" ? payload.body : "",
icon: payload.icon || "/pwa/icon-192.png",
badge: payload.badge || "/pwa/icon-192.png",
tag: payload.tag,
renotify: Boolean(payload.renotify),
requireInteraction: Boolean(payload.requireInteraction),
data: payload.data || {},
};

await self.registration.showNotification(title, options);
}

// 🔔 Click handling
self.addEventListener("notificationclick", (event) => {
event.notification.close();

const deepLink =
typeof event.notification.data?.deepLink === "string"
? event.notification.data.deepLink
: "/inbox";

const targetUrl = new URL(deepLink, self.location.origin).toString();

event.waitUntil(openOrFocusWindow(targetUrl, event.notification.data));
});

// 🔄 Handle subscription change
self.addEventListener("pushsubscriptionchange", (event) => {
event.waitUntil(
(async () => {
const clients = await self.clients.matchAll({
type: "window",
includeUncontrolled: true,
});

```
  await Promise.all(
    clients.map((client) =>
      client.postMessage({
        type: "notification:push-subscription-change",
      }),
    ),
  );
})(),
```

);
});

// 📦 Helpers
function readPushPayload(event: PushEvent) {
if (!event.data) return {};

try {
return event.data.json() as Record<string, unknown>;
} catch {
return {
title: "Axodesk",
body: event.data.text(),
};
}
}

async function openOrFocusWindow(targetUrl: string, payload: unknown) {
const clients = await self.clients.matchAll({
type: "window",
includeUncontrolled: true,
});

for (const client of clients) {
if ("focus" in client) await client.focus();
if ("navigate" in client) await client.navigate(targetUrl);

```
client.postMessage({
  type: "notification:click",
  payload,
});

return;
```

}

await self.clients.openWindow(targetUrl);
}
