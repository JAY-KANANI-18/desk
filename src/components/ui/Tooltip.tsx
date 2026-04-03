// src/components/ui/Tooltip.tsx
import React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "right" | "left" | "top" | "bottom";
}

export const Tooltip = ({
  content,
  children,
  side = "right",
}: TooltipProps) => {
  const positionClasses = {
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  };

  const arrowClasses = {
    right:
      "absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black border-l border-t border-gray-200 rotate-[-45deg]",
    left:
      "absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black border-r border-b border-gray-200 rotate-[-45deg]",
    top:
      "absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-black border-r border-b border-gray-200 rotate-45",
    bottom:
      "absolute top-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-black border-l border-t border-gray-200 rotate-45",
  };

  return (
    <div className="relative inline-block">
      <div className="peer inline-block">
        {children}
      </div>

      <div
        className={`
          pointer-events-none absolute z-[9999] whitespace-nowrap rounded-xl border border-gray-200 bg-black px-3 py-2 text-sm font-medium text-white shadow-xl
          opacity-0 scale-95 transition-all duration-150 ease-out
          peer-hover:opacity-100 peer-hover:scale-100
          ${positionClasses[side]}
        `}
      >
        {content}
        <div className={arrowClasses[side]} />
      </div>
    </div>
  );
};