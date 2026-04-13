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
    <aside className="hidden w-full border-r border-slate-200 bg-white/90 p-5 md:flex md:w-72 md:flex-col">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Radio size={20} />
        Broadcasts
      </h2>

      <div className="space-y-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.name}
            type="button"
            onClick={() => onSelectStatus(filter.name)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              selectedStatus === filter.name
                ? "bg-sky-50 text-sky-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${filter.color}`} />
            <span>{filter.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        WhatsApp broadcasts use approved templates only. Runs stay traceable after delivery starts, so scheduled
        changes are locked once a broadcast begins.
      </div>
    </aside>
  );
}
