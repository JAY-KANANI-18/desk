import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const MOBILE_SHEET_ANIMATION_MS = 420;

interface MobileSheetProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  fullScreen?: boolean;
  borderless?: boolean;
}

export function MobileSheet({
  open,
  title,
  onClose,
  children,
  headerActions,
  footer,
  fullScreen = false,
  borderless = false,
}: MobileSheetProps) {
  const canUseDom = typeof document !== "undefined";
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!canUseDom || !isRendered) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [canUseDom, isRendered]);

  useEffect(() => {
    if (!canUseDom) return;

    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (open) {
      setIsRendered(true);
      frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timeout = setTimeout(() => {
        setIsRendered(false);
      }, MOBILE_SHEET_ANIMATION_MS);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeout) clearTimeout(timeout);
    };
  }, [canUseDom, open]);

  if (!canUseDom || !isRendered) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[120] bg-slate-950/35 backdrop-blur-[2px] transition-opacity ease-out md:hidden ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${MOBILE_SHEET_ANIMATION_MS}ms` }}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[130] md:hidden ${
          fullScreen ? "top-0" : ""
        }`}
      >
        <div
          className={`flex flex-col overflow-hidden bg-white transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isVisible ? "translate-y-0" : "translate-y-12"
          } ${
            fullScreen
              ? "h-[100dvh] max-h-[100dvh]"
              : `max-h-[88vh] min-h-[42vh] rounded-t-[28px] shadow-[0_-18px_50px_rgba(15,23,42,0.18)] ${
                  borderless ? "" : "border border-slate-200"
                }`
          }`}
          style={{ transitionDuration: `${MOBILE_SHEET_ANIMATION_MS}ms` }}
        >
          <div
            className={`px-4 ${borderless ? "" : "border-b border-slate-100"} ${
              fullScreen
                ? "pb-3 pt-[max(1rem,env(safe-area-inset-top))]"
                : "pb-3 pt-4"
            }`}
          >
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-14 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">{title}</div>
              <div className="flex items-center gap-2">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 ${
                    borderless ? "" : "border border-slate-200"
                  }`}
                  aria-label="Close panel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
          {footer ? (
            <div
              className={`px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
                borderless ? "" : "border-t border-slate-100"
              }`}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
