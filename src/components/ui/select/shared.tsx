import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  FieldShell,
  cx,
  getInputControlClassName,
  getInputControlStyle,
  type InputSize,
} from "../inputs/shared";

export type SelectSize = InputSize;
export type SelectTriggerAppearance =
  | "field"
  | "pill"
  | "inline"
  | "toolbar"
  | "button";
export type SelectOptionTone = "primary" | "warning" | "neutral";
export type SelectOptionSurface = "flush" | "inset";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface IconSelectOption extends SelectOption {
  icon?: ReactNode;
}

export interface UserSelectOption extends SelectOption {
  avatarSrc?: string;
  avatarName?: string;
  subtitle?: string;
}

export interface TagSelectOption extends SelectOption {
  description?: string;
}

export interface TagSelectGroup {
  label: string;
  options: TagSelectOption[];
}

export interface SelectFieldProps {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  size?: SelectSize;
  emptyMessage?: string;
  className?: string;
}

function findEnabledIndex<T>(
  options: T[],
  getOptionDisabled: (option: T) => boolean,
  startIndex: number,
  direction: 1 | -1,
) {
  if (!options.length) {
    return -1;
  }

  let nextIndex = startIndex;

  for (let attempt = 0; attempt < options.length; attempt += 1) {
    nextIndex =
      nextIndex + direction < 0
        ? options.length - 1
        : (nextIndex + direction) % options.length;

    if (!getOptionDisabled(options[nextIndex])) {
      return nextIndex;
    }
  }

  return -1;
}

function useOutsideDismiss(
  containerRef: RefObject<HTMLElement>,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(target)) {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [containerRef, enabled, onDismiss]);
}

function useDropdownPresence(isOpen: boolean) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);

      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    setIsVisible(false);

    const timeout = window.setTimeout(() => {
      setIsMounted(false);
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  return { isMounted, isVisible };
}

export function useSelectController<T>({
  options,
  disabled = false,
  closeOnSelect = true,
  getOptionDisabled,
  outsideDismiss = true,
  onSelect,
}: {
  options: T[];
  disabled?: boolean;
  closeOnSelect?: boolean;
  getOptionDisabled?: (option: T) => boolean;
  outsideDismiss?: boolean;
  onSelect: (option: T, index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const isOptionDisabled = getOptionDisabled ?? (() => false);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const focusTrigger = () => {
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const close = (focusAfterClose = false) => {
    setIsOpen(false);

    if (focusAfterClose) {
      focusTrigger();
    }
  };

  const open = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const toggle = () => {
    if (disabled) {
      return;
    }

    setIsOpen((current) => !current);
  };

  const moveHighlight = (direction: 1 | -1) => {
    const nextIndex = findEnabledIndex(
      options,
      isOptionDisabled,
      highlightedIndex,
      direction,
    );

    if (nextIndex >= 0) {
      setHighlightedIndex(nextIndex);
    }
  };

  const selectByIndex = (index: number) => {
    const option = options[index];

    if (!option || isOptionDisabled(option)) {
      return;
    }

    setHighlightedIndex(index);
    onSelect(option, index);

    if (closeOnSelect) {
      close(true);
    }
  };

  const selectHighlighted = () => {
    if (highlightedIndex >= 0) {
      selectByIndex(highlightedIndex);
    }
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          open();
        } else {
          moveHighlight(1);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          open();
        } else {
          moveHighlight(-1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!isOpen) {
          open();
        } else {
          selectHighlighted();
        }
        break;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          close(true);
        }
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (
    event: KeyboardEvent<HTMLElement | HTMLInputElement>,
  ) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
        event.preventDefault();
        selectHighlighted();
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
      case "Home":
        event.preventDefault();
        setHighlightedIndex(findEnabledIndex(options, isOptionDisabled, -1, 1));
        break;
      case "End":
        event.preventDefault();
        setHighlightedIndex(
          findEnabledIndex(options, isOptionDisabled, 0, -1),
        );
        break;
      default:
        break;
    }
  };

  useOutsideDismiss(containerRef, outsideDismiss && isOpen, () => close(false));

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    const nextIndex = findEnabledIndex(options, isOptionDisabled, -1, 1);
    setHighlightedIndex(nextIndex);
  }, [isOpen, options, isOptionDisabled]);

  return {
    containerRef,
    triggerRef,
    listId,
    isOpen,
    highlightedIndex,
    setHighlightedIndex,
    open,
    close,
    toggle,
    selectByIndex,
    handleTriggerKeyDown,
    handleListKeyDown,
  };
}

export function getSelectOptionId(listId: string, index: number) {
  return `${listId}-option-${index}`;
}

export function findOptionByValue<T extends SelectOption>(
  options: T[],
  value: string | undefined,
) {
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.value === value);
}

