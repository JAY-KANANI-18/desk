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
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-7xl flex-col overflow-hidden px-6 py-6">
      <button
        type="button"
        onClick={() => navigate("/contacts")}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mt-3 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <BriefcaseBusiness size={14} />
            Background imports
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Import Process
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor contact import jobs, check progress, and download result files when a run finishes.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/contacts/import")}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go to import
          </button>
          <button
            type="button"
            onClick={() => loadJobs().catch(() => setJobs([]))}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_140px_120px_160px_120px] bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div>Job</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Updated</div>
          <div className="text-right">Action</div>
        </div>

        <div className="min-h-0 overflow-y-auto">
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
                className="grid grid-cols-[1.2fr_140px_120px_160px_120px] items-center border-t border-gray-100 px-5 py-4 text-sm"
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
