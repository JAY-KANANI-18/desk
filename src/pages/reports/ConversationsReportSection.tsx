import { useCallback } from "react";
import { workspaceApi } from "../../lib/workspaceApi";
import {
  ReportChartCard,
  ReportsErrorState,
  ReportsLoadingState,
  ReportsSectionIntro,
  ReportSingleChartCard,
  ReportStatCard,
  useReportLoader,
} from "./shared";

export const ConversationsReportSection = () => {
  const { data, error, loading } = useReportLoader(
    useCallback((filters) => workspaceApi.getConversations(filters), []),
  );

  if (loading) {
    return <ReportsLoadingState />;
  }

  if (error || !data) {
    return (
      <ReportsErrorState
        message={error || "Conversation analytics are unavailable."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ReportsSectionIntro
        description="Analyze open and resolved trends, status mix, and response performance."
        title="Conversations"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ReportStatCard label="Total" value={data.stats.total} />
        <ReportStatCard label="Open" value={data.stats.open} />
        <ReportStatCard label="Resolved" value={data.stats.resolved} />
        <ReportStatCard
          label="Avg handle time (min)"
          value={data.stats.avgHandleTimeMinutes}
        />
        <ReportStatCard
          label="Avg first response (min)"
          value={data.stats.averageFirstResponseMinutes}
        />
      </div>

      <ReportChartCard
        barData={data.byStatus.bar}
        donutSegments={data.byStatus.donut}
        title="Conversations by status"
        total={data.byStatus.total}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportSingleChartCard
          data={data.openedByDay}
          title="Opened by day"
        />
        <ReportSingleChartCard
          data={data.closedByDay}
          title="Closed and resolved by day"
        />
      </div>
    </div>
  );
};
