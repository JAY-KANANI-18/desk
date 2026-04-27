import type { CSSProperties, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg";
export type InputAppearance =
  | "default"
  | "auth"
  | "toolbar"
  | "sidebar"
  | "inline-edit"
  | "composer"
  | "composer-inline"
  | "composer-note";
export type FieldLabelVariant = "default" | "sidebar";
export type BaseInputType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "time"
  | "datetime-local"
  | "password"
  | "search"
  | "tel"
  | "url";

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const sizeClassNames: Record<InputSize, string> = {
  xs: "input-xs",
  sm: "input-sm",
  md: "",
  lg: "input-lg",
};

const appearanceClassNames: Record<InputAppearance, string> = {
  default: "",
  auth: "rounded-2xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400",
  toolbar:
    "rounded-xl border-transparent bg-slate-100 text-gray-700 placeholder:text-gray-400 md:rounded-lg md:border-gray-300 md:bg-white",
  sidebar:
    "rounded-xl border-[#e0e4ed] bg-[#fafbfc] text-[13px] text-[#1c2030] placeholder:text-[#c8cdd8]",
  "inline-edit":
    "input-inline-edit text-sm font-medium text-gray-800 placeholder:text-gray-400",
  composer:
    "rounded-none border-transparent bg-transparent px-3 py-2 text-[13px] leading-6 text-gray-700 placeholder:text-gray-400 shadow-none focus:border-transparent focus:shadow-none sm:px-4 sm:py-3 sm:text-sm sm:leading-relaxed",
  "composer-inline":
    "rounded-none border-transparent bg-transparent px-0 py-0 text-[13px] font-medium text-gray-800 placeholder:text-gray-400 shadow-none focus:border-transparent focus:shadow-none sm:text-sm",
  "composer-note":
    "rounded-none border-transparent bg-transparent px-3 py-2 text-[13px] leading-6 text-gray-700 placeholder:text-amber-400 shadow-none focus:border-transparent focus:shadow-none sm:px-4 sm:py-3 sm:text-sm sm:leading-relaxed",
};

const iconPaddingByAppearance: Record<
  InputAppearance,
  Record<InputSize, { left: string; right: string }>
> = {
  default: {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  auth: {
    xs: { left: "2.25rem", right: "2.25rem" },
    sm: { left: "2.5rem", right: "2.5rem" },
    md: { left: "2.75rem", right: "2.75rem" },
    lg: { left: "3rem", right: "3rem" },
  },
  toolbar: {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  sidebar: {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  "inline-edit": {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  composer: {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  "composer-inline": {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
  "composer-note": {
    xs: { left: "2rem", right: "2rem" },
    sm: { left: "2.25rem", right: "2.25rem" },
    md: { left: "2.5rem", right: "2.5rem" },
    lg: { left: "2.75rem", right: "2.75rem" },
  },
};

const labelClassNames: Record<FieldLabelVariant, string> = {
  default:
    "mb-[var(--spacing-sm)] block text-sm font-medium text-[var(--color-gray-700)]",
  sidebar:
    "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#b0b8c8]",
};

const actionButtonClassNames: Record<InputSize, string> = {
  xs: "min-h-[1.5rem] min-w-[1.5rem] px-[var(--spacing-xs)] text-xs",
  sm: "min-h-[calc(var(--spacing-lg)+var(--spacing-xs))] min-w-[calc(var(--spacing-lg)+var(--spacing-xs))] px-[var(--spacing-sm)] text-xs",
  md: "min-h-[calc(var(--spacing-xl)+var(--spacing-xs))] min-w-[calc(var(--spacing-xl)+var(--spacing-xs))] px-[var(--spacing-sm)] text-xs",
  lg: "min-h-[calc(var(--spacing-xl)+var(--spacing-lg))] min-w-[calc(var(--spacing-xl)+var(--spacing-lg))] px-[var(--spacing-md)] text-sm",
};

export function getInputControlClassName({
  size = "md",
  appearance = "default",
  hasLeftIcon = false,
  hasRightIcon = false,
  multiline = false,
  className,
}: {
  size?: InputSize;
  appearance?: InputAppearance;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
  multiline?: boolean;
  className?: string;
}) {
  const isComposerAppearance =
    appearance === "composer" ||
    appearance === "composer-inline" ||
    appearance === "composer-note";

  return cx(
    isComposerAppearance
      ? "block w-full"
      : appearance === "inline-edit"
        ? "input"
        : "input focus-visible",
    multiline && "resize-none",
    !isComposerAppearance && sizeClassNames[size],
    appearanceClassNames[appearance],
    className,
  );
}

export function getInputControlStyle({
  hasError,
  readOnly,
  size = "md",
  appearance = "default",
  hasLeftIcon = false,
  hasRightIcon = false,
  paddingRight,
  paddingLeft,
}: {
  hasError?: boolean;
  readOnly?: boolean;
  size?: InputSize;
  appearance?: InputAppearance;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
  paddingRight?: string;
  paddingLeft?: string;
}) {
  const style: CSSProperties = {};
  const iconPadding = iconPaddingByAppearance[appearance][size];
  const isComposerAppearance =
    appearance === "composer" ||
    appearance === "composer-inline" ||
    appearance === "composer-note";

  if (isComposerAppearance) {
    style.border = "none";
    style.boxShadow = "none";
    style.outline = "none";
    style.backgroundColor = "transparent";
  }

  if (hasError) {
    style.borderColor = "var(--color-error)";
  }

  if (readOnly) {
    if (
      appearance === "composer" ||
      appearance === "composer-inline" ||
      appearance === "composer-note"
    ) {
      style.backgroundColor = "transparent";
      style.color = "var(--color-gray-500)";
      style.cursor = "wait";
    } else {
      style.backgroundColor = "var(--color-gray-100)";
      style.color = "var(--color-gray-600)";
    }
  }

  if (paddingRight) {
    style.paddingRight = paddingRight;
  } else if (hasRightIcon) {
    style.paddingRight = iconPadding.right;
  }

  if (paddingLeft) {
    style.paddingLeft = paddingLeft;
  } else if (hasLeftIcon) {
    style.paddingLeft = iconPadding.left;
  }

  return style;
}

export function getAdornmentClassName({
  side,
  appearance = "default",
  multiline = false,
}: {
  side: "left" | "right";
  appearance?: InputAppearance;
  multiline?: boolean;
}) {
  return cx(
    "absolute z-[1] flex min-w-5 items-center justify-center text-[var(--color-gray-400)]",
    side === "left"
      ? appearance === "auth"
        ? "left-4 pointer-events-none"
        : "left-3 pointer-events-none"
      : appearance === "auth"
        ? "right-4"
        : "right-3",
    multiline ? "top-3.5" : "inset-y-0",
  );
}

export function getActionButtonClassName(size: InputSize = "md") {
  return cx(
    "inline-flex items-center justify-center rounded-full font-medium text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-gray-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
    actionButtonClassNames[size],
  );
}

export function getDescriptionId(id: string, hasDescription: boolean) {
  return hasDescription ? `${id}-description` : undefined;
}

export function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  messageEnd,
  labelVariant = "default",
  className,
  children,
}: {
  id: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  messageEnd?: ReactNode;
  labelVariant?: FieldLabelVariant;
  className?: string;
  children: ReactNode;
}) {
  const message = error || hint;
  const hasMeta = Boolean(message || messageEnd);

  return (
    <div className={cx("w-full", className)}>
      {label ? (
        <label
          htmlFor={id}
          className={labelClassNames[labelVariant]}
        >
          <span>{label}</span>
          {required ? (
            <span
              aria-hidden="true"
              className="ml-[var(--spacing-xs)]"
              style={{ color: "var(--color-error)" }}
            >
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {hasMeta ? (
        <div className="mt-[var(--spacing-xs)] flex items-start justify-between gap-[var(--spacing-sm)]">
          <p
            id={`${id}-description`}
            className="min-w-0 flex-1 text-xs leading-[var(--line-height-normal)]"
            style={{
              color: error ? "var(--color-error)" : "var(--color-gray-500)",
            }}
          >
            {message}
          </p>

          {messageEnd ? (
            <div className="flex-shrink-0 text-xs text-[var(--color-gray-500)]">
              {messageEnd}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
