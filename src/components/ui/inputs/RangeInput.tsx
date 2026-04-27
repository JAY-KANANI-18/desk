import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "./shared";

export interface RangeInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  valueLabel?: string | number;
}

export const RangeInput = forwardRef<HTMLInputElement, RangeInputProps>(
  ({ className, valueLabel, ...props }, ref) => (
    <div className="flex w-full items-center gap-3">
      <input
        {...props}
        ref={ref}
        type="range"
        className={cx(
          "h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
      {valueLabel !== undefined ? (
        <span className="w-6 shrink-0 text-center text-sm font-medium tabular-nums text-gray-700">
          {valueLabel}
        </span>
      ) : null}
    </div>
  ),
);

RangeInput.displayName = "RangeInput";
