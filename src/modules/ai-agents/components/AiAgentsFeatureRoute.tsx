import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";

export function AiAgentsFeatureRoute({ children }: { children: React.ReactNode }) {
  const { flags, loading } = useFeatureFlags();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-slate-500">
        <Loader2 size={16} className="mr-2 animate-spin" />
        Checking AI Agents availability...
      </div>
    );
  }

  if (!flags.aiAgents) {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
}
