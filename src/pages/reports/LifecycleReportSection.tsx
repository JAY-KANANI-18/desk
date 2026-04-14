import { useCallback, useMemo } from "react";
import { workspaceApi } from "../../lib/workspaceApi";
import {
  ReportChartCard,
  ReportsErrorState,
  ReportsLoadingState,
  ReportsSectionIntro,
  ReportStatCard,
  useReportLoader,
} from "./shared";

export const LifecycleReportSection = () => {
  const { data, error, loading } = useReportLoader(
    useCallback((filters) => workspaceApi.getLifecycle(filters), []),
  );

  const topStage = useMemo(() => {
    if (!data?.stages) {
      return null;
    }

    return [...data.stages].sort((left: any, right: any) => right.count - left.count)[0] ?? null;
  }, [data?.stages]);

  if (loading) {
    return <ReportsLoadingState />;
  }

  if (error || !data) {
    return (
      <ReportsErrorState message={error || "Lifecycle analytics are unavailable."} />
    );
  }

  return (
    <div className="space-y-6">
      <ReportsSectionIntro
        description="See how contacts are distributed across lifecycle stages."
        title="Lifecycle"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard label="Total contacts" value={data.total} />
        <ReportStatCard label="Stages" value={data.stages.length} />
        <ReportStatCard label="Top stage" value={topStage?.name || "-"} />
        <ReportStatCard label="Top stage count" value={topStage?.count || 0} />
      </div>

      <ReportChartCard
        barData={data.chart.bar}
        donutSegments={data.chart.donut}
        title="Contacts by lifecycle stage"
        total={data.chart.total}
      />
    </div>
  );
};
