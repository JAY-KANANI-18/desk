import { useEffect, useState } from "react";
import { RefreshCw } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { CenterModal } from "../../../components/ui/Modal";
import { importApi, type ImportJobRecord } from "../../../lib/importApi";
import {
  formatImportJobDate,
  formatImportJobType,
  ImportJobStatusTag,
  openImportJobResult,
} from "./jobPresentation";

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
    if (!open) {
      return;
    }

    loadJobs().catch(() => setJobs([]));
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title="Import jobs"
      subtitle="Track background imports and download completed results."
      size="xl"
      width={896}
      closeOnOverlayClick={false}
      bodyPadding="none"
      headerActions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          
          leftIcon={<RefreshCw size={15} />}
          onClick={() => loadJobs().catch(() => undefined)}
          loading={loading}
          loadingMode="inline"
          loadingLabel="Refreshing"
        >
          Refresh
        </Button>
      }
    >
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
                <div className="font-medium text-gray-900">
                  {formatImportJobType(job.type)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {formatImportJobDate(job.createdAt)}
                </div>
              </div>

              <div>
                <ImportJobStatusTag status={job.status} />
              </div>

              <div>{job.progress}%</div>

              <div>
                {job.resultUrl ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => openImportJobResult(job.resultUrl)}
                  >
                    Download
                  </Button>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </div>
            </div>
          ))}

          {!loading && !jobs.length ? (
            <div className="border-t border-gray-100 px-4 py-8 text-sm text-gray-500">
              No import jobs yet.
            </div>
          ) : null}

          {loading && !jobs.length ? (
            <div className="border-t border-gray-100 px-4 py-8 text-sm text-gray-500">
              Loading jobs...
            </div>
          ) : null}
        </div>
      </div>
    </CenterModal>
  );
}
