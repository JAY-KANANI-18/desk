import type { ReactNode } from "react";
import { Loader2, RefreshCcw, RefreshCw } from "@/components/ui/icons";

import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";
import { formatDateTime, formatLogLabel, type IntegrationViewModel } from "./integrationUi";
import { readResourceString } from "./integrationManageShared";
import type {
  IntegrationEventLogItem,
  IntegrationJobLogItem,
  IntegrationResourceItem,
} from "./integrationManageTypes";

function logStatusColor(status: string) {
  const normalized = status.toLowerCase();
  if (["failed", "error"].includes(normalized)) return "tag-red";
  if (["completed", "processed", "sent", "connected"].includes(normalized)) return "tag-green";
  if (["processing", "pending", "received"].includes(normalized)) return "tag-blue";
  if (["cancelled", "skipped"].includes(normalized)) return "tag-grey";
  return "tag-blue";
}

function formatShopifyMoney(value?: number | null, currency?: string | null) {
  if (value == null) return null;
  const normalizedCurrency = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${normalizedCurrency} ${(value / 100).toFixed(2)}`;
  }
}

function compactDetails(parts: Array<string | null | undefined>) {
  const clean = parts.filter((part): part is string => Boolean(part));
  return clean.length > 0 ? clean.join(" | ") : "Details are not available yet.";
}

function shopifyOrderAction(eventType: string) {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("order") && normalized.includes("paid")) {
    return "paid";
  }
  if (normalized.includes("order") && normalized.includes("fulfilled")) {
    return "fulfilled";
  }
  if (normalized.includes("order") && normalized.includes("cancel")) {
    return "cancelled";
  }
  return "updated";
}

function shopifyEventLabel(event: IntegrationEventLogItem) {
  const normalized = event.eventType.toLowerCase();
  const summary = event.summary;
  const money = formatShopifyMoney(summary?.totalAmount, summary?.currency);
  const identifier = summary?.identifier || event.externalEventId || null;

  if (normalized.includes("order")) {
    const action = shopifyOrderAction(event.eventType);
    const readableId = identifier ? ` ${identifier}` : "";
    return {
      title: `Order${readableId} ${action}`,
      detail: compactDetails([
        money,
        summary?.customerLabel,
        summary?.itemPreview,
        summary?.status ? `Status: ${formatLogLabel(summary.status)}` : null,
      ]),
    };
  }
  if (normalized.includes("customer")) {
    const customerName = summary?.customerLabel || identifier;
    return {
      title: customerName
        ? `${normalized.includes("created") ? "New customer" : "Customer updated"}: ${customerName}`
        : normalized.includes("created") ? "New customer" : "Customer updated",
      detail: compactDetails([
        summary?.itemCount != null ? `${summary.itemCount} orders` : null,
        money ? `${money} total spent` : null,
        summary?.status ? `Status: ${formatLogLabel(summary.status)}` : null,
      ]),
    };
  }
  if (normalized.includes("cart") || normalized.includes("checkout")) {
    const itemCopy =
      summary?.itemCount == null
        ? null
        : `${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"}`;
    return {
      title: normalized.includes("abandoned") ? "Abandoned cart" : "Cart updated",
      detail: compactDetails([
        itemCopy,
        money,
        summary?.customerLabel,
        summary?.itemPreview,
        summary?.status ? `Status: ${formatLogLabel(summary.status)}` : null,
      ]),
    };
  }
  if (normalized.includes("product")) {
    return {
      title: identifier
        ? `${normalized.includes("created") ? "New product" : "Product updated"}: ${identifier}`
        : normalized.includes("created") ? "New product" : "Product updated",
      detail: "Product details changed in Shopify.",
    };
  }
  return {
    title: formatLogLabel(event.eventType).replace(/^Commerce\s+/i, ""),
    detail: identifier ? `Shopify reference: ${identifier}` : "Shopify sent an update to AxoDesk.",
  };
}

