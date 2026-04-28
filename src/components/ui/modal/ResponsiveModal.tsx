import type { ReactNode } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { CenterModal, type CenterModalProps } from "./CenterModal";
import { MobileSheet } from "./MobileSheet";

export interface ResponsiveModalProps
  extends Omit<CenterModalProps, "children" | "isOpen" | "onClose" | "title"> {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  mobileTitle?: ReactNode;
  mobileFooter?: ReactNode;
  mobileHeaderActions?: ReactNode;
  mobileFullScreen?: boolean;
  mobileBorderless?: boolean;
  mobileCloseOnOverlayClick?: boolean;
  mobileShowOverlay?: boolean;
  mobileLockBodyScroll?: boolean;
  mobileShowCloseButton?: boolean;
  mobileBodyClassName?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  mobileTitle,
  mobileFooter,
  mobileHeaderActions,
  mobileFullScreen = false,
  mobileBorderless = false,
  mobileCloseOnOverlayClick,
  mobileShowOverlay,
  mobileLockBodyScroll,
  mobileShowCloseButton,
  mobileBodyClassName,
  ...centerModalProps
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (!isOpen) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={isOpen}
        onClose={onClose}
        title={mobileTitle ?? title}
        headerActions={mobileHeaderActions}
        footer={mobileFooter ?? footer}
        fullScreen={mobileFullScreen}
        borderless={mobileBorderless}
        closeOnOverlayClick={mobileCloseOnOverlayClick}
        showOverlay={mobileShowOverlay}
        lockBodyScroll={mobileLockBodyScroll}
        showCloseButton={mobileShowCloseButton}
      >
        {mobileBodyClassName ? (
          <div className={mobileBodyClassName}>{children}</div>
        ) : (
          children
        )}
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      {...centerModalProps}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
    >
      {children}
    </CenterModal>
  );
}
