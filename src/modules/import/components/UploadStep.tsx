import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";

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

  const triggerFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileInputChange = (files?: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onSelectFile(file);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerFilePicker();
    }
  };

  const downloadSample = () => {
    const csv =
      "First Name,Last Name,Email,Phone\nJohn,Smith,john@example.com,+15551234567";
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
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(event) => handleFileInputChange(event.target.files)}
        />

        {!fileName ? (
          <div
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={triggerFilePicker}
            onKeyDown={handleDropZoneKeyDown}
            role="button"
            tabIndex={0}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-all ${
              dragging
                ? "border-indigo-500 bg-indigo-50/80"
                : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
            }`}
          >
            <div
              className={`rounded-xl p-3 transition-colors ${
                dragging
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-white text-indigo-400 shadow-sm"
              }`}
            >
              <UploadCloud size={22} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                {uploading
                  ? "Uploading..."
                  : dragging
                    ? "Drop file here"
                    : "Drag and drop or click to upload"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                CSV or XLSX - max 20 MB - up to 200,000 rows
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <FileSpreadsheet size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {fileName}
              </p>
              <p className="text-xs text-gray-400">
                {typeof fileSize === "number"
                  ? `${(fileSize / 1024 / 1024).toFixed(2)} MB`
                  : "Uploaded"}
                {typeof rowCountEstimate === "number"
                  ? ` - ~${rowCountEstimate.toLocaleString()} rows`
                  : ""}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <Tag label="Ready" size="sm" bgColor="success" />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFilePicker}
              >
                Replace
              </Button>

              {onRemoveFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  leftIcon={<X size={14} />}
                  aria-label="Remove uploaded file"
                  onClick={onRemoveFile}
                />
              ) : null}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-400">
          Need a template?
          <Button type="button" variant="link" size="sm" onClick={downloadSample}>
            Download sample CSV
          </Button>
        </div>

        {fileName && configPanel ? configPanel : null}

        {!fileName ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Requirements
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-gray-500">
              <li>Identify contacts via email or phone number</li>
              <li>Max file size 20 MB</li>
              <li>Max 200,000 rows</li>
              <li>All columns must have a header row</li>
            </ul>
            <p className="mt-2 text-xs text-amber-600">
              Tip: keep one header row at the top and use a clean phone/email
              column.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
