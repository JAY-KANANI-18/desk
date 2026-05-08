import { type ReactNode, type RefObject } from "react";
import { MobileSheet } from "../modal";
import { cx } from "../inputs/shared";
import {
  MenuDropdown,
  type MenuDropdownAlign,
  type MenuDropdownPlacement,
  type MenuDropdownWidth,
} from "./MenuDropdown";

export interface PanelMenuProps {
  isOpen: boolean;
  isMobile?: boolean;
  onClose: () => void;
  title?: ReactNode;
  mobileTitle?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  anchorRef?: RefObject<HTMLElement>;
  placement?: MenuDropdownPlacement;
  align?: MenuDropdownAlign;
  width?: MenuDropdownWidth;
  className?: string;
  bodyClassName?: string;
  mobileBodyClassName?: string;
  fullScreenMobile?: boolean;
  borderlessMobile?: boolean;
  ariaLabel?: string;
}

export function PanelMenu({
  isOpen,
  isMobile = false,
  onClose,
  title,
  mobileTitle,
  headerActions,
  footer,
  children,
  anchorRef,
  placement = "bottom",
  align = "end",
  width = "md",
  className,
  bodyClassName,
  mobileBodyClassName,
  fullScreenMobile = false,
  borderlessMobile = false,
  ariaLabel,
}: PanelMenuProps) {
  if (isMobile) {
    return (
      <MobileSheet
        isOpen={isOpen}
        title={mobileTitle ?? title ?? ""}
        onClose={onClose}
        headerActions={headerActions}
        footer={footer}
        fullScreen={fullScreenMobile}
        borderless={borderlessMobile}
      >
        <div className={mobileBodyClassName}>{children}</div>
      </MobileSheet>
    );
  }

  return (
    <MenuDropdown
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      placement={placement}
      align={align}
      width={width}
      role="dialog"
      ariaLabel={ariaLabel}
      className={className}
    >
      {title || headerActions ? (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          {title ? (
            <div className="min-w-0 text-sm font-semibold text-gray-800">
              {title}
            </div>
          ) : (
            <span />
          )}
          {headerActions ? (
            <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cx("min-h-0", bodyClassName)}>{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-4 py-2.5">{footer}</div>
      ) : null}
    </MenuDropdown>
  );
}
