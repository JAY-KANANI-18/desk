import { useState, useEffect, useCallback } from "react";

import { SectionError } from "../components/SectionError";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import type { Integration } from "../types";

const API_ROOT =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

function waitForMetaAdsOAuthPopup(popup: Window): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Facebook login timed out. Please try again."));
    }, 5 * 60 * 1000);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "meta_ads_oauth" && event.data?.code) {
        cleanup();
        resolve(event.data.code as string);
      }
      if (event.data?.type === "meta_ads_oauth" && event.data?.error) {
        cleanup();
        reject(
          new Error(
            (event.data.error_description as string) ||
              (event.data.error as string) ||
              "Facebook login was cancelled."
          )
        );
      }
    };

    const poll = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          reject(new Error("Login window was closed."));
          return;
        }
        const href = popup.location.href;
        if (href?.includes("code=")) {
          const code = new URL(href).searchParams.get("code");
          if (code) {
            popup.close();
            cleanup();
            resolve(code);
          }
        }
      } catch {
        /* cross-origin until redirect */
      }
    }, 500);

    const cleanup = () => {
      clearTimeout(timeout);
      clearInterval(poll);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
  });
}

export const Integrations = () => {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workspaceApi.getIntegrations();
      const list = (res as { integrations?: Integration[] })?.integrations ?? [];
      setItems(list);
    } catch {
      setError("Failed to load integrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connectMetaAds = async () => {
    setBusyId("meta_ads");
    try {
      const start = (await workspaceApi.getMetaAdsOAuthUrl()) as {
        url: string;
        redirectUri?: string;
      };
      if (!start?.url) throw new Error("Could not start Facebook login.");

      const popup = window.open(start.url, "meta_ads_oauth", "width=600,height=720,scrollbars=yes");
      if (!popup) throw new Error("Popup blocked. Allow popups for this site and try again.");

      const code = await waitForMetaAdsOAuthPopup(popup);
      await workspaceApi.exchangeMetaAdsOAuthCode(code);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Meta Ads connection failed.");
    } finally {
      setBusyId(null);
    }
  };

  const disconnectMetaAds = async () => {
    setBusyId("meta_ads");
    try {
      await workspaceApi.disconnectMetaAdsIntegration();
      await load();
    } catch {
      setError("Failed to disconnect Meta Ads.");
    } finally {
      setBusyId(null);
    }
  };

  const refreshMetaAds = async () => {
    setBusyId("meta_ads_refresh");
    try {
      await workspaceApi.getMetaAdsStatus();
      await load();
    } catch {
      /* non-fatal */
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <DataLoader type={"integrations"} />;
  if (error && items.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-sm text-gray-600 max-w-2xl">
        Integrations extend your workspace with advertising and analytics capabilities. They are separate
        from messaging channels — use{" "}
        <a href="/channels" className="text-indigo-600 hover:underline">
          Channels
        </a>{" "}
        for WhatsApp, SMS, email, and similar.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((int) => (
          <div
            key={int.id}
            className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100 flex-shrink-0">
                {int.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{int.name}</p>
                <span className="text-xs text-gray-400">{int.category}</span>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{int.desc}</p>
              </div>
            </div>

            {int.id === "meta_ads" && int.connected && int.routingChannelId && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-2 text-xs text-gray-700">
                <p className="font-medium text-gray-800">Webhook URL</p>
                <code className="block break-all text-[11px] text-indigo-800 bg-white border border-slate-200 rounded px-2 py-1.5">
                  {API_ROOT}/api/integrations/meta-ads/webhook/{int.routingChannelId}
                </code>
                <p className="text-gray-500">
                  Point Meta lead ads or Conversions API forwarding here so clicks and leads create inbox
                  activity and workflow triggers.
                </p>
              </div>
            )}

            {int.id === "meta_ads" && int.connected && int.summary && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-gray-100 px-3 py-2">
                  <p className="text-gray-400">Ad account</p>
                  <p className="font-medium text-gray-900 truncate">{int.summary.accountName || "—"}</p>
                  <p className="text-gray-500 font-mono truncate">{int.summary.accountId || ""}</p>
                </div>
                <div className="rounded-lg border border-gray-100 px-3 py-2">
                  <p className="text-gray-400">Campaigns</p>
                  <p className="font-medium text-gray-900">
                    {int.summary.campaignCount != null ? int.summary.campaignCount : "—"}
                  </p>
                  <p className="text-gray-500">{int.summary.currency || ""}</p>
                </div>
                <div className="col-span-2 rounded-lg border border-gray-100 px-3 py-2">
                  <p className="text-gray-400">Status</p>
                  <p className="font-medium text-gray-900">{int.summary.accountStatus || "—"}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {int.id === "meta_ads" && (
                <>
                  {!int.connected ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        connectMetaAds();
                      }}
                      disabled={busyId !== null}
                      className="text-xs px-4 py-2 rounded-lg font-medium bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:opacity-50"
                    >
                      {busyId === "meta_ads" ? "Connecting…" : "Continue with Facebook"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          refreshMetaAds();
                        }}
                        disabled={busyId !== null}
                        className="text-xs px-3 py-2 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {busyId === "meta_ads_refresh" ? "Refreshing…" : "Refresh stats"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          disconnectMetaAds();
                        }}
                        disabled={busyId !== null}
                        className="text-xs px-3 py-2 rounded-lg font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {busyId === "meta_ads" ? "…" : "Disconnect"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
