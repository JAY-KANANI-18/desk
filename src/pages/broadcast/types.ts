import type { BroadcastRunRow } from "../../lib/broadcastApi";

export type TagRow = {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  description?: string | null;
};

export type LifecycleRow = {
  id: string;
  name: string;
  type?: string;
  emoji?: string | null;
};

export type BroadcastFormState = {
  name: string;
  channelId: string;
  text: string;
  tagIds: string[];
  lifecycleId: string;
  respectMarketingOptOut: boolean;
  commerce: BroadcastCommerceAudienceState;
  limit: number;
  scheduleMode: "now" | "later";
  scheduledAt: string;
};

export type BroadcastCommerceAudienceMode = "all" | "abandoned_cart" | "purchased";

export type BroadcastPurchasedStatus = "paid" | "fulfilled" | "created" | "cancelled";

export type BroadcastCommerceAudienceState = {
  mode: BroadcastCommerceAudienceMode;
  abandonedCartOlderThanMinutes: number;
  abandonedCartMinTotalAmount: string;
  purchasedSince: string;
  purchasedMinTotalAmount: string;
  purchasedStatuses: BroadcastPurchasedStatus[];
};

export type BroadcastDraftState = {
  name: string;
  scheduledAt: string;
};

export type BroadcastAudiencePreviewState = {
  totalMatching: number;
  sample: Array<{ name: string; identifier: string }>;
};

export type BroadcastTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  status?: string;
  variables: unknown;
  components?: unknown;
};

export type BroadcastStatusFilter = {
  name: string;
  color: string;
};

export type BroadcastSortableField = "name" | "scheduledAt" | "status";

export type BroadcastViewMode = "table" | "calendar";

export type CalendarEventsByDate = Record<string, BroadcastRunRow[]>;
