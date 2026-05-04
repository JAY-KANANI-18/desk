import { Radio } from "lucide-react";
import { Button } from "../../components/ui/Button";
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
          <Radio size={18} className="text-[var(--color-primary)]" />
          Broadcasts
        </h2>
      )}

      <div className="space-y-1.5">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.name}
            type="button"
            onClick={() => onSelectStatus(filter.name)}
            fullWidth
            contentAlign="start"
      
            variant={
              selectedStatus === filter.name ? "soft-primary" : "ghost"
            }
          >
            <span className={`h-2.5 w-2.5 rounded-full ${filter.color}`} />
            <span className="flex-1">{filter.name}</span>
          </Button>
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
