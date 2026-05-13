import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, Radio } from "@/components/ui/icons";
import { MobileSheet } from "../components/ui/modal";
import { Button } from "../components/ui/Button";
import { FloatingActionButton } from "../components/ui/FloatingActionButton";
import { PageLayout } from "../components/ui/PageLayout";
import { useIsMobile } from "../hooks/useIsMobile";
import { BroadcastCalendarView } from "./broadcast/BroadcastCalendarView";
import { BroadcastComposerPage } from "./broadcast/BroadcastComposerPage";
import { BroadcastDetailsPage } from "./broadcast/BroadcastDetailsPage";
import { BroadcastSidebar } from "./broadcast/BroadcastSidebar";
import { BroadcastTableView } from "./broadcast/BroadcastTableView";
import { BroadcastToolbar } from "./broadcast/BroadcastToolbar";
import type { BroadcastRunRow } from "../lib/broadcastApi";
import { useBroadcastPage } from "./broadcast/useBroadcastPage";
import { formatDateTime } from "./broadcast/utils";

export const Broadcast = () => {
  const page = useBroadcastPage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { broadcastId } = useParams<{ broadcastId?: string }>();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const isComposerRoute = location.pathname.replace(/\/+$/, "").endsWith("/broadcast/new");

  useEffect(() => {
    if (isComposerRoute) {
      page.closeDetails();
      return;
    }
    if (broadcastId) {
      void page.openDetailById(broadcastId);
      return;
    }
    page.closeDetails();
  }, [broadcastId, isComposerRoute, page.openDetailById, page.closeDetails]);

  const openDetailPage = useCallback(
    (run: BroadcastRunRow) => {
      navigate(run.id);
    },
    [navigate],
  );

  const closeDetailPage = useCallback(() => {
    navigate("..", { relative: "path" });
  }, [navigate]);

  const openComposerPage = useCallback(() => {
    page.openComposer();
    navigate("new");
  }, [navigate, page.openComposer]);

  const closeComposerPage = useCallback(() => {
    page.closeComposer();
    navigate("..", { relative: "path" });
  }, [navigate, page.closeComposer]);

  const sendComposerBroadcast = useCallback(async () => {
    const result = await page.handleSend();
    if (result) {
      navigate(`../${result.broadcastRunId}`, { relative: "path", replace: true });
    }
    return result;
  }, [navigate, page.handleSend]);

  const desktopToolbar = isMobile ? undefined : (
    <BroadcastToolbar
      searchQuery={page.searchQuery}
      onSearchChange={page.setSearchQuery}
      onRefresh={page.refreshPage}
      refreshing={page.channelsLoading || page.runsLoading}
      activeRunLabel={page.activeRunLabel}
      viewMode={page.viewMode}
      onViewModeChange={page.setViewMode}
      onNewBroadcast={openComposerPage}
      selectedStatus={page.selectedStatus}
      onStatusChange={page.setSelectedStatus}
      onOpenFilters={() => setShowStatusMenu(true)}
      desktopMode="embedded"
    />
  );

  if (isComposerRoute) {
    return (
      <BroadcastComposerPage
        channels={page.channels}
        form={page.form}
        onFormChange={page.setForm}
        tags={page.tags}
        lifecycles={page.lifecycles}
        audiencePreview={page.audiencePreview}
        previewLoading={page.previewLoading}
        onPreviewAudience={page.runAudiencePreview}
        isWhatsApp={page.isWhatsApp}
        waTemplates={page.waTemplates}
        selectedTemplateId={page.selectedTemplateId}
        onSelectedTemplateIdChange={page.setSelectedTemplateId}
        selectedTemplate={page.selectedTemplate}
        selectedChannel={page.selectedChannel}
        templateVars={page.templateVars}
        onTemplateVarsChange={page.setTemplateVars}
        sending={page.sending}
        onBack={closeComposerPage}
        onSend={sendComposerBroadcast}
      />
    );
  }

  if (broadcastId) {
    return (
      <BroadcastDetailsPage
        selectedRun={page.selectedRun}
        detailsLoading={page.detailsLoading}
        analytics={page.analytics}
        analyticsLoading={page.analyticsLoading}
        trace={page.trace}
        traceLoading={page.traceLoading}
        traceFilter={page.traceFilter}
        tracePage={page.tracePage}
        traceLimit={page.traceLimit}
        broadcastAction={page.broadcastAction}
        broadcastActionSaving={page.broadcastActionSaving}
        broadcastDraft={page.broadcastDraft}
        onBroadcastDraftChange={page.setBroadcastDraft}
        onBack={closeDetailPage}
        onOpenBroadcastAction={page.openBroadcastAction}
        onCancelBroadcastAction={() => page.setBroadcastAction(null)}
        onSaveBroadcastAction={page.saveBroadcastAction}
        onSendNow={page.sendSelectedBroadcastNow}
        onRefreshAnalytics={page.refreshAnalytics}
        onRefreshTrace={page.refreshTrace}
        onTraceFilterChange={page.changeTraceFilter}
        onTracePageChange={page.changeTracePage}
      />
    );
  }

  return (
    <PageLayout
      title="Message broadcasts"
      toolbar={desktopToolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isMobile ? (
            <BroadcastToolbar
              searchQuery={page.searchQuery}
              onSearchChange={page.setSearchQuery}
              onRefresh={page.refreshPage}
              refreshing={page.channelsLoading || page.runsLoading}
              activeRunLabel={page.activeRunLabel}
              viewMode={page.viewMode}
              onViewModeChange={page.setViewMode}
              onNewBroadcast={openComposerPage}
              selectedStatus={page.selectedStatus}
              onStatusChange={page.setSelectedStatus}
              onOpenFilters={() => setShowStatusMenu(true)}
            />
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            {page.viewMode === "calendar" ? (
              <BroadcastCalendarView
                monthLabel={page.monthLabel}
                calendarMonth={page.calendarMonth}
                calendarDays={page.calendarDays}
                calendarEventsByDate={page.calendarEventsByDate}
                todayKey={page.todayKey}
                onToday={page.goToToday}
                onPreviousMonth={page.goToPreviousMonth}
                onNextMonth={page.goToNextMonth}
                onOpenDetail={openDetailPage}
                hasMoreRuns={page.hasMoreRuns}
                runsLoadingMore={page.runsLoadingMore}
                nextCursor={page.nextCursor}
                onLoadMore={page.loadMoreRuns}
              />
            ) : (
              <BroadcastTableView
                runs={page.runs}
                runsLoading={page.runsLoading}
                runsLoadingMore={page.runsLoadingMore}
                hasMoreRuns={page.hasMoreRuns}
                nextCursor={page.nextCursor}
                debouncedSearchQuery={page.debouncedSearchQuery}
                selectedStatus={page.selectedStatus}
                sortBy={page.sortBy}
                sortOrder={page.sortOrder}
                onToggleSort={page.toggleSort}
                onOpenDetail={openDetailPage}
                onLoadMore={page.loadMoreRuns}
              />
            )}
          </div>

          {page.lastSendResult && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-600">
              Last broadcast:{" "}
              <span className="font-medium text-gray-900">
                {page.lastSendResult.status === "scheduled"
                  ? `scheduled for ${formatDateTime(page.lastSendResult.scheduledAt)}`
                  : `${page.lastSendResult.queued} people started`}
              </span>
              {page.lastSendResult.failed > 0 && (
                <span className="ml-2 text-red-600">{page.lastSendResult.failed} need attention</span>
              )}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-2"
                onClick={() => navigate(page.lastSendResult.broadcastRunId)}
              >
                View details
              </Button>
            </div>
          )}
        </div>

        <MobileSheet
          isOpen={showStatusMenu}
          onClose={() => setShowStatusMenu(false)}
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Broadcasts
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                <Radio size={16} className="text-[var(--color-primary)]" />
                {page.selectedStatus}
              </h2>
            </div>
          }
        >
          <BroadcastSidebar
            selectedStatus={page.selectedStatus}
            onSelectStatus={(value) => {
              page.setSelectedStatus(value);
              setShowStatusMenu(false);
            }}
            variant="mobile"
          />
        </MobileSheet>

        <FloatingActionButton
          label="New broadcast"
          icon={<Plus size={24} />}
          onClick={openComposerPage}
        />
      </div>
    </PageLayout>
  );
};
