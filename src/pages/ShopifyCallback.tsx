import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "@/components/ui/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { workspaceApi } from "../lib/workspaceApi";
import { useWorkspace } from "../context/WorkspaceContext";

type ShopifyCallbackPayload = {
  type: "shopify_oauth";
  code: string | null;
  shop: string | null;
  hmac: string | null;
  timestamp: string | null;
  host: string | null;
  state: string | null;
  error: string | null;
  error_description: string | null;
};

function readWorkspaceIdFromState(state: string | null) {
  if (!state) return null;
  const parseState = (value: string) => {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const workspaceId = (parsed as { workspaceId?: unknown }).workspaceId;
    return typeof workspaceId === "string" && workspaceId.trim() ? workspaceId : null;
  };

  try {
    return parseState(state);
  } catch {
    try {
      return parseState(decodeURIComponent(state));
    } catch {
      return null;
    }
  }
}

export default function ShopifyCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [statusText, setStatusText] = useState("Returning Shopify authorization to AxoDesk...");
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");
  const payload = useMemo<ShopifyCallbackPayload>(
    () => ({
      type: "shopify_oauth",
      code: params.get("code"),
      shop: params.get("shop"),
      hmac: params.get("hmac"),
      timestamp: params.get("timestamp"),
      host: params.get("host"),
      state: params.get("state"),
      error: params.get("error"),
      error_description: params.get("error_description"),
    }),
    [params],
  );

  const closeOrReturn = () => {
    window.close();
    navigate("/workspace/settings/integrations", { replace: true });
  };

  useEffect(() => {
    const closeButtonTimer = window.setTimeout(() => {
      setShowCloseButton(true);
    }, 900);

    if (window.opener) {
      window.opener.postMessage(payload, window.location.origin);
      if (payload.error) {
        setStatusTone("error");
        setStatusText("Shopify returned an error. AxoDesk will show the details in the main window.");
      } else {
        setStatusTone("success");
        setStatusText("Authorization received. AxoDesk is saving the Shopify connection now.");
      }
      const closeTimer = window.setTimeout(() => {
        window.close();
      }, 1400);

      return () => {
        window.clearTimeout(closeButtonTimer);
        window.clearTimeout(closeTimer);
      };
    }

    if (payload.error) {
      setStatusTone("error");
      setStatusText(
        payload.error_description || payload.error || "Shopify returned an error before authorization completed.",
      );
      return () => {
        window.clearTimeout(closeButtonTimer);
      };
    }

    if (!payload.code) {
      setStatusTone("error");
      setStatusText("Shopify did not return an authorization code. Start the connection again.");
      return () => {
        window.clearTimeout(closeButtonTimer);
      };
    }

    const workspaceId = readWorkspaceIdFromState(payload.state) ?? activeWorkspace?.id ?? null;
    if (!workspaceId) {
      setStatusTone("info");
      setStatusText("Preparing workspace context before saving the Shopify connection...");
      return () => {
        window.clearTimeout(closeButtonTimer);
      };
    }

    const exchangeKey = `shopify-oauth:${payload.shop ?? "unknown"}:${payload.code}`;
    if (window.sessionStorage.getItem(exchangeKey) === "completed") {
      setStatusTone("success");
      setStatusText("Shopify is already connected. Returning to integrations...");
      const returnTimer = window.setTimeout(closeOrReturn, 1200);
      return () => {
        window.clearTimeout(closeButtonTimer);
        window.clearTimeout(returnTimer);
      };
    }

    if (window.sessionStorage.getItem(exchangeKey) === "started") {
      setStatusTone("info");
      setStatusText("AxoDesk is already saving this Shopify authorization...");
      return () => {
        window.clearTimeout(closeButtonTimer);
      };
    }

    let cancelled = false;
    window.sessionStorage.setItem(exchangeKey, "started");
    setStatusTone("info");
    setStatusText("Original popup window was unavailable. Saving Shopify connection directly...");

    void workspaceApi
      .exchangeShopifyOAuthCode(
        {
          code: payload.code,
          shop: payload.shop,
          hmac: payload.hmac,
          timestamp: payload.timestamp,
          host: payload.host,
          state: payload.state,
        },
        workspaceId,
      )
      .then(() => {
        if (cancelled) return;
        window.sessionStorage.setItem(exchangeKey, "completed");
        setStatusTone("success");
        setStatusText("Shopify is connected. Returning to integrations...");
        window.setTimeout(closeOrReturn, 1400);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        window.sessionStorage.removeItem(exchangeKey);
        setStatusTone("error");
        setStatusText(error instanceof Error ? error.message : "Shopify connection failed.");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(closeButtonTimer);
    };
  }, [activeWorkspace?.id, navigate, payload]);

  const toneClass =
    statusTone === "success"
      ? "bg-green-50 text-green-800 border-green-100"
      : statusTone === "error"
        ? "bg-red-50 text-red-800 border-red-100"
        : "bg-blue-50 text-blue-800 border-blue-100";

  return (
    <div className="flex min-h-[260px] items-center justify-center bg-[var(--color-gray-50)] px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-gray-200)] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <Loader2 size={20} className="animate-spin" />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-[var(--color-gray-900)]">
          Finishing Shopify connection
        </h1>
        <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${toneClass}`}>
          {statusText}
        </p>

        {showCloseButton ? (
          <div className="mt-5">
            <Button type="button" variant="secondary" onClick={closeOrReturn}>
              Return to integrations
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
