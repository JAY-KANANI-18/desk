// src/pages/meta/InstagramCallback.tsx

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChannelApi } from "../lib/channelApi";

export default function InstagramCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");

    const run = async () => {
      if (error) {
        handleError(error);
        return;
      }

      if (!code) return;

      try {
        // ✅ Call backend directly
        const redirectUri = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI;

        const result = await ChannelApi.exchangeInstagramCode(
          code,
          redirectUri,
        );

        // ✅ Desktop: notify opener
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "instagram_oauth_success",
              channel: result.channel,
            },
            window.location.origin,
          );

          window.close();
          return;
        }

        // ✅ Mobile: redirect back to app
        window.location.href = "/channels?connected=instagram";
      } catch (e: any) {
        handleError(e.message);
      }
    };

    const handleError = (message: string) => {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "instagram_oauth_error",
            error: message,
          },
          window.location.origin,
        );
        window.close();
      } else {
        window.location.href = `/channels?error=${encodeURIComponent(message)}`;
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      Connecting Instagram...
    </div>
  );
}
