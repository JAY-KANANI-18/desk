import { forwardRef } from "react";
import { DollarSign } from "@/components/ui/icons";
import { Tag } from "../Tag";
import { SelectEmptyState, SelectList, SelectOptionRow } from "./shared";

export interface VariableSuggestionOption {
  key: string;
  label: string;
  description?: string;
}

export type VariableSuggestionMenuPlacement = "top" | "bottom";

export interface VariableSuggestionMenuProps {
  isOpen: boolean;
  query?: string;
  options: VariableSuggestionOption[];
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  onSelect: (option: VariableSuggestionOption) => void;
  showEmptyState?: boolean;
  emptyMessage?: string;
  placement?: VariableSuggestionMenuPlacement;
  className?: string;
}

export const VariableSuggestionMenu = forwardRef<
  HTMLDivElement,
  VariableSuggestionMenuProps
>(
  (
    {
      isOpen,
      query = "",
      options,
      highlightedIndex,
      onHighlightChange,
      onSelect,
      showEmptyState = false,
      emptyMessage,
      placement = "top",
      className = "",
    },
    ref,
  ) => {
    if (!isOpen) return null;

    const listId = "variable-suggestion-menu";
    const hasOptions = options.length > 0;

    if (!hasOptions && !showEmptyState) {
      return null;
    }

    const placementClassName =
      placement === "bottom"
        ? "top-full mt-[var(--spacing-xs)]"
        : "bottom-full mb-[var(--spacing-xs)]";

    return (
      <div
        ref={ref}
        className={`absolute left-0 z-[var(--z-dropdown)] w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-md ${placementClassName} ${className}`}
      >
        <div className="flex items-center gap-[var(--spacing-sm)] border-b border-[var(--color-gray-100)] px-[var(--spacing-md)] py-[var(--spacing-sm)]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <DollarSign size={13} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-500)]">
            Insert variable
          </span>
          {query ? (
            <span className="ml-auto min-w-0">
              <Tag label={`$${query}`} size="sm" bgColor="primary" maxWidth={120} />
            </span>
          ) : null}
        </div>

        <SelectList id={listId} onKeyDown={() => undefined}>
          {hasOptions ? (
            options.map((option, index) => (
              <SelectOptionRow
                key={option.key}
                id={`${listId}-${option.key}`}
                selected={false}
                highlighted={highlightedIndex === index}
                tone="primary"
                surface="inset"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHighlightChange(index)}
                onSelect={() => onSelect(option)}
                trailing={
                  <code className="mt-1 shrink-0 rounded border border-[var(--color-primary-light)] bg-[var(--color-gray-50)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-primary)]">
                    {`{{${option.key}}}`}
                  </code>
                }
              >
                <div className="flex min-w-0 items-center gap-[var(--spacing-sm)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <DollarSign size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--color-gray-800)]">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block truncate text-xs text-[var(--color-gray-400)]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </div>
              </SelectOptionRow>
            ))
          ) : (
            <SelectEmptyState message={emptyMessage ?? `No variable matches $${query}`} />
          )}
        </SelectList>

        {hasOptions ? (
          <div className="border-t border-[var(--color-gray-100)] bg-[var(--color-gray-50)] px-[var(--spacing-md)] py-1.5">
            <p className="text-[10px] text-[var(--color-gray-400)]">
              Arrow keys navigate - Enter selects - Esc dismisses
            </p>
          </div>
        ) : null}
      </div>
    );
  },
);

VariableSuggestionMenu.displayName = "VariableSuggestionMenu";
