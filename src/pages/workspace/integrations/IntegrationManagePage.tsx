import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Copy,
  Loader2,
  RefreshCcw,
  RefreshCw,
  Settings,
  Webhook,
} from "@/components/ui/icons";

import { Button } from "../../../components/ui/Button";
import { BackButton } from "../../../components/channels/BackButton";
import { PageLayout } from "../../../components/ui/PageLayout";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { BaseInput, CheckboxInput } from "../../../components/ui/inputs";
import { ConfirmDeleteModal } from "../../../components/ui/modal";
import { BaseSelect } from "../../../components/ui/select";
import { Tag } from "../../../components/ui/Tag";
import { getIntegrationMetadata, type IntegrationTabId } from "../../../config/integrationMetadata";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import type { Integration } from "../types";
import {
  formatCapability,
  formatDateTime,
  formatLogLabel,
  integrationInitials,
  integrationBenefits,
  mergeIntegrationCatalog,
  mergeIntegrationConnections,
  shopifyPhaseColor,
  statusLabel,
  webhookUrlFor,
  type IntegrationViewModel,
} from "./integrationUi";
import {
  connectMetaAdsViaPopup,
  connectShopifyViaPopup,
  delay,
  normalizeShopInput,
  type ShopifyConnectPhase,
} from "./integrationOauth";

