import { useState } from "react";
import { connectMetaChannel } from "../integrations/meta/meta-channels";
import type { MetaChannel } from "../integrations/meta/meta-types";

interface Props {
  channel: MetaChannel;
  onSuccess: (auth: any) => void;
}

export default function MetaConnectButton({ channel, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const auth = await connectMetaChannel(channel);
      onSuccess(auth);
    } catch (e: any) {
      setError(e.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#1877F2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Connecting..." : `Connect ${channel}`}
      </button>

      {error && (
        <div style={{ marginTop: 8, color: "red", fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}