import { workspaceApi } from "../../../lib/workspaceApi";

export type ShopifyOAuthPayload = {
  code: string;
  shop?: string | null;
  hmac?: string | null;
  timestamp?: string | null;
  host?: string | null;
  state?: string | null;
};

export type ShopifyOAuthResult =
  | { mode: "backend_connected" }
  | { mode: "frontend_exchange"; payload: ShopifyOAuthPayload };

type MetaAdsOAuthResult =
  | { mode: "backend_connected" }
  | { mode: "frontend_exchange"; code: string };

export type ShopifyConnectPhase =
  | "idle"
  | "opening"
  | "waiting"
  | "received"
  | "saving"
  | "connected"
  | "failed";

export function normalizeShopInput(value: string) {
  return value.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
}

export function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function connectMetaAdsViaPopup() {
  const start = (await workspaceApi.getMetaAdsOAuthUrl()) as {
    url?: string;
    redirectUri?: string;
  };
  if (!start?.url) throw new Error("Could not start Facebook login.");

  const popup = window.open(start.url, "meta_ads_oauth", "width=600,height=720,scrollbars=yes");
  if (!popup) throw new Error("Popup blocked. Allow popups for this site and try again.");

  const result = await waitForMetaAdsOAuthPopup(popup, start.redirectUri);
  if (result.mode === "frontend_exchange") {
    await workspaceApi.exchangeMetaAdsOAuthCode(result.code);
  }
}

export async function connectShopifyViaPopup(
  shopInput: string,
  onPhaseChange?: (phase: ShopifyConnectPhase, message: string) => void,
) {
  const shop = normalizeShopInput(shopInput);
  if (!shop) throw new Error("Shop domain is required.");

  onPhaseChange?.("opening", "Opening Shopify install window...");
  const start = (await workspaceApi.getShopifyOAuthUrl(shop)) as {
    url?: string;
    redirectUri?: string;
  };
  if (!start?.url) throw new Error("Could not start Shopify login.");

  const popup = window.open(start.url, "shopify_oauth", "width=620,height=760,scrollbars=yes");
  if (!popup) throw new Error("Popup blocked. Allow popups for this site and try again.");

  onPhaseChange?.("waiting", "Waiting for Shopify authorization in the popup...");
  const result = await waitForShopifyOAuthPopup(popup, onPhaseChange, start.redirectUri);

  if (result.mode === "frontend_exchange") {
    onPhaseChange?.("saving", "Saving Shopify connection and registering webhooks...");
    await workspaceApi.exchangeShopifyOAuthCode(result.payload);
    return;
  }

  onPhaseChange?.("saving", "Shopify connected in the backend. Refreshing catalog...");
}

function waitForMetaAdsOAuthPopup(
  popup: Window,
  redirectUri?: string,
): Promise<MetaAdsOAuthResult> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Facebook login timed out. Please try again."));
    }, 5 * 60 * 1000);

    const onMessage = (event: MessageEvent) => {
      if (!isTrustedOAuthOrigin(event.origin, redirectUri)) return;

      if (event.data?.type === "OAUTH_CALLBACK" && event.data?.providerKey === "meta_ads") {
        cleanup();
        popup.close();
        if (event.data.status === "success") {
          resolve({ mode: "backend_connected" });
          return;
        }
        reject(new Error((event.data.message as string) || "Meta Ads connection failed."));
        return;
      }

      if (event.data?.type === "meta_ads_oauth" && event.data?.code) {
        cleanup();
        resolve({ mode: "frontend_exchange", code: event.data.code as string });
      }
      if (event.data?.type === "meta_ads_oauth" && event.data?.error) {
        cleanup();
        reject(
          new Error(
            (event.data.error_description as string) ||
              (event.data.error as string) ||
              "Facebook login was cancelled.",
          ),
        );
      }
    };

    const poll = window.setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          reject(new Error("Login window was closed."));
          return;
        }

        const href = popup.location.href;
        if (
          href?.includes("/workspace/settings/integrations") &&
          href.includes("oauthProvider=meta_ads")
        ) {
          const url = new URL(href);
          popup.close();
          cleanup();
          if (url.searchParams.get("oauthStatus") === "success") {
            resolve({ mode: "backend_connected" });
            return;
          }
          reject(new Error(url.searchParams.get("error") || "Meta Ads connection failed."));
          return;
        }

        if (href?.includes("code=")) {
          const code = new URL(href).searchParams.get("code");
          if (code) {
            popup.close();
            cleanup();
            resolve({ mode: "frontend_exchange", code });
          }
        }
      } catch {
        /* cross-origin until redirect */
      }
    }, 500);

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
  });
}

