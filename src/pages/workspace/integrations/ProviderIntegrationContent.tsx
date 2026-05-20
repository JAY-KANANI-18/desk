import type { ReactNode } from "react";

import type { IntegrationTabId } from "../../../config/integrationMetadata";
import { isShopifyDataTab } from "./ShopifyDataTab";

export function ShopifyIntegrationContent({
  connected,
  activeTab,
  connectView,
  dataView,
  settingsView,
  activityView,
}: {
  connected: boolean;
  activeTab: IntegrationTabId;
  connectView: ReactNode;
  dataView: ReactNode;
  settingsView: ReactNode;
  activityView: ReactNode;
}) {
  if (!connected) return <>{connectView}</>;
  if (isShopifyDataTab(activeTab)) return <>{dataView}</>;
  if (activeTab === "settings") return <>{settingsView}</>;
  if (activeTab === "activity") return <>{activityView}</>;
  return null;
}

export function MetaAdsIntegrationContent({
  connected,
  activeTab,
  connectView,
  settingsView,
  activityView,
}: {
  connected: boolean;
  activeTab: IntegrationTabId;
  connectView: ReactNode;
  settingsView: ReactNode;
  activityView: ReactNode;
}) {
  if (!connected) return <>{connectView}</>;
  if (activeTab === "settings") return <>{settingsView}</>;
  if (activeTab === "activity") return <>{activityView}</>;
  return null;
}
