import { forwardRef } from "react";
import { Search, X } from "@/components/ui/icons";
import { BaseInput, type BaseInputProps } from "./BaseInput";
import { cx } from "./shared";

export interface SearchInputProps
  extends Omit<BaseInputProps, "type" | "inputMode" | "leftIcon" | "rightIcon"> {
  onClear?: () => void;
  clearAriaLabel?: string;
  clearButtonClassName?: string;
  searchIconSize?: number;
  clearIconSize?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onClear,
      clearAriaLabel = "Clear search",
      clearButtonClassName,
      searchIconSize = 15,
      clearIconSize = 10,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const hasValue = String(value ?? "").length > 0;
    const canClear = Boolean(onClear && !disabled && !readOnly);
    const showClear = Boolean(hasValue && canClear);

    return (
      <BaseInput
        {...props}
        ref={ref}
        type="search"
        inputMode="search"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        leftIcon={<Search size={searchIconSize} />}
        rightIcon={
          canClear ? (
            <span className="pointer-events-none flex h-6 w-6 items-center justify-end overflow-hidden">
              <button
                type="button"
                aria-label={clearAriaLabel}
                aria-hidden={!showClear}
                tabIndex={showClear ? 0 : -1}
                disabled={!showClear}
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClear}
                className={cx(
                  "inline-flex h-4 w-4 origin-center items-center justify-center rounded-full bg-slate-500 text-white shadow-sm transition-[background-color,opacity,transform] duration-200 ease-out hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] disabled:pointer-events-none",
                  showClear
                    ? "pointer-events-auto translate-x-0 scale-100 opacity-100"
                    : "pointer-events-none translate-x-3 scale-75 opacity-0",
                  clearButtonClassName,
                )}
              >
                <X size={clearIconSize} strokeWidth={3} />
              </button>
            </span>
          ) : undefined
        }
      />
    );
  },
);

SearchInput.displayName = "SearchInput";
