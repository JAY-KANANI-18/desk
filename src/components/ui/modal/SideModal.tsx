import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BaseModalProps,
  ModalBody,
  ModalFooter,
  ModalFrame,
  ModalHeader,
  ModalPortal,
  getModalMotionTransition,
  handleDialogKeyDown,
  useModalDialog,
} from "./shared";

export interface SideModalProps extends BaseModalProps {
  width?: number | string;
  size?: never;
}

export function SideModal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  onBack,
  headerActions,
  width = 480,
  footer,
  footerMeta,
  secondaryAction,
  primaryAction,
  closeOnOverlayClick = true,
  showOverlay = true,
  allowBackgroundInteraction = false,
  lockBodyScroll = true,
  showCloseButton = true,
  bodyPadding = "md",
  children,
}: SideModalProps) {
  const { dialogRef, titleId, isMounted, isVisible, onExitComplete } =
    useModalDialog({
      isOpen,
      onClose,
      lockBodyScroll,
    });
  const shouldReduceMotion = useReducedMotion();
  const hiddenMotion = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 24 };
  const visibleMotion = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, x: 0 };

  const panelStyle: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    maxWidth: "100vw",
    height: "100%",
    borderTopLeftRadius: "var(--radius-lg)",
    borderBottomLeftRadius: "var(--radius-lg)",
  };

  return (
    <ModalPortal isMounted={isMounted}>
      <ModalFrame
        isVisible={isVisible}
        onExitComplete={onExitComplete}
        panelPosition="end"
        onOverlayClick={closeOnOverlayClick ? onClose : undefined}
        showOverlay={showOverlay}
        allowBackgroundInteraction={allowBackgroundInteraction}
      >
        <motion.div
          key="side-modal-panel"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, onClose)}
          className="relative z-[1] flex h-full min-h-0 min-w-0 pointer-events-auto flex-col overflow-hidden border border-[var(--color-gray-200)] bg-white shadow-xl focus:outline-none"
          initial={hiddenMotion}
          animate={visibleMotion}
          exit={hiddenMotion}
          transition={getModalMotionTransition(shouldReduceMotion)}
          style={panelStyle}
        >
          <ModalHeader
            titleId={titleId}
            title={title}
            subtitle={subtitle}
            headerIcon={headerIcon}
            onBack={onBack}
            headerActions={headerActions}
            showCloseButton={showCloseButton}
            onClose={onClose}
          />
          <ModalBody padding={bodyPadding}>{children}</ModalBody>
          <ModalFooter
            footer={footer}
            footerMeta={footerMeta}
            secondaryAction={secondaryAction}
            primaryAction={primaryAction}
          />
        </motion.div>
      </ModalFrame>
    </ModalPortal>
  );
}
