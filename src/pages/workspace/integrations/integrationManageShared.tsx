import { useState } from "react";

import type { IntegrationViewModel } from "./integrationUi";
import { integrationInitials } from "./integrationUi";
import type { IntegrationResourceItem, ShopifySyncResource } from "./integrationManageTypes";

export type HealthRecord = Record<string, unknown>;

export function isMinimalIntegration(integration: IntegrationViewModel) {
  return integration.id === "shopify" || integration.id === "meta_ads";
}

export function IntegrationIcon({
  integration,
  compact = false,
}: {
  integration: IntegrationViewModel;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center ${
        compact ? "h-9 w-9" : "h-12 w-12"
      }`}
    >
      {imageFailed ? (
        <span className="text-xs font-semibold text-gray-500">
          {integrationInitials(integration.name)}
        </span>
      ) : (
        <img
          alt=""
          className={`${compact ? "h-8 w-8" : "h-9 w-9"} object-contain`}
          src={integration.simpleIconUrl}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

export function DetailTile({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-gray-900">{value}</p>
      {subValue ? <p className="mt-0.5 truncate text-xs text-gray-500">{subValue}</p> : null}
    </div>
  );
}

export function asHealthRecord(value: unknown): HealthRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as HealthRecord;
}

export function readHealthString(record: HealthRecord | null, key: string) {
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function readHealthNumber(record: HealthRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}

export function readResourceString(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function readResourceBoolean(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

export function resourcesOfType(resources: IntegrationResourceItem[], type: string) {
  return resources.filter((resource) => resource.type === type);
}

export function toDayStartIso(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

export function toDayEndIso(value: string) {
  return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;
}

export function integrationAccountLabel(integration: IntegrationViewModel) {
  return (
    integration.summary?.accountName ||
    integration.summary?.shopName ||
    integration.summary?.shopDomain ||
    integration.name
  );
}

export function integrationConnectionNoun(integration: IntegrationViewModel) {
  if (integration.id === "shopify") return "store";
  if (integration.id === "meta_ads") return "ad account";
  if (integration.providerCategory === "crm") return "CRM";
  if (integration.providerCategory === "payments") return "payment provider";
  return "tool";
}

export function friendlyHealthStateLabel(state: string) {
  const normalized = state.toLowerCase();
  if (normalized === "ok" || normalized === "connected") return "Looks good";
  if (normalized === "warning") return "Needs setup";
  if (normalized === "error" || normalized === "failed") return "Needs attention";
  return state
    .replace(/\./g, "_")
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function friendlyHealthColor(state: string) {
  const normalized = state.toLowerCase();
  if (normalized === "ok" || normalized === "connected") return "tag-green";
  if (normalized === "warning") return "tag-yellow";
  if (normalized === "error" || normalized === "failed") return "tag-red";
  return "tag-blue";
}

export function friendlyHealthMessage(message: string | null, integration: IntegrationViewModel) {
  if (!message) return null;
  if (
    message.includes("WEBHOOK_BASE_URL") ||
    message.includes("PUBLIC_API_BASE_URL") ||
    message.includes("BACKEND_PUBLIC_URL")
  ) {
    return `${integration.name} can sync existing data, but live updates need a public backend URL before webhooks can be enabled.`;
  }
  return message;
}

export function totalShopifyRecords(totals: HealthRecord | null) {
  if (!totals) return null;
  return [
    readHealthNumber(totals, "products") ?? 0,
    readHealthNumber(totals, "customers") ?? 0,
    readHealthNumber(totals, "orders") ?? 0,
    readHealthNumber(totals, "carts") ?? 0,
  ].reduce((sum, count) => sum + count, 0);
}

export function shopifyRecordTotals(integration: IntegrationViewModel) {
  const health = asHealthRecord(integration.health);
  const initialSync = asHealthRecord(health?.initialSync);
  const backfill = asHealthRecord(health?.backfill);
  return asHealthRecord(backfill?.totals) ?? asHealthRecord(initialSync?.totals);
}

export function shopifyResourceCountLabel(totals: HealthRecord | null, resource: ShopifySyncResource) {
  const count = readHealthNumber(totals, resource);
  return count == null ? "Not available" : count.toLocaleString();
}

export function friendlyActionLabel(action: { key: string; label: string }, integration: IntegrationViewModel) {
  if (action.key === "test_connection") return "Check connection";
  if (action.key === "refresh_sources") {
    return integration.id === "meta_ads" ? "Refresh lead sources" : "Refresh sources";
  }
  if (action.key === "resubscribe_webhooks") return "Reconnect live updates";
  return action.label;
}

export function shopifyStoreUrl(integration: IntegrationViewModel) {
  const shop = integration.summary?.shopDomain || integration.summary?.shopName;
  return shop ? `https://${shop.replace(/^https?:\/\//i, "")}` : "-";
}
