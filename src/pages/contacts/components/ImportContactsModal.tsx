import type { ChangeEvent, DragEvent, RefObject } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, Upload, X } from "lucide-react";
import { CSV_HEADERS, SAMPLE_CSV_ROWS } from "../constants";
import type { Contact } from "../types";

interface ImportContactsModalProps {
  open: boolean;
  onClose: () => void;
  onDownloadSample: () => void;
  importParsed: Omit<Contact, "id">[] | null;
  importDragging: boolean;
  setImportDragging: (value: boolean) => void;
  onDrop: (event: DragEvent) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  importFileName: string | null;
  setImportParsed: (value: Omit<Contact, "id">[] | null) => void;
  setImportFileName: (value: string | null) => void;
  importFileError: string | null;
  onConfirmImport: () => Promise<void>;
}

export function ImportContactsModal({
  open,
  onClose,
  onDownloadSample,
  importParsed,
  importDragging,
  setImportDragging,
  onDrop,
  fileInputRef,
  onFileInputChange,
  importFileName,
  setImportParsed,
  setImportFileName,
  importFileError,
  onConfirmImport,
}: ImportContactsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <Upload size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Import Contacts</h2>
              <p className="text-xs text-gray-500">Upload a CSV file to bulk-import contacts</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={15} className="text-gray-400" />
                Required CSV Format
              </h3>
              <button
                onClick={onDownloadSample}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
              >
                <Download size={13} />
                Download Sample CSV
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border bg-white">
                    <tr>
                      {CSV_HEADERS.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap border-r border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 last:border-r-0"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {SAMPLE_CSV_ROWS.map((row, index) => (
                      <tr key={index} className="bg-white">
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.firstName}</td>
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.lastName}</td>
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.email}</td>
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.phone}</td>
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.lifecycle}</td>
                        <td className="border-r border-gray-100 px-3 py-2 text-gray-700">{row.channel}</td>
                        <td className="px-3 py-2 text-gray-700">{row.tags.join(";")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="mt-2 space-y-1">
              {[
                "First row must be the header row exactly as shown above.",
                "Lifecycle values: New Lead, Hot Lead, Payment, Customer, Cold Lead.",
                "Channel values: email, whatsapp, instagram, messenger, webchat.",
                "Multiple tags should be separated by semicolons; for example: VIP;Follow-up.",
              ].map((note) => (
                <li key={note} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="mt-0.5 text-gray-400">*</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Upload Your File</h3>
            {!importParsed ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setImportDragging(true);
                }}
                onDragLeave={() => setImportDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  importDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
              >
                <Upload size={28} className={`mx-auto mb-2 ${importDragging ? "text-indigo-500" : "text-gray-400"}`} />
                <p className="text-sm font-medium text-gray-700">Drag and drop your CSV file here</p>
                <p className="mt-1 text-xs text-gray-400">
                  or <span className="font-medium text-indigo-600">click to browse</span>
                </p>
                <p className="mt-2 text-xs text-gray-400">Supports .csv files only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileInputChange}
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-green-800">{importFileName}</p>
                  <p className="mt-0.5 text-xs text-green-600">
                    {importParsed.length} contact{importParsed.length > 1 ? "s" : ""} ready to import
                  </p>

                  <div className="mt-3 overflow-hidden rounded-lg border border-green-200 text-xs">
                    <table className="w-full">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-green-700">Name</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-green-700">Email</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-green-700">Lifecycle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100 bg-white">
                        {importParsed.slice(0, 3).map((contact, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1.5 text-gray-700">
                              {contact.firstName} {contact.lastName}
                            </td>
                            <td className="px-2 py-1.5 text-gray-700">{contact.email}</td>
                            <td className="px-2 py-1.5 text-gray-700">{String(contact.lifecycle ?? "-")}</td>
                          </tr>
                        ))}
                        {importParsed.length > 3 && (
                          <tr>
                            <td colSpan={3} className="px-2 py-1.5 text-center text-gray-400">
                              +{importParsed.length - 3} more...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportParsed(null);
                    setImportFileName(null);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {importFileError && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle size={13} />
                {importFileError}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-400">
            {importParsed ? `${importParsed.length} contacts will be added to your list.` : "No file selected yet."}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => void onConfirmImport()}
              disabled={!importParsed}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={14} />
              Import {importParsed ? `${importParsed.length} Contacts` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
