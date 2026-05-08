import { type ReactNode, type RefObject } from "react";
import { cx } from "../inputs/shared";
import {
  MenuDropdown,
  type MenuDropdownAlign,
  type MenuDropdownPlacement,
  type MenuDropdownWidth,
} from "./MenuDropdown";

export type ActionMenuItemTone = "default" | "danger";

export interface ActionMenuItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: ActionMenuItemTone;
  disabled?: boolean;
  loading?: boolean;
  onSelect: () => void | Promise<void>;
}

export type ActionMenuEntry =
  | ActionMenuItem
  | {
      id: string;
      type: "separator";
    };

export interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionMenuEntry[];
  anchorRef?: RefObject<HTMLElement>;
  placement?: MenuDropdownPlacement;
  align?: MenuDropdownAlign;
  width?: MenuDropdownWidth;
  ariaLabel?: string;
  className?: string;
}

function isSeparator(item: ActionMenuEntry): item is { id: string; type: "separator" } {
  return "type" in item && item.type === "separator";
}

export function ActionMenu({
  isOpen,
  onClose,
  items,
  anchorRef,
  placement = "bottom",
  align = "end",
  width = "sm",
  ariaLabel = "Actions",
  className,
}: ActionMenuProps) {
  return (
    <MenuDropdown
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      placement={placement}
      align={align}
      width={width}
      role="menu"
      ariaLabel={ariaLabel}
      className={cx("py-1", className)}
    >
      {items.map((item) => {
        if (isSeparator(item)) {
          return <div key={item.id} className="my-1 border-t border-gray-100" />;
        }

        const isDanger = item.tone === "danger";
        const disabled = item.disabled || item.loading;

        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }

              onClose();
              void item.onSelect();
            }}
            className={cx(
              "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-55",
              isDanger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50",
            )}
          >
            {item.icon ? (
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {item.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.label}</span>
              {item.description ? (
                <span
                  className={cx(
                    "mt-0.5 block text-xs leading-5",
                    isDanger ? "text-red-500/80" : "text-gray-500",
                  )}
                >
                  {item.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </MenuDropdown>
  );
}
