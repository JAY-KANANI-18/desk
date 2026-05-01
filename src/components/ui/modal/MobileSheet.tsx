import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { X } from "lucide-react";
import { IconButton } from "../button/IconButton";
import {
  ModalPortal,
  handleDialogKeyDown,
  useBodyScrollLock,
  useEscapeToClose,
  useFocusTrap,
} from "./shared";
import { useHistoryBack } from "../../../hooks/useHistoryBack";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOBILE_SHEET_ANIMATION_MS = 420;
const MOBILE_SHEET_PAGE_RETURN_MS = 620;
const MOBILE_SHEET_OVERLAY_Z_INDEX = 120;
const MOBILE_SHEET_PANEL_Z_INDEX = 130;
const MOBILE_SHEET_LAYER_STEP = 20;

/** px/s — faster than this on release → force close */
const VELOCITY_CLOSE_THRESHOLD = 500;

/** fraction of sheet height dragged down → force close */
const DISTANCE_CLOSE_RATIO = 0.4;

/** spring-like snap-back timing */
const SNAP_BACK_DURATION_MS = 320;

/** close animation duration */
const CLOSE_DURATION_MS = 220;

const classDrivenIconButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
  width: undefined,
  minWidth: undefined,
} satisfies CSSProperties;

const mountedSheetStack: string[] = [];
const presentedSheetStack: string[] = [];
const sheetLayerSubscribers = new Set<() => void>();
let pageReturnTimeout: ReturnType<typeof setTimeout> | null = null;

function getPageReturnDuration() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return 0;
  }

  return MOBILE_SHEET_PAGE_RETURN_MS;
}

function clearPageReturnTimeout() {
  if (!pageReturnTimeout) return;

  clearTimeout(pageReturnTimeout);
  pageReturnTimeout = null;
}

function resetPageDepth() {
  if (typeof document === "undefined") return;

  clearPageReturnTimeout();
  document.body.classList.remove(
    "mobile-sheet-presenting",
    "mobile-sheet-returning",
  );
  document.body.style.removeProperty("--mobile-sheet-page-duration");
  document.body.style.removeProperty("--mobile-sheet-page-easing");
  document.body.style.removeProperty("--mobile-sheet-page-scale");
  document.body.style.removeProperty("--mobile-sheet-page-offset");
  document.body.style.removeProperty("--mobile-sheet-page-radius");
}

function removeStackEntry(stack: string[], id: string) {
  const index = stack.indexOf(id);
  if (index === -1) return;

  stack.splice(index, 1);
}

function registerStackEntry(stack: string[], id: string) {
  if (!stack.includes(id)) {
    stack.push(id);
    notifySheetLayerSubscribers();
  }

  return () => {
    removeStackEntry(stack, id);
    notifySheetLayerSubscribers();
  };
}

function syncPageDepth() {
  if (typeof document === "undefined") return;

  const depth = Math.min(presentedSheetStack.length, 3);

  if (depth === 0 && mountedSheetStack.length === 0) {
    if (!document.body.classList.contains("mobile-sheet-returning")) {
      resetPageDepth();
    }
    return;
  }

  if (depth === 0) {
    if (!document.body.classList.contains("mobile-sheet-returning")) {
      const returnDuration = getPageReturnDuration();
      document.body.classList.remove("mobile-sheet-presenting");
      document.body.classList.add("mobile-sheet-returning");
      document.body.style.setProperty(
        "--mobile-sheet-page-duration",
        `${returnDuration}ms`,
      );
      document.body.style.setProperty(
        "--mobile-sheet-page-easing",
        "cubic-bezier(0.2, 0, 0, 1)",
      );

      pageReturnTimeout = setTimeout(resetPageDepth, returnDuration);
    }
    return;
  }

  clearPageReturnTimeout();
  document.body.classList.add("mobile-sheet-presenting");
  document.body.classList.remove("mobile-sheet-returning");
  document.body.style.setProperty(
    "--mobile-sheet-page-duration",
    `${MOBILE_SHEET_ANIMATION_MS}ms`,
  );
  document.body.style.setProperty(
    "--mobile-sheet-page-easing",
    "cubic-bezier(0.22, 1, 0.36, 1)",
  );
  document.body.style.setProperty(
    "--mobile-sheet-page-scale",
    String(1 - depth * 0.02),
  );
  document.body.style.setProperty(
    "--mobile-sheet-page-offset",
    `${depth * 5}px`,
  );
  document.body.style.setProperty(
    "--mobile-sheet-page-radius",
    `${Math.min(24, 14 + depth * 3)}px`,
  );
}

