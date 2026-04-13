import React from "react";

export function MessageAreaDateBadge({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center py-2 z-10"
      style={{ position: "sticky", top: 0 }}
    >
      <span
        className="px-3 py-1 text-[11px] font-semibold text-gray-500 bg-white
        border border-gray-200 rounded-full shadow-sm select-none"
      >
        {label}
      </span>
    </div>
  );
}
