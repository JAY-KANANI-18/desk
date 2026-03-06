// src/components/ConnectInstagramButton.tsx

import React from "react";

const APP_ID = import.meta.env.VITE_META_APP_ID;
const REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI;

const scopes = [
  // "instagram_basic",
  // "instagram_manage_messages",
  // "pages_show_list",
  // "pages_manage_metadata"
  "instagram_business_basic",

"instagram_manage_comments",  
"instagram_business_manage_messages"
  // "business_management", "whatsapp_business_management", "whatsapp_business_messaging", "public_profile"
].join(",");

export default function ConnectInstagramButton() {

  const connectInstagram = () => {

    const oauthUrl =
      `https://www.facebook.com/v22.0/dialog/oauth` +
      `?client_id=${APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${scopes}` +
      `&response_type=code`;

    window.location.href = oauthUrl;
  };

  return (
    <button
      onClick={connectInstagram}
      style={{
        padding: "10px 16px",
        background: "#E1306C",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer"
      }}
    >
      Connect Instagram
    </button>
  );
}