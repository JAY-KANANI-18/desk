import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "@/components/ui/icons";

import { workspaceApi } from "../../../lib/workspaceApi";
import type { Integration } from "../types";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";
import { INTEGRATION_CATEGORIES } from "../../../config/integrationMetadata";
import {
  formatDateTime,
  integrationInitials,
  integrationBenefits,
  mergeIntegrationCatalog,
  statusColor,
  statusLabel,
  type IntegrationViewModel,
} from "../integrations/integrationUi";

function IntegrationIcon({ integration }: { integration: IntegrationViewModel }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
      {imageFailed ? (
        <span className="text-xs font-semibold text-gray-500">
          {integrationInitials(integration.name)}
        </span>
      ) : (
        <img
          alt=""
          className="h-9 w-9 object-contain"
          src={integration.simpleIconUrl}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

function IntegrationBenefitList({
  benefits,
  connected,
}: {
  benefits: string[];
  connected: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="h-px w-7 rounded-full bg-[var(--color-primary)]/45" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          {connected ? "Active benefits" : "What this unlocks"}
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {benefits.map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-2.5 text-sm leading-5 text-gray-700 md:text-[13px] md:leading-5"
          >
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]/70" />
            <span className="min-w-0 font-medium">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationCard({
  integration,
  onManage,
}: {
  integration: IntegrationViewModel;
  onManage: (integration: IntegrationViewModel) => void;
}) {
  const isPlanned = integration.availability === "planned";
  const actionLabel = integration.connected ? "Manage" : isPlanned ? "Preview" : "Connect";
  const accountLabel =
    integration.connected
      ? integration.summary?.accountName ||
        integration.summary?.shopName ||
        integration.summary?.shopDomain ||
        null
      : null;
  const benefits = integrationBenefits(integration).slice(0, 3);
  const stateTitle = integration.connected
    ? "Active in workspace"
    : isPlanned
      ? "Coming later"
      : "Ready to connect";
  const stateText = integration.connected
    ? accountLabel
      ? `Connected to ${accountLabel}`
      : "Connected and ready for contacts, workflows, and broadcasts."
    : isPlanned
      ? "Preview how this provider will fit into AxoDesk."
      : "Connect this provider when you are ready.";
  const cardStyle = integration.connected
    ? {
        borderColor:
          "color-mix(in srgb, var(--color-primary) 36%, var(--settings-surface-border))",
        boxShadow:
          "inset 3px 0 0 var(--color-primary), 0 12px 30px color-mix(in srgb, var(--color-primary) 10%, transparent)",
      }
    : null;

  return (
    <div
      className={`settings-row-card flex flex-col gap-5 md:flex-row md:items-stretch ${
        integration.connected ? "settings-row-card--active" : ""
      }`}
      style={cardStyle ?? undefined}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <IntegrationIcon integration={integration} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-gray-900">
              {integration.name}
            </p>
            <Tag
              label={statusLabel(integration)}
              bgColor={statusColor(integration)}
              textColor={integration.connected ? "var(--color-success)" : undefined}
              size="sm"
            />
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500">
            {integration.desc}
          </p>

          <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                integration.connected ? "text-[var(--color-primary)]" : "text-gray-700"
              }`}
            >
              {integration.connected ? (
                <CheckCircle2 size={14} weight="fill" />
              ) : null}
              {stateTitle}
            </span>
            <span className="hidden text-gray-300 sm:inline" aria-hidden="true">/</span>
            <span className="font-medium text-gray-600">{stateText}</span>
            {integration.connected && integration.lastSyncedAt ? (
              <>
                <span className="hidden text-gray-300 sm:inline" aria-hidden="true">/</span>
                <span>Last synced {formatDateTime(integration.lastSyncedAt)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-gray-100 pt-4 md:w-[380px] md:border-l md:border-t-0 md:border-gray-100 md:pl-6 md:pt-0 lg:w-[420px]">
        <IntegrationBenefitList benefits={benefits} connected={integration.connected} />
        <Button
          onClick={() => onManage(integration)}
          variant={integration.connected ? "primary" : "secondary"}
          size="sm"
          className="w-full md:w-auto md:self-end"
          rightIcon={<ChevronRight size={14} />}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export const Integrations = () => {
  const navigate = useNavigate();
  const [remoteItems, setRemoteItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await workspaceApi.getIntegrations()) as {
        integrations?: Integration[];
      };
      setRemoteItems(res.integrations ?? []);
    } catch {
      setError("Failed to load integration connection status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useMobileHeaderActions(
    {
      actions: [
        {
          id: "refresh-integrations",
          label: "Refresh integrations",
          icon: loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          ),
          onClick: () => void load(),
          disabled: loading,
        },
      ],
    },
    [load, loading],
  );

  const integrations = useMemo(
    () => mergeIntegrationCatalog(remoteItems),
    [remoteItems],
  );
  const grouped = useMemo(
    () =>
      INTEGRATION_CATEGORIES.map((itemCategory) => ({
        category: itemCategory,
        items: integrations.filter((integration) => integration.category === itemCategory),
      })).filter((group) => group.items.length > 0),
    [integrations],
  );

  const handleManage = (integration: IntegrationViewModel) => {
    navigate(`/workspace/settings/integrations/${integration.id}`);
  };

  return (
    <div className="settings-page-stack">
      {loading ? (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Checking integration connection status...
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      {grouped.length === 0 ? (
        <div className="settings-empty-panel">
          <p className="text-sm font-medium text-gray-700">
            No integrations found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Available providers will appear here when they are enabled.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.category} className="space-y-3">
              <div className="space-y-3">
                {group.items.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onManage={handleManage}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
