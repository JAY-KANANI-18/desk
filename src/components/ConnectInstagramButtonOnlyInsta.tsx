import React, { useRef, useState } from "react";

interface Props {
  onSuccess?: (code: string) => void;
  onError?: (err: Error) => void;
}

export default function InstagramConnectButtonOnlyInsta({ onSuccess, onError }: Props) {
  const popupRef = useRef<Window | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    const clientId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    const redirectUri = (
      import.meta.env.VITE_META_REDIRECT_URI
    );

    const scope = encodeURIComponent(
      "instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages"
    );

    const url =
      `https://www.instagram.com/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=${scope}`;

    const popup = window.open(
      url,
      "instagram_oauth",
      "width=600,height=700"
    );

    if (!popup) {
      onError?.(new Error("Popup blocked"));
      return;
    }

    popupRef.current = popup;
    setLoading(true);

    const timer = setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(timer);
        setLoading(false);
        popupRef.current = null;
        onError?.(new Error("Instagram login cancelled"));
      }
    }, 500);

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // IMPORTANT: Validate origin for security
      console.log({event});
      

      if (event.data?.type === "instagram_oauth") {
        clearInterval(timer);
        window.removeEventListener("message", handler);

        popupRef.current?.close();
        popupRef.current = null;

        setLoading(false);

        if (event.data.code) {
          onSuccess?.(event.data.code);
        } else {
          onError?.(new Error("Instagram login failed"));
        }
      }
    };

    window.addEventListener("message", handler);
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-60"
    >
      {loading ? "Connecting..." : "Connect Instagram"}
    </button>
  );
}