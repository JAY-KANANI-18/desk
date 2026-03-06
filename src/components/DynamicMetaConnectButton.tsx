import React, { useEffect } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

const API_URL = import.meta.env.VITE_API_URL;

type Props = {
  workspaceId: string;
  onConnected?: () => void; // callback to refresh channels
};

export default function ConnectWhatsAppButtonPage({
  onConnected,
}: Props) {

  const openPopup = () => {
    const width = 600;
    const height = 700;

    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const { activeWorkspace } = useWorkspace();

    const url = `${API_URL}/whatsapp/oauth?workspaceId=${activeWorkspace?.id}`;

    window.open(
      url,
      "meta-oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "WHATSAPP_CONNECTED") {
        console.log("WhatsApp connected!");

        if (onConnected) {
          onConnected();
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onConnected]);

  return (
    <button
      onClick={openPopup}
      style={{
        padding: "10px 16px",
        background: "#25D366",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Connect WhatsApp
    </button>
  );
}