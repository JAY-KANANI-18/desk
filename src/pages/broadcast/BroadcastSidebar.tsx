import { Radio } from "lucide-react";
import { STATUS_FILTERS } from "./constants";

type BroadcastSidebarProps = {
  selectedStatus: string;
  onSelectStatus: (value: string) => void;
};

export function BroadcastSidebar({
  selectedStatus,
  onSelectStatus,
}: BroadcastSidebarProps) {
  return (
    <aside className="hidden w-full border-r border-gray-200 bg-white p-4 md:flex md:w-64 md:flex-col">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Radio size={18} className="text-indigo-600" />
        Broadcasts
      </h2>

      <div className="space-y-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.name}
            type="button"
            onClick={() => onSelectStatus(filter.name)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              selectedStatus === filter.name
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${filter.color}`} />
            <span>{filter.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
        WhatsApp broadcasts use approved templates only. Runs stay traceable after delivery starts, so scheduled
        changes are locked once a broadcast begins.
      </div>
    </aside>
  );
}
