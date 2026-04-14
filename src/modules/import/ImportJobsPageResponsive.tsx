import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { importApi, type ImportJobRecord } from "../../lib/importApi";
import { JobProgressModal } from "./components/JobProgressModal";

export default function ImportJobsPageResponsive() {
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

  const stats = useMemo(() => {
    const completed = jobs.filter((job) => job.status === "COMPLETED").length;
    const running = jobs.filter(
      (job) => job.status !== "COMPLETED" && job.status !== "FAILED",
    ).length;
    const review = jobs.filter((job) => job.failureCount > 0).length;

    return {
      total: jobs.length,
      completed,
      running,
      review,
    };
  }, [jobs]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-y-auto px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32 md:overflow-hidden md:pb-6">
      <button
        type="button"
        onClick={() => navigate("/contacts")}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <section className="mt-3 rounded-[30px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-[0_24px_60px_rgba(79,70,229,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <BriefcaseBusiness size={14} />
              Background imports
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Import Process
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor background contact imports, see what is still running, and
              open each job for full progress details.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
              <SummaryStat label="Total jobs" value={stats.total} />
              <SummaryStat label="Running now" value={stats.running} tone="indigo" />
              <SummaryStat label="Completed" value={stats.completed} tone="green" />
              <SummaryStat label="Needs review" value={stats.review} tone="amber" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[320px]">
            <button
              type="button"
              onClick={() => navigate("/contacts/import")}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <ArrowUpRight size={16} />
              New import
            </button>

            <button
              type="button"
              onClick={() => loadJobs().catch(() => setJobs([]))}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3 md:hidden">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-[28px] border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading jobs...
          </div>
        ) : null}

        {!loading && !jobs.length ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500 shadow-sm">
            <BriefcaseBusiness size={20} className="text-slate-300" />
            No import jobs found yet.
          </div>
        ) : null}

        {!loading &&
          jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-900">
                    {formatJobType(job.type)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {job.successCount.toLocaleString()} success /{" "}
                    {job.failureCount.toLocaleString()} failed
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      job.status === "FAILED" ? "bg-red-500" : "bg-indigo-600"
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <JobMeta label="Updated" value={formatJobDate(job.updatedAt)} />
                <JobMeta
                  label="Records"
                  value={(job.successCount + job.failureCount).toLocaleString()}
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveJobId(job.id)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                View details
              </button>
            </article>
          ))}
      </section>

      <section className="mt-4 hidden min-h-0 flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:flex md:flex-col">
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
                  <div className="font-medium text-gray-900">
                    {formatJobType(job.type)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {job.successCount.toLocaleString()} success /{" "}
                    {job.failureCount.toLocaleString()} failed
                  </div>
                </div>
                <div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="font-medium text-gray-700">{job.progress}%</div>
                <div className="text-xs text-gray-500">
                  {formatJobDate(job.updatedAt)}
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
      </section>

      <JobProgressModal
        jobId={activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "indigo" | "green" | "amber";
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-white text-slate-700 ring-slate-200";

  return (
    <div className={`rounded-2xl px-4 py-3 shadow-sm ring-1 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ImportJobRecord["status"] }) {
  const toneClass =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "FAILED"
        ? "bg-red-100 text-red-700"
        : "bg-indigo-100 text-indigo-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function JobMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function formatJobType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatJobDate(updatedAt: string) {
  return new Date(updatedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
