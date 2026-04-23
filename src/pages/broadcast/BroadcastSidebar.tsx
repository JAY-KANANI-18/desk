import { Radio } from "lucide-react";
import { STATUS_FILTERS } from "./constants";

type BroadcastSidebarProps = {
  selectedStatus: string;
  onSelectStatus: (value: string) => void;
  variant?: "desktop" | "mobile";
};

export function BroadcastSidebar({
  selectedStatus,
  onSelectStatus,
  variant = "desktop",
}: BroadcastSidebarProps) {
  const isMobile = variant === "mobile";

  const content = (
    <>
      {isMobile ? null : (
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Radio size={18} className="text-indigo-600" />
          Broadcasts
        </h2>
      )}

      <div className="space-y-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.name}
            type="button"
            onClick={() => onSelectStatus(filter.name)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
              selectedStatus === filter.name
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${filter.color}`} />
            <span className="flex-1">{filter.name}</span>
          </button>
        ))}
      </div>

      <div
        className={`mt-6 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 ${
          isMobile ? "" : "border border-gray-200"
        }`}
      >
        WhatsApp broadcasts use approved templates only. Runs stay traceable after delivery starts, so scheduled
        changes are locked once a broadcast begins.
      </div>
    </>
  );

  if (isMobile) {
    return <div className="space-y-4 p-3">{content}</div>;
  }

  return (
    <aside className="hidden w-full border-r border-gray-200 bg-white p-4 md:flex md:w-64 md:flex-col">
      {content}
    </aside>
  );
}
