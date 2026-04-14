import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

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
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const GAP = 12;

    const positions = {
      right: { top: rect.top + rect.height / 2, left: rect.right + GAP },
      left:  { top: rect.top + rect.height / 2, left: rect.left - GAP },
      top:   { top: rect.top - GAP,              left: rect.left + rect.width / 2 },
      bottom:{ top: rect.bottom + GAP,           left: rect.left + rect.width / 2 },
    };

    setPos(positions[side]);
    setVisible(true);
  };

  const transformMap = {
    right:  "translateY(-50%)",
    left:   "translate(-100%, -50%)",
    top:    "translate(-50%, -100%)",
    bottom: "translateX(-50%)",
  };

  const arrowStyle: Record<string, React.CSSProperties> = {
    right: {
      position: "absolute", left: -5, top: "50%",
      transform: "translateY(-50%) rotate(-45deg)",
      width: 10, height: 10, background: "black",
      borderLeft: "1px solid #e5e7eb", borderTop: "1px solid #e5e7eb",
    },
    left: {
      position: "absolute", right: -5, top: "50%",
      transform: "translateY(-50%) rotate(-45deg)",
      width: 10, height: 10, background: "black",
      borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
    },
    top: {
      position: "absolute", bottom: -5, left: "50%",
      transform: "translateX(-50%) rotate(45deg)",
      width: 10, height: 10, background: "black",
      borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
    },
    bottom: {
      position: "absolute", top: -5, left: "50%",
      transform: "translateX(-50%) rotate(45deg)",
      width: 10, height: 10, background: "black",
      borderLeft: "1px solid #e5e7eb", borderTop: "1px solid #e5e7eb",
    },
  };

  return (
    <div
      ref={ref}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && createPortal(
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: transformMap[side],
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className="whitespace-nowrap rounded-xl border border-gray-200 bg-black px-3 py-2 text-sm font-medium text-white shadow-xl"
        >
          {content}
          <div style={arrowStyle[side]} />
        </div>,
        document.body
      )}
    </div>
  );
};  