type IntegrationEventLogItem = {
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

type IntegrationEventSummary = {
  resourceType: "order" | "cart" | "customer";
  identifier?: string | null;
  customerLabel?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  itemCount?: number | null;
  itemPreview?: string | null;
  status?: string | null;
};

type IntegrationJobLogItem = {
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

type IntegrationLogResponse<T> = {
  items?: T[];
  nextCursor?: string | null;
};

type IntegrationResourceItem = {
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

type IntegrationResourceResponse = {
  items?: IntegrationResourceItem[];
};

type IntegrationsResponse = {
  integrations?: Integration[];
  connections?: Integration[];
};

const INTEGRATIONS_ROUTE = "/integrations";

type ShopifySyncResource = "products" | "customers" | "orders" | "carts";

type ShopifyBackfillState = {
  resources: Record<ShopifySyncResource, boolean>;
  since: string;
  until: string;
};

const SHOPIFY_SYNC_RESOURCES: Array<{ id: ShopifySyncResource; label: string }> = [
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "orders", label: "Orders" },
  { id: "carts", label: "Carts / checkouts" },
];

function isMinimalIntegration(integration: IntegrationViewModel) {
  return integration.id === "shopify" || integration.id === "meta_ads";
}

function IntegrationIcon({
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

function DetailTile({
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

type HealthRecord = Record<string, unknown>;

function asHealthRecord(value: unknown): HealthRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as HealthRecord)
    : null;
}

function readHealthString(record: HealthRecord | null, key: string) {
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function readHealthNumber(record: HealthRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}

function readResourceString(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function readResourceBoolean(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

function resourcesOfType(resources: IntegrationResourceItem[], type: string) {
  return resources.filter((resource) => resource.type === type);
}

function toDayStartIso(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

function toDayEndIso(value: string) {
  return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;
}

function integrationAccountLabel(integration: IntegrationViewModel) {
  return (
    integration.summary?.accountName ||
    integration.summary?.shopName ||
    integration.summary?.shopDomain ||
    integration.name
  );
}

function integrationConnectionNoun(integration: IntegrationViewModel) {
  if (integration.id === "shopify") return "store";
  if (integration.id === "meta_ads") return "ad account";
  if (integration.providerCategory === "crm") return "CRM";
  if (integration.providerCategory === "payments") return "payment provider";
  return "tool";
}

function friendlyHealthStateLabel(state: string) {
  const normalized = state.toLowerCase();
  if (normalized === "ok" || normalized === "connected") return "Looks good";
  if (normalized === "warning") return "Needs setup";
  if (normalized === "error" || normalized === "failed") return "Needs attention";
  return formatLogLabel(state);
}

function friendlyHealthColor(state: string) {
  const normalized = state.toLowerCase();
  if (normalized === "ok" || normalized === "connected") return "tag-green";
  if (normalized === "warning") return "tag-yellow";
  if (normalized === "error" || normalized === "failed") return "tag-red";
  return "tag-blue";
}

function friendlyHealthMessage(message: string | null, integration: IntegrationViewModel) {
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

function totalShopifyRecords(totals: HealthRecord | null) {
  if (!totals) return null;
  return [
    readHealthNumber(totals, "products") ?? 0,
    readHealthNumber(totals, "customers") ?? 0,
    readHealthNumber(totals, "orders") ?? 0,
    readHealthNumber(totals, "carts") ?? 0,
  ].reduce((sum, count) => sum + count, 0);
}

function shopifyRecordTotals(integration: IntegrationViewModel) {
  const health = asHealthRecord(integration.health);
  const initialSync = asHealthRecord(health?.initialSync);
  const backfill = asHealthRecord(health?.backfill);
  return asHealthRecord(backfill?.totals) ?? asHealthRecord(initialSync?.totals);
}

function shopifyResourceCountLabel(totals: HealthRecord | null, resource: ShopifySyncResource) {
  const count = readHealthNumber(totals, resource);
  return count == null ? "Not available" : count.toLocaleString();
}

function friendlyActionLabel(action: { key: string; label: string }, integration: IntegrationViewModel) {
  if (action.key === "test_connection") return "Check connection";
  if (action.key === "refresh_sources") {
    return integration.id === "meta_ads" ? "Refresh lead sources" : "Refresh sources";
  }
  if (action.key === "resubscribe_webhooks") return "Reconnect live updates";
  return action.label;
}

function shopifyStoreUrl(integration: IntegrationViewModel) {
  const shop = integration.summary?.shopDomain || integration.summary?.shopName;
  return shop ? `https://${shop.replace(/^https?:\/\//i, "")}` : "-";
}

function HealthPanel({
  integration,
  latestJob,
}: {
  integration: IntegrationViewModel;
  latestJob?: IntegrationJobLogItem | null;
}) {
  const health = asHealthRecord(integration.health);
  const webhookRegistration = asHealthRecord(health?.webhookRegistration);
  const initialSync = asHealthRecord(health?.initialSync);
  const backfill = asHealthRecord(health?.backfill);
  const totals = asHealthRecord(backfill?.totals) ?? asHealthRecord(initialSync?.totals);
  const healthState = readHealthString(health, "state") ?? integration.status;
  const checkedAt = readHealthString(health, "checkedAt");
  const skippedReason = readHealthString(webhookRegistration, "reason");
  const failedWebhooks = readHealthNumber(webhookRegistration, "failedCount");
  const syncStatus = readHealthString(backfill, "status") ?? readHealthString(initialSync, "status");
  const friendlyMessage = friendlyHealthMessage(skippedReason, integration);
  const syncedRecords = totalShopifyRecords(totals);

  return (
    <section className="settings-row-card">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">Status</p>
          <Tag
            label={friendlyHealthStateLabel(healthState)}
            bgColor={friendlyHealthColor(healthState)}
            size="sm"
          />
        </div>

        {friendlyMessage || failedWebhooks ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {friendlyMessage || `Some live updates could not be enabled. Try reconnecting live updates.`}
          </p>
        ) : null}

        {latestJob?.lastError ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {latestJob.lastError}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailTile label="Last checked" value={formatDateTime(checkedAt)} />
          <DetailTile label="Data sync" value={syncStatus ? formatLogLabel(syncStatus) : "Ready"} />
          <DetailTile
            label="Latest task"
            value={latestJob ? formatLogLabel(latestJob.status) : "-"}
            subValue={latestJob ? formatLogLabel(latestJob.type) : undefined}
          />
          <DetailTile
            label="Records synced"
            value={syncedRecords == null ? "-" : syncedRecords.toLocaleString()}
            subValue={totals ? "Customers, orders, products, and carts" : undefined}
          />
        </div>
      </div>
    </section>
  );
}

function ConnectionPanel({
  integration,
  busyAction,
  shopifyShop,
  shopifyShopError,
  shopifyConnectPhase,
  shopifyConnectMessage,
  onShopifyShopChange,
  onConnectShopify,
  onConnectMetaAds,
  onRefresh,
  onSync,
  onProviderAction,
}: {
  integration: IntegrationViewModel;
  busyAction: string | null;
  shopifyShop: string;
  shopifyShopError: string | null;
  shopifyConnectPhase: ShopifyConnectPhase;
  shopifyConnectMessage: string | null;
  onShopifyShopChange: (value: string) => void;
  onConnectShopify: (event?: FormEvent<HTMLFormElement>) => void;
  onConnectMetaAds: () => void;
  onRefresh: () => void;
  onSync: () => void;
  onProviderAction: (action: string) => void;
}) {
  if (integration.connected) {
    const connectionNoun = integrationConnectionNoun(integration);

    return (
      <section className="settings-row-card settings-row-card--active">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                Connected {connectionNoun}
              </p>
              <Tag label="Ready" bgColor="tag-green" size="sm" />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              AxoDesk is connected to {integrationAccountLabel(integration)}.
            </p>
          </div>

          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {integration.actions?.sync ? (
              <Button
                onClick={onSync}
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                loading={busyAction === "sync"}
                loadingMode="inline"
                loadingLabel="Queuing..."
                leftIcon={<RefreshCcw size={14} />}
              >
                Sync now
              </Button>
            ) : null}

            {(integration.actions?.providerActions ?? []).map((action) => (
              <Button
                key={action.key}
                onClick={() => onProviderAction(action.key)}
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                loading={busyAction === `action:${action.key}`}
                loadingMode="inline"
                loadingLabel="Running..."
              >
                {friendlyActionLabel(action, integration)}
              </Button>
            ))}

            <Button
              onClick={onRefresh}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              loading={busyAction === "refresh"}
              loadingMode="inline"
              loadingLabel="Refreshing..."
              leftIcon={<RefreshCw size={14} />}
            >
              Refresh status
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (integration.availability === "planned") {
    return (
      <section className="settings-row-card">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">Connection</p>
          <Tag label="Planned" bgColor="tag-grey" size="sm" />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This provider is on the roadmap. You can preview where it will live once it is available.
        </p>
      </section>
    );
  }

  if (integration.id === "shopify") {
    return (
      <section className="settings-row-card">
        <form className="space-y-4" onSubmit={onConnectShopify}>
          <div>
            <p className="text-sm font-semibold text-gray-900">Connect store</p>
            <p className="mt-1 text-sm text-gray-500">
              Bring customers, orders, products, and carts into AxoDesk.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <BaseInput
              label="Shop domain"
              value={shopifyShop}
              disabled={busyAction === "connect"}
              onChange={(event) => onShopifyShopChange(event.target.value)}
              placeholder="acme.myshopify.com"
              error={shopifyShopError ?? undefined}
              hint="Use the permanent myshopify.com domain."
            />
            <Button
              type="submit"
              loading={busyAction === "connect"}
              loadingMode="inline"
              loadingLabel="Connecting..."
            >
              Connect Shopify
            </Button>
          </div>

          {shopifyConnectMessage ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${shopifyPhaseColor(
                shopifyConnectPhase,
              )}`}
            >
              {shopifyConnectMessage}
            </div>
          ) : null}
        </form>
      </section>
    );
  }

  if (integration.id === "meta_ads") {
    return (
      <section className="settings-row-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Connect ad account</p>
            <p className="mt-1 text-sm text-gray-500">
              Capture leads from Meta campaigns and route them into contacts and workflows.
            </p>
          </div>
          <Button
            onClick={onConnectMetaAds}
            variant="facebook"
            loading={busyAction === "connect"}
            loadingMode="inline"
            loadingLabel="Connecting..."
          >
            Connect Meta Ads
          </Button>
        </div>
      </section>
    );
  }

  return null;
}

function OverviewTab({
  integration,
  connectionPanel,
  latestJob,
}: {
  integration: IntegrationViewModel;
  connectionPanel: ReactNode;
  latestJob?: IntegrationJobLogItem | null;
}) {
  const benefits = integrationBenefits(integration);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
      <div className="space-y-4">
        {connectionPanel}
        {integration.connected ? <HealthPanel integration={integration} latestJob={latestJob} /> : null}
      </div>

      <section className="settings-row-card">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">What this unlocks</p>
            <p className="mt-1 text-sm text-gray-500">
              The useful parts AxoDesk can use after this connection is active.
            </p>
          </div>

          <div className="space-y-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 text-sm text-gray-700">
                <Check size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ShopifyConnectView({
  shopifyShop,
  shopifyShopError,
  shopifyConnectPhase,
  shopifyConnectMessage,
  busyAction,
  onShopifyShopChange,
  onConnectShopify,
}: {
  shopifyShop: string;
  shopifyShopError: string | null;
  shopifyConnectPhase: ShopifyConnectPhase;
  shopifyConnectMessage: string | null;
  busyAction: string | null;
  onShopifyShopChange: (value: string) => void;
  onConnectShopify: (event?: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="max-w-3xl">
      <form className="settings-row-card space-y-4" onSubmit={onConnectShopify}>
        <div>
          <p className="text-base font-semibold text-gray-900">Connect your Shopify store</p>
          <p className="mt-1 text-sm text-gray-500">
            Enter your store URL. We will open Shopify so you can approve the connection.
          </p>
        </div>

        <BaseInput
          label="Shopify store URL"
          value={shopifyShop}
          disabled={busyAction === "connect"}
          onChange={(event) => onShopifyShopChange(event.target.value)}
          placeholder="your-store.myshopify.com"
          error={shopifyShopError ?? undefined}
          hint="Example: your-store.myshopify.com"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            loading={busyAction === "connect"}
            loadingMode="inline"
            loadingLabel="Connecting..."
          >
            Connect store
          </Button>
        </div>

        {shopifyConnectMessage ? (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${shopifyPhaseColor(
              shopifyConnectPhase,
            )}`}
          >
            {shopifyConnectMessage}
          </div>
        ) : null}
      </form>
    </section>
  );
}

function ShopifyStoreSummary({
  integration,
  latestJob,
  busyAction,
  onSync,
  onRefresh,
}: {
  integration: IntegrationViewModel;
  latestJob?: IntegrationJobLogItem | null;
  busyAction: string | null;
  onSync: () => void;
  onRefresh: () => void;
}) {
  const health = asHealthRecord(integration.health);
  const totals = shopifyRecordTotals(integration);
  const totalRecords = totalShopifyRecords(totals);
  const checkedAt = readHealthString(health, "checkedAt");

  return (
    <section className="settings-row-card settings-row-card--active">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-gray-900">Store connected</p>
            <Tag label="Ready" bgColor="tag-green" size="sm" />
          </div>
          <p className="mt-1 break-words text-sm text-gray-500">
            {integrationAccountLabel(integration)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {integration.actions?.sync ? (
            <Button
              onClick={onSync}
              size="xs"
              loading={busyAction === "sync"}
              loadingMode="inline"
              loadingLabel="Syncing..."
              leftIcon={<RefreshCcw size={14} />}
            >
              Sync now
            </Button>
          ) : null}
          <Button
            onClick={onRefresh}
            variant="secondary"
            size="xs"
            loading={busyAction === "refresh"}
            loadingMode="inline"
            loadingLabel="Refreshing..."
            leftIcon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailTile label="Store URL" value={shopifyStoreUrl(integration)} />
        <DetailTile label="Last checked" value={formatDateTime(checkedAt)} />
        <DetailTile
          label="Total records"
          value={totalRecords == null ? "-" : totalRecords.toLocaleString()}
        />
        <DetailTile
          label="Latest sync"
          value={latestJob ? formatLogLabel(latestJob.status) : "Ready"}
        />
      </div>

      {latestJob?.lastError ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {latestJob.lastError}
        </p>
      ) : null}
    </section>
  );
}

function ShopifyConfigTab({
  integration,
  latestJob,
  busyAction,
  onSync,
  onRefresh,
  onDisconnect,
}: {
  integration: IntegrationViewModel;
  latestJob?: IntegrationJobLogItem | null;
  busyAction: string | null;
  onSync: () => void;
  onRefresh: () => void;
  onDisconnect: () => void;
}) {
  const totals = shopifyRecordTotals(integration);

  return (
    <div className="space-y-4">
      <ShopifyStoreSummary
        integration={integration}
        latestJob={latestJob}
        busyAction={busyAction}
        onSync={onSync}
        onRefresh={onRefresh}
      />

      <section className="settings-row-card">
        <p className="text-sm font-semibold text-gray-900">Store records</p>
        <p className="mt-1 text-sm text-gray-500">
          Customers, orders, products, and abandoned carts stay available for conversations,
          broadcasts, and workflows.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SHOPIFY_SYNC_RESOURCES.map((resource) => (
            <DetailTile
              key={resource.id}
              label={resource.label}
              value={shopifyResourceCountLabel(totals, resource.id)}
              subValue="Total records"
            />
          ))}
        </div>
      </section>

      <section className="settings-row-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect store</p>
            <p className="mt-1 text-sm text-gray-500">
              New Shopify data will stop syncing into AxoDesk.
            </p>
          </div>
          <Button
            onClick={onDisconnect}
            variant="danger-ghost"
            loading={busyAction === "disconnect"}
            loadingMode="inline"
            loadingLabel="Disconnecting..."
          >
            Disconnect
          </Button>
        </div>
      </section>
    </div>
  );
}

function MetaAdsConnectView({
  busyAction,
  onConnectMetaAds,
}: {
  busyAction: string | null;
  onConnectMetaAds: () => void;
}) {
  return (
    <section className="max-w-3xl">
      <div className="settings-row-card space-y-4">
        <div>
          <p className="text-base font-semibold text-gray-900">Connect Meta Ads</p>
          <p className="mt-1 text-sm text-gray-500">
            Sign in with Meta to bring new lead form submissions into AxoDesk.
          </p>
        </div>

        <Button
          onClick={onConnectMetaAds}
          variant="facebook"
          className="w-full sm:w-auto"
          loading={busyAction === "connect"}
          loadingMode="inline"
          loadingLabel="Connecting..."
        >
          Connect Meta Ads
        </Button>
      </div>
    </section>
  );
}

function MetaAdsSummary({
  integration,
  resources,
  resourcesLoading,
  busyAction,
  onProviderAction,
  onRefresh,
}: {
  integration: IntegrationViewModel;
  resources: IntegrationResourceItem[];
  resourcesLoading: boolean;
  busyAction: string | null;
  onProviderAction: (action: string) => void;
  onRefresh: () => void;
}) {
  const adAccounts = resourcesOfType(resources, "ad_account");
  const pages = resourcesOfType(resources, "page");
  const leadForms = resourcesOfType(resources, "lead_form");
  const activeLeadForms = leadForms.filter((form) => form.status === "active");
  const primaryAdAccount =
    adAccounts.find((resource) => readResourceBoolean(resource.settings, "primary")) ??
    adAccounts[0];
  const canCheckConnection = integration.actions?.providerActions?.some(
    (action) => action.key === "test_connection",
  );

  return (
    <section className="settings-row-card settings-row-card--active">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-gray-900">Meta Ads connected</p>
            <Tag label="Ready" bgColor="tag-green" size="sm" />
          </div>
          <p className="mt-1 break-words text-sm text-gray-500">
            {primaryAdAccount?.name ?? integration.summary?.accountName ?? "Lead forms ready"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => onProviderAction("refresh_sources")}
            size="xs"
            loading={busyAction === "action:refresh_sources"}
            loadingMode="inline"
            loadingLabel="Refreshing..."
            leftIcon={<RefreshCcw size={14} />}
          >
            Refresh sources
          </Button>
          {canCheckConnection ? (
            <Button
              onClick={() => onProviderAction("test_connection")}
              variant="secondary"
              size="xs"
              loading={busyAction === "action:test_connection"}
              loadingMode="inline"
              loadingLabel="Checking..."
            >
              Check connection
            </Button>
          ) : (
            <Button
              onClick={onRefresh}
              variant="secondary"
              size="xs"
              loading={busyAction === "refresh"}
              loadingMode="inline"
              loadingLabel="Refreshing..."
              leftIcon={<RefreshCw size={14} />}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailTile
          label="Ad account"
          value={resourcesLoading ? "Loading..." : primaryAdAccount?.name ?? "-"}
        />
        <DetailTile
          label="Pages"
          value={resourcesLoading ? "Loading..." : pages.length.toLocaleString()}
        />
        <DetailTile
          label="Lead forms"
          value={resourcesLoading ? "Loading..." : leadForms.length.toLocaleString()}
        />
        <DetailTile
          label="Active forms"
          value={resourcesLoading ? "Loading..." : activeLeadForms.length.toLocaleString()}
        />
      </div>
    </section>
  );
}

function MetaAdsConfigTab({
  integration,
  resources,
  resourcesLoading,
  resourcesError,
  busyAction,
  onProviderAction,
  onRefresh,
  onUpdateResourceSettings,
  onDisconnect,
}: {
  integration: IntegrationViewModel;
  resources: IntegrationResourceItem[];
  resourcesLoading: boolean;
  resourcesError: string | null;
  busyAction: string | null;
  onProviderAction: (action: string) => void;
  onRefresh: () => void;
  onUpdateResourceSettings: (
    resourceId: string,
    payload: { status?: "active" | "inactive"; settings?: Record<string, unknown> },
  ) => void;
  onDisconnect: () => void;
}) {
  const leadForms = resourcesOfType(resources, "lead_form");

  return (
    <div className="space-y-4">
      <MetaAdsSummary
        integration={integration}
        resources={resources}
        resourcesLoading={resourcesLoading}
        busyAction={busyAction}
        onProviderAction={onProviderAction}
        onRefresh={onRefresh}
      />

      <section className="settings-row-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Lead sources</p>
            <p className="mt-1 text-sm text-gray-500">
              Choose which Meta lead forms should create contacts and start workflows.
            </p>
          </div>
          <Tag label={`${leadForms.length} forms`} bgColor="tag-blue" size="sm" />
        </div>

        {resourcesError ? (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {resourcesError}
          </p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          {resourcesLoading ? (
            <div className="flex items-center gap-2 px-3 py-5 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading lead sources...
            </div>
          ) : leadForms.length > 0 ? (
            leadForms.map((form) => {
              const settings = form.settings ?? {};
              const metadata = form.metadata ?? {};
              const sourceLabel =
                readResourceString(settings, "sourceLabel") ??
                form.name ??
                form.externalId;
              const enabled = readResourceBoolean(settings, "sourceEnabled") ?? true;
              const pageName =
                readResourceString(settings, "linkedPageName") ??
                readResourceString(metadata, "pageName");

              return (
                <div
                  key={form.id}
                  className="grid gap-3 border-b border-gray-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{sourceLabel}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {pageName ? `${pageName} page` : "Meta lead form"}
                    </p>
                  </div>
                  <CheckboxInput
                    checked={enabled}
                    onChange={(checked) =>
                      onUpdateResourceSettings(form.id, {
                        settings: { sourceEnabled: checked },
                      })
                    }
                    label="Use in AxoDesk"
                    description="Create contacts from this form"
                  />
                </div>
              );
            })
          ) : (
            <div className="px-3 py-5 text-sm text-gray-500">
              No lead forms found yet. Refresh sources after your Meta account has page and form access.
            </div>
          )}
        </div>
      </section>

      <section className="settings-row-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect Meta Ads</p>
            <p className="mt-1 text-sm text-gray-500">
              New Meta leads will stop coming into AxoDesk.
            </p>
          </div>
          <Button
            onClick={onDisconnect}
            variant="danger-ghost"
            loading={busyAction === "disconnect"}
            loadingMode="inline"
            loadingLabel="Disconnecting..."
          >
            Disconnect
          </Button>
        </div>
      </section>
    </div>
  );
}

function IntegrationUnderlineTabs({
  tabs,
  activeTab,
  routeId,
  onNavigate,
}: {
  tabs: Array<{ id: IntegrationTabId; label: string }>;
  activeTab: IntegrationTabId;
  routeId: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(`${INTEGRATIONS_ROUTE}/${routeId}/${tab.id}`)}
              className={`min-h-11 shrink-0 border-b-2 px-8 text-sm font-medium transition-colors ${
                selected
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-700 hover:border-gray-200 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProviderTab({
  integration,
  tabId,
  resources,
  resourcesLoading,
  resourcesError,
  busyAction,
  shopifyBackfill,
  latestJob,
  onShopifyBackfillChange,
  onRunShopifyBackfill,
  onSelectAdAccount,
  onUpdateResourceSettings,
  onProviderAction,
}: {
  integration: IntegrationViewModel;
  tabId: IntegrationTabId;
  resources: IntegrationResourceItem[];
  resourcesLoading: boolean;
  resourcesError: string | null;
  busyAction: string | null;
  shopifyBackfill: ShopifyBackfillState;
  latestJob?: IntegrationJobLogItem | null;
  onShopifyBackfillChange: (next: ShopifyBackfillState) => void;
  onRunShopifyBackfill: () => void;
  onSelectAdAccount: (resourceId: string) => void;
  onUpdateResourceSettings: (
    resourceId: string,
    payload: { status?: "active" | "inactive"; settings?: Record<string, unknown> },
  ) => void;
  onProviderAction: (action: string) => void;
}) {
  if (tabId === "commerce") {
    const selectedResourceCount = SHOPIFY_SYNC_RESOURCES.filter(
      (resource) => shopifyBackfill.resources[resource.id],
    ).length;

    return (
      <div className="space-y-4">
        <section className="settings-row-card">
          <p className="text-sm font-semibold text-gray-900">Store data</p>
          <p className="mt-1 text-sm text-gray-500">
            Choose the Shopify data AxoDesk can use for support context and campaigns.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {SHOPIFY_SYNC_RESOURCES.map((item) => (
              <DetailTile
                key={item.id}
                label={item.label}
                value={integration.connected ? "Ready" : "Not connected"}
              />
            ))}
          </div>
        </section>

        {integration.connected ? (
          <section className="settings-row-card">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sync past data</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Pull a selected date range into AxoDesk when you need older records.
                  </p>
                </div>
                <Button
                  onClick={onRunShopifyBackfill}
                  loading={busyAction === "backfill"}
                  loadingMode="inline"
                  loadingLabel="Queuing..."
                  disabled={selectedResourceCount === 0}
                  leftIcon={<RefreshCcw size={14} />}
                >
                  Sync selected data
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {SHOPIFY_SYNC_RESOURCES.map((resource) => (
                  <CheckboxInput
                    key={resource.id}
                    checked={shopifyBackfill.resources[resource.id]}
                    onChange={(checked) =>
                      onShopifyBackfillChange({
                        ...shopifyBackfill,
                        resources: {
                          ...shopifyBackfill.resources,
                          [resource.id]: checked,
                        },
                      })
                    }
                    label={resource.label}
                    description="Bring this into AxoDesk"
                  />
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <BaseInput
                  label="Updated from"
                  type="date"
                  value={shopifyBackfill.since}
                  onChange={(event) =>
                    onShopifyBackfillChange({ ...shopifyBackfill, since: event.target.value })
                  }
                />
                <BaseInput
                  label="Updated until"
                  type="date"
                  value={shopifyBackfill.until}
                  onChange={(event) =>
                    onShopifyBackfillChange({ ...shopifyBackfill, until: event.target.value })
                  }
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <DetailTile label="Latest sync" value={latestJob ? formatLogLabel(latestJob.status) : "-"} />
                <DetailTile label="Attempts" value={latestJob ? `${latestJob.attempts}/${latestJob.maxRetries}` : "-"} />
                <DetailTile label="Scheduled" value={formatDateTime(latestJob?.scheduledAt)} />
                <DetailTile label="Completed" value={formatDateTime(latestJob?.completedAt)} />
              </div>

              {latestJob?.lastError ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {latestJob.lastError}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (tabId === "ads") {
    const adAccounts = resourcesOfType(resources, "ad_account");
    const pages = resourcesOfType(resources, "page");
    const leadForms = resourcesOfType(resources, "lead_form");
    const selectedAdAccount =
      adAccounts.find((resource) => readResourceBoolean(resource.settings, "primary")) ??
      adAccounts[0];

    return (
      <div className="space-y-4">
        <section className="settings-row-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Lead sources</p>
              <p className="mt-1 text-sm text-gray-500">
                Pick the ad account and lead forms that should feed AxoDesk workflows.
              </p>
              <div className="mt-3 max-w-xl">
                <BaseSelect
                  label="Primary ad account"
                  value={selectedAdAccount?.id}
                  disabled={!integration.connected || resourcesLoading || adAccounts.length === 0}
                  options={adAccounts.map((account) => ({
                    label: account.name ?? account.externalId,
                    value: account.id,
                  }))}
                  placeholder={resourcesLoading ? "Loading ad accounts..." : "Select ad account"}
                  emptyMessage="No ad accounts discovered yet."
                  onChange={onSelectAdAccount}
                />
              </div>
            </div>
            <Button
              onClick={() => onProviderAction("refresh_sources")}
              variant="secondary"
              size="sm"
              loading={busyAction === "action:refresh_sources"}
              loadingMode="inline"
              loadingLabel="Refreshing..."
              leftIcon={<RefreshCcw size={14} />}
              disabled={!integration.connected}
            >
              Refresh lead sources
            </Button>
          </div>

          {resourcesError ? (
            <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {resourcesError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <DetailTile label="Account" value={selectedAdAccount?.name ?? integration.summary?.accountName ?? "-"} />
            <DetailTile label="Ad accounts" value={resourcesLoading ? "Loading..." : String(adAccounts.length)} />
            <DetailTile label="Pages" value={resourcesLoading ? "Loading..." : String(pages.length)} />
            <DetailTile label="Lead forms" value={resourcesLoading ? "Loading..." : String(leadForms.length)} />
          </div>
        </section>

        <section className="settings-row-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">Lead forms</p>
            <Tag label={`${leadForms.length} forms`} bgColor="tag-blue" size="sm" />
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
            {resourcesLoading ? (
              <div className="flex items-center gap-2 px-3 py-5 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Loading sources...
              </div>
            ) : leadForms.length > 0 ? (
              leadForms.map((form) => {
                const settings = form.settings ?? {};
                const metadata = form.metadata ?? {};
                const sourceLabel =
                  readResourceString(settings, "sourceLabel") ??
                  form.name ??
                  form.externalId;
                const enabled = readResourceBoolean(settings, "sourceEnabled") ?? true;
                const pageName =
                  readResourceString(settings, "linkedPageName") ??
                  readResourceString(metadata, "pageName") ??
                  "-";

                return (
                  <div
                    key={form.id}
                    className="grid gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(180px,0.8fr)_220px_120px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {form.name ?? form.externalId}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-500">{pageName}</p>
                    </div>
                    <BaseInput
                      key={`${form.id}-${sourceLabel}`}
                      label="Display name"
                      defaultValue={sourceLabel}
                      onBlur={(event) => {
                        const next = event.target.value.trim();
                        if (next && next !== sourceLabel) {
                          onUpdateResourceSettings(form.id, {
                            settings: { sourceLabel: next },
                          });
                        }
                      }}
                    />
                    <CheckboxInput
                      checked={enabled}
                      onChange={(checked) =>
                        onUpdateResourceSettings(form.id, {
                          settings: { sourceEnabled: checked },
                        })
                      }
                      label="Use in workflows"
                      description="Start automations from this form"
                    />
                    <div>
                      <Tag
                        label={formatLogLabel(form.status)}
                        bgColor={form.status === "active" ? "tag-green" : "tag-grey"}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-5 text-sm text-gray-500">
                No lead forms found yet. Refresh after the connected Meta account has access to your pages and forms.
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (tabId === "payments") {
    return (
      <section className="settings-row-card">
        <p className="text-sm font-semibold text-gray-900">Payment workflow</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {integration.capabilities.map((capability) => (
            <Tag key={capability} label={formatCapability(capability)} bgColor="tag-green" size="sm" />
          ))}
        </div>
      </section>
    );
  }

  if (tabId === "mapping") {
    return (
      <section className="settings-row-card">
        <p className="text-sm font-semibold text-gray-900">Field mapping</p>
        <p className="mt-2 text-sm text-gray-500">
          Mapping controls will use this provider metadata when the connector is enabled.
        </p>
      </section>
    );
  }

  return null;
}

function WebhooksTab({
  integration,
  copied,
  onCopy,
}: {
  integration: IntegrationViewModel;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  const webhookUrl = webhookUrlFor(integration);

  return (
    <section className="settings-row-card">
      <div className="flex items-start gap-3">
        <Webhook size={17} className="mt-0.5 text-gray-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Live update endpoint</p>
          <p className="mt-1 text-sm text-gray-500">
            Use this only when a provider asks where to send live events.
          </p>
          {webhookUrl ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-[var(--color-primary)]">
                {webhookUrl}
              </code>
              <Button
                onClick={() => onCopy(webhookUrl)}
                variant="secondary"
                size="sm"
                leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              The endpoint appears after this integration is connected.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

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

function ActivityTab({
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

function SettingsTab({
  integration,
  busyAction,
  onDisconnect,
}: {
  integration: IntegrationViewModel;
  busyAction: string | null;
  onDisconnect: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="settings-row-card">
        <div className="flex items-start gap-3">
          <Settings size={17} className="mt-0.5 text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Connection details</p>
            <p className="mt-1 text-sm text-gray-500">
              AxoDesk keeps credentials secure on the backend and uses this connection only for the features you enable.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <DetailTile label="Connected tool" value={integrationAccountLabel(integration)} />
              <DetailTile label="Used for" value={integration.category} />
              <DetailTile label="Sign-in method" value={formatCapability(integration.authType)} />
              <DetailTile label="Current status" value={statusLabel(integration)} />
            </div>
          </div>
        </div>
      </section>

      {integration.connected ? (
        <section className="settings-row-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Disconnect integration</p>
              <p className="mt-1 text-sm text-gray-500">
                Stops sync, webhooks, and automations that rely on this provider.
              </p>
            </div>
            <Button
              onClick={onDisconnect}
              variant="danger-ghost"
              loading={busyAction === "disconnect"}
              loadingMode="inline"
              loadingLabel="Disconnecting..."
            >
              Disconnect
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function IntegrationManagePage() {
  const { providerId, tabId } = useParams<{ providerId: string; tabId?: string }>();
  const navigate = useNavigate();
  const routeMetadata = getIntegrationMetadata(providerId);
  const [items, setItems] = useState<IntegrationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [shopifyShop, setShopifyShop] = useState("");
  const [shopifyShopError, setShopifyShopError] = useState<string | null>(null);
  const [shopifyConnectPhase, setShopifyConnectPhase] = useState<ShopifyConnectPhase>("idle");
  const [shopifyConnectMessage, setShopifyConnectMessage] = useState<string | null>(null);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<IntegrationEventLogItem[]>([]);
  const [jobLogs, setJobLogs] = useState<IntegrationJobLogItem[]>([]);
  const [eventNextCursor, setEventNextCursor] = useState<string | null>(null);
  const [jobNextCursor, setJobNextCursor] = useState<string | null>(null);
  const [replayingEventId, setReplayingEventId] = useState<string | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [resources, setResources] = useState<IntegrationResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [shopifyBackfill, setShopifyBackfill] = useState<ShopifyBackfillState>({
    resources: {
      products: true,
      customers: true,
      orders: true,
      carts: true,
    },
    since: "",
    until: "",
  });

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const res = (await workspaceApi.getIntegrations()) as IntegrationsResponse;
      const connections = res.connections ?? (res.integrations ?? []).filter(
        (item) => item.integrationId || item.routingChannelId,
      );
      const next = [
        ...mergeIntegrationConnections(connections),
        ...mergeIntegrationCatalog([]),
      ];
      setItems(next);
      return next;
    } catch {
      setError("Failed to load integration connection status.");
      return [];
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const routeIntegration = useMemo(() => {
    if (!providerId) return null;
    return items.find(
      (item) =>
        item.routeId === providerId ||
        item.integrationId === providerId ||
        item.routingChannelId === providerId,
    ) ?? null;
  }, [items, providerId]);

  const metadata =
    routeMetadata ?? (routeIntegration ? getIntegrationMetadata(routeIntegration.id) : null);

  const fallbackIntegration = useMemo(() => {
    if (!metadata) return null;
    return mergeIntegrationCatalog([]).find((item) => item.id === metadata.id) ?? null;
  }, [metadata]);

  const integration = useMemo(() => {
    if (routeIntegration) return routeIntegration;
    if (!metadata) return null;
    return (
      items.find(
        (item) =>
          item.routeId === metadata.id ||
          (!item.integrationId && item.id === metadata.id),
      ) ?? fallbackIntegration
    );
  }, [fallbackIntegration, items, metadata, routeIntegration]);

  const visibleTabs = useMemo(() => {
    if (!integration) return [];
    if (isMinimalIntegration(integration)) {
      return integration.connected
        ? [
            { id: "settings" as const, label: "Config" },
            { id: "activity" as const, label: "Logs" },
          ]
        : [];
    }
    return integration.tabs;
  }, [integration]);

  const defaultTab = visibleTabs[0]?.id ?? integration?.tabs[0]?.id ?? "overview";
  const activeTab = (tabId ?? defaultTab) as IntegrationTabId;
  const integrationTabButtons = useMemo(() => {
    if (!integration || visibleTabs.length === 0) return undefined;

    if (isMinimalIntegration(integration)) {
      return (
        <IntegrationUnderlineTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          routeId={integration.routeId}
          onNavigate={navigate}
        />
      );
    }

    return (
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {visibleTabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => navigate(`${INTEGRATIONS_ROUTE}/${integration.routeId}/${tab.id}`)}
            variant={activeTab === tab.id ? "soft-primary" : "secondary"}
            size="xs"
            className="shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>
    );
  }, [activeTab, integration, navigate, visibleTabs]);

  useMobileHeaderActions(
    metadata
      ? {
          eyebrow: "",
          title: integration?.name ?? metadata.name,
          subtitle: integration?.desc ?? metadata.desc,
          backTo: INTEGRATIONS_ROUTE,
          leading: integration ? (
            <IntegrationIcon compact integration={integration} />
          ) : undefined,
          desktopToolbar: integrationTabButtons,
          panel: integration ? (
            <p className="text-sm leading-5 text-slate-500">
              {integration.desc}
            </p>
          ) : undefined,
        }
      : {},
    [
      activeTab,
      integration?.desc,
      integration?.id,
      integration?.name,
      integration?.routeId,
      integrationTabButtons,
      metadata?.desc,
      metadata?.name,
      navigate,
    ],
  );

  const validTab =
    visibleTabs.length > 0
      ? visibleTabs.some((tab) => tab.id === activeTab)
      : integration?.tabs.some((tab) => tab.id === activeTab) ?? false;

  useEffect(() => {
    if (!integration || !providerId) return;
    if (isMinimalIntegration(integration) && !integration.connected) return;
    if (!tabId || !validTab) {
      navigate(`${INTEGRATIONS_ROUTE}/${providerId}/${defaultTab}`, {
        replace: true,
      });
    }
  }, [defaultTab, integration, navigate, providerId, tabId, validTab]);

  const loadActivity = useCallback(async () => {
    if (!integration?.integrationId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const eventsRes = await workspaceApi.getIntegrationEvents(integration.integrationId, {
        limit: 25,
      });
      const jobsRes = isMinimalIntegration(integration)
        ? null
        : await workspaceApi.getIntegrationJobs(integration.integrationId, { limit: 10 });
      setEventLogs(
        ((eventsRes as IntegrationLogResponse<IntegrationEventLogItem>)?.items ?? []),
      );
      setJobLogs(
        jobsRes ? ((jobsRes as IntegrationLogResponse<IntegrationJobLogItem>)?.items ?? []) : [],
      );
      setEventNextCursor(
        (eventsRes as IntegrationLogResponse<IntegrationEventLogItem>)?.nextCursor ?? null,
      );
      setJobNextCursor(
        jobsRes ? (jobsRes as IntegrationLogResponse<IntegrationJobLogItem>)?.nextCursor ?? null : null,
      );
    } catch {
      setLogsError("Failed to load integration activity.");
    } finally {
      setLogsLoading(false);
    }
  }, [integration]);

  const loadResources = useCallback(async () => {
    if (!integration?.integrationId) {
      setResources([]);
      return;
    }
    setResourcesLoading(true);
    setResourcesError(null);
    try {
      const res = (await workspaceApi.getIntegrationResources(
        integration.integrationId,
      )) as IntegrationResourceResponse;
      setResources(res.items ?? []);
    } catch {
      setResourcesError("Failed to load integration resources.");
    } finally {
      setResourcesLoading(false);
    }
  }, [integration?.integrationId]);

  const loadMoreEvents = useCallback(async () => {
    if (!integration?.integrationId || !eventNextCursor) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = (await workspaceApi.getIntegrationEvents(integration.integrationId, {
        limit: 25,
        cursor: eventNextCursor,
      })) as IntegrationLogResponse<IntegrationEventLogItem>;
      setEventLogs((current) => [...current, ...(res.items ?? [])]);
      setEventNextCursor(res.nextCursor ?? null);
    } catch {
      setLogsError("Failed to load more integration events.");
    } finally {
      setLogsLoading(false);
    }
  }, [eventNextCursor, integration?.integrationId]);

  const loadMoreJobs = useCallback(async () => {
    if (!integration?.integrationId || !jobNextCursor) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = (await workspaceApi.getIntegrationJobs(integration.integrationId, {
        limit: 10,
        cursor: jobNextCursor,
      })) as IntegrationLogResponse<IntegrationJobLogItem>;
      setJobLogs((current) => [...current, ...(res.items ?? [])]);
      setJobNextCursor(res.nextCursor ?? null);
    } catch {
      setLogsError("Failed to load more integration jobs.");
    } finally {
      setLogsLoading(false);
    }
  }, [integration?.integrationId, jobNextCursor]);

  const retryJob = useCallback(
    async (jobId: string) => {
      if (!integration?.integrationId) return;
      setRetryingJobId(jobId);
      setLogsError(null);
      try {
        await workspaceApi.retryIntegrationJob(integration.integrationId, jobId);
        await loadActivity();
      } catch (retryError: unknown) {
        setLogsError(
          retryError instanceof Error ? retryError.message : "Failed to retry integration job.",
        );
      } finally {
        setRetryingJobId(null);
      }
    },
    [integration?.integrationId, loadActivity],
  );

  const replayEvent = useCallback(
    async (eventId: string) => {
      if (!integration?.integrationId) return;
      setReplayingEventId(eventId);
      setLogsError(null);
      try {
        await workspaceApi.replayIntegrationEvent(integration.integrationId, eventId);
        await loadActivity();
      } catch (replayError: unknown) {
        setLogsError(
          replayError instanceof Error
            ? replayError.message
            : "Failed to queue integration event replay.",
        );
      } finally {
        setReplayingEventId(null);
      }
    },
    [integration?.integrationId, loadActivity],
  );

  useEffect(() => {
    if (integration?.integrationId) {
      void loadActivity();
    }
  }, [integration?.integrationId, loadActivity]);

  useEffect(() => {
    const needsProviderResources =
      integration?.integrationId &&
      (["ads", "commerce"].includes(activeTab) ||
        (integration.id === "meta_ads" && integration.connected));
    if (needsProviderResources) {
      void loadResources();
    }
  }, [activeTab, integration?.connected, integration?.id, integration?.integrationId, loadResources]);

  const refreshProvider = useCallback(async () => {
    if (!integration) return;
    setBusyAction("refresh");
    setError(null);
    try {
      if (integration.id === "meta_ads") {
        await workspaceApi.getMetaAdsStatus();
      }
      await load({ silent: true });
    } catch {
      setError(`Failed to refresh ${integration.name}.`);
    } finally {
      setBusyAction(null);
    }
  }, [integration, load]);

  const queueIntegrationSync = useCallback(async (
    payload?: {
      mode?: "manual_sync" | "backfill";
      resources?: string[];
      since?: string;
      until?: string;
    },
    busyKey = "sync",
  ) => {
    if (!integration?.integrationId) return;
    setBusyAction(busyKey);
    setError(null);
    setLogsError(null);
    try {
      await workspaceApi.syncIntegration(integration.integrationId, payload);
      await load({ silent: true });
      await loadActivity();
    } catch (syncError: unknown) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : `Failed to queue ${integration.name} sync.`,
      );
    } finally {
      setBusyAction(null);
    }
  }, [integration, load, loadActivity]);

  const syncProvider = useCallback(() => {
    void queueIntegrationSync();
  }, [queueIntegrationSync]);

  const runShopifyBackfill = useCallback(() => {
    if (!integration?.integrationId) return;
    const selectedResources = SHOPIFY_SYNC_RESOURCES
      .filter((resource) => shopifyBackfill.resources[resource.id])
      .map((resource) => resource.id);
    if (selectedResources.length === 0) {
      setError("Select at least one Shopify resource to backfill.");
      return;
    }
    void queueIntegrationSync(
      {
        mode: "backfill",
        resources: selectedResources,
        since: toDayStartIso(shopifyBackfill.since),
        until: toDayEndIso(shopifyBackfill.until),
      },
      "backfill",
    );
  }, [integration?.integrationId, queueIntegrationSync, shopifyBackfill]);

  const runProviderAction = useCallback(
    async (action: string) => {
      if (!integration?.integrationId) return;
      setBusyAction(`action:${action}`);
      setError(null);
      setLogsError(null);
      try {
        await workspaceApi.runIntegrationAction(integration.integrationId, action);
        await load({ silent: true });
        if (action === "refresh_sources") {
          await loadResources();
        }
        await loadActivity();
      } catch (actionError: unknown) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : `Failed to run ${formatLogLabel(action)}.`,
        );
      } finally {
        setBusyAction(null);
      }
    },
    [integration, load, loadActivity, loadResources],
  );

  const updateResourceSettings = useCallback(
    async (
      resourceId: string,
      payload: { status?: "active" | "inactive"; settings?: Record<string, unknown> },
    ) => {
      if (!integration?.integrationId) return;
      setResourcesError(null);
      try {
        await workspaceApi.updateIntegrationResource(
          integration.integrationId,
          resourceId,
          payload,
        );
        await Promise.all([load({ silent: true }), loadResources()]);
      } catch {
        setResourcesError("Failed to update integration resource mapping.");
      }
    },
    [integration?.integrationId, load, loadResources],
  );

  const selectAdAccount = useCallback(
    (resourceId: string) => {
      void updateResourceSettings(resourceId, {
        status: "active",
        settings: { primary: true },
      });
    },
    [updateResourceSettings],
  );

  const connectMetaAds = useCallback(async () => {
    setBusyAction("connect");
    setError(null);
    try {
      await connectMetaAdsViaPopup();
      const refreshed = await load({ silent: true });
      const connected = refreshed.find(
        (item) => item.id === "meta_ads" && item.integrationId,
      );
      if (connected) {
        navigate(`${INTEGRATIONS_ROUTE}/${connected.routeId}/settings`, {
          replace: true,
        });
      }
    } catch (connectError: unknown) {
      setError(connectError instanceof Error ? connectError.message : "Meta Ads connection failed.");
    } finally {
      setBusyAction(null);
    }
  }, [load, navigate]);

  const connectShopify = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const shop = normalizeShopInput(shopifyShop);
      if (!shop) {
        setShopifyShopError("Shop domain is required.");
        return;
      }

      setBusyAction("connect");
      setShopifyShopError(null);
      setError(null);
      try {
        await connectShopifyViaPopup(shop, (phase, message) => {
          setShopifyConnectPhase(phase);
          setShopifyConnectMessage(message);
        });
        const refreshed = await load({ silent: true });
        setShopifyConnectPhase("connected");
        setShopifyConnectMessage("Shopify is connected. The catalog has been refreshed.");
        const connected =
          refreshed.find(
            (item) =>
              item.id === "shopify" &&
              item.integrationId &&
              normalizeShopInput(item.summary?.shopDomain ?? item.externalAccountId ?? "") === shop,
          ) ??
          refreshed.find((item) => item.id === "shopify" && item.integrationId);
        if (connected) {
          navigate(`${INTEGRATIONS_ROUTE}/${connected.routeId}/settings`, {
            replace: true,
          });
        }
      } catch (connectError: unknown) {
        const message =
          connectError instanceof Error ? connectError.message : "Shopify connection failed.";
        if (
          message.includes("window closed before AxoDesk received authorization") ||
          message.includes("Login window was closed")
        ) {
          setShopifyConnectPhase("saving");
          setShopifyConnectMessage("Popup closed. Checking Shopify connection status...");
          await delay(1600);
          const refreshed = await load({ silent: true });
          const shopify = refreshed.find(
            (item) =>
              item.id === "shopify" &&
              item.integrationId &&
              normalizeShopInput(item.summary?.shopDomain ?? item.externalAccountId ?? "") === shop,
          );
          if (shopify?.connected) {
            setShopifyConnectPhase("connected");
            setShopifyConnectMessage("Shopify is connected. The catalog has been refreshed.");
            navigate(`${INTEGRATIONS_ROUTE}/${shopify.routeId}/settings`, {
              replace: true,
            });
            return;
          }
        }
        setShopifyConnectPhase("failed");
        setShopifyConnectMessage(message);
      } finally {
        setBusyAction(null);
      }
    },
    [load, navigate, shopifyShop],
  );

  const disconnectIntegration = useCallback(async () => {
    if (!integration) return;
    setBusyAction("disconnect");
    setError(null);
    try {
      await workspaceApi.disconnectIntegration(integration.integrationId ?? integration.id);
      setConfirmDisconnectOpen(false);
      await load({ silent: true });
      navigate(INTEGRATIONS_ROUTE, {
        replace: true,
      });
    } catch {
      setError(`Failed to disconnect ${integration.name}.`);
    } finally {
      setBusyAction(null);
    }
  }, [integration, load, navigate]);

  const copyWebhook = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => undefined);
    setCopiedWebhook(true);
    window.setTimeout(() => setCopiedWebhook(false), 1500);
  };

  const pageTitle =
    integration?.name ?? metadata?.name ?? routeMetadata?.name ?? "Integration";
  const pageSubtitle = integration?.desc ?? metadata?.desc ?? routeMetadata?.desc;
  const pageLeading = (
    <BackButton
      ariaLabel="Back to integrations"
      onClick={() => navigate(INTEGRATIONS_ROUTE)}
    />
  );
  const pageTitleLeading = integration ? (
    <IntegrationIcon compact integration={integration} />
  ) : null;
  const renderPage = (
    content: ReactNode,
    options?: {
      title?: string;
      subtitle?: string;
      toolbar?: ReactNode;
    },
  ) => (
    <PageLayout
      title={options?.title ?? pageTitle}
      subtitle={options?.subtitle ?? pageSubtitle}
      leading={pageLeading}
      titleLeading={pageTitleLeading}
      toolbar={options?.toolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 md:px-6 md:py-8 lg:px-8"
    >
      <div className="settings-page-stack mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-y-auto px-4 pb-24 pt-4 md:min-h-full md:flex-none md:overflow-visible md:px-0 md:pb-0 md:pt-0">
        {content}
      </div>
    </PageLayout>
  );

  if (loading) {
    return renderPage(<DataLoader type="integrations" />);
  }

  if (!metadata) {
    return renderPage(
      <div className="settings-empty-panel">
        <p className="text-sm font-medium text-gray-700">Integration not found</p>
        <div className="mt-4">
          <Button onClick={() => navigate(INTEGRATIONS_ROUTE)}>
            Back to integrations
          </Button>
        </div>
      </div>,
      {
        title: "Integration not found",
        subtitle: "Choose an available integration to connect or manage.",
        toolbar: undefined,
      },
    );
  }

  if (!integration) return null;

  const connectionPanel = (
    <ConnectionPanel
      integration={integration}
      busyAction={busyAction}
      shopifyShop={shopifyShop}
      shopifyShopError={shopifyShopError}
      shopifyConnectPhase={shopifyConnectPhase}
      shopifyConnectMessage={shopifyConnectMessage}
      onShopifyShopChange={(value) => {
        setShopifyShop(value);
        if (shopifyShopError) setShopifyShopError(null);
      }}
      onConnectShopify={connectShopify}
      onConnectMetaAds={connectMetaAds}
      onRefresh={refreshProvider}
      onSync={syncProvider}
      onProviderAction={runProviderAction}
    />
  );

  return renderPage(
    <>
      {error ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      {visibleTabs.length > 0 && isMinimalIntegration(integration) ? (
        <div className="md:hidden">
          <IntegrationUnderlineTabs
            tabs={visibleTabs}
            activeTab={activeTab}
            routeId={integration.routeId}
            onNavigate={navigate}
          />
        </div>
      ) : null}

      {visibleTabs.length > 0 && !isMinimalIntegration(integration) ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => navigate(`${INTEGRATIONS_ROUTE}/${integration.routeId}/${tab.id}`)}
              variant={activeTab === tab.id ? "soft-primary" : "secondary"}
              size="xs"
              className="shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      ) : null}

      {integration.id === "shopify" && !integration.connected ? (
        <ShopifyConnectView
          shopifyShop={shopifyShop}
          shopifyShopError={shopifyShopError}
          shopifyConnectPhase={shopifyConnectPhase}
          shopifyConnectMessage={shopifyConnectMessage}
          busyAction={busyAction}
          onShopifyShopChange={(value) => {
            setShopifyShop(value);
            if (shopifyShopError) setShopifyShopError(null);
          }}
          onConnectShopify={connectShopify}
        />
      ) : null}

      {integration.id === "meta_ads" && !integration.connected ? (
        <MetaAdsConnectView
          busyAction={busyAction}
          onConnectMetaAds={connectMetaAds}
        />
      ) : null}

      {!isMinimalIntegration(integration) && activeTab === "overview" ? (
        <OverviewTab
          integration={integration}
          connectionPanel={connectionPanel}
          latestJob={jobLogs[0] ?? null}
        />
      ) : null}

      {integration.id === "meta_ads" && integration.connected && activeTab === "settings" ? (
        <MetaAdsConfigTab
          integration={integration}
          resources={resources}
          resourcesLoading={resourcesLoading}
          resourcesError={resourcesError}
          busyAction={busyAction}
          onProviderAction={runProviderAction}
          onRefresh={refreshProvider}
          onUpdateResourceSettings={updateResourceSettings}
          onDisconnect={() => setConfirmDisconnectOpen(true)}
        />
      ) : null}

      {integration.id === "shopify" && integration.connected && activeTab === "settings" ? (
        <ShopifyConfigTab
          integration={integration}
          latestJob={jobLogs[0] ?? null}
          busyAction={busyAction}
          onSync={syncProvider}
          onRefresh={refreshProvider}
          onDisconnect={() => setConfirmDisconnectOpen(true)}
        />
      ) : null}

      {!isMinimalIntegration(integration) && ["commerce", "ads", "payments", "mapping"].includes(activeTab) ? (
        <ProviderTab
          integration={integration}
          tabId={activeTab}
          resources={resources}
          resourcesLoading={resourcesLoading}
          resourcesError={resourcesError}
          busyAction={busyAction}
          shopifyBackfill={shopifyBackfill}
          latestJob={jobLogs[0] ?? null}
          onShopifyBackfillChange={setShopifyBackfill}
          onRunShopifyBackfill={runShopifyBackfill}
          onSelectAdAccount={selectAdAccount}
          onUpdateResourceSettings={updateResourceSettings}
          onProviderAction={runProviderAction}
        />
      ) : null}

      {!isMinimalIntegration(integration) && activeTab === "webhooks" ? (
        <WebhooksTab
          integration={integration}
          copied={copiedWebhook}
          onCopy={copyWebhook}
        />
      ) : null}

      {(isMinimalIntegration(integration)
        ? integration.connected && activeTab === "activity"
        : activeTab === "activity") ? (
        <ActivityTab
          integration={integration}
          resources={resources}
          logsLoading={logsLoading}
          logsError={logsError}
          eventLogs={eventLogs}
          jobLogs={jobLogs}
          eventNextCursor={eventNextCursor}
          jobNextCursor={jobNextCursor}
          replayingEventId={replayingEventId}
          retryingJobId={retryingJobId}
          onReload={loadActivity}
          onLoadMoreEvents={loadMoreEvents}
          onLoadMoreJobs={loadMoreJobs}
          onReplayEvent={replayEvent}
          onRetryJob={retryJob}
        />
      ) : null}

      {!isMinimalIntegration(integration) && activeTab === "settings" ? (
        <SettingsTab
          integration={integration}
          busyAction={busyAction}
          onDisconnect={() => setConfirmDisconnectOpen(true)}
        />
      ) : null}

      <ConfirmDeleteModal
        open={confirmDisconnectOpen}
        entityName={`${integration.name} integration`}
        entityType="integration"
        title="Disconnect integration"
        heading={`Disconnect ${integration.name}?`}
        body="Sync, webhooks, and automations that rely on this provider will stop."
        confirmLabel="Disconnect integration"
        isDeleting={busyAction === "disconnect"}
        onCancel={() => {
          if (busyAction !== "disconnect") setConfirmDisconnectOpen(false);
        }}
        onConfirm={disconnectIntegration}
      />
    </>,
    { toolbar: integrationTabButtons },
  );
}
