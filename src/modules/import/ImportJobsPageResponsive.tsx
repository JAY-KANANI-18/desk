import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  RefreshCw,
} from "@/components/ui/icons";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PageLayout } from "../../components/ui/PageLayout";
import { useIsMobile } from "../../hooks/useIsMobile";
import { importApi, type ImportJobRecord } from "../../lib/importApi";
import { JobProgressModal } from "./components/JobProgressModal";
import {
  formatImportJobDate,
  formatImportJobType,
  ImportJobProgressBar,
  ImportJobStatusTag,
} from "./components/jobPresentation";
import { BackButton } from "../../components/channels/BackButton";

export default function ImportJobsPageResponsive() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  const renderHeaderActions = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        leftIcon={<ArrowUpRight size={16} />}
        onClick={() => navigate("/contacts/import")}
      >
        New import
      </Button>

      <Button
        type="button"
        variant="secondary"
        leftIcon={<RefreshCw size={15} />}
        onClick={() => loadJobs().catch(() => setJobs([]))}
        loading={loading}
        loadingMode="inline"
        loadingLabel="Refreshing"
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Contacts / Imports"
      title="Import jobs"
      subtitle="Monitor background contact imports and open each run for full progress details."
      leading={
        <BackButton
          onClick={() => navigate("/contacts")}
          ariaLabel="Back to contacts"
        />
      }
      actions={renderHeaderActions()}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        {isMobile ? (
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <BackButton
              ariaLabel="Back"
              onClick={() => navigate("/contacts")}
              size="sm"
            />

            <div className="mt-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Import jobs
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Monitor background contact imports and open each run for full
                progress details.
              </p>
            </div>

            <div className="mt-4">{renderHeaderActions()}</div>
          </div>
        ) : null}

        <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-y-auto px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-32 md:overflow-hidden md:pb-6">
          <section className="rounded-[30px] border border-[var(--color-primary-light)] bg-gradient-to-br from-[var(--color-primary-light)] via-white to-slate-50 p-5 shadow-[0_24px_60px_rgba(79,70,229,0.08)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary-light)]">
                  <BriefcaseBusiness size={14} />
                  Background imports
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Import process
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  See what is still running, which jobs completed, and which
                  imports may need review.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
                  <SummaryStat label="Total jobs" value={stats.total} />
                  <SummaryStat
                    label="Running now"
                    value={stats.running}
                    tone="indigo"
                  />
                  <SummaryStat
                    label="Completed"
                    value={stats.completed}
                    tone="green"
                  />
                  <SummaryStat
                    label="Needs review"
                    value={stats.review}
                    tone="amber"
                  />
                </div>
              </div>

              <div className="hidden lg:block lg:w-[320px]" />
            </div>
          </section>

          <section className="mt-4 space-y-3 md:hidden">
            {loading ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-[28px] border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
                Refreshing jobs...
              </div>
            ) : null}

            {!loading && !jobs.length ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500 shadow-sm">
                <BriefcaseBusiness size={20} className="text-slate-300" />
                No import jobs found yet.
              </div>
            ) : null}

            {!loading
              ? jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-slate-900">
                          {formatImportJobType(job.type)}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {job.successCount.toLocaleString()} success /{" "}
                          {job.failureCount.toLocaleString()} failed
                        </div>
                      </div>
                      <ImportJobStatusTag status={job.status} />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <ImportJobProgressBar
                        progress={job.progress}
                        status={job.status}
                        className="mt-2 h-2.5"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <JobMeta
                        label="Updated"
                        value={formatImportJobDate(job.updatedAt)}
                      />
                      <JobMeta
                        label="Records"
                        value={(
                          job.successCount + job.failureCount
                        ).toLocaleString()}
                      />
                    </div>

                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={() => setActiveJobId(job.id)}
                      >
                        View details
                      </Button>
                    </div>
                  </article>
                ))
              : null}
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
                  Refreshing jobs...
                </div>
              ) : null}

              {!loading && !jobs.length ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-500">
                  <BriefcaseBusiness size={20} className="text-gray-300" />
                  No import jobs found yet.
                </div>
              ) : null}

              {!loading
                ? jobs.map((job) => (
                    <div
                      key={job.id}
                      className="grid min-w-[760px] grid-cols-[minmax(220px,1.2fr)_140px_120px_160px_120px] items-center border-t border-gray-100 px-5 py-4 text-sm"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatImportJobType(job.type)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {job.successCount.toLocaleString()} success /{" "}
                          {job.failureCount.toLocaleString()} failed
                        </div>
                      </div>
                      <div>
                        <ImportJobStatusTag status={job.status} />
                      </div>
                      <div className="font-medium text-gray-700">
                        {job.progress}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatImportJobDate(job.updatedAt)}
                      </div>
                      <div className="text-right">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setActiveJobId(job.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </section>

          <JobProgressModal
            jobId={activeJobId}
            onClose={() => setActiveJobId(null)}
          />
        </div>
      </div>
    </PageLayout>
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
      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] ring-[var(--color-primary-light)]"
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
      <div className="mt-2 text-2xl font-semibold">
        {value.toLocaleString()}
      </div>
    </div>
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
