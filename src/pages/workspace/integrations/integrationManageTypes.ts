import type { Integration } from "../types";

export type IntegrationEventLogItem = {
  id: string;
  resourceId?: string | null;
  provider: string;
  eventType: string;
  externalEventId?: string | null;
  status: string;
  summary?: IntegrationEventSummary | null;
  occurredAt?: string | null;
  processedAt?: string | null;
  error?: string | null;
  createdAt: string;
};

export type IntegrationEventSummary = {
  resourceType: "order" | "cart" | "customer";
  identifier?: string | null;
  customerLabel?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  itemCount?: number | null;
  itemPreview?: string | null;
  status?: string | null;
};

export type IntegrationJobLogItem = {
  id: string;
  resourceId?: string | null;
  type: string;
  status: string;
  attempts: number;
  maxRetries: number;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type IntegrationLogResponse<T> = {
  items?: T[];
  nextCursor?: string | null;
};

export type IntegrationResourceItem = {
  id: string;
  type: string;
  externalId: string;
  name?: string | null;
  status: string;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
};

export type IntegrationResourceResponse = {
  items?: IntegrationResourceItem[];
};

export type IntegrationsResponse = {
  integrations?: Integration[];
  connections?: Integration[];
};

export type ShopifySyncResource = "products" | "customers" | "orders" | "carts";

export type ShopifyBackfillState = {
  resources: Record<ShopifySyncResource, boolean>;
  since: string;
  until: string;
};

export const INTEGRATIONS_ROUTE = "/integrations";

export const SHOPIFY_SYNC_RESOURCES: Array<{ id: ShopifySyncResource; label: string }> = [
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "orders", label: "Orders" },
  { id: "carts", label: "Carts / checkouts" },
];
