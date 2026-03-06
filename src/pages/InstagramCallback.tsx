// src/pages/meta/InstagramCallback.tsx

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function InstagramCallback() {

  const [params] = useSearchParams();

  useEffect(() => {

    const code = params.get("code");
    localStorage.setItem("instagram_oauth_code", code || "");
    console.log({codeeeeeeeeeeeee:code});
    

    if (!code) return;

    fetch("/api/meta/instagram/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    });

  }, []);

  return <div>Connecting Instagram...</div>;
}