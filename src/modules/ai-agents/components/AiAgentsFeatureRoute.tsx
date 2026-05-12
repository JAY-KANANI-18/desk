import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "@/components/ui/icons";
import { FeatureGate, useFeatureFlags } from "../../../context/FeatureFlagContext";

export function AiAgentsFeatureRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useFeatureFlags();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-slate-500">
        <Loader2 size={16} className="mr-2 animate-spin" />
        Checking AI Agents availability...
      </div>
    );
  }

  return (
    <FeatureGate flag="aiAgents" fallback={<Navigate to="/inbox" replace />}>
      {children}
    </FeatureGate>
  );
}
