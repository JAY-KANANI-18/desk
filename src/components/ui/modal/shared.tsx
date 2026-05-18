import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { ChevronLeft, X } from "@/components/ui/icons";
import { IconButton } from "../button/IconButton";
import { cx } from "../inputs/shared";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";
export type ModalBodyPadding = "none" | "sm" | "md" | "lg";

const MODAL_PRESENCE_DURATION_MS = 200;
const MODAL_MOTION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const modalMotionTransition: Transition = {
  opacity: { duration: 0.11, ease: "easeOut" },
  scale: { duration: 0.18, ease: MODAL_MOTION_EASE },
  x: { duration: 0.18, ease: MODAL_MOTION_EASE },
  y: { duration: 0.18, ease: MODAL_MOTION_EASE },
};

export function getModalMotionTransition(
  shouldReduceMotion: boolean | null,
): Transition {
  return shouldReduceMotion ? { duration: 0 } : modalMotionTransition;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  headerIcon?: ReactNode;
  onBack?: () => void;
  headerActions?: ReactNode;
  footer?: ReactNode;
  footerMeta?: ReactNode;
  secondaryAction?: ReactNode;
  primaryAction?: ReactNode;
  closeOnOverlayClick?: boolean;
  showOverlay?: boolean;
  allowBackgroundInteraction?: boolean;
  lockBodyScroll?: boolean;
  showCloseButton?: boolean;
  showDividers?: boolean;
  bodyPadding?: ModalBodyPadding;
  children: ReactNode;
}

export function useModalPresence(isOpen: boolean) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;

    if (isOpen) {
      setIsMounted(true);
    }
  }, [isOpen]);

  const handleExitComplete = () => {
    if (!isOpenRef.current) {
      setIsMounted(false);
    }
  };

  return { isMounted, isVisible: isOpen, onExitComplete: handleExitComplete };
}

let bodyScrollLockCount = 0;
let previousBodyOverflow: string | null = null;

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return undefined;
    }

    if (bodyScrollLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    bodyScrollLockCount += 1;

    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

      if (bodyScrollLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? "";
        previousBodyOverflow = null;
      }
    };
  }, [active]);
}

export function useEscapeToClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onClose]);
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!active || !containerRef.current || typeof document === "undefined") {
      return undefined;
    }

    const container = containerRef.current;
    const previousActive = document.activeElement as HTMLElement | null;

    const focusInitialElement = () => {
      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0]?.focus();
        return;
      }

      container.focus();
    };

    const frame = window.requestAnimationFrame(focusInitialElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.();
    };
  }, [active, containerRef]);
}

const centerModalWidthBySize: Record<ModalSize, CSSProperties> = {
  sm: { maxWidth: "28rem" },
  md: { maxWidth: "36rem" },
  lg: { maxWidth: "48rem" },
  xl: { maxWidth: "64rem" },
  fullscreen: { width: "100vw", height: "100vh", maxWidth: "100vw" },
};

export function getCenterModalPanelStyle(size: ModalSize = "md"): CSSProperties {
  return centerModalWidthBySize[size];
}

export function ModalPortal({
  children,
  isMounted,
}: {
  children: ReactNode;
  isMounted: boolean;
}) {
  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export function ModalFrame({
  isVisible,
  onExitComplete,
  onOverlayClick,
  showOverlay = true,
  allowBackgroundInteraction = false,
  panelPosition = "center",
  children,
}: {
  isVisible: boolean;
  onExitComplete?: () => void;
  onOverlayClick?: () => void;
  showOverlay?: boolean;
  allowBackgroundInteraction?: boolean;
  panelPosition?: "center" | "end";
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cx(
        "fixed inset-0 flex p-[var(--spacing-md)]",
        allowBackgroundInteraction && "pointer-events-none",
        panelPosition === "center"
          ? "items-center justify-center"
          : "items-stretch justify-end",
      )}
      style={{
        zIndex: "var(--z-modal)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOverlayClick?.();
        }
      }}
    >
      <AnimatePresence onExitComplete={onExitComplete}>
        {isVisible
          ? [
              showOverlay ? (
                <motion.div
                  key="modal-overlay"
                  aria-hidden="true"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion
                      ? 0
                      : MODAL_PRESENCE_DURATION_MS / 1000,
                    ease: "easeInOut",
                  }}
                  style={{
                    backgroundColor: "rgb(17 24 39 / 0.48)",
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    onOverlayClick?.();
                  }}
                />
              ) : null,
              children,
            ]
          : null}
      </AnimatePresence>
    </div>
  );
}

