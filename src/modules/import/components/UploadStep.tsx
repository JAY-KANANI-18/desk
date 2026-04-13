import type { ReactNode } from "react";
import { useState, useRef } from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";

type Props = {
  fileName?: string;
  fileSize?: number;
  rowCountEstimate?: number;
  uploading: boolean;
  onSelectFile: (file: File) => void;
  onRemoveFile?: () => void;
  configPanel?: ReactNode;
};

export function UploadStep({
  fileName,
  fileSize,
  rowCountEstimate,
  uploading,
  onSelectFile,
  onRemoveFile,
  configPanel,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelectFile(file);
  };

  const downloadSample = () => {
    const csv = "First Name,Last Name,Email,Phone\nJohn,Smith,john@example.com,+15551234567";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts-import-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">

        {/* Upload zone or file badge */}
        {!fileName ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all ${
              dragging
                ? "border-indigo-500 bg-indigo-50/80"
                : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelectFile(file);
                e.target.value = "";
              }}
            />
            <div className={`rounded-xl p-3 transition-colors ${dragging ? "bg-indigo-100 text-indigo-600" : "bg-white text-indigo-400 shadow-sm"}`}>
              <UploadCloud size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {uploading ? "Uploading…" : dragging ? "Drop file here" : "Drag & drop or click to upload"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">CSV or XLSX · max 20 MB · up to 200,000 rows</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{fileName}</p>
              <p className="text-xs text-gray-400">
                {typeof fileSize === "number" ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : "Uploaded"}
                {typeof rowCountEstimate === "number" ? ` · ~${rowCountEstimate.toLocaleString()} rows` : ""}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Ready</span>
              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Replace
                <input type="file" accept=".csv,.xlsx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectFile(f); e.target.value = ""; }} />
              </label>
              {onRemoveFile && (
                <button type="button" onClick={onRemoveFile}
                  className="rounded p-1 text-gray-300 hover:bg-gray-200 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sample download — inline, minimal */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          Need a template?
          <button type="button" onClick={downloadSample}
            className="font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
            Download sample CSV
          </button>
        </div>

        {/* Config panel — only after file uploaded */}
        {fileName && configPanel ? configPanel : null}

        {/* Instructions — collapsed, minimal */}
        {!fileName && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Requirements</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>· Identify contacts via email or phone number</li>
              <li>· Max file size 20 MB</li>
              <li>· Max 200,000 rows</li>
              <li>· All columns must have a header row</li>
            </ul>
            <p className="mt-2 text-xs text-amber-600">
              Tip: keep one header row at the top and use a clean phone/email column.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}