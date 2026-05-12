import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useWorkspace } from "./WorkspaceContext";

export interface FeatureFlags {
  aiAgents: boolean;
  lifecycle: boolean;
}

export type FeatureFlagName = keyof FeatureFlags;

interface FeatureFlagContextType {
  flags: FeatureFlags;
  loading: boolean;
  refresh: () => Promise<void>;
}

interface FeatureGateProps {
  flag: FeatureFlagName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DEFAULT_FLAGS: FeatureFlags = {
  aiAgents: false,
  lifecycle: false,
};

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeWorkspace } = useWorkspace();

  const flags = useMemo<FeatureFlags>(
    () => ({
      aiAgents: Boolean(activeWorkspace?.features?.aiAgentsEnabled),
      lifecycle: Boolean(activeWorkspace?.features?.lifecycleEnabled),
    }),
    [
      activeWorkspace?.features?.aiAgentsEnabled,
      activeWorkspace?.features?.lifecycleEnabled,
    ],
  );

  const refresh = useCallback(async () => undefined, []);

  const value = useMemo(
    () => ({
      flags,
      loading: false,
      refresh,
    }),
    [flags, refresh],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const FeatureFlagsProvider = FeatureFlagProvider;

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used inside FeatureFlagProvider");
  }
  return ctx;
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  flag,
  children,
  fallback = null,
}) => {
  const { flags } = useFeatureFlags();
  return flags[flag] ? <>{children}</> : <>{fallback}</>;
};

export { DEFAULT_FLAGS as defaultFeatureFlags };
