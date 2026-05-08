import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cx } from "../inputs/shared";
import {
  getFloatingMenuGeometry,
  getFloatingMenuMeasuredWidth,
  getFloatingMenuTransformOrigin,
  getHiddenFloatingMenuMotionState,
  type FloatingMenuAlign,
  type FloatingMenuGeometry,
  type FloatingMenuPlacement,
  type FloatingMenuWidth,
} from "./floatingMenuGeometry";

export type MenuDropdownPlacement = FloatingMenuPlacement;
export type MenuDropdownAlign = FloatingMenuAlign;
export type MenuDropdownWidth = FloatingMenuWidth;

export interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorRef?: RefObject<HTMLElement>;
  placement?: MenuDropdownPlacement;
  align?: MenuDropdownAlign;
  width?: MenuDropdownWidth;
  className?: string;
  role?: string;
  ariaLabel?: string;
}

export function MenuDropdown({
  isOpen,
  onClose,
  children,
  anchorRef,
  placement = "bottom",
  align = "start",
  width = "trigger",
  className,
  role,
  ariaLabel,
}: MenuDropdownProps) {
  const fallbackAnchorRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<FloatingMenuGeometry | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const focusAnchor = () => {
    const anchor = anchorRef?.current ?? fallbackAnchorRef.current?.parentElement;

    window.requestAnimationFrame(() => {
      anchor?.focus();
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        focusAnchor();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        target instanceof Element &&
        (target.closest("[data-menu-dropdown='true']") ||
          target.closest("[data-select-dropdown='true']"))
      ) {
        return;
      }

      const anchor = anchorRef?.current ?? fallbackAnchorRef.current?.parentElement;

      if (anchor?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [anchorRef, isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setGeometry(null);
      return undefined;
    }

    const anchor = anchorRef?.current ?? fallbackAnchorRef.current?.parentElement;
    const dropdown = dropdownRef.current;

    if (!anchor || !dropdown) {
      return undefined;
    }

    const updateGeometry = () => {
      setGeometry(
        getFloatingMenuGeometry({
          align,
          anchor,
          dropdown,
          placement,
          width,
        }),
      );
    };

    updateGeometry();
    window.addEventListener("resize", updateGeometry);
    window.addEventListener("scroll", updateGeometry, true);

    return () => {
      window.removeEventListener("resize", updateGeometry);
      window.removeEventListener("scroll", updateGeometry, true);
    };
  }, [align, anchorRef, children, isOpen, placement, width]);

  const measuringDropdown = isOpen && !geometry ? (
    <div
      ref={dropdownRef}
      data-menu-dropdown="true"
      role={role}
      aria-label={ariaLabel}
      className={cx(
        "fixed overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-md",
        "pointer-events-none invisible",
        className,
      )}
      style={{
        left: -9999,
        top: -9999,
        width: getFloatingMenuMeasuredWidth(width),
        zIndex: "calc(var(--z-modal) + 10)",
      }}
    >
      {children}
    </div>
  ) : null;

  const renderedDropdown = (
    <AnimatePresence>
      {isOpen && geometry ? (
        <motion.div
          key="menu-dropdown"
          ref={dropdownRef}
          data-menu-dropdown="true"
          role={role}
          aria-label={ariaLabel}
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  ...getHiddenFloatingMenuMotionState(geometry.placement, false),
                }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  ...getHiddenFloatingMenuMotionState(geometry.placement, false),
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.11, ease: "easeOut" },
                  scale: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                  x: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                  y: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
                }
          }
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          className={cx(
            "fixed overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-md",
            className,
          )}
          style={{
            left: geometry.left,
            top: geometry.top,
            width: geometry.width,
            zIndex: "calc(var(--z-modal) + 10)",
            transformOrigin: getFloatingMenuTransformOrigin(geometry.placement, align),
            pointerEvents: "auto",
          }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={fallbackAnchorRef} className="hidden" />
      {typeof document !== "undefined"
        ? createPortal(
            <>
              {measuringDropdown}
              {renderedDropdown}
            </>,
            document.body,
          )
        : null}
    </>
  );
}
