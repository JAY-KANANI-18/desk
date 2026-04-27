// LEGACY - not mounted in current router, pending removal
import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { importApi, type ImportJobRecord } from "../../lib/importApi";
import { JobProgressModal } from "./components/JobProgressModal";

export default function ImportJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ImportJobRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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
    loadJobs().catch(() => setJobs([]));
  }, []);

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        onClick={() => navigate("/contacts")}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mt-3 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <BriefcaseBusiness size={14} />
            Background imports
          </div>
          <h1 className="mt-3 text-xl font-semibold text-gray-900 sm:text-2xl">
            Import Process
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor contact import jobs, check progress, and download result files when a run finishes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/contacts/import")}
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Go to import
          </button>
          <button
            type="button"
            onClick={() => loadJobs().catch(() => setJobs([]))}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.2fr)_140px_120px_160px_120px] bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div>Job</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Updated</div>
          <div className="text-right">Action</div>
        </div>

        <div className="min-h-0 overflow-x-auto overflow-y-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Loading jobs...
            </div>
          ) : null}

          {!loading && !jobs.length ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500">
              <BriefcaseBusiness size={20} className="text-gray-300" />
              No import jobs found yet.
            </div>
          ) : null}

          {!loading &&
            jobs.map((job) => (
              <div
                key={job.id}
                className="grid min-w-[760px] grid-cols-[minmax(220px,1.2fr)_140px_120px_160px_120px] items-center border-t border-gray-100 px-5 py-4 text-sm"
              >
                <div>
                  <div className="font-medium text-gray-900">{job.type}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {job.successCount.toLocaleString()} success • {job.failureCount.toLocaleString()} failed
                  </div>
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
                <div className="font-medium text-gray-700">{job.progress}%</div>
                <div className="text-xs text-gray-500">
                  {new Date(job.updatedAt).toLocaleString()}
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setActiveJobId(job.id)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <JobProgressModal jobId={activeJobId} onClose={() => setActiveJobId(null)} />
    </div>
  );
}
