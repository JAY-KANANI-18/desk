// src/pages/meta/InstagramCallback.tsx

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function InstagramCallback() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "instagram_oauth",
          code,
          error
        },
        window.location.origin
      );
    }

    // Close popup after sending message
    window.close();
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      Connecting Instagram...
    </div>
  );
}