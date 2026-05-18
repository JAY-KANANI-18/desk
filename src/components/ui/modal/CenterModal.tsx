import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BaseModalProps,
  ModalBody,
  ModalFooter,
  ModalFrame,
  ModalHeader,
  ModalPortal,
  getCenterModalPanelStyle,
  getModalMotionTransition,
  handleDialogKeyDown,
  useModalDialog,
  type ModalSize,
} from "./shared";

export interface CenterModalProps extends BaseModalProps {
  size?: ModalSize;
  width?: number | string;
}

export function CenterModal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  onBack,
  headerActions,
  size = "md",
  width,
  footer,
  footerMeta,
  secondaryAction,
  primaryAction,
  closeOnOverlayClick = true,
  showOverlay = true,
  allowBackgroundInteraction = false,
  lockBodyScroll = true,
  showCloseButton = true,
  showDividers = true,
  bodyPadding = "md",
  children,
}: CenterModalProps) {
  const { dialogRef, titleId, isMounted, isVisible, onExitComplete } =
    useModalDialog({
      isOpen,
      onClose,
      lockBodyScroll,
    });
  const shouldReduceMotion = useReducedMotion();
  const hiddenMotion = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.97, y: 8 };
  const visibleMotion = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0 };

  const panelStyle: CSSProperties = {
    ...getCenterModalPanelStyle(size),
    width:
      typeof width === "number"
        ? `${width}px`
        : width ?? (size === "fullscreen" ? "100vw" : "100%"),
    borderRadius: size === "fullscreen" ? 0 : "var(--radius-lg)",
  };

  return (
    <ModalPortal isMounted={isMounted}>
      <ModalFrame
        isVisible={isVisible}
        onExitComplete={onExitComplete}
        panelPosition="center"
        onOverlayClick={closeOnOverlayClick ? onClose : undefined}
        showOverlay={showOverlay}
        allowBackgroundInteraction={allowBackgroundInteraction}
      >
        <motion.div
          key="center-modal-panel"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, onClose)}
          className="relative z-[1] flex min-h-0 min-w-0 max-h-[calc(100vh-var(--spacing-2xl))] w-full pointer-events-auto flex-col overflow-hidden border border-[var(--color-gray-200)] bg-white shadow-xl focus:outline-none"
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
            showDivider={showDividers}
            onClose={onClose}
          />
          <ModalBody padding={bodyPadding}>{children}</ModalBody>
          <ModalFooter
            footer={footer}
            footerMeta={footerMeta}
            secondaryAction={secondaryAction}
            primaryAction={primaryAction}
            showDivider={showDividers}
          />
        </motion.div>
      </ModalFrame>
    </ModalPortal>
  );
}
