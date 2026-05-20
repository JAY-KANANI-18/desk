import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { BackButton } from "../../../components/channels/BackButton";
import { PageLayout } from "../../../components/ui/PageLayout";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { ConfirmDeleteModal } from "../../../components/ui/modal";
import { getIntegrationMetadata, type IntegrationTabId } from "../../../config/integrationMetadata";
import { workspaceApi } from "../../../lib/workspaceApi";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { DataLoader } from "../../Loader";
import {
  MetaAdsIntegrationContent,
  ShopifyIntegrationContent,
} from "./ProviderIntegrationContent";
import { ActivityTab } from "./IntegrationActivityTab";
import {
  ShopifyConfigTab,
  ShopifyConnectView,
} from "./ShopifyIntegrationPanels";
import {
  MetaAdsConfigTab,
  MetaAdsConnectView,
} from "./MetaAdsIntegrationPanels";
import {
  ConnectionPanel,
  IntegrationUnderlineTabs,
  OverviewTab,
  ProviderTab,
  SettingsTab,
  WebhooksTab,
} from "./IntegrationManageTabs";
import {
  DEFAULT_SHOPIFY_ROWS_PAGINATION,
  SHOPIFY_DATA_TABS,
  ShopifyDataTab,
  isShopifyDataTab,
  type CommercePagination,
  type ShopifyCommerceResponse,
  type ShopifyCommerceRow,
  type ShopifyDataTabId,
} from "./ShopifyDataTab";
import {
  formatLogLabel,
  mergeIntegrationCatalog,
  mergeIntegrationConnections,
  type IntegrationViewModel,
} from "./integrationUi";
import {
  IntegrationIcon,
  isMinimalIntegration,
  shopifyRecordTotals,
  shopifyResourceCountLabel,
  shopifyStoreUrl,
  toDayEndIso,
  toDayStartIso,
} from "./integrationManageShared";
import {
  INTEGRATIONS_ROUTE,
  SHOPIFY_SYNC_RESOURCES,
  type IntegrationEventLogItem,
  type IntegrationJobLogItem,
  type IntegrationLogResponse,
  type IntegrationResourceItem,
  type IntegrationResourceResponse,
  type IntegrationsResponse,
  type ShopifyBackfillState,
} from "./integrationManageTypes";
import {
  connectMetaAdsViaPopup,
  connectShopifyViaPopup,
  delay,
  normalizeShopInput,
  type ShopifyConnectPhase,
} from "./integrationOauth";