function notifySheetLayerSubscribers() {
  syncPageDepth();
  sheetLayerSubscribers.forEach((listener) => listener());
}

function useMobileSheetLayer({
  mounted,
  presented,
}: {
  mounted: boolean;
  presented: boolean;
}) {
  const id = useId();
  const [, setVersion] = useState(0);

  useLayoutEffect(() => {
    const listener = () => setVersion((version) => version + 1);
    sheetLayerSubscribers.add(listener);

    return () => {
      sheetLayerSubscribers.delete(listener);
    };
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return undefined;
    return registerStackEntry(mountedSheetStack, id);
  }, [mounted, id]);

  useLayoutEffect(() => {
    if (!presented) return undefined;
    return registerStackEntry(presentedSheetStack, id);
  }, [presented, id]);

  const mountedIndex = mountedSheetStack.indexOf(id);
  const presentedIndex = presentedSheetStack.indexOf(id);
  const layer = mounted
    ? mountedIndex === -1
      ? mountedSheetStack.length
      : mountedIndex
    : 0;
  const isTop = presented
    ? presentedIndex === -1 ||
      presentedIndex === presentedSheetStack.length - 1
    : false;
  const depth = presented
    ? Math.max(
        0,
        presentedSheetStack.length -
          1 -
          (presentedIndex === -1
            ? presentedSheetStack.length
            : presentedIndex),
      )
    : 0;

  return { depth, layer, isTop };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MobileSheetProps {
  isOpen: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  fullScreen?: boolean;
  borderless?: boolean;
  closeOnOverlayClick?: boolean;
  showOverlay?: boolean;
  lockBodyScroll?: boolean;
  showCloseButton?: boolean;
}

// ─── Drag State ───────────────────────────────────────────────────────────────

interface DragState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  lastY: number;
  lastTime: number;
  velocity: number; // px/s
  startScrollTop: number;
  source: "handle" | "content" | null;
}

