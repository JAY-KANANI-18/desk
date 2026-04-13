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

  return (
    <div className="flex h-full flex-col bg-slate-50 md:flex-row">
      <BroadcastSidebar
        selectedStatus={page.selectedStatus}
        onSelectStatus={page.setSelectedStatus}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <BroadcastToolbar
          searchQuery={page.searchQuery}
          onSearchChange={page.setSearchQuery}
          onRefresh={page.refreshPage}
          refreshing={page.channelsLoading || page.runsLoading}
          activeRunLabel={page.activeRunLabel}
          viewMode={page.viewMode}
          onViewModeChange={page.setViewMode}
          onNewBroadcast={page.openComposer}
        />

        <div className="flex-1 overflow-auto">
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
          <div className="border-t border-slate-200 bg-white px-6 py-3 text-sm text-slate-700">
            Last run:{" "}
            <span className="font-medium text-slate-900">
              {page.lastSendResult.status === "scheduled"
                ? `scheduled for ${formatDateTime(page.lastSendResult.scheduledAt)}`
                : `${page.lastSendResult.queued} queued`}
            </span>
            {page.lastSendResult.failed > 0 && (
              <span className="ml-2 text-red-600">{page.lastSendResult.failed} enqueue errors</span>
            )}
            <button
              type="button"
              className="ml-3 text-sky-600 transition hover:underline"
              onClick={() => void page.openLastRun()}
            >
              View run
            </button>
          </div>
        )}
      </div>

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
