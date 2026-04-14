import { useCallback } from "react";
import { workspaceApi } from "../../lib/workspaceApi";
import {
  FailedMessagesTable,
  ReportChartCard,
  ReportsErrorState,
  ReportsLoadingState,
  ReportsSectionIntro,
  ReportStatCard,
  useReportLoader,
} from "./shared";

export const MessagesReportSection = () => {
  const { data, error, loading } = useReportLoader(
    useCallback(async (filters) => {
      const [messages, failedMessages] = await Promise.all([
        workspaceApi.getMessages(filters),
        workspaceApi.getFailedMessages(filters),
      ]);

      return {
        failedMessages,
        messages,
      };
    }, []),
  );

  if (loading) {
    return <ReportsLoadingState />;
  }

  if (error || !data) {
    return (
      <ReportsErrorState message={error || "Message analytics are unavailable."} />
    );
  }

  return (
    <div className="space-y-6">
      <ReportsSectionIntro
        description="Analyze incoming, outgoing, delivery funnel, and failed outbound messages."
        title="Messages"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          label="Total messages"
          value={data.messages.stats.totalMessages}
        />
        <ReportStatCard
          label="Incoming"
          value={data.messages.stats.incoming}
        />
        <ReportStatCard
          label="Outgoing"
          value={data.messages.stats.outgoing}
        />
        <ReportStatCard
          label="Avg / conversation"
          value={data.messages.stats.avgPerConversation}
        />
      </div>

      <ReportChartCard
        barData={data.messages.incoming.bar}
        donutSegments={data.messages.incoming.donut}
        title="Incoming messages by channel"
        total={data.messages.incoming.total}
      />

      <ReportChartCard
        barData={data.messages.outgoing.bar}
        donutSegments={data.messages.outgoing.donut}
        title="Outgoing messages by channel"
        total={data.messages.outgoing.total}
      />

      <ReportChartCard
        barData={data.messages.funnel.bar}
        donutSegments={data.messages.funnel.donut}
        title="Outgoing delivery funnel"
        total={data.messages.funnel.total}
      />

      <FailedMessagesTable rows={data.failedMessages?.data || []} />
    </div>
  );
};