const initialDragState = (): DragState => ({
  isDragging: false,
  startY: 0,
  currentY: 0,
  lastY: 0,
  lastTime: 0,
  velocity: 0,
  startScrollTop: 0,
  source: null,
});

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileSheet({
  isOpen,
  title,
  onClose,
  children,
  headerActions,
  footer,
  fullScreen = false,
  borderless = false,
  closeOnOverlayClick = true,
  showOverlay = true,
  lockBodyScroll = true,
  showCloseButton = true,
}: MobileSheetProps) {
  const canUseDom =
    typeof document !== "undefined" && typeof window !== "undefined";

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [contentAtTop, setContentAtTop] = useState(true);
  const { depth, layer, isTop } = useMobileSheetLayer({
    mounted: isRendered,
    presented: isOpen,
  });
  const overlayZIndex =
    MOBILE_SHEET_OVERLAY_Z_INDEX + layer * MOBILE_SHEET_LAYER_STEP;
  const panelZIndex =
    MOBILE_SHEET_PANEL_Z_INDEX + layer * MOBILE_SHEET_LAYER_STEP;
  const depthScale = Math.max(0.94, 1 - depth * 0.025);
  const depthOffset = depth * -6;
  const depthOpacity = Math.max(0.94, 1 - depth * 0.025);

  // ── Refs ──────────────────────────────────────────────────────────────────

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const backdropId = useId();

  /** Raw drag state — stored in a ref to avoid re-renders on every pointer move */
  const drag = useRef<DragState>(initialDragState());

  /** Current translate Y applied inline (avoids setState during drag) */
  const translateYRef = useRef(0);

  /** Whether we're in the "programmatic snap/close" transition */
  const isAnimatingRef = useRef(false);

  // ── Utilities ─────────────────────────────────────────────────────────────

  /** Apply translateY directly to the DOM node — zero React re-renders */
  const applyTranslate = useCallback((y: number, transition?: string) => {
    const el = sheetRef.current;
    if (!el) return;
    translateYRef.current = y;
    el.style.transform = `translateY(${y}px)`;
    el.style.transition = transition ?? "none";
  }, []);

  /** Sync backdrop opacity directly — also zero re-renders */
  const applyBackdropOpacity = useCallback(
    (ratio: number) => {
      // ratio: 0 = fully open (100% opacity), 1 = fully closed (0% opacity)
      const backdropEl = document.getElementById(backdropId);
      if (backdropEl) {
        backdropEl.style.opacity = String(Math.max(0, 1 - ratio));
      }
    },
    [backdropId]
  );

  const getSheetHeight = () => sheetRef.current?.offsetHeight ?? 0;

  const syncContentAtTop = useCallback(() => {
    const nextAtTop = (scrollRef.current?.scrollTop ?? 0) <= 0;
    setContentAtTop((current) =>
      current === nextAtTop ? current : nextAtTop,
    );
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  /**
   * Shared pointer-down logic.
   * `source` tells us whether it came from the handle or content area.
   */
  const onDragStart = useCallback(
    (e: ReactPointerEvent, source: "handle" | "content") => {
      if (!isTop) return;

      // Content drag only allowed when scrolled to top
      const startScrollTop = scrollRef.current?.scrollTop ?? 0;
      if (source === "content" && startScrollTop > 0) {
        return;
      }
      if (isAnimatingRef.current) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      drag.current = {
        isDragging: true,
        startY: e.clientY,
        currentY: e.clientY,
        lastY: e.clientY,
        lastTime: performance.now(),
        velocity: 0,
        startScrollTop,
        source,
      };

      applyTranslate(0);
    },
    [applyTranslate, isTop]
  );

  const onDragMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isTop) return;

      const d = drag.current;
      if (!d.isDragging) return;

      const now = performance.now();
      const dt = now - d.lastTime;
      const dy = e.clientY - d.lastY;

      // Compute instantaneous velocity (px/s)
      if (dt > 0) {
        d.velocity = (dy / dt) * 1000;
      }
      d.lastY = e.clientY;
      d.lastTime = now;
      d.currentY = e.clientY;

      const rawDelta = e.clientY - d.startY;

      if (d.source === "content") {
        const nextScrollTop = Math.max(0, d.startScrollTop - rawDelta);

        if (nextScrollTop > 0) {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = nextScrollTop;
          }
          applyTranslate(0);
          applyBackdropOpacity(0);
          return;
        }
      }

      // Clamp: no dragging above the open position
      const clampedDelta = Math.max(0, rawDelta);

      // Subtle resistance for large drags (feels physical)
      const resistedDelta =
        clampedDelta > 80
          ? 80 + (clampedDelta - 80) * 0.55
          : clampedDelta;

      applyTranslate(resistedDelta);

      // Sync backdrop
      const ratio = resistedDelta / (getSheetHeight() || 500);
      applyBackdropOpacity(ratio);
    },
    [applyTranslate, applyBackdropOpacity, isTop]
  );

  const finishDrag = useCallback(
    (forceSnapBack = false) => {
      if (!isTop) return;

      const d = drag.current;
      if (!d.isDragging) return;

      drag.current = { ...initialDragState() };

      const sheetHeight = getSheetHeight();
      const draggedDistance = translateYRef.current;
      const velocity = d.velocity;
      const minFlingDistance =
        d.source === "content"
          ? Math.min(120, sheetHeight * 0.18)
          : Math.min(56, sheetHeight * 0.12);

      const shouldClose =
        !forceSnapBack &&
        (draggedDistance > sheetHeight * DISTANCE_CLOSE_RATIO ||
          (velocity > VELOCITY_CLOSE_THRESHOLD &&
            draggedDistance > minFlingDistance));

      if (shouldClose) {
        // Phase 1 (0 → CLOSE_DURATION_MS):
        //   Inner sheet animates down to sheetHeight px.
        // Phase 2 (CLOSE_DURATION_MS → MOBILE_SHEET_ANIMATION_MS):
        //   onClose() fires → parent sets isOpen=false → outer gets translate-y-full.
        //   Inner MUST stay at translateY(sheetHeight) — hidden behind the outer.
        //   Resetting to 0 here causes the glitch in kept-mounted usage (MobileContactSheet):
        //   the outer exit runs for 420ms but the inner snaps to 0 = briefly visible.
        //
        // Fix: never reset inner transform on close. Let it stay at sheetHeight.
        // The isOpen useEffect resets it to 0 silently when the sheet reopens.
        isAnimatingRef.current = true;
        applyTranslate(
          sheetHeight,
          `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.4,0,1,1)`
        );
        applyBackdropOpacity(1);

        setTimeout(() => {
          isAnimatingRef.current = false;
          // No applyTranslate(0) here — inner stays at sheetHeight while
          // the outer exit transition covers it. Reset is in the isOpen useEffect.
          onClose();
        }, CLOSE_DURATION_MS);
      } else {
        // Snap back to open
        isAnimatingRef.current = true;
        applyTranslate(
          0,
          `transform ${SNAP_BACK_DURATION_MS}ms cubic-bezier(0.22,1,0.36,1)`
        );
        applyBackdropOpacity(0);

        setTimeout(() => {
          isAnimatingRef.current = false;
        }, SNAP_BACK_DURATION_MS);
      }
    },
    [applyTranslate, applyBackdropOpacity, isTop, onClose]
  );

  const onDragEnd = useCallback(
    (_e: ReactPointerEvent) => {
      finishDrag(false);
    },
    [finishDrag],
  );

  const onDragCancel = useCallback(
    (_e: ReactPointerEvent) => {
      finishDrag(true);
    },
    [finishDrag],
  );

  // Prevent content from dragging the sheet when user is scrolled down
  const onContentPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isTop) return;

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setContentAtTop(scrollTop <= 0);
      if (scrollTop > 0) {
        // Stop the event from reaching the sheet's drag handler
        e.stopPropagation();
        return;
      }
      onDragStart(e, "content");
    },
    [isTop, onDragStart]
  );

  // ── Open/close render lifecycle ───────────────────────────────────────────
  useHistoryBack(isOpen, onClose);

  useBodyScrollLock(lockBodyScroll && isRendered);
  useEscapeToClose(isOpen && isRendered && isTop, onClose);
  useFocusTrap(isOpen && isRendered && isTop, sheetRef);

  useEffect(() => {
    if (!canUseDom) return;

    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (isOpen) {
      setIsRendered(true);
      syncContentAtTop();
      // Reset inner drag transform to 0 here — the outer wrapper is still
      // at translate-y-full (invisible), so this reset is not visible to the user.
      // This is the ONLY place we reset. We deliberately do NOT reset in onDragEnd
      // because the outer exit transition needs its full 420ms to complete —
      // resetting the inner to 0 early causes the re-appear glitch.
      applyTranslate(0);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeout = setTimeout(() => setIsRendered(false), MOBILE_SHEET_ANIMATION_MS);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeout) clearTimeout(timeout);
    };
  }, [canUseDom, isOpen, applyTranslate, syncContentAtTop]);

  if (!canUseDom) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ModalPortal isMounted={isRendered}>
      <>
        {/* ── Backdrop ── */}
        {showOverlay ? (
          <div
            id={backdropId}
            className={`fixed inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity ease-out md:hidden ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              pointerEvents: isTop ? "auto" : "none",
              zIndex: overlayZIndex,
              transitionDuration: `${MOBILE_SHEET_ANIMATION_MS}ms`,
            }}
            onMouseDown={(event) => {
              if (
                isTop &&
                event.target === event.currentTarget &&
                closeOnOverlayClick
              ) {
                onClose();
              }
            }}
          />
        ) : null}

        {/* ── Sheet container ── */}
        {/*
          TWO-LAYER APPROACH — fixes the "full-height flash" glitch:
          • Outer div owns the CSS entry/exit animation (translate-y-0 / translate-y-full)
          • Inner div (sheetRef) owns the imperative drag transform via inline style
          They never write to the same element, so React re-renders can't clobber
          an in-progress drag translate.
        */}
        <div
          className={`
            fixed inset-x-0 bottom-0 md:hidden
            transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]
            ${fullScreen ? "top-0" : ""}
            ${isVisible ? "translate-y-0" : "translate-y-full"}
          `}
          style={{
            pointerEvents: isTop ? "auto" : "none",
            zIndex: panelZIndex,
            transitionDuration: `${MOBILE_SHEET_ANIMATION_MS}ms`,
          }}
        >
          <div
            className="mx-auto w-full"
            style={{
              opacity: depthOpacity,
              pointerEvents: isTop ? "auto" : "none",
              transform: `translate3d(0, ${depthOffset}px, 0) scale(${depthScale})`,
              transformOrigin: "top center",
              transition: `transform ${MOBILE_SHEET_ANIMATION_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${MOBILE_SHEET_ANIMATION_MS}ms ease-out`,
            }}
          >
            <div
            ref={sheetRef}
            role="dialog"
            aria-hidden={!isTop}
            aria-modal={isTop}
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (isTop) {
                handleDialogKeyDown(event, onClose);
              }
            }}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragCancel}
            className={`
              flex flex-col overflow-hidden bg-white
              focus:outline-none
              ${
                fullScreen
                  ? "h-[100dvh] max-h-[100dvh]"
                  : `max-h-[88vh] min-h-[42vh] rounded-t-[28px]
                     shadow-[0_-18px_50px_rgba(15,23,42,0.18)]
                     ${borderless ? "" : "border border-slate-200"}`
              }
            `}
            style={{
              // No transition here — this element is drag-only.
              // applyTranslate() writes transform + transition imperatively.
              willChange: "transform",
              touchAction: "none",
            }}
          >
            {/* ── Drag handle strip (always draggable) ── */}
            <div
              className={`
                flex-shrink-0 cursor-grab px-4 active:cursor-grabbing
                ${borderless ? "" : "border-b border-slate-100"}
                ${
                  fullScreen
                    ? "pb-3 pt-[max(1rem,env(safe-area-inset-top))]"
                    : "pb-3 pt-4"
                }
              `}
              style={{
                // Handle zone: always accepts touch-drag
                touchAction: "none",
              }}
              onPointerDown={(e) => onDragStart(e, "handle")}
            >
              {/* Visual pill */}
              <div className="mb-3 flex justify-center">
                <div className="h-1.5 w-14 rounded-full bg-slate-200 transition-colors active:bg-slate-300" />
              </div>

              {/* Title row */}
              <div className="flex items-center justify-between gap-3">
                <div id={titleId} className="min-w-0 flex-1">
                  {title}
                </div>
                {headerActions || showCloseButton ? (
                  <div className="flex items-center gap-2">
                    {headerActions}
                    {showCloseButton ? (
                      <IconButton
                        type="button"
                        icon={<X size={16} />}
                        onClick={onClose}
                        className={`
                          inline-flex h-10 w-10 items-center justify-center
                          rounded-2xl text-slate-500 transition-colors
                          hover:bg-slate-100
                          ${borderless ? "" : "border border-slate-200"}
                        `}
                        style={classDrivenIconButtonStyle}
                        variant="unstyled"
                        aria-label="Close panel"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Scrollable content (conditional drag) ── */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              style={{
                touchAction: contentAtTop ? "none" : "pan-y",
                // Prevent page-level bounce on overscroll
                overscrollBehavior: "contain",
              }}
              onPointerDown={onContentPointerDown}
              onScroll={syncContentAtTop}
            >
              {children}
            </div>

            {/* ── Footer ── */}
            {footer ? (
              <div
                className={`
                  flex-shrink-0 px-4 py-3
                  pb-[max(0.75rem,env(safe-area-inset-bottom))]
                  ${borderless ? "" : "border-t border-slate-100"}
                `}
              >
                {footer}
              </div>
            ) : null}
            </div>
          </div>
          {/* ↑ inner drag div */}
        </div>
        {/* ↑ outer animation wrapper */}
      </>
    </ModalPortal>
  );
}
