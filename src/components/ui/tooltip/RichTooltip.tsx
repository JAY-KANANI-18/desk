import type { ReactNode } from "react";
import { Tooltip, type TooltipPosition, type TooltipProps } from "./Tooltip";

export interface RichTooltipProps
  extends Omit<TooltipProps, "content"> {
  icon?: ReactNode;
  title: string;
  description: string;
}

export function RichTooltip({
  icon,
  title,
  description,
  children,
  position = "auto",
  delay = 400,
  disabled = false,
  maxWidth = 320,
}: RichTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="flex max-w-full items-start gap-[var(--spacing-sm)]">
          {icon ? (
            <span className="mt-[2px] shrink-0 text-[var(--color-primary-light)]">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="font-semibold text-white">{title}</div>
            <div className="mt-[2px] text-xs leading-[var(--line-height-normal)] text-[var(--color-gray-200)]">
              {description}
            </div>
          </div>
        </div>
      }
      position={position}
      delay={delay}
      disabled={disabled}
      maxWidth={maxWidth}
    >
      {children}
    </Tooltip>
  );
}
