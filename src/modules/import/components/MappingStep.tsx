import { Search, X } from "lucide-react";

const FIELD_OPTIONS = [
  { value: "do_not_import", label: "Do not import" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  // { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
  // { value: "marketing_opt_out", label: "Marketing Opt Out" },
];

type Props = {
  headers: string[];
  sampleRows: Record<string, unknown>[];
  mapping: Record<string, string>;
  search: string;
  validation: { hasIdentifier: boolean; duplicates: string[] };
  onSearchChange: (value: string) => void;
  onMappingChange: (header: string, value: string) => void;
};

export function MappingStep({
  headers, sampleRows, mapping, search, validation, onSearchChange, onMappingChange,
}: Props) {
  const visibleHeaders = headers.filter((header) => {
    const matchesSearch = header.toLowerCase().includes(search.trim().toLowerCase());
    const hasSample = sampleRows.some(
      (row) => row?.[header] !== undefined && row?.[header] !== null && String(row?.[header]).trim() !== ""
    );
    return matchesSearch && hasSample;
  });

  const mappedCount = headers.filter((h) => mapping[h] && mapping[h] !== "do_not_import").length;

  const usedFields = new Set(
    Object.values(mapping).filter((v) => v && v !== "do_not_import")
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Map Columns</h3>
          <p className="text-xs text-gray-400">Match each CSV column to a contact field.</p>
        </div>
        <label className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-400 focus-within:border-indigo-400">
          <Search size={12} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search columns…"
            className="w-36 bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
          />
        </label>
      </div>

      {/* Validation */}
      {(!validation.hasIdentifier || validation.duplicates.length > 0) && (
        <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {!validation.hasIdentifier && <p>Map at least one identifier: phone or email.</p>}
          {validation.duplicates.length > 0 && <p>Duplicate mappings: {validation.duplicates.join(", ")}.</p>}
        </div>
      )}

      {/* Table */}
      <div className="mx-5 mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_20px_180px_180px_28px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
          <div>Column</div>
          <div />
          <div>Sample</div>
          <div>Map To</div>
          <div />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 32px)" }}>
          {visibleHeaders.map((header) => {
            const mappedValue = mapping[header] ?? "do_not_import";
            const isMapped = mappedValue !== "do_not_import";

            const sampleValue = sampleRows
              .map((row) => row?.[header])
              .find((v) => v !== undefined && v !== null && String(v).trim() !== "");

            const availableOptions = FIELD_OPTIONS.filter(
              (opt) => opt.value === "do_not_import" || opt.value === mappedValue || !usedFields.has(opt.value)
            );

            return (
              <div
                key={header}
                className={`grid grid-cols-[1fr_20px_180px_180px_28px] items-center gap-3 border-b border-gray-100 px-4 py-2 text-sm last:border-0 ${
                  isMapped ? "bg-indigo-50/30" : "bg-white"
                }`}
              >
                <div className="truncate text-xs font-medium text-gray-800">{header}</div>
                <div className="text-[11px] text-gray-300">→</div>
                <div className="truncate">
                  {sampleValue !== undefined ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
                      {String(sampleValue)}
                    </span>
                  ) : null}
                </div>
                <select
                  value={mappedValue}
                  onChange={(e) => onMappingChange(header, e.target.value)}
                  className={`h-7 w-full rounded-md border px-2 text-xs outline-none focus:border-indigo-400 ${
                    isMapped ? "border-indigo-200 bg-white text-gray-800" : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {availableOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="flex justify-center">
                  {isMapped ? (
                    <button
                      type="button"
                      onClick={() => onMappingChange(header, "do_not_import")}
                      className="rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {visibleHeaders.length === 0 && (
            <div className="px-5 py-6 text-center text-xs text-gray-400">No columns match your search.</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-400">
        <span>
          <span className="font-medium text-gray-600">{mappedCount}</span> mapped ·{" "}
          <span className="font-medium text-gray-600">{headers.length - mappedCount}</span> skipped
        </span>
        {mappedCount > 0 && (
          <span className="font-medium text-green-600">
            {Math.round((mappedCount / headers.length) * 100)}% coverage
          </span>
        )}
      </div>
    </div>
  );
}