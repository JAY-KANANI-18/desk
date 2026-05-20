import type { FormEvent } from "react";
import { RefreshCcw, RefreshCw } from "@/components/ui/icons";

import { Button } from "../../../components/ui/Button";
import { BaseInput } from "../../../components/ui/inputs";
import { Tag } from "../../../components/ui/Tag";
import { formatDateTime, formatLogLabel, shopifyPhaseColor, type IntegrationViewModel } from "./integrationUi";
import type { ShopifyConnectPhase } from "./integrationOauth";
import {
  DetailTile,
  asHealthRecord,
  integrationAccountLabel,
  readHealthString,
  shopifyRecordTotals,
  shopifyResourceCountLabel,
  shopifyStoreUrl,
  totalShopifyRecords,
} from "./integrationManageShared";
import {
  SHOPIFY_SYNC_RESOURCES,
  type IntegrationJobLogItem,
} from "./integrationManageTypes";

export function ShopifyConnectView({
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

export function ShopifyConfigTab({
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
