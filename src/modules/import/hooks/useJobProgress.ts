import { useEffect, useMemo, useState } from "react";
import { importApi, type ImportJobRecord } from "../../../lib/importApi";
import { useSocket } from "../../../socket/socket-provider";

type JobUpdatePayload = {
  jobId: string;
  status: ImportJobRecord["status"];
  progress: number;
  processedRecords: number;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  resultUrl?: string | null;
};

export function useJobProgress(jobId: string | null) {
  const { socket } = useSocket();
  const [job, setJob] = useState<ImportJobRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    importApi
      .getJob(jobId)
      .then((result) => {
        if (!cancelled) {
          setJob(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!socket || !jobId) return;

    const handleUpdate = (payload: JobUpdatePayload) => {
      if (payload.jobId !== jobId) return;
      setJob((prev) => ({
        ...(prev ?? {
          id: payload.jobId,
          type: "CONTACT_IMPORT",
          entity: "contact",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fileUrl: null,
          resultUrl: payload.resultUrl ?? null,
        }),
        status: payload.status,
        progress: payload.progress,
        processedRecords: payload.processedRecords,
        totalRecords: payload.totalRecords,
        successCount: payload.successCount,
        failureCount: payload.failureCount,
        resultUrl: payload.resultUrl ?? prev?.resultUrl ?? null,
        updatedAt: new Date().toISOString(),
      } as ImportJobRecord));
    };

    socket.on("job:update", handleUpdate);
    return () => {
      socket.off("job:update", handleUpdate);
    };
  }, [jobId, socket]);

  useEffect(() => {
    if (!jobId) return;
    if (job && !["PENDING", "PROCESSING"].includes(job.status)) return;

    const interval = window.setInterval(async () => {
      try {
        const result = await importApi.getJob(jobId);
        setJob(result);
      } catch {
        // best effort fallback polling
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [job, jobId]);

  const isFinished = useMemo(
    () => Boolean(job && !["PENDING", "PROCESSING"].includes(job.status)),
    [job],
  );

  return {
    job,
    loading,
    isFinished,
  };
}
