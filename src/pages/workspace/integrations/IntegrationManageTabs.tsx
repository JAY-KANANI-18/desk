import type { FormEvent, ReactNode } from "react";
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
import { BaseInput, CheckboxInput } from "../../../components/ui/inputs";
import { BaseSelect } from "../../../components/ui/select";
import { Tag } from "../../../components/ui/Tag";
import type { IntegrationTabId } from "../../../config/integrationMetadata";
import {
  formatCapability,
  formatDateTime,
  formatLogLabel,
  integrationBenefits,
  shopifyPhaseColor,
  statusLabel,
  webhookUrlFor,
  type IntegrationViewModel,
} from "./integrationUi";
import {
  DetailTile,
  asHealthRecord,
  friendlyActionLabel,
  friendlyHealthColor,
  friendlyHealthMessage,
  friendlyHealthStateLabel,
  integrationAccountLabel,
  integrationConnectionNoun,
  readHealthNumber,
  readHealthString,
  readResourceBoolean,
  readResourceString,
  resourcesOfType,
  totalShopifyRecords,
} from "./integrationManageShared";
import {
  INTEGRATIONS_ROUTE,
  SHOPIFY_SYNC_RESOURCES,
  type IntegrationJobLogItem,
  type IntegrationResourceItem,
  type ShopifyBackfillState,
} from "./integrationManageTypes";
import type { ShopifyConnectPhase } from "./integrationOauth";

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

export function ConnectionPanel({
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

export function OverviewTab({
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

export function IntegrationUnderlineTabs({
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

export function ProviderTab({
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

export function WebhooksTab({
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

export function SettingsTab({
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