function shopifyEventStatus(status: string) {
  const normalized = status.toLowerCase();
  if (["failed", "error"].includes(normalized)) {
    return { label: "Needs attention", color: "tag-red" };
  }
  if (["pending", "processing", "received"].includes(normalized)) {
    return { label: "In progress", color: "tag-blue" };
  }
  if (["cancelled", "skipped"].includes(normalized)) {
    return { label: "Skipped", color: "tag-grey" };
  }
  if (["projected", "processed", "completed", "sent", "connected"].includes(normalized)) {
    return { label: "Added to AxoDesk", color: "tag-green" };
  }
  return { label: formatLogLabel(status), color: logStatusColor(status) };
}

function ShopifyActivityTab({
  logsLoading,
  logsError,
  eventLogs,
  eventNextCursor,
  replayingEventId,
  onReload,
  onLoadMoreEvents,
  onReplayEvent,
}: {
  logsLoading: boolean;
  logsError: string | null;
  eventLogs: IntegrationEventLogItem[];
  eventNextCursor: string | null;
  replayingEventId: string | null;
  onReload: () => void;
  onLoadMoreEvents: () => void;
  onReplayEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={onReload}
          variant="secondary"
          size="sm"
          loading={logsLoading}
          loadingMode="inline"
          loadingLabel="Loading..."
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {logsError ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {logsError}
        </p>
      ) : null}

      <section className="settings-row-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Recent store activity</p>
            <p className="mt-1 text-sm text-gray-500">
              Helpful Shopify updates AxoDesk has received for this store.
            </p>
          </div>
          <span className="text-xs text-gray-400">{eventLogs.length} recent</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          {logsLoading ? (
            <div className="flex items-center gap-2 px-3 py-5 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading activity...
            </div>
          ) : eventLogs.length > 0 ? (
            eventLogs.map((event) => {
              const label = shopifyEventLabel(event);
              const status = shopifyEventStatus(event.status);
              const canRetry = ["failed", "error"].includes(event.status.toLowerCase());

              return (
                <div
                  key={event.id}
                  className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_170px_160px_96px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{label.detail}</p>
                    {event.error ? (
                      <p className="mt-1 text-xs text-red-600">{event.error}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 sm:justify-self-start">
                    <Tag label={status.label} bgColor={status.color} size="sm" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(event.processedAt || event.occurredAt || event.createdAt)}
                  </p>
                  <div className="flex min-h-9 justify-start sm:justify-end">
                    {canRetry ? (
                      <Button
                        onClick={() => onReplayEvent(event.id)}
                        variant="secondary"
                        size="2xs"
                        loading={replayingEventId === event.id}
                        loadingMode="inline"
                        loadingLabel="Trying..."
                      >
                        Try again
                      </Button>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-5 text-sm text-gray-500">
              No Shopify activity yet. New orders, customers, products, and carts will appear here.
            </div>
          )}
        </div>

        {eventNextCursor ? (
          <div className="mt-3 flex justify-end">
            <Button
              onClick={onLoadMoreEvents}
              variant="secondary"
              size="xs"
              loading={logsLoading}
              loadingMode="inline"
              loadingLabel="Loading..."
            >
              Load more
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function metaAdsEventLabel(event: IntegrationEventLogItem, resources: IntegrationResourceItem[]) {
  const source = event.resourceId
    ? resources.find((resource) => resource.id === event.resourceId)
    : null;
  const sourceLabel =
    source?.name ??
    readResourceString(source?.settings, "sourceLabel") ??
    readResourceString(source?.metadata, "pageName");
  const leadId = event.externalEventId ? `Lead ${event.externalEventId}` : null;

  return {
    title: formatLogLabel(event.eventType).toLowerCase().includes("lead")
      ? "New lead received"
      : formatLogLabel(event.eventType),
    detail: compactDetails([
      sourceLabel ? `Source: ${sourceLabel}` : null,
      leadId,
      event.error,
    ]),
  };
}

function MetaAdsActivityTab({
  logsLoading,
  logsError,
  eventLogs,
  eventNextCursor,
  replayingEventId,
  resources,
  onReload,
  onLoadMoreEvents,
  onReplayEvent,
}: {
  logsLoading: boolean;
  logsError: string | null;
  eventLogs: IntegrationEventLogItem[];
  eventNextCursor: string | null;
  replayingEventId: string | null;
  resources: IntegrationResourceItem[];
  onReload: () => void;
  onLoadMoreEvents: () => void;
  onReplayEvent: (eventId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={onReload}
          variant="secondary"
          size="sm"
          loading={logsLoading}
          loadingMode="inline"
          loadingLabel="Loading..."
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {logsError ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {logsError}
        </p>
      ) : null}

      <section className="settings-row-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Recent lead activity</p>
            <p className="mt-1 text-sm text-gray-500">
              Meta lead form submissions AxoDesk has received.
            </p>
          </div>
          <span className="text-xs text-gray-400">{eventLogs.length} recent</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          {logsLoading ? (
            <div className="flex items-center gap-2 px-3 py-5 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading lead activity...
            </div>
          ) : eventLogs.length > 0 ? (
            eventLogs.map((event) => {
              const label = metaAdsEventLabel(event, resources);
              const failed = ["failed", "error"].includes(event.status.toLowerCase());
              const status = failed
                ? { label: "Needs attention", color: "tag-red" }
                : ["received", "processing", "pending"].includes(event.status.toLowerCase())
                  ? { label: "Received", color: "tag-blue" }
                  : { label: "Added to AxoDesk", color: "tag-green" };

              return (
                <div
                  key={event.id}
                  className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_150px_160px_96px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{label.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{label.detail}</p>
                  </div>
                  <div className="min-w-0 sm:justify-self-start">
                    <Tag label={status.label} bgColor={status.color} size="sm" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(event.processedAt || event.occurredAt || event.createdAt)}
                  </p>
                  <div className="flex min-h-9 justify-start sm:justify-end">
                    {failed ? (
                      <Button
                        onClick={() => onReplayEvent(event.id)}
                        variant="secondary"
                        size="2xs"
                        loading={replayingEventId === event.id}
                        loadingMode="inline"
                        loadingLabel="Trying..."
                      >
                        Try again
                      </Button>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-5 text-sm text-gray-500">
              No leads yet. New Meta lead form submissions will appear here.
            </div>
          )}
        </div>

        {eventNextCursor ? (
          <div className="mt-3 flex justify-end">
            <Button
              onClick={onLoadMoreEvents}
              variant="secondary"
              size="xs"
              loading={logsLoading}
              loadingMode="inline"
              loadingLabel="Loading..."
            >
              Load more
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function ActivityTab({
  integration,
  resources,
  logsLoading,
  logsError,
  eventLogs,
  jobLogs,
  eventNextCursor,
  jobNextCursor,
  replayingEventId,
  retryingJobId,
  onReload,
  onLoadMoreEvents,
  onLoadMoreJobs,
  onReplayEvent,
  onRetryJob,
}: {
  integration: IntegrationViewModel;
  resources: IntegrationResourceItem[];
  logsLoading: boolean;
  logsError: string | null;
  eventLogs: IntegrationEventLogItem[];
  jobLogs: IntegrationJobLogItem[];
  eventNextCursor: string | null;
  jobNextCursor: string | null;
  replayingEventId: string | null;
  retryingJobId: string | null;
  onReload: () => void;
  onLoadMoreEvents: () => void;
  onLoadMoreJobs: () => void;
  onReplayEvent: (eventId: string) => void;
  onRetryJob: (jobId: string) => void;
}) {
  if (!integration.integrationId) {
    return (
      <div className="settings-empty-panel">
        <p className="text-sm font-medium text-gray-700">No activity yet</p>
        <p className="mt-1 text-sm text-gray-500">Activity starts after the provider is connected.</p>
      </div>
    );
  }

  if (integration.id === "shopify") {
    return (
      <ShopifyActivityTab
        logsLoading={logsLoading}
        logsError={logsError}
        eventLogs={eventLogs}
        eventNextCursor={eventNextCursor}
        replayingEventId={replayingEventId}
        onReload={onReload}
        onLoadMoreEvents={onLoadMoreEvents}
        onReplayEvent={onReplayEvent}
      />
    );
  }

  if (integration.id === "meta_ads") {
    return (
      <MetaAdsActivityTab
        logsLoading={logsLoading}
        logsError={logsError}
        eventLogs={eventLogs}
        eventNextCursor={eventNextCursor}
        replayingEventId={replayingEventId}
        resources={resources}
        onReload={onReload}
        onLoadMoreEvents={onLoadMoreEvents}
        onReplayEvent={onReplayEvent}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={onReload}
          variant="secondary"
          size="sm"
          loading={logsLoading}
          loadingMode="inline"
          loadingLabel="Loading..."
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh activity
        </Button>
      </div>

      {logsError ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {logsError}
        </p>
      ) : null}

      <LogList
        title="Events"
        loading={logsLoading}
        emptyLabel="No events yet."
        items={eventLogs.map((event) => ({
          id: event.id,
          title: formatLogLabel(event.eventType),
          detail: event.externalEventId || event.id,
          status: formatLogLabel(event.status),
          statusColor: logStatusColor(event.status),
          error: event.error,
          date: formatDateTime(event.processedAt || event.occurredAt || event.createdAt),
          action: ["failed", "error", "received"].includes(event.status.toLowerCase()) ? (
            <Button
              onClick={() => onReplayEvent(event.id)}
              variant="secondary"
              size="2xs"
              loading={replayingEventId === event.id}
              loadingMode="inline"
              loadingLabel="Queuing..."
              leftIcon={<RefreshCcw size={12} />}
            >
              Replay
            </Button>
          ) : null,
        }))}
        hasMore={Boolean(eventNextCursor)}
        onLoadMore={onLoadMoreEvents}
      />

      <LogList
        title="Jobs"
        loading={logsLoading}
        emptyLabel="No jobs yet."
        items={jobLogs.map((job) => ({
          id: job.id,
          title: formatLogLabel(job.type),
          detail: `Attempt ${job.attempts} of ${job.maxRetries}`,
          status: formatLogLabel(job.status),
          statusColor: logStatusColor(job.status),
          error: job.lastError,
          date: formatDateTime(job.completedAt || job.startedAt || job.createdAt),
          action:
            job.status === "failed" || job.status === "cancelled" ? (
              <Button
                onClick={() => onRetryJob(job.id)}
                variant="secondary"
                size="2xs"
                loading={retryingJobId === job.id}
                loadingMode="inline"
                loadingLabel="Retrying..."
              >
                Retry
              </Button>
            ) : null,
        }))}
        hasMore={Boolean(jobNextCursor)}
        onLoadMore={onLoadMoreJobs}
      />
    </div>
  );
}

function LogList({
  title,
  loading,
  emptyLabel,
  items,
  hasMore,
  onLoadMore,
}: {
  title: string;
  loading: boolean;
  emptyLabel: string;
  items: Array<{
    id: string;
    title: string;
    detail: string;
    status: string;
    statusColor: string;
    error?: string | null;
    date: string;
    action?: ReactNode;
  }>;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const logGridClass =
    "sm:grid-cols-[minmax(0,1fr)_140px_160px_96px]";

  return (
    <section className="settings-row-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <span className="text-xs text-gray-400">{items.length} recent</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-5 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : items.length > 0 ? (
          <>
            <div
              className={`hidden gap-3 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 sm:grid ${logGridClass}`}
            >
              <span>Activity</span>
              <span>Status</span>
              <span>Time</span>
              <span className="text-right">Action</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className={`grid gap-3 border-b border-gray-100 px-3 py-3 text-xs last:border-b-0 sm:items-center sm:gap-4 sm:grid ${logGridClass}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{item.detail}</p>
                  {item.error ? (
                    <p className="mt-1 truncate text-[11px] text-red-600">{item.error}</p>
                  ) : null}
                </div>
                <div className="min-w-0 sm:justify-self-start">
                  <Tag label={item.status} bgColor={item.statusColor} size="sm" />
                </div>
                <p className="min-w-0 text-gray-500 sm:truncate">{item.date}</p>
                <div className="flex min-h-9 justify-start sm:justify-end">
                  {item.action ?? <span aria-hidden="true" />}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="px-3 py-5 text-sm text-gray-500">{emptyLabel}</div>
        )}
      </div>

      {hasMore ? (
        <div className="mt-3 flex justify-end">
          <Button
            onClick={onLoadMore}
            variant="secondary"
            size="xs"
            loading={loading}
            loadingMode="inline"
            loadingLabel="Loading..."
          >
            Load more
          </Button>
        </div>
      ) : null}
    </section>
  );
}
