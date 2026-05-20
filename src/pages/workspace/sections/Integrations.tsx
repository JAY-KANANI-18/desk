import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "@/components/ui/icons";

import { workspaceApi } from "../../../lib/workspaceApi";
import type { Integration } from "../types";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { Button } from "../../../components/ui/Button";
import { PageLayout } from "../../../components/ui/PageLayout";
import { Tag } from "../../../components/ui/Tag";
import {
  integrationInitials,
  mergeIntegrationCatalog,
  mergeIntegrationConnections,
  statusColor,
  statusLabel,
  type IntegrationViewModel,
} from "../integrations/integrationUi";

type IntegrationsResponse = {
  integrations?: Integration[];
  connections?: Integration[];
};

const MULTI_CONNECTION_PROVIDERS = new Set(["meta_ads", "shopify"]);

type ProviderAccent = {
  main: string;
  soft: string;
  wash: string;
  border: string;
  restShadow: string;
};

const DEFAULT_ACCENT: ProviderAccent = {
  main: "var(--color-primary)",
  soft: "rgba(79, 70, 229, 0.08)",
  wash: "rgba(79, 70, 229, 0.14)",
  border: "rgba(79, 70, 229, 0.24)",
  restShadow: "rgba(79, 70, 229, 0.16)",
};

const PROVIDER_ACCENTS: Record<string, ProviderAccent> = {
  meta_ads: {
    main: "#0866ff",
    soft: "rgba(8, 102, 255, 0.08)",
    wash: "rgba(8, 102, 255, 0.15)",
    border: "rgba(8, 102, 255, 0.26)",
    restShadow: "rgba(8, 102, 255, 0.17)",
  },
  shopify: {
    main: "#78b657",
    soft: "rgba(120, 182, 87, 0.1)",
    wash: "rgba(120, 182, 87, 0.17)",
    border: "rgba(120, 182, 87, 0.3)",
    restShadow: "rgba(120, 182, 87, 0.18)",
  },
};

type IntegrationCardStyle = CSSProperties &
  Record<
    | "--integration-accent"
    | "--integration-rest-shadow"
    | "--integration-icon-border"
    | "--integration-card-shadow",
    string
  >;

function providerAccent(providerId: string) {
  return PROVIDER_ACCENTS[providerId] ?? DEFAULT_ACCENT;
}

