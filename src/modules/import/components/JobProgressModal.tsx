import { useMemo } from "react";
import { Button } from "../../../components/ui/Button";
import { CenterModal } from "../../../components/ui/Modal";
import { useJobProgress } from "../hooks/useJobProgress";
import {
  ImportJobProgressBar,
  ImportJobStatusTag,
  openImportJobResult,
} from "./jobPresentation";

type Props = {
  jobId: string | null;
  onClose: () => void;
};

export function JobProgressModal({ jobId, onClose }: Props) {
  const { job, loading, isFinished } = useJobProgress(jobId);

  const title = useMemo(() => {
    if (!job) {
      return "Import started";
    }

    if (job.status === "COMPLETED") {
      return "Import completed";
    }

    if (job.status === "FAILED") {
      return "Import failed";
    }

    return "Import running in background";
  }, [job]);

  if (!jobId) {
    return null;
  }

  return (
    <CenterModal
      isOpen={Boolean(jobId)}
      onClose={onClose}
      title={title}
      subtitle={
        job?.status === "COMPLETED"
          ? "Your notification center will also show the final result."
          : "You can safely leave this page while the background import keeps running."
      }
      size="md"
      width={560}
      closeOnOverlayClick={false}
      bodyPadding="none"
      secondaryAction={
        <Button type="button" variant="secondary" onClick={onClose}>
          {isFinished ? "Close" : "Hide"}
        </Button>
      }
      primaryAction={
        job?.resultUrl ? (
          <Button
            type="button"
            onClick={() => openImportJobResult(job.resultUrl)}
          >
            Download result file
          </Button>
        ) : null
      }
    >
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
            <span>Status</span>
            {loading && !job ? (
              <span>Loading...</span>
            ) : (
              <ImportJobStatusTag status={job?.status ?? "PENDING"} />
            )}
          </div>

          <ImportJobProgressBar
            progress={job?.progress ?? 0}
            status={job?.status ?? "PENDING"}
            className="mt-3 h-3"
          />

          <div className="mt-2 text-right text-xs font-medium text-gray-500">
            {(job?.progress ?? 0).toFixed(0)}%
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="Processed" value={job?.processedRecords ?? 0} />
            <Metric label="Success" value={job?.successCount ?? 0} />
            <Metric
              label="Failed"
              value={job?.failureCount ?? 0}
              tone="danger"
            />
          </div>
        </div>
      </div>
    </CenterModal>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div
        className={`text-2xl font-semibold ${
          tone === "danger" ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}
