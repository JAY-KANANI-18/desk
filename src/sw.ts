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

const logServiceWorker = (event: string, details?: unknown) => {
  console.info(`[PushSW] ${event}`, details ?? "");
};

const logServiceWorkerError = (event: string, error: unknown, details?: unknown) => {
  console.error(`[PushSW] ${event}`, {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error,
    details,
  });
};

clientsClaim();
cleanupOutdatedCaches();
const precacheManifest = self.__WB_MANIFEST;
precacheAndRoute(precacheManifest);

logServiceWorker("boot", {
  manifestEntries: precacheManifest.length,
});

self.addEventListener("install", () => {
  logServiceWorker("install");
});

self.addEventListener("activate", (event) => {
  logServiceWorker("activate", {
    scope: self.registration.scope,
  });
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  logServiceWorker("message", {
    data: event.data ?? null,
  });
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly(),
);

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

    try {
      return await strategy.handle(options);
    } catch {
      const offline = await caches.match("/offline.html");
      return offline ?? Response.error();
    }
  },
);

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

registerRoute(
  ({ request }) =>
    request.destination === "font" || /\/fonts?\//.test(request.url),
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

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title
      : "Axodesk";

  const options: NotificationOptions = {
    body: typeof payload.body === "string" ? payload.body : "",
    icon:
      typeof payload.icon === "string" && payload.icon
        ? payload.icon
        : "/pwa/icon-192.png",
    badge:
      typeof payload.badge === "string" && payload.badge
        ? payload.badge
        : "/pwa/icon-192.png",
    tag: typeof payload.tag === "string" ? payload.tag : undefined,
    renotify: Boolean(payload.renotify),
    requireInteraction: Boolean(payload.requireInteraction),
    data:
      payload.data && typeof payload.data === "object" ? payload.data : {},
  };

  logServiceWorker("push:received", {
    hasEventData: Boolean(event.data),
    payload,
    options,
  });

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(title, options);
        logServiceWorker("push:show-notification:success", {
          title,
          options,
        });
      } catch (error) {
        logServiceWorkerError("push:show-notification:failed", error, {
          title,
          options,
        });
        throw error;
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const deepLink =
    typeof event.notification.data?.deepLink === "string" &&
    event.notification.data.deepLink
      ? event.notification.data.deepLink
      : "/inbox";
  const targetUrl = new URL(deepLink, self.location.origin).toString();

  logServiceWorker("notificationclick", {
    deepLink,
    targetUrl,
    data: event.notification.data ?? null,
  });

  event.waitUntil(openOrFocusWindow(targetUrl, event.notification.data));
});

self.addEventListener("notificationclose", (event) => {
  logServiceWorker("notificationclose", {
    title: event.notification.title,
    tag: event.notification.tag,
    data: event.notification.data ?? null,
  });
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      logServiceWorker("pushsubscriptionchange", {
        oldSubscription: event.oldSubscription
          ? {
              endpoint: event.oldSubscription.endpoint,
              expirationTime: event.oldSubscription.expirationTime ?? null,
            }
          : null,
        newSubscription: event.newSubscription
          ? {
              endpoint: event.newSubscription.endpoint,
              expirationTime: event.newSubscription.expirationTime ?? null,
            }
          : null,
      });
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      logServiceWorker("pushsubscriptionchange:clients", {
        count: clients.length,
      });

      await Promise.all(
        clients.map((client) =>
          client.postMessage({
            type: "notification:push-subscription-change",
          }),
        ),
      );
    })(),
  );
});

function readPushPayload(event: PushEvent) {
  if (!event.data) {
    logServiceWorker("push:missing-data");
    return {};
  }

  try {
    const payload = event.data.json() as Record<string, unknown>;
    logServiceWorker("push:payload-json", payload);
    return payload;
  } catch (error) {
    logServiceWorkerError("push:payload-json-failed", error);
    const textPayload = event.data.text();
    logServiceWorker("push:payload-text", {
      textPayload,
    });
    return {
      title: "Axodesk",
      body: textPayload,
    };
  }
}

async function openOrFocusWindow(targetUrl: string, payload: unknown) {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  logServiceWorker("window:matchAll", {
    targetUrl,
    clientCount: clients.length,
    clients: clients.map((client) => ({
      url: client.url,
      visibilityState:
        "visibilityState" in client ? client.visibilityState : undefined,
      focused: "focused" in client ? client.focused : undefined,
    })),
  });

  for (const client of clients) {
    if ("focus" in client) {
      await client.focus();
    }

    if ("navigate" in client) {
      await client.navigate(targetUrl);
    }

    client.postMessage({
      type: "notification:click",
      payload,
    });
    return;
  }

  try {
    await self.clients.openWindow(targetUrl);
    logServiceWorker("window:opened", {
      targetUrl,
    });
  } catch (error) {
    logServiceWorkerError("window:open-failed", error, {
      targetUrl,
      payload,
    });
    throw error;
  }
}
