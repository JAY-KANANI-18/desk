import { Download, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { PreviewImportResponse } from "../../../lib/importApi";

type Props = {
  fileName?: string;
  importMode: string;
  matchBy: string;
  selectedTagNames: string[];
  preview: PreviewImportResponse | null;
  onReupload: () => void;
};

export function ReviewStep({
  fileName,
  importMode,
  matchBy,
  selectedTagNames,
  preview,
  onReupload,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-5">
      <div className="flex min-h-0 flex-1 flex-col gap-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            value={preview?.new ?? 0}
            label="New contacts"
            tone="success"
          />
          <StatCard
            value={preview?.update ?? 0}
            label="Will be updated"
            tone="default"
          />
          <StatCard
            value={preview?.errors ?? 0}
            label="Skipped (errors)"
            tone={preview?.errors ? "danger" : "default"}
          />
        </div>

        {/* Error actions */}
        {preview?.errorFileUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
            <p className="flex-1 text-xs text-red-600">
              {(preview.errors ?? 0).toLocaleString()} rows have errors. Download the error file to review them.
            </p>
            <a
              href={preview.errorFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              <Download size={12} />
              Download
            </a>
            <button
              type="button"
              onClick={onReupload}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <RefreshCcw size={12} />
              Re-upload
            </button>
          </div>
        )}

        {/* Config summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50">
          <Row label="File" value={fileName ?? "Uploaded file"} />
          <Row label="Mode" value={formatImportMode(importMode)} />
          <Row label="Match by" value={matchBy === "phone" ? "Phone" : "Email"} />
          <Row label="Tags" last>
            {selectedTagNames.length ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTagNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">None</span>
            )}
          </Row>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "default" | "success" | "danger";
}) {
  const numColor =
    tone === "danger" ? "text-red-500" :
    tone === "success" ? "text-green-600" :
    "text-gray-900";

  const bgColor =
    tone === "danger" ? "bg-red-50 border-red-100" :
    tone === "success" ? "bg-green-50 border-green-100" :
    "bg-gray-50 border-gray-200";

  return (
    <div className={`rounded-xl border px-4 py-3 ${bgColor}`}>
      <div className={`text-2xl font-semibold ${numColor}`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
  last,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 px-4 py-2.5 ${!last ? "border-b border-gray-100" : ""}`}>
      <span className="w-20 flex-shrink-0 text-xs font-medium text-gray-400">{label}</span>
      {children ?? <span className="text-xs text-gray-700">{value}</span>}
    </div>
  );
}

function formatImportMode(importMode: string) {
  switch (importMode) {
    case "create": return "Create new contacts only";
    case "update": return "Update existing contacts only";
    case "overwrite": return "Overwrite matching contacts";
    default: return "Create and update matching contacts";
  }
}