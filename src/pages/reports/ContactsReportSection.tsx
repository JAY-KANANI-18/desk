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

export const ContactsReportSection = () => {
  const { data, error, loading } = useReportLoader(
    useCallback((filters) => workspaceApi.getContacts(filters), []),
  );

  if (loading) {
    return <ReportsLoadingState />;
  }

  if (error || !data) {
    return (
      <ReportsErrorState message={error || "Contact analytics are unavailable."} />
    );
  }

  return (
    <div className="space-y-6">
      <ReportsSectionIntro
        description="Track contact growth, deletions, source channels, and connection trends."
        title="Contacts"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard label="Total contacts" value={data.stats.totalContacts} />
        <ReportStatCard label="New this period" value={data.stats.newContacts} />
        <ReportStatCard
          label="Deleted this period"
          value={data.stats.deletedContacts}
        />
        <ReportStatCard
          label="Connected channels"
          value={data.stats.activeConnections}
        />
      </div>

      <ReportChartCard
        barData={data.byChannel.bar}
        donutSegments={data.byChannel.donut}
        title="New contacts by channel"
        total={data.byChannel.total}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportSingleChartCard
          data={data.addedByDay}
          title="Contacts added by day"
        />
        <ReportSingleChartCard
          data={data.deletedByDay || []}
          title="Contacts deleted by day"
        />
      </div>
    </div>
  );
};
