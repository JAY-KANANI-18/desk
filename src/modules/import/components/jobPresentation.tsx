import { Tag } from "../../../components/ui/Tag";
import type { ImportJobRecord } from "../../../lib/importApi";

function formatStatusLabel(status: ImportJobRecord["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusColor(status: ImportJobRecord["status"]) {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "FAILED") {
    return "error";
  }

  return "primary";
}

export function ImportJobStatusTag({
  status,
}: {
  status: ImportJobRecord["status"];
}) {
  return (
    <Tag
      label={formatStatusLabel(status)}
      size="sm"
      bgColor={getStatusColor(status)}
    />
  );
}

export function ImportJobProgressBar({
  progress,
  status,
  className,
}: {
  progress: number;
  status: ImportJobRecord["status"];
  className?: string;
}) {
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div
      className={["overflow-hidden rounded-full bg-gray-100", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={`h-full rounded-full transition-all ${
          status === "FAILED" ? "bg-red-500" : "bg-[var(--color-primary)]"
        }`}
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}

export function formatImportJobType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatImportJobDate(updatedAt: string) {
  return new Date(updatedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function openImportJobResult(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
