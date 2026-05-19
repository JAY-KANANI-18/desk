import {
  INTEGRATION_METADATA,
  type IntegrationMetadata,
} from "../../../config/integrationMetadata";
import type { Integration } from "../types";

export interface IntegrationViewModel extends IntegrationMetadata {
  icon: string;
  routeId: string;
  connected: boolean;
  status: string;
  integrationId: string | null;
  routingChannelId: string | null;
  externalAccountId: string | null;
  externalAccountName: string | null;
  webhookPath: string | null;
  health: unknown;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastWebhookAt: string | null;
  actions: Integration["actions"];
  summary: Integration["summary"];
}

export const API_ROOT =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

function integrationViewModel(
  metadata: IntegrationMetadata,
  remote?: Integration | null,
): IntegrationViewModel {
  return {
    ...metadata,
    icon: metadata.simpleIconUrl,
    routeId: remote?.integrationId ?? metadata.id,
    connected: remote?.connected ?? false,
    status: remote?.status ?? metadata.availability,
    integrationId: remote?.integrationId ?? null,
    routingChannelId: remote?.routingChannelId ?? null,
    externalAccountId: remote?.externalAccountId ?? null,
    externalAccountName: remote?.externalAccountName ?? null,
    webhookPath: remote?.webhookPath ?? null,
    health: remote?.health ?? null,
    connectedAt: remote?.connectedAt ?? null,
    lastSyncedAt: remote?.lastSyncedAt ?? null,
    lastWebhookAt: remote?.lastWebhookAt ?? null,
    actions:
      remote?.actions ?? {
        connect: metadata.connectMode,
        disconnect: false,
        refresh: false,
        sync: false,
        providerActions: [],
        configure: metadata.availability === "available",
      },
    summary: remote?.summary ?? null,
  };
}

export function mergeIntegrationCatalog(remoteItems: Integration[] = []): IntegrationViewModel[] {
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));

  return INTEGRATION_METADATA.map((metadata) =>
    integrationViewModel(metadata, remoteById.get(metadata.id)),
  );
}

export function mergeIntegrationConnections(remoteItems: Integration[] = []): IntegrationViewModel[] {
  return remoteItems
    .map((remote) => {
      const metadata = INTEGRATION_METADATA.find((item) => item.id === remote.id);
      return metadata ? integrationViewModel(metadata, remote) : null;
    })
    .filter((item): item is IntegrationViewModel => item !== null);
}

export function statusLabel(integration: Pick<IntegrationViewModel, "connected" | "status" | "availability">) {
  if (integration.connected) return "Connected";
  if (integration.status === "error") return "Error";
  if (integration.status === "syncing") return "Connecting";
  if (integration.status === "expired") return "Expired";
  if (integration.availability === "planned") return "Planned";
  return "Available";
}

export function statusColor(integration: Pick<IntegrationViewModel, "connected" | "status" | "availability">) {
  if (integration.connected) return "tag-green";
  if (integration.status === "error") return "tag-red";
  if (integration.status === "syncing") return "tag-yellow";
  if (integration.status === "expired") return "tag-orange";
  if (integration.availability === "planned") return "tag-grey";
  return "tag-blue";
}

const CAPABILITY_LABELS: Record<string, string> = {
  api_key: "API key",
  auth: "Secure login",
  broadcast_audience: "Broadcast audiences",
  campaign_health: "Campaign updates",
  carts: "Abandoned carts",
  commerce: "Commerce",
  contact_enrichment: "Contact context",
  customers: "Customers",
  export: "Exports",
  lead_capture: "Lead capture",
  oauth: "Secure login",
  orders: "Orders",
  payment_links: "Payment links",
  payments: "Payments",
  products: "Products",
  refunds: "Refunds",
  row_sync: "Row sync",
  workflow_action: "Workflow actions",
  workflow_trigger: "Workflow triggers",
};

export function formatCapability(value: string) {
  const normalized = value.toLowerCase();
  if (CAPABILITY_LABELS[normalized]) {
    return CAPABILITY_LABELS[normalized];
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLogLabel(value: string) {
  return formatCapability(value.replace(/\./g, "_"));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function webhookUrlFor(integration: Pick<IntegrationViewModel, "webhookPath">) {
  return integration.webhookPath ? `${API_ROOT}${integration.webhookPath}` : null;
}

export function integrationInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

export function shopifyPhaseColor(phase: string) {
  if (phase === "connected") return "border-green-100 bg-green-50 text-green-800";
  if (phase === "failed") return "border-red-100 bg-red-50 text-red-800";
  return "border-blue-100 bg-blue-50 text-blue-800";
}

const BENEFIT_LABELS: Record<string, string> = {
  broadcast_audience: "Build broadcast audiences from this data",
  campaign_health: "See campaign activity in customer context",
  carts: "Follow up on abandoned carts",
  contact_enrichment: "Add source details to contacts",
  customers: "Keep customer profiles up to date",
  lead_capture: "Turn new leads into contacts",
  orders: "Show order history beside conversations",
  payment_links: "Send payment links from AxoDesk",
  payments: "Track payment updates",
  products: "Use product details in support and campaigns",
  refunds: "Track refunds and payment issues",
  workflow_action: "Use this tool in workflow actions",
  workflow_trigger: "Start workflows automatically",
};

export function integrationBenefits(integration: Pick<IntegrationViewModel, "capabilities">) {
  return integration.capabilities.map((capability) => {
    return BENEFIT_LABELS[capability] ?? formatCapability(capability);
  });
}
