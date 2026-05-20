import { Loader2, RefreshCcw, RefreshCw } from "@/components/ui/icons";

import { Button } from "../../../components/ui/Button";
import { CheckboxInput } from "../../../components/ui/inputs";
import { Tag } from "../../../components/ui/Tag";
import type { IntegrationViewModel } from "./integrationUi";
import {
  DetailTile,
  readResourceBoolean,
  readResourceString,
  resourcesOfType,
} from "./integrationManageShared";
import type { IntegrationResourceItem } from "./integrationManageTypes";

export function MetaAdsConnectView({
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

export function MetaAdsConfigTab({
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
