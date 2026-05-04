import { Search, X } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

const FIELD_OPTIONS = [
  { value: "do_not_import", label: "Do not import" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
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
  headers,
  sampleRows,
  mapping,
  search,
  validation,
  onSearchChange,
  onMappingChange,
}: Props) {
  const visibleHeaders = headers.filter((header) => {
    const matchesSearch = header
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const hasSample = sampleRows.some(
      (row) =>
        row?.[header] !== undefined &&
        row?.[header] !== null &&
        String(row?.[header]).trim() !== "",
    );

    return matchesSearch && hasSample;
  });

  const mappedCount = headers.filter(
    (header) => mapping[header] && mapping[header] !== "do_not_import",
  ).length;

  const usedFields = new Set(
    Object.values(mapping).filter((value) => value && value !== "do_not_import"),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Map Columns</h3>
          <p className="text-xs text-gray-400">
            Match each CSV column to a contact field.
          </p>
        </div>

        <div className="w-full max-w-[220px]">
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search columns..."
            inputSize="sm"
            leftIcon={<Search size={14} />}
          />
        </div>
      </div>

      {!validation.hasIdentifier || validation.duplicates.length > 0 ? (
        <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {!validation.hasIdentifier ? (
            <p>Map at least one identifier: phone or email.</p>
          ) : null}
          {validation.duplicates.length > 0 ? (
            <p>Duplicate mappings: {validation.duplicates.join(", ")}.</p>
          ) : null}
        </div>
      ) : null}

      <div className="mx-5 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200">
        <div className="grid grid-cols-[1fr_20px_180px_180px_28px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
          <div>Column</div>
          <div />
          <div>Sample</div>
          <div>Map To</div>
          <div />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {visibleHeaders.map((header) => {
            const mappedValue = mapping[header] ?? "do_not_import";
            const isMapped = mappedValue !== "do_not_import";
            const sampleValue = sampleRows
              .map((row) => row?.[header])
              .find(
                (value) =>
                  value !== undefined &&
                  value !== null &&
                  String(value).trim() !== "",
              );
            const availableOptions = FIELD_OPTIONS.filter(
              (option) =>
                option.value === "do_not_import" ||
                option.value === mappedValue ||
                !usedFields.has(option.value),
            );

            return (
              <div
                key={header}
                className={`grid grid-cols-[1fr_20px_180px_180px_28px] items-center gap-3 border-b border-gray-100 px-4 py-2 text-sm last:border-0 ${
                  isMapped ? "bg-[var(--color-primary-light)]" : "bg-white"
                }`}
              >
                <div className="truncate text-xs font-medium text-gray-800">
                  {header}
                </div>
                <div className="text-[11px] text-gray-300">-&gt;</div>
                <div className="truncate">
                  {sampleValue !== undefined ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
                      {String(sampleValue)}
                    </span>
                  ) : null}
                </div>
                <Select
                  value={mappedValue}
                  onChange={(event) =>
                    onMappingChange(header, event.target.value)
                  }
                  options={availableOptions}
                  size="sm"
                />
                <div className="flex justify-center">
                  {isMapped ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      iconOnly
                      leftIcon={<X size={12} />}
                      aria-label={`Clear mapping for ${header}`}
                      onClick={() => onMappingChange(header, "do_not_import")}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}

          {visibleHeaders.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-gray-400">
              No columns match your search.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-400">
        <span>
          <span className="font-medium text-gray-600">{mappedCount}</span> mapped
          {" - "}
          <span className="font-medium text-gray-600">
            {headers.length - mappedCount}
          </span>{" "}
          skipped
        </span>
        {mappedCount > 0 ? (
          <span className="font-medium text-green-600">
            {Math.round((mappedCount / headers.length) * 100)}% coverage
          </span>
        ) : null}
      </div>
    </div>
  );
}
