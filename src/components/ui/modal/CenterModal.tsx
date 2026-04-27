import type { CSSProperties } from "react";
import {
  BaseModalProps,
  ModalBody,
  ModalFooter,
  ModalFrame,
  ModalHeader,
  ModalPortal,
  getCenterModalPanelStyle,
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
  bodyPadding = "md",
  children,
}: CenterModalProps) {
  const { dialogRef, titleId, isMounted, isVisible } = useModalDialog({
    isOpen,
    onClose,
    lockBodyScroll,
  });

  const panelStyle: CSSProperties = {
    ...getCenterModalPanelStyle(size),
    width:
      typeof width === "number"
        ? `${width}px`
        : width ?? (size === "fullscreen" ? "100vw" : "100%"),
    borderRadius: size === "fullscreen" ? 0 : "var(--radius-lg)",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
    transition: "opacity var(--transition-base), transform var(--transition-base)",
  };

  return (
    <ModalPortal isMounted={isMounted}>
      <ModalFrame
        isVisible={isVisible}
        panelPosition="center"
        onOverlayClick={closeOnOverlayClick ? onClose : undefined}
        showOverlay={showOverlay}
        allowBackgroundInteraction={allowBackgroundInteraction}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={(event) => handleDialogKeyDown(event, onClose)}
          className="flex min-h-0 max-h-[calc(100vh-var(--spacing-2xl))] w-full flex-col overflow-hidden border border-[var(--color-gray-200)] bg-white shadow-xl focus:outline-none"
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
        </div>
      </ModalFrame>
    </ModalPortal>
  );
}
