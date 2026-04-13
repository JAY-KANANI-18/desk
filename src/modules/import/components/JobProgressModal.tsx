import { X } from "lucide-react";
import { useMemo } from "react";
import { useJobProgress } from "../hooks/useJobProgress";

type Props = {
  jobId: string | null;
  onClose: () => void;
};

export function JobProgressModal({ jobId, onClose }: Props) {
  const { job, loading, isFinished } = useJobProgress(jobId);

  const title = useMemo(() => {
    if (!job) return "Import started";
    if (job.status === "COMPLETED") return "Import completed";
    if (job.status === "FAILED") return "Import failed";
    return "Import running in background";
  }, [job]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {job?.status === "COMPLETED"
                ? "Your notification center will also show the final result."
                : "You can safely leave this page while the background import keeps running."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Status</span>
            <span>{loading && !job ? "Loading..." : job?.status ?? "PENDING"}</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                job?.status === "FAILED" ? "bg-red-500" : "bg-indigo-600"
              }`}
              style={{ width: `${job?.progress ?? 0}%` }}
            />
          </div>
          <div className="mt-2 text-right text-xs font-medium text-gray-500">
            {(job?.progress ?? 0).toFixed(0)}%
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="Processed" value={job?.processedRecords ?? 0} />
            <Metric label="Success" value={job?.successCount ?? 0} />
            <Metric label="Failed" value={job?.failureCount ?? 0} tone="danger" />
          </div>

          {job?.resultUrl ? (
            <a
              href={job.resultUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Download result file
            </a>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              isFinished
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isFinished ? "Close" : "Hide"}
          </button>
        </div>
      </div>
    </div>
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
      <div className={`text-2xl font-semibold ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}
