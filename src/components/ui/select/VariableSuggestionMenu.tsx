import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  getFloatingMenuGeometry,
  getFloatingMenuMeasuredWidth,
  getFloatingMenuTransformOrigin,
  getHiddenFloatingMenuMotionState,
  type FloatingMenuGeometry,
} from "../menu/floatingMenuGeometry";
import { SelectEmptyState, SelectOptionRow } from "./shared";

export interface VariableSuggestionOption {
  key: string;
  label: string;
  description?: string;
  group?: string;
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
  anchorRef?: RefObject<HTMLElement | null>;
  className?: string;
}

type VariableMenuGeometry = FloatingMenuGeometry & {
  listMaxHeight: number;
};

const VARIABLE_MENU_WIDTH = "lg";
const VARIABLE_MENU_VIEWPORT_PADDING = 8;
const VARIABLE_MENU_HEADER_HEIGHT = 50;
const VARIABLE_MENU_MIN_LIST_HEIGHT = 120;
const VARIABLE_MENU_DEFAULT_LIST_HEIGHT = 320;

const VARIABLE_NAMESPACE_LABELS: Record<string, string> = {
  contact: "Contact",
  trigger: "Event",
  vars: "Saved answer",
  store: "Store",
  conversation: "Conversation",
};

function humanizeVariablePart(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getVariableDisplayLabel(option: VariableSuggestionOption) {
  if (option.label && option.label !== option.key) return option.label;

  const [namespace, ...parts] = option.key.split(".");
  const namespaceLabel = VARIABLE_NAMESPACE_LABELS[namespace] ?? humanizeVariablePart(namespace);
  const fieldLabel = humanizeVariablePart(parts.at(-1) ?? option.key);

  if (!fieldLabel) return namespaceLabel;
  return `${namespaceLabel} ${fieldLabel}`;
}

function getVariableGroup(option: VariableSuggestionOption) {
  if (option.group) return option.group;

  if (option.key.startsWith("contact.")) return "Contact property";
  if (option.key === "trigger.checkoutUrl") return "Cart property";
  if (option.key.startsWith("trigger.order") || option.key.startsWith("trigger.customer")) {
    return "Order property";
  }
  if (option.key.startsWith("trigger.")) return "Event property";
  if (option.key.startsWith("vars.")) return "Saved answer";
  if (option.key.startsWith("store.")) return "Store property";
  if (option.key.startsWith("conversation.")) return "Conversation property";
  if (option.key.startsWith("agent.")) return "Sender property";

  return "Other property";
}

function groupVariableOptions(options: VariableSuggestionOption[]) {
  const groups: Array<{
    label: string;
    items: Array<{
      option: VariableSuggestionOption;
      index: number;
      label: string;
    }>;
  }> = [];
  const groupIndex = new Map<string, number>();

  options.forEach((option, index) => {
    const group = getVariableGroup(option);
    const existingIndex = groupIndex.get(group);
    const item = { option, index, label: getVariableDisplayLabel(option) };

    if (existingIndex === undefined) {
      groupIndex.set(group, groups.length);
      groups.push({ label: group, items: [item] });
      return;
    }

    groups[existingIndex].items.push(item);
  });

  return groups;
}

function getVariableMenuGeometry({
  anchor,
  dropdown,
  placement,
}: {
  anchor: HTMLElement;
  dropdown: HTMLElement;
  placement: VariableSuggestionMenuPlacement;
}): VariableMenuGeometry {
  const baseGeometry = getFloatingMenuGeometry({
    align: "start",
    anchor,
    dropdown,
    placement,
    width: VARIABLE_MENU_WIDTH,
    allowedPlacements: ["top", "bottom"],
  });
  const anchorRect = anchor.getBoundingClientRect();
  const availableHeight =
    baseGeometry.placement === "top"
      ? anchorRect.top - VARIABLE_MENU_VIEWPORT_PADDING
      : window.innerHeight -
        anchorRect.bottom -
        VARIABLE_MENU_VIEWPORT_PADDING;
  const listMaxHeight = Math.max(
    VARIABLE_MENU_MIN_LIST_HEIGHT,
    Math.min(VARIABLE_MENU_DEFAULT_LIST_HEIGHT, availableHeight - VARIABLE_MENU_HEADER_HEIGHT),
  );

  return {
    ...baseGeometry,
    listMaxHeight,
  };
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
      anchorRef: providedAnchorRef,
      className = "",
    },
    ref,
  ) => {
    const anchorRef = useRef<HTMLSpanElement>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const generatedListId = useId();
    const [geometry, setGeometry] = useState<VariableMenuGeometry | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const listId = `variable-suggestion-menu-${generatedListId}`;
    const hasOptions = options.length > 0;
    const shouldRender = isOpen && (hasOptions || showEmptyState);
    const groupedOptions = groupVariableOptions(options);

    const setDropdownRef = useCallback(
      (node: HTMLDivElement | null) => {
        dropdownRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    useLayoutEffect(() => {
      if (!shouldRender) {
        setGeometry(null);
        return undefined;
      }

      const anchor = providedAnchorRef?.current ?? anchorRef.current?.parentElement;
      const dropdown = dropdownRef.current;

      if (!anchor || !dropdown) {
        return undefined;
      }

      const updateGeometry = () => {
        setGeometry(getVariableMenuGeometry({ anchor, dropdown, placement }));
      };

      updateGeometry();
      window.addEventListener("resize", updateGeometry);
      window.addEventListener("scroll", updateGeometry, true);

      return () => {
        window.removeEventListener("resize", updateGeometry);
        window.removeEventListener("scroll", updateGeometry, true);
      };
    }, [
      emptyMessage,
      generatedListId,
      isOpen,
      options,
      placement,
      providedAnchorRef,
      query,
      shouldRender,
      showEmptyState,
    ]);

    const hiddenState = getHiddenFloatingMenuMotionState(
      geometry?.placement ?? placement,
      Boolean(shouldReduceMotion),
    );
    const fallbackAnchor = providedAnchorRef?.current;
    const fallbackAnchorRect = fallbackAnchor?.getBoundingClientRect();
    const fallbackWidth = getFloatingMenuMeasuredWidth(VARIABLE_MENU_WIDTH) ?? 320;
    const fallbackLeft = fallbackAnchorRect
      ? Math.min(
          Math.max(VARIABLE_MENU_VIEWPORT_PADDING, fallbackAnchorRect.left),
          Math.max(
            VARIABLE_MENU_VIEWPORT_PADDING,
            window.innerWidth - fallbackWidth - VARIABLE_MENU_VIEWPORT_PADDING,
          ),
        )
      : VARIABLE_MENU_VIEWPORT_PADDING;
    const fallbackTop =
      fallbackAnchorRect && placement === "bottom"
        ? fallbackAnchorRect.bottom + VARIABLE_MENU_VIEWPORT_PADDING
        : fallbackAnchorRect
          ? fallbackAnchorRect.top - VARIABLE_MENU_DEFAULT_LIST_HEIGHT
          : VARIABLE_MENU_VIEWPORT_PADDING;
    const visibleGeometry: VariableMenuGeometry | null = shouldRender
      ? geometry ?? {
          left: fallbackLeft,
          top: Math.min(
            Math.max(VARIABLE_MENU_VIEWPORT_PADDING, fallbackTop),
            Math.max(
              VARIABLE_MENU_VIEWPORT_PADDING,
              window.innerHeight -
                VARIABLE_MENU_DEFAULT_LIST_HEIGHT -
                VARIABLE_MENU_HEADER_HEIGHT -
                VARIABLE_MENU_VIEWPORT_PADDING,
            ),
          ),
          width: fallbackWidth,
          placement,
          listMaxHeight: VARIABLE_MENU_DEFAULT_LIST_HEIGHT,
        }
      : null;

    const menuClassName = `overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-gray-200)] bg-white shadow-md ${className}`;
    const menuContent = (listMaxHeight = VARIABLE_MENU_DEFAULT_LIST_HEIGHT) => (
      <>
        <div className="flex items-center justify-between gap-[var(--spacing-sm)] border-b border-[var(--color-gray-100)] px-[var(--spacing-md)] py-2.5">
          <span className="text-sm font-semibold text-[var(--color-gray-800)]">
            Insert property
          </span>
          {query ? (
            <span className="min-w-0 truncate text-xs text-[var(--color-gray-500)]">
              Search: {query}
            </span>
          ) : null}
        </div>

        <div
          id={listId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={() => undefined}
          className="overflow-y-auto py-[var(--spacing-xs)]"
          style={{ maxHeight: listMaxHeight }}
        >
          {hasOptions ? (
            groupedOptions.map((group) => (
              <div key={group.label} className="py-1">
                <div className="px-[var(--spacing-md)] pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-400)]">
                  {group.label}
                </div>
                {group.items.map(({ option, index, label }) => (
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
                  >
                    <span className="block truncate text-sm font-medium text-[var(--color-gray-800)]">
                      {label}
                    </span>
                  </SelectOptionRow>
                ))}
              </div>
            ))
          ) : (
            <SelectEmptyState message={emptyMessage ?? `No property matches "${query}"`} />
          )}
        </div>
      </>
    );

    const measuringDropdown = shouldRender ? (
      <div
        ref={setDropdownRef}
        data-select-dropdown="true"
        data-variable-suggestion-menu="true"
        className={`${menuClassName} pointer-events-none invisible fixed`}
        style={{
          left: -9999,
          top: -9999,
          width: getFloatingMenuMeasuredWidth(VARIABLE_MENU_WIDTH),
          zIndex: "calc(var(--z-modal) + 10)",
        }}
      >
        {menuContent()}
      </div>
    ) : null;

    return (
      <>
        <span ref={anchorRef} className="hidden" />
        {typeof document !== "undefined"
          ? createPortal(
              <>
                {measuringDropdown}
                <AnimatePresence>
                  {visibleGeometry ? (
                    <motion.div
                      key="variable-suggestion-menu"
                      ref={setDropdownRef}
                      data-select-dropdown="true"
                      data-variable-suggestion-menu="true"
                      onMouseDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      initial={{ opacity: 0, ...hiddenState }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, ...hiddenState }}
                      transition={{
                        opacity: {
                          duration: shouldReduceMotion ? 0.001 : 0.11,
                          ease: "easeOut",
                        },
                        x: {
                          duration: shouldReduceMotion ? 0.001 : 0.18,
                          ease: [0.16, 1, 0.3, 1],
                        },
                        y: {
                          duration: shouldReduceMotion ? 0.001 : 0.18,
                          ease: [0.16, 1, 0.3, 1],
                        },
                        scale: {
                          duration: shouldReduceMotion ? 0.001 : 0.18,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      className={`${menuClassName} fixed`}
                      style={{
                        left: visibleGeometry.left,
                        top: visibleGeometry.top,
                        width: visibleGeometry.width,
                        zIndex: "calc(var(--z-modal) + 10)",
                        transformOrigin: getFloatingMenuTransformOrigin(
                          visibleGeometry.placement,
                          "start",
                        ),
                        pointerEvents: "auto",
                      }}
                    >
                      {menuContent(visibleGeometry.listMaxHeight)}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>,
              document.body,
            )
          : null}
      </>
    );
  },
);

VariableSuggestionMenu.displayName = "VariableSuggestionMenu";