export function ModalHeader({
  titleId,
  title,
  subtitle,
  headerIcon,
  onBack,
  headerActions,
  showCloseButton = true,
  showDivider = true,
  onClose,
}: {
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headerIcon?: ReactNode;
  onBack?: () => void;
  headerActions?: ReactNode;
  showCloseButton?: boolean;
  showDivider?: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cx(
        "sticky top-0 z-[1] flex items-start justify-between gap-[var(--spacing-md)] bg-white px-[var(--spacing-lg)] py-[var(--spacing-md)]",
        showDivider && "border-b border-[var(--color-gray-200)]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-[var(--spacing-sm)]">
        {onBack ? (
          <IconButton
            icon={<ChevronLeft size={18} />}
            variant="ghost"
            size="md"
            aria-label="Go back"
            onClick={onBack}
          />
        ) : null}

        {headerIcon ? (
          <div className="mt-[2px] shrink-0">
            {headerIcon}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="truncate text-lg font-semibold text-[var(--color-gray-900)]"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-[var(--spacing-xs)] text-sm text-[var(--color-gray-500)]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {headerActions || showCloseButton ? (
        <div className="flex shrink-0 items-center gap-[var(--spacing-xs)]">
          {headerActions ? (
            <div className="flex items-center gap-[var(--spacing-xs)]">
              {headerActions}
            </div>
          ) : null}

          {showCloseButton ? (
            <IconButton
              icon={<X size={18} />}
              variant="ghost"
              size="md"
              aria-label="Close modal"
              onClick={onClose}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const bodyPaddingClassNames: Record<ModalBodyPadding, string> = {
  none: "overflow-hidden p-0",
  sm: "overflow-y-auto px-[var(--spacing-sm)] py-[var(--spacing-sm)]",
  md: "overflow-y-auto px-[var(--spacing-lg)] py-[var(--spacing-md)]",
  lg: "overflow-y-auto px-[var(--spacing-xl)] py-[var(--spacing-lg)]",
};

export function ModalBody({
  children,
  padding = "md",
}: {
  children: ReactNode;
  padding?: ModalBodyPadding;
}) {
  return (
    <div className={cx("min-h-0 flex-1", bodyPaddingClassNames[padding])}>
      {children}
    </div>
  );
}

export function ModalFooter({
  footer,
  footerMeta,
  secondaryAction,
  primaryAction,
  showDivider = true,
}: {
  footer?: ReactNode;
  footerMeta?: ReactNode;
  secondaryAction?: ReactNode;
  primaryAction?: ReactNode;
  showDivider?: boolean;
}) {
  if (footer) {
    return (
      <div
        className={cx(
          "sticky bottom-0 z-[1] bg-white px-[var(--spacing-lg)] py-[var(--spacing-md)]",
          showDivider && "border-t border-[var(--color-gray-200)]",
        )}
      >
        {footer}
      </div>
    );
  }

  if (!footerMeta && !secondaryAction && !primaryAction) {
    return null;
  }

  return (
    <div
      className={cx(
        "sticky bottom-0 z-[1] bg-white px-[var(--spacing-lg)] py-[var(--spacing-md)]",
        showDivider && "border-t border-[var(--color-gray-200)]",
      )}
    >
      <div className="flex flex-col gap-[var(--spacing-md)] sm:flex-row sm:items-center">
        {footerMeta ? (
          <div className="min-w-0 flex-1">
            {footerMeta}
          </div>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}

        <div className="flex flex-col-reverse gap-[var(--spacing-sm)] sm:flex-row sm:items-center sm:justify-end">
          {secondaryAction}
          {primaryAction}
        </div>
      </div>
    </div>
  );
}

export function useModalDialog({
  isOpen,
  onClose,
  lockBodyScroll = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  lockBodyScroll?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const presence = useModalPresence(isOpen);

  useBodyScrollLock(lockBodyScroll && presence.isMounted);
  useEscapeToClose(isOpen, onClose);
  useFocusTrap(isOpen && presence.isMounted, dialogRef);

  return {
    dialogRef,
    titleId,
    ...presence,
  };
}

export function handleDialogKeyDown(
  event: ReactKeyboardEvent<HTMLDivElement>,
  onClose: () => void,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
  }
}