export function getSelectedOptions<T extends SelectOption>(
  options: T[],
  values: string[],
) {
  return options.filter((option) => values.includes(option.value));
}

export function SelectField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      {children}
    </FieldShell>
  );
}

export function SelectTrigger({
  id,
  name,
  triggerRef,
  listId,
  isOpen,
  disabled = false,
  size = "md",
  hasValue = false,
  hasClearAction = false,
  hideIndicator = false,
  appearance = "field",
  fullWidth = false,
  error,
  className,
  style,
  onClick,
  onKeyDown,
  children,
}: {
  id: string;
  name?: string;
  triggerRef: RefObject<HTMLButtonElement>;
  listId: string;
  isOpen: boolean;
  disabled?: boolean;
  size?: SelectSize;
  hasValue?: boolean;
  hasClearAction?: boolean;
  hideIndicator?: boolean;
  fullWidth?: boolean;
  appearance?: SelectTriggerAppearance;
  error?: string;
  className?: string;
  style?: CSSProperties;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  const isFieldAppearance = appearance === "field";
  const indicatorSize =
    appearance === "inline"
      ? 13
      : appearance === "pill" ||
          appearance === "toolbar" ||
          appearance === "button"
        ? 14
        : 16;
  const triggerStyle = isFieldAppearance
    ? getInputControlStyle({
        hasError: Boolean(error),
        paddingRight: hasClearAction ? "calc(var(--spacing-2xl) * 2)" : undefined,
      })
    : undefined;
  const resolvedStyle =
    triggerStyle || style
      ? {
          ...triggerStyle,
          ...style,
          ...(triggerStyle
            ? {
                display: "flex",
                alignItems: "center",
              }
            : {}),
        }
      : undefined;

  return (
    <button
      ref={triggerRef}
      id={id}
      name={name}
      type="button"
      role="combobox"
      aria-controls={listId}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cx(
        isFieldAppearance &&
          getInputControlClassName({
            size,
            className,
          }),
        appearance === "pill" &&
          cx(
            "inline-flex min-h-[calc(var(--spacing-xl)+var(--spacing-xs))] items-center justify-between gap-[var(--spacing-sm)] rounded-full border border-[var(--color-gray-300)] bg-white px-[var(--spacing-md)] py-[var(--spacing-xs)] text-left text-sm font-medium text-[var(--color-gray-700)] shadow-sm transition-colors",
            fullWidth && "w-full",
            !disabled && "hover:border-[var(--color-gray-400)]",
            className,
          ),
        appearance === "toolbar" &&
          cx(
            "inline-flex min-h-[calc(var(--spacing-xl)+var(--spacing-xs))] items-center justify-between gap-[var(--spacing-sm)] rounded-full border border-transparent bg-transparent px-[var(--spacing-md)] py-[var(--spacing-xs)] text-left text-sm font-medium transition-colors",
            fullWidth && "w-full",
            isOpen
              ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
              : "text-[var(--color-gray-700)]",
            !disabled && !isOpen && "hover:bg-[var(--color-gray-100)]",
            className,
          ),
        appearance === "button" &&
          cx(
            "btn focus-visible relative isolate overflow-hidden text-left",
            fullWidth && "w-full",
            className,
          ),
        appearance === "inline" &&
          cx(
            "inline-flex min-h-0 items-center justify-between gap-[6px] rounded-full px-0 py-0 text-left text-sm font-medium transition-colors",
            fullWidth && "w-full",
            hasValue ? "text-[var(--color-gray-500)]" : "text-[var(--color-gray-500)]",
            !disabled && "hover:text-[var(--color-primary-hover)]",
            className,
          ),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1",
        isFieldAppearance &&
          "flex items-center justify-between gap-[var(--spacing-sm)] text-left",
        !hasValue && isFieldAppearance && "text-[var(--color-gray-400)]",
        disabled && "cursor-not-allowed",
        disabled && !isFieldAppearance && "opacity-60",
      )}
      style={resolvedStyle}
    >
      <span className="flex min-w-0 flex-1 items-center">
        {children}
      </span>
        {!hideIndicator ? (
          <ChevronDown
            size={indicatorSize}
            aria-hidden="true"
            className={cx(
              "shrink-0 transition-transform duration-200",
              appearance === "inline" || appearance === "toolbar"
                ? "text-current/70"
                : "text-[var(--color-gray-400)]",
              isOpen && "rotate-180",
            )}
          />
        ) : null}
    </button>
  );
}

