import { useCallback, useState } from "react";
import { Radio } from "lucide-react";
import { MobileSheet } from "../components/topbar/MobileSheet";
import { BroadcastCalendarView } from "./broadcast/BroadcastCalendarView";
import { BroadcastComposerModal } from "./broadcast/BroadcastComposerModal";
import { BroadcastDetailsDrawer } from "./broadcast/BroadcastDetailsDrawer";
import { BroadcastSidebar } from "./broadcast/BroadcastSidebar";
import { BroadcastTableView } from "./broadcast/BroadcastTableView";
import { BroadcastToolbar } from "./broadcast/BroadcastToolbar";
import { useBroadcastPage } from "./broadcast/useBroadcastPage";
import { formatDateTime } from "./broadcast/utils";

export const Broadcast = () => {
  const page = useBroadcastPage();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const openStatusMenu = useCallback(() => setShowStatusMenu(true), []);

  return (
    <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white md:flex-row">
      <BroadcastSidebar
        selectedStatus={page.selectedStatus}
        onSelectStatus={page.setSelectedStatus}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <BroadcastToolbar
          searchQuery={page.searchQuery}
          onSearchChange={page.setSearchQuery}
          onRefresh={page.refreshPage}
          refreshing={page.channelsLoading || page.runsLoading}
          activeRunLabel={page.activeRunLabel}
          viewMode={page.viewMode}
          onViewModeChange={page.setViewMode}
          onNewBroadcast={page.openComposer}
          selectedStatus={page.selectedStatus}
          onOpenFilters={openStatusMenu}
        />

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
              onOpenDetail={page.openDetail}
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
              onOpenDetail={page.openDetail}
              onLoadMore={page.loadMoreRuns}
            />
          )}
        </div>

        {page.lastSendResult && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-600">
            Last run:{" "}
            <span className="font-medium text-gray-900">
              {page.lastSendResult.status === "scheduled"
                ? `scheduled for ${formatDateTime(page.lastSendResult.scheduledAt)}`
                : `${page.lastSendResult.queued} queued`}
            </span>
            {page.lastSendResult.failed > 0 && (
              <span className="ml-2 text-red-600">{page.lastSendResult.failed} enqueue errors</span>
            )}
            <button
              type="button"
              className="ml-3 text-indigo-600 transition hover:text-indigo-700 hover:underline"
              onClick={() => void page.openLastRun()}
            >
              View run
            </button>
          </div>
        )}
      </div>

      <MobileSheet
        open={showStatusMenu}
        onClose={() => setShowStatusMenu(false)}
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Broadcasts
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Radio size={16} className="text-indigo-600" />
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

      <BroadcastComposerModal
        open={page.showComposer}
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
        templateVars={page.templateVars}
        onTemplateVarsChange={page.setTemplateVars}
        sending={page.sending}
        onClose={page.closeComposer}
        onSend={page.handleSend}
      />

      <BroadcastDetailsDrawer
        selectedRun={page.selectedRun}
        analytics={page.analytics}
        analyticsLoading={page.analyticsLoading}
        trace={page.trace}
        traceLoading={page.traceLoading}
        broadcastAction={page.broadcastAction}
        broadcastActionSaving={page.broadcastActionSaving}
        broadcastDraft={page.broadcastDraft}
        onBroadcastDraftChange={page.setBroadcastDraft}
        onClose={page.closeDetails}
        onOpenBroadcastAction={page.openBroadcastAction}
        onCancelBroadcastAction={() => page.setBroadcastAction(null)}
        onSaveBroadcastAction={page.saveBroadcastAction}
        onSendNow={page.sendSelectedBroadcastNow}
        onRefreshAnalytics={page.refreshAnalytics}
        onRefreshTrace={page.refreshTrace}
      />
    </div>
  );
};
