const ENABLED_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

function readBooleanEnv(value: unknown) {
  return typeof value === "string" && ENABLED_VALUES.has(value.trim().toLowerCase());
}

export const featureFlags = {
  workflowAiBuilder: readBooleanEnv(import.meta.env.VITE_WORKFLOW_AI_BUILDER_ENABLED),
  shopifyIntegration: readBooleanEnv(import.meta.env.VITE_SHOPIFY_FEATURE_ENABLED),
  metaAdsIntegration: readBooleanEnv(import.meta.env.VITE_META_ADS_FEATURE_ENABLED),
} as const;
