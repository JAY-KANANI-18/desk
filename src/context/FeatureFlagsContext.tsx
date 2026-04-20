import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { aiAgentsApi } from "../lib/aiAgentsApi";
import { useAuth } from "./AuthContext";

type FeatureFlags = {
  aiAgents: boolean;
};

type FeatureFlagsContextType = {
  flags: FeatureFlags;
  loading: boolean;
  refresh: () => Promise<void>;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

const defaultFlags: FeatureFlags = {
  aiAgents: false,
};

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFlags(defaultFlags);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await aiAgentsApi.features();
      setFlags({
        aiAgents: Boolean(result?.aiAgents),
      });
    } catch {
      setFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ flags, loading, refresh }), [flags, loading, refresh]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used inside FeatureFlagsProvider");
  return ctx;
};