function waitForShopifyOAuthPopup(
  popup: Window,
  onPhaseChange?: (phase: ShopifyConnectPhase, message: string) => void,
  redirectUri?: string,
): Promise<ShopifyOAuthResult> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Shopify login timed out. Please try again."));
    }, 5 * 60 * 1000);

    const readPayloadFromUrl = (href: string): ShopifyOAuthPayload | null => {
      const url = new URL(href);
      const code = url.searchParams.get("code");
      if (!code) return null;
      return {
        code,
        shop: url.searchParams.get("shop"),
        hmac: url.searchParams.get("hmac"),
        timestamp: url.searchParams.get("timestamp"),
        host: url.searchParams.get("host"),
        state: url.searchParams.get("state"),
      };
    };

    const onMessage = (event: MessageEvent) => {
      if (!isTrustedOAuthOrigin(event.origin, redirectUri)) return;

      if (event.data?.type === "OAUTH_CALLBACK" && event.data?.providerKey === "shopify") {
        cleanup();
        if (event.data.status === "success") {
          onPhaseChange?.("saving", "Shopify connected in the backend. Refreshing catalog...");
          resolve({ mode: "backend_connected" });
          return;
        }
        reject(new Error((event.data.message as string) || "Shopify connection failed."));
        return;
      }

      if (event.data?.type === "shopify_oauth" && event.data?.code) {
        onPhaseChange?.("received", "Shopify returned authorization. Saving the connection...");
        cleanup();
        resolve({
          mode: "frontend_exchange",
          payload: {
            code: event.data.code as string,
            shop: event.data.shop as string | null | undefined,
            hmac: event.data.hmac as string | null | undefined,
            timestamp: event.data.timestamp as string | null | undefined,
            host: event.data.host as string | null | undefined,
            state: event.data.state as string | null | undefined,
          },
        });
      }

      if (event.data?.type === "shopify_oauth" && event.data?.error) {
        cleanup();
        reject(
          new Error(
            (event.data.error_description as string) ||
              (event.data.error as string) ||
              "Shopify login was cancelled.",
          ),
        );
      }
    };

    const poll = window.setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          reject(new Error("Shopify window closed before AxoDesk received authorization."));
          return;
        }

        const href = popup.location.href;
        if (
          href?.includes("/workspace/settings/integrations") &&
          href.includes("oauthProvider=shopify")
        ) {
          const url = new URL(href);
          popup.close();
          cleanup();
          if (url.searchParams.get("oauthStatus") === "success") {
            resolve({ mode: "backend_connected" });
            return;
          }
          reject(new Error(url.searchParams.get("error") || "Shopify connection failed."));
          return;
        }

        const payload = readPayloadFromUrl(href);
        if (payload) {
          onPhaseChange?.("received", "Shopify returned authorization. Saving the connection...");
          popup.close();
          cleanup();
          resolve({ mode: "frontend_exchange", payload });
        }
      } catch {
        /* cross-origin until redirect */
      }
    }, 500);

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
  });
}

function isTrustedOAuthOrigin(origin: string, redirectUri?: string) {
  const redirectOrigin = readUrlOrigin(redirectUri);
  return origin === window.location.origin || origin === redirectOrigin;
}

function readUrlOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value, window.location.origin).origin;
  } catch {
    return null;
  }
}