function IntegrationIcon({ integration }: { integration: IntegrationViewModel }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center sm:h-12 sm:w-12">
      {imageFailed ? (
        <span className="text-xs font-semibold text-gray-500">
          {integrationInitials(integration.name)}
        </span>
      ) : (
        <img
          alt=""
          className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          src={integration.simpleIconUrl}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

function shopifyStoreUrl(integration: IntegrationViewModel) {
  const shop = integration.summary?.shopDomain || integration.externalAccountId;
  return shop ? `https://${shop.replace(/^https?:\/\//i, "")}` : null;
}

function integrationAccountLabel(integration: IntegrationViewModel) {
  return (
    integration.summary?.accountName ||
    integration.summary?.shopName ||
    integration.summary?.shopDomain ||
    integration.externalAccountName ||
    integration.externalAccountId ||
    null
  );
}

function connectedDetails(integration: IntegrationViewModel) {
  if (integration.id === "shopify") {
    return [
      {
        label: "Store",
        value: integration.summary?.shopName || integration.externalAccountName || "Shopify store",
      },
      {
        label: "URL",
        value: shopifyStoreUrl(integration),
      },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  }

  if (integration.id === "meta_ads") {
    return [
      {
        label: "Ad account",
        value: integration.summary?.accountName || integration.externalAccountName || "Meta Ads account",
      },
      {
        label: "Account ID",
        value: integration.summary?.accountId || integration.externalAccountId,
      },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  }

  const account = integrationAccountLabel(integration);
  return account ? [{ label: "Account", value: account }] : [];
}

function IntegrationCard({
  integration,
  onManage,
  section,
  connectionCount = 0,
}: {
  integration: IntegrationViewModel;
  onManage: (integration: IntegrationViewModel) => void;
  section: "mine" | "available";
  connectionCount?: number;
}) {
  const isPlanned = integration.availability === "planned";
  const isMine = section === "mine";
  const actionLabel = isMine
    ? "Manage"
    : isPlanned
      ? "Preview"
      : connectionCount > 0
        ? "Add another"
        : "Connect";
  const details = isMine ? connectedDetails(integration) : [];
  const accent = providerAccent(integration.id);
  const cardLightEffect =
    `radial-gradient(ellipse at 94% 0%, ${accent.wash} 0%, ${accent.soft} 30%, transparent 54%), linear-gradient(145deg, rgba(248, 250, 252, 0.98) 0%, rgba(244, 247, 251, 0.96) 54%, rgba(255, 255, 255, 0.9) 100%)`;
  const cardStyle = isMine
    ? {
        borderColor: "transparent",
        background: cardLightEffect,
        padding: "1rem",
      }
    : {
        borderColor: "transparent",
        background: cardLightEffect,
      };
  const accentStyle: IntegrationCardStyle = {
    "--integration-accent": accent.main,
    "--integration-rest-shadow": accent.restShadow,
    "--integration-icon-border": accent.border,
    "--integration-card-shadow": `inset 0 1px 0 rgba(255, 255, 255, 0.78), inset 0 -26px 54px rgba(15, 23, 42, 0.035), 0 18px 42px rgba(15, 23, 42, 0.1), 0 10px 22px ${accent.restShadow}`,
    ...cardStyle,
  };
  const actionButton = (
    <Button
      onClick={() => onManage(integration)}
      variant="primary"
      size="xs"
      className="group/manage"
      preserveChildLayout
      style={{
        backgroundColor: "var(--color-primary)",
        borderColor: "var(--color-primary)",
      }}
    >
      <span className="inline-flex items-center">{actionLabel}</span>
      <span className="inline-flex items-center transition-transform duration-200 group-hover/manage:translate-x-0.5">
        <ChevronRight size={14} />
      </span>
    </Button>
  );
  const availableAction = (
    <button
      type="button"
      onClick={() => onManage(integration)}
      className="group/action inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-[var(--integration-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--integration-icon-border)]"
    >
      <span>{actionLabel}</span>
      <span className="inline-flex transition-transform group-hover/action:translate-x-0.5">
        <ChevronRight size={14} />
      </span>
    </button>
  );

  return (
    <div
      className={`settings-row-card flex h-full flex-col ${
        isMine
          ? "group relative gap-3 overflow-hidden shadow-[var(--integration-card-shadow)]"
          : "group relative gap-3.5 overflow-hidden shadow-[var(--integration-card-shadow)]"
      }`}
      style={accentStyle}
    >
      {isMine ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 z-10 w-1 bg-[var(--color-primary)]"
          style={{ backgroundColor: accent.main }}
        />
      ) : null}
      <div className="relative z-10 flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
          <IntegrationIcon integration={integration} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-gray-900">
                {integration.name}
              </p>
              {isMine ? (
                <Tag
                  label={statusLabel(integration)}
                  bgColor={statusColor(integration)}
                  textColor={integration.connected ? "var(--color-success)" : undefined}
                  size="sm"
                />
              ) : null}
            </div>
            {isMine ? <div className="flex-shrink-0">{actionButton}</div> : null}
          </div>
          {!isMine ? (
            <p className="mt-1 line-clamp-3 text-sm leading-5 text-gray-500">
              {integration.desc}
            </p>
          ) : null}
        </div>
      </div>

      {details.length ? (
        <dl className="relative z-10 grid gap-1.5 border-t border-gray-100 pt-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3"
            >
              <dt className="text-xs font-medium text-gray-400">{detail.label}</dt>
              <dd
                className={`text-sm font-medium text-gray-800 ${
                  isMine ? "truncate" : "break-words"
                }`}
                title={detail.value}
              >
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {!isMine ? (
        <div className="relative z-10 mt-0 flex justify-end pt-1">
          {availableAction}
        </div>
      ) : null}
    </div>
  );
}

export const Integrations = () => {
  const navigate = useNavigate();
  const [catalogItems, setCatalogItems] = useState<IntegrationViewModel[]>([]);
  const [connectionItems, setConnectionItems] = useState<IntegrationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await workspaceApi.getIntegrations()) as IntegrationsResponse;
      const connections = res.connections ?? (res.integrations ?? []).filter(
        (integration) => integration.integrationId || integration.routingChannelId,
      );
      setCatalogItems(mergeIntegrationCatalog([]));
      setConnectionItems(mergeIntegrationConnections(connections));
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
      title: "Integrations",
      subtitle: "Connect the tools AxoDesk can use for leads, store data, broadcasts, and workflows.",
      panel: (
        <p className="text-sm leading-5 text-slate-500">
          Connect the tools AxoDesk can use for leads, store data, broadcasts, and workflows.
        </p>
      ),
    },
    [],
  );

  const connectionCountsByProvider = useMemo(() => {
    return connectionItems.reduce<Record<string, number>>((counts, integration) => {
      counts[integration.id] = (counts[integration.id] ?? 0) + 1;
      return counts;
    }, {});
  }, [connectionItems]);

  const availableItems = useMemo(
    () =>
      catalogItems.filter(
        (integration) =>
          integration.availability === "available" &&
          (MULTI_CONNECTION_PROVIDERS.has(integration.id) ||
            !connectionCountsByProvider[integration.id]),
      ),
    [catalogItems, connectionCountsByProvider],
  );

  const handleManage = (integration: IntegrationViewModel) => {
    navigate(`/integrations/${integration.routeId}`);
  };

  return (
    <PageLayout
      title="Integrations"
      subtitle="Connect the tools AxoDesk can use for leads, store data, broadcasts, and workflows."
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 md:px-6 md:py-8 lg:px-8"
    >
      <div className="settings-page-stack mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-y-auto px-4 pb-28 pt-4 md:min-h-full md:flex-none md:overflow-visible md:px-0 md:pb-0 md:pt-0">
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

      {!connectionItems.length && !availableItems.length ? (
        <div className="settings-empty-panel">
          <p className="text-sm font-medium text-gray-700">
            No integrations found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Available providers will appear here when they are enabled.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {connectionItems.length ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">My integrations</h2>
        
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {connectionItems.map((integration) => (
                  <IntegrationCard
                    key={integration.routeId}
                    integration={integration}
                    section="mine"
                    onManage={handleManage}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Available integrations</h2>
           
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {availableItems.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  section="available"
                  connectionCount={connectionCountsByProvider[integration.id] ?? 0}
                  onManage={handleManage}
                />
              ))}
            </div>
          </section>
        </div>
      )}
      </div>
    </PageLayout>
  );
};