export function IntegrationManageEngine() {
  const { providerId, tabId } = useParams<{ providerId: string; tabId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [shopifyRows, setShopifyRows] = useState<ShopifyCommerceRow[]>([]);
  const [shopifyRowsLoading, setShopifyRowsLoading] = useState(false);
  const [shopifyRowsMobileLoadingMore, setShopifyRowsMobileLoadingMore] = useState(false);
  const [shopifyRowsError, setShopifyRowsError] = useState<string | null>(null);
  const [shopifyRowsPage, setShopifyRowsPage] = useState(1);
  const [shopifyRowsResource, setShopifyRowsResource] = useState<ShopifyDataTabId | null>(null);
  const [shopifyRowsPagination, setShopifyRowsPagination] = useState<CommercePagination>(
    DEFAULT_SHOPIFY_ROWS_PAGINATION,
  );
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
      if (integration.id === "shopify") {
        return integration.connected
          ? [
              ...SHOPIFY_DATA_TABS.map((tab) => ({ id: tab.id, label: tab.label })),
              { id: "settings" as const, label: "Config" },
              { id: "activity" as const, label: "Logs" },
            ]
          : [];
      }

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

  const loadShopifyRows = useCallback(
    async (nextPage = shopifyRowsPage) => {
      if (!integration?.integrationId || integration.id !== "shopify" || !isShopifyDataTab(activeTab)) {
        return;
      }

      const append = isMobile && nextPage > 1;
      if (append) {
        setShopifyRowsMobileLoadingMore(true);
      } else {
        setShopifyRowsLoading(true);
      }
      setShopifyRowsError(null);
      try {
        const response = (await workspaceApi.getIntegrationCommerceRecords(
          integration.integrationId,
          activeTab,
          {
            page: nextPage,
            limit: shopifyRowsPagination.limit,
          },
        )) as ShopifyCommerceResponse;
        const items = Array.isArray(response.items) ? response.items : [];
        setShopifyRowsResource(activeTab);
        setShopifyRows((current) => {
          if (!append) return items;
          const seen = new Set(current.map((row) => row.id));
          return [...current, ...items.filter((row) => !seen.has(row.id))];
        });
        setShopifyRowsPagination(
          response.pagination ?? {
            ...DEFAULT_SHOPIFY_ROWS_PAGINATION,
            total: items.length,
            page: nextPage,
            limit: shopifyRowsPagination.limit,
          },
        );
      } catch {
        setShopifyRowsResource(activeTab);
        setShopifyRows([]);
        setShopifyRowsError(`Failed to load Shopify ${formatLogLabel(activeTab).toLowerCase()}.`);
      } finally {
        if (append) {
          setShopifyRowsMobileLoadingMore(false);
        } else {
          setShopifyRowsLoading(false);
        }
      }
    },
    [
      activeTab,
      integration?.id,
      integration?.integrationId,
      isMobile,
      shopifyRowsPage,
      shopifyRowsPagination.limit,
    ],
  );

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
    setShopifyRows([]);
    setShopifyRowsResource(null);
    setShopifyRowsPage(1);
    setShopifyRowsPagination(DEFAULT_SHOPIFY_ROWS_PAGINATION);
    setShopifyRowsError(null);
  }, [activeTab, integration?.integrationId]);

  useEffect(() => {
    if (
      integration?.id === "shopify" &&
      integration.integrationId &&
      isShopifyDataTab(activeTab)
    ) {
      void loadShopifyRows(shopifyRowsPage);
    }
  }, [
    activeTab,
    integration?.id,
    integration?.integrationId,
    loadShopifyRows,
    shopifyRowsPage,
  ]);

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

  const loadNextShopifyRowsPage = useCallback(() => {
    if (
      shopifyRowsLoading ||
      shopifyRowsMobileLoadingMore ||
      !shopifyRowsPagination.hasNextPage
    ) {
      return;
    }
    setShopifyRowsPage((current) => Math.min(shopifyRowsPagination.totalPages, current + 1));
  }, [
    shopifyRowsLoading,
    shopifyRowsMobileLoadingMore,
    shopifyRowsPagination.hasNextPage,
      shopifyRowsPagination.totalPages,
  ]);

  const reloadShopifyRows = useCallback(() => {
    if (shopifyRowsPage === 1) {
      void loadShopifyRows(1);
      return;
    }
    setShopifyRowsPage(1);
  }, [loadShopifyRows, shopifyRowsPage]);

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

      {integration.id === "shopify" ? (
        <ShopifyIntegrationContent
          connected={integration.connected}
          activeTab={activeTab}
          connectView={
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
          }
          dataView={
            isShopifyDataTab(activeTab) ? (
              <ShopifyDataTab
                tabId={activeTab}
                rows={shopifyRowsResource === activeTab ? shopifyRows : []}
                loading={shopifyRowsLoading || shopifyRowsResource !== activeTab}
                mobileLoadingMore={shopifyRowsMobileLoadingMore}
                error={shopifyRowsError}
                pagination={shopifyRowsPagination}
                onReload={reloadShopifyRows}
                onPageChange={setShopifyRowsPage}
                onLoadNextMobilePage={loadNextShopifyRowsPage}
              />
            ) : null
          }
          settingsView={
            <ShopifyConfigTab
              integration={integration}
              latestJob={jobLogs[0] ?? null}
              busyAction={busyAction}
              onSync={syncProvider}
              onRefresh={refreshProvider}
              onDisconnect={() => setConfirmDisconnectOpen(true)}
            />
          }
          activityView={
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
          }
        />
      ) : null}

      {integration.id === "meta_ads" ? (
        <MetaAdsIntegrationContent
          connected={integration.connected}
          activeTab={activeTab}
          connectView={
            <MetaAdsConnectView
              busyAction={busyAction}
              onConnectMetaAds={connectMetaAds}
            />
          }
          settingsView={
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
          }
          activityView={
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
          }
        />
      ) : null}

      {!isMinimalIntegration(integration) && activeTab === "overview" ? (
        <OverviewTab
          integration={integration}
          connectionPanel={connectionPanel}
          latestJob={jobLogs[0] ?? null}
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

      {!isMinimalIntegration(integration) && activeTab === "activity" ? (
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
