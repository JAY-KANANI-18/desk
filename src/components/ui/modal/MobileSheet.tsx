import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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

const MOBILE_SHEET_ANIMATION_MS = 420;

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
  const canUseDom = typeof document !== "undefined" && typeof window !== "undefined";
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(lockBodyScroll && isRendered);
  useEscapeToClose(isOpen && isRendered, onClose);
  useFocusTrap(isOpen && isRendered, sheetRef);

  useEffect(() => {
    if (!canUseDom) return;

    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (isOpen) {
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
  }, [canUseDom, isOpen]);

  if (!canUseDom) {
    return null;
  }

  return (
    <ModalPortal isMounted={isRendered}>
      <>
        {showOverlay ? (
          <div
            className={`fixed inset-0 z-[120] bg-slate-950/35 backdrop-blur-[2px] transition-opacity ease-out md:hidden ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDuration: `${MOBILE_SHEET_ANIMATION_MS}ms` }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && closeOnOverlayClick) {
                onClose();
              }
            }}
          />
        ) : null}
        <div
          className={`fixed inset-x-0 bottom-0 z-[130] md:hidden ${
            fullScreen ? "top-0" : ""
          }`}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={(event) => handleDialogKeyDown(event, onClose)}
            className={`flex flex-col overflow-hidden bg-white transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none ${
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
                <div id={titleId} className="min-w-0 flex-1">{title}</div>
                {headerActions || showCloseButton ? (
                  <div className="flex items-center gap-2">
                    {headerActions}
                    {showCloseButton ? (
                      <IconButton
                        type="button"
                        icon={<X size={16} />}
                        onClick={onClose}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 ${
                          borderless ? "" : "border border-slate-200"
                        }`}
                        style={classDrivenIconButtonStyle}
                        variant="unstyled"
                        aria-label="Close panel"
                      />
                    ) : null}
                  </div>
                ) : null}
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
      </>
    </ModalPortal>
  );
}
