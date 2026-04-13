import { useCallback } from "react";
import { broadcastApi } from "../../lib/broadcastApi";
import { useChannel } from "../../context/ChannelContext";
import { useBroadcastComposer } from "./useBroadcastComposer";
import { useBroadcastDetails } from "./useBroadcastDetails";
import { useBroadcastRuns } from "./useBroadcastRuns";

export function useBroadcastPage() {
  const { channels, loading: channelsLoading, refreshChannels } = useChannel();
  const runs = useBroadcastRuns();

  const reloadRuns = useCallback(async () => {
    await runs.loadRuns(true);
  }, [runs]);

  const composer = useBroadcastComposer({ channels, reloadRuns });
  const details = useBroadcastDetails({ reloadRuns });

  const refreshPage = useCallback(() => {
    void refreshChannels(false);
    void runs.loadRuns(true);
  }, [refreshChannels, runs]);

  const openLastRun = useCallback(async () => {
    if (!composer.lastSendResult) return;
    const full = await broadcastApi.get(composer.lastSendResult.broadcastRunId);
    await details.openDetail(full);
  }, [composer.lastSendResult, details]);

  return {
    channels,
    channelsLoading,
    ...runs,
    ...composer,
    ...details,
    refreshPage,
    openLastRun,
  };
}
