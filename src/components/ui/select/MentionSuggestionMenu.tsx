import { forwardRef, useId } from "react";
import { AtSign } from "lucide-react";
import { Avatar } from "../Avatar";
import { Tag } from "../Tag";
import { SelectEmptyState, SelectList, SelectOptionRow } from "./shared";

export type MentionSuggestionStatus = "online" | "offline" | "away" | "busy";

export interface MentionSuggestionOption {
  id: string;
  label: string;
  subtitle?: string;
  avatarSrc?: string;
  status?: MentionSuggestionStatus;
  statusLabel?: string;
}

export interface MentionSuggestionMenuProps {
  isOpen: boolean;
  query?: string;
  options: MentionSuggestionOption[];
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  onSelect: (option: MentionSuggestionOption) => void;
  title?: string;
  showEmptyState?: boolean;
  emptyMessage?: string;
  className?: string;
}

function getStatusColor(status?: MentionSuggestionStatus) {
  switch (status) {
    case "online":
      return "var(--color-success)";
    case "away":
    case "busy":
      return "var(--color-warning)";
    case "offline":
      return "var(--color-gray-300)";
    default:
      return undefined;
  }
}

export const MentionSuggestionMenu = forwardRef<
  HTMLDivElement,
  MentionSuggestionMenuProps
>(
  (
    {
      isOpen,
      query = "",
      options,
      highlightedIndex,
      onHighlightChange,
      onSelect,
      title = "Mention teammate",
      showEmptyState = false,
      emptyMessage,
      className = "",
    },
    ref,
  ) => {
    const generatedListId = useId();

    if (!isOpen) return null;

    const listId = `mention-suggestion-menu-${generatedListId}`;
    const hasOptions = options.length > 0;

    if (!hasOptions && !showEmptyState) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={`absolute bottom-full left-0 z-[var(--z-dropdown)] mb-[var(--spacing-xs)] w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-md ${className}`}
      >
        <div className="flex items-center gap-[var(--spacing-sm)] border-b border-[var(--color-gray-100)] px-[var(--spacing-md)] py-[var(--spacing-sm)]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-amber-50 text-[var(--color-warning)]">
            <AtSign size={13} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-500)]">
            {title}
          </span>
          {query ? (
            <span className="ml-auto min-w-0">
              <Tag label={`@${query}`} size="sm" bgColor="warning" maxWidth={120} />
            </span>
          ) : null}
        </div>

        <SelectList id={listId} onKeyDown={() => undefined}>
          {hasOptions ? (
            options.map((option, index) => {
              const statusLabel = option.statusLabel ?? option.status;

              return (
                <SelectOptionRow
                  key={option.id}
                  id={`${listId}-${option.id}`}
                  selected={false}
                  highlighted={highlightedIndex === index}
                  tone="warning"
                  surface="inset"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => onHighlightChange(index)}
                  onSelect={() => onSelect(option)}
                  trailing={
                    highlightedIndex === index ? (
                      <span className="mt-1 shrink-0 text-xs font-medium text-[var(--color-warning)]">
                        Enter
                      </span>
                    ) : undefined
                  }
                >
                  <div className="flex min-w-0 items-center gap-[var(--spacing-sm)]">
                    <Avatar
                      src={option.avatarSrc}
                      name={option.label}
                      size="md"
                      fallbackTone="neutral"
                      showStatus={Boolean(option.status)}
                      statusColor={getStatusColor(option.status)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--color-gray-800)]">
                        {option.label}
                      </span>
                      {option.subtitle || statusLabel ? (
                        <span className="block truncate text-xs text-[var(--color-gray-400)]">
                          {[option.subtitle, statusLabel].filter(Boolean).join(" - ")}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </SelectOptionRow>
              );
            })
          ) : (
            <SelectEmptyState message={emptyMessage ?? `No teammate matches @${query}`} />
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

MentionSuggestionMenu.displayName = "MentionSuggestionMenu";
