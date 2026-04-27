import type { CSSProperties } from "react";
import {
  BaseModalProps,
  ModalBody,
  ModalFooter,
  ModalFrame,
  ModalHeader,
  ModalPortal,
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
  const { dialogRef, titleId, isMounted, isVisible } = useModalDialog({
    isOpen,
    onClose,
    lockBodyScroll,
  });

  const panelStyle: CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    maxWidth: "100vw",
    height: "100%",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateX(0)" : "translateX(24px)",
    transition: "opacity var(--transition-base), transform var(--transition-base)",
    borderTopLeftRadius: "var(--radius-lg)",
    borderBottomLeftRadius: "var(--radius-lg)",
  };

  return (
    <ModalPortal isMounted={isMounted}>
      <ModalFrame
        isVisible={isVisible}
        panelPosition="end"
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
          className="flex min-h-0 h-full flex-col overflow-hidden border border-[var(--color-gray-200)] bg-white shadow-xl focus:outline-none"
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
