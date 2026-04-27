import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { cx } from "../inputs/shared";

export type TooltipPosition = "auto" | "top" | "bottom" | "left" | "right";
type ResolvedTooltipPosition = Exclude<TooltipPosition, "auto">;

export interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  maxWidth?: number | string;
}

const VIEWPORT_PADDING = 12;
const TOOLTIP_GAP = 10;

function isTouchOnlyDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const noHover = window.matchMedia?.("(hover: none)").matches;
  return Boolean(window.navigator.maxTouchPoints > 0 && (coarsePointer || noHover));
}

function getPositionSpaces(rect: DOMRect) {
  return {
    top: rect.top,
    bottom: window.innerHeight - rect.bottom,
    left: rect.left,
    right: window.innerWidth - rect.right,
  };
}

function chooseResolvedPosition(
  preferred: TooltipPosition,
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
): ResolvedTooltipPosition {
  const spaces = getPositionSpaces(triggerRect);
  const needed = {
    top: tooltipRect.height + TOOLTIP_GAP,
    bottom: tooltipRect.height + TOOLTIP_GAP,
    left: tooltipRect.width + TOOLTIP_GAP,
    right: tooltipRect.width + TOOLTIP_GAP,
  };

  const fits = {
    top: spaces.top >= needed.top,
    bottom: spaces.bottom >= needed.bottom,
    left: spaces.left >= needed.left,
    right: spaces.right >= needed.right,
  };

  if (preferred !== "auto") {
    if (fits[preferred]) {
      return preferred;
    }

    const oppositeMap: Record<ResolvedTooltipPosition, ResolvedTooltipPosition> = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };

    const opposite = oppositeMap[preferred];
    if (fits[opposite]) {
      return opposite;
    }

    return (Object.entries(spaces).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "top") as ResolvedTooltipPosition;
  }

  const rankedPositions = (Object.entries(spaces) as Array<
    [ResolvedTooltipPosition, number]
  >).sort((a, b) => b[1] - a[1]);

  return rankedPositions[0]?.[0] ?? "top";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipCoordinates(
  position: ResolvedTooltipPosition,
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
) {
  switch (position) {
    case "top":
      return {
        top: triggerRect.top - TOOLTIP_GAP,
        left: clamp(
          triggerRect.left + triggerRect.width / 2,
          VIEWPORT_PADDING + tooltipRect.width / 2,
          window.innerWidth - VIEWPORT_PADDING - tooltipRect.width / 2,
        ),
        transform: "translate(-50%, -100%)",
      };
    case "bottom":
      return {
        top: triggerRect.bottom + TOOLTIP_GAP,
        left: clamp(
          triggerRect.left + triggerRect.width / 2,
          VIEWPORT_PADDING + tooltipRect.width / 2,
          window.innerWidth - VIEWPORT_PADDING - tooltipRect.width / 2,
        ),
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: clamp(
          triggerRect.top + triggerRect.height / 2,
          VIEWPORT_PADDING + tooltipRect.height / 2,
          window.innerHeight - VIEWPORT_PADDING - tooltipRect.height / 2,
        ),
        left: triggerRect.left - TOOLTIP_GAP,
        transform: "translate(-100%, -50%)",
      };
    case "right":
    default:
      return {
        top: clamp(
          triggerRect.top + triggerRect.height / 2,
          VIEWPORT_PADDING + tooltipRect.height / 2,
          window.innerHeight - VIEWPORT_PADDING - tooltipRect.height / 2,
        ),
        left: triggerRect.right + TOOLTIP_GAP,
        transform: "translateY(-50%)",
      };
  }
}

export function Tooltip({
  content,
  children,
  position = "auto",
  delay = 400,
  disabled = false,
  maxWidth = 280,
}: TooltipProps) {
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const [portalReady, setPortalReady] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [resolvedPosition, setResolvedPosition] =
    useState<ResolvedTooltipPosition>("top");
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    transform: "translate(-50%, -100%)",
  });

  useEffect(() => {
    setPortalReady(typeof document !== "undefined");
    setIsTouchDevice(isTouchOnlyDevice());
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const nextPosition = chooseResolvedPosition(position, triggerRect, tooltipRect);
      const nextCoords = getTooltipCoordinates(
        nextPosition,
        triggerRect,
        tooltipRect,
      );

      setResolvedPosition(nextPosition);
      setCoords(nextCoords);
      setIsVisible(true);
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [content, isOpen, maxWidth, position]);

  const shouldDisable =
    disabled || !content || isMobile || isTouchDevice || !portalReady;

  const scheduleOpen = () => {
    if (shouldDisable) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    setIsVisible(false);
    setIsOpen(false);
  };

  const tooltipNode =
    isOpen && portalReady
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-hidden={!isVisible}
            className={cx(
              "pointer-events-none fixed rounded-[var(--radius-md)] border px-[var(--spacing-sm)] py-[calc(var(--spacing-xs)+2px)] text-sm shadow-lg",
              resolvedPosition === "top" && "origin-bottom",
              resolvedPosition === "bottom" && "origin-top",
              resolvedPosition === "left" && "origin-right",
              resolvedPosition === "right" && "origin-left",
            )}
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
              zIndex: "var(--z-tooltip)",
              maxWidth,
              backgroundColor: "var(--color-gray-900)",
              borderColor: "var(--color-gray-800)",
              color: "white",
              opacity: isVisible ? 1 : 0,
              transition:
                "opacity var(--transition-fast), transform var(--transition-fast)",
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  if (shouldDisable) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex max-w-full"
        onMouseEnter={scheduleOpen}
        onMouseLeave={hideTooltip}
        onFocus={scheduleOpen}
        onBlur={hideTooltip}
      >
        {children}
      </span>

      {tooltipNode}
    </>
  );
}