export function SelectDropdown({
  isOpen,
  placement = "bottom",
  align = "start",
  width = "trigger",
  children,
}: {
  isOpen: boolean;
  placement?: "top" | "bottom";
  align?: "start" | "end";
  width?: "trigger" | "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const { isMounted, isVisible } = useDropdownPresence(isOpen);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cx(
        "absolute overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white shadow-md",
        placement === "top"
          ? "bottom-full mb-[var(--spacing-xs)]"
          : "top-full mt-[var(--spacing-xs)]",
        width === "trigger"
          ? "left-0 right-0"
          : align === "end"
            ? "right-0"
            : "left-0",
        width === "sm" && "w-[240px] max-w-[calc(100vw-2rem)]",
        width === "md" && "w-[280px] max-w-[calc(100vw-2rem)]",
        width === "lg" && "w-[320px] max-w-[calc(100vw-2rem)]",
      )}
      style={{
        zIndex: "var(--z-dropdown)",
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : placement === "top"
            ? "translateY(4px) scale(0.98)"
            : "translateY(-4px) scale(0.98)",
        transformOrigin:
          placement === "top" ? "bottom center" : "top center",
        transition:
          "opacity var(--transition-fast), transform var(--transition-fast)",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

export function SelectList({
  id,
  onKeyDown,
  children,
}: {
  id: string;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      role="listbox"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="max-h-64 overflow-y-auto py-[var(--spacing-xs)]"
    >
      {children}
    </div>
  );
}

export function SelectOptionRow({
  id,
  selected,
  highlighted,
  disabled = false,
  onSelect,
  onMouseDown,
  onMouseEnter,
  trailing,
  tone = "primary",
  surface = "flush",
  children,
}: {
  id: string;
  selected: boolean;
  highlighted: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter: () => void;
  trailing?: ReactNode;
  tone?: SelectOptionTone;
  surface?: SelectOptionSurface;
  children: ReactNode;
}) {
  const toneBackgroundClass =
    tone === "warning"
      ? "bg-[#fff7ed]"
      : tone === "neutral"
        ? "bg-[var(--color-gray-100)]"
        : "bg-[var(--color-primary-light)]";
  const toneCheckClass =
    tone === "warning"
      ? "text-[#c2410c]"
      : tone === "neutral"
        ? "text-[var(--color-gray-500)]"
        : "text-[var(--color-primary)]";

  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onSelect}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={cx(
        "flex w-full items-start gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-left transition-colors",
        surface === "inset" && "mx-[var(--spacing-xs)] rounded-[var(--radius-lg)]",
        surface === "inset"
          ? selected
            ? toneBackgroundClass
            : highlighted
              ? "bg-[var(--color-gray-50)]"
              : "bg-transparent"
          : highlighted
            ? "bg-[var(--color-primary-light)]"
            : selected
              ? "bg-[var(--color-gray-50)]"
              : "bg-transparent",
        disabled
          ? "cursor-not-allowed opacity-50"
          : highlighted || selected
            ? "cursor-pointer"
            : "cursor-pointer hover:bg-[var(--color-gray-50)]",
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ?? (
        selected ? (
          <Check
            size={16}
            className={cx(
              "mt-0.5 shrink-0",
              surface === "inset" ? toneCheckClass : "text-[var(--color-primary)]",
            )}
          />
        ) : null
      )}
    </button>
  );
}

export function SelectOptionLabel({
  label,
  subtitle,
}: {
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-[var(--color-gray-700)]">
        {label}
      </div>
      {subtitle ? (
        <div className="mt-[2px] truncate text-xs text-[var(--color-gray-500)]">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function SelectEmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="px-[var(--spacing-md)] py-[var(--spacing-lg)] text-sm text-[var(--color-gray-500)]">
      {message}
    </div>
  );
}

export function SelectSearchInput({
  inputRef,
  value,
  onChange,
  onKeyDown,
  placeholder = "Search...",
}: {
  inputRef: RefObject<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="border-b border-[var(--color-gray-200)] p-[var(--spacing-sm)]">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-[var(--spacing-md)] flex items-center text-[var(--color-gray-400)]">
          <Search size={14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={getInputControlClassName({
            size: "sm",
            hasLeftIcon: true,
          })}
          style={getInputControlStyle({
            paddingLeft: "calc(var(--spacing-xl) + var(--spacing-sm))",
          })}
        />
      </div>
    </div>
  );
}

export function SelectChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-[var(--spacing-xs)] rounded-full bg-[var(--color-gray-100)] px-[var(--spacing-sm)] py-[2px] text-xs font-medium text-[var(--color-gray-700)]">
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="inline-flex items-center justify-center rounded-full text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-gray-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1"
        >
          <X size={12} />
        </button>
      ) : null}
    </span>
  );
}

export function SelectMenuHeader({
  title,
  actionLabel,
  onAction,
}: {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  if (!title && !(actionLabel && onAction)) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-gray-200)] px-[var(--spacing-md)] py-[var(--spacing-sm)]">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-500)]">
        {title}
      </span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function SelectUserAvatar({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-xs font-semibold text-[var(--color-primary)]">
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
