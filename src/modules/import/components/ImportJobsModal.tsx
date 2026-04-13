import { useEffect, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { importApi, type ImportJobRecord } from "../../../lib/importApi";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ImportJobsModal({ open, onClose }: Props) {
  const [jobs, setJobs] = useState<ImportJobRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await importApi.listImportJobs();
      setJobs(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadJobs().catch(() => setJobs([]));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex h-[min(80vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Import jobs</h3>
            <p className="mt-1 text-sm text-gray-500">Track background imports and download completed results.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadJobs().catch(() => undefined)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-[1.1fr_120px_120px_140px] bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div>Job</div>
              <div>Status</div>
              <div>Progress</div>
              <div>Result</div>
            </div>

            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-[1.1fr_120px_120px_140px] items-center border-t border-gray-100 px-4 py-4 text-sm"
              >
                <div>
                  <div className="font-medium text-gray-900">{job.type}</div>
                  <div className="mt-1 text-xs text-gray-500">{new Date(job.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      job.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : job.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div>{job.progress}%</div>
                <div>
                  {job.resultUrl ? (
                    <a
                      href={job.resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </div>
              </div>
            ))}

            {!loading && !jobs.length ? (
              <div className="border-t border-gray-100 px-4 py-8 text-sm text-gray-500">No import jobs yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
