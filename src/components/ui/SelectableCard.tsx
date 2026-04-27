import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";

export interface SelectableCardProps
  extends Omit<
    ButtonProps,
    | "children"
    | "variant"
    | "selected"
    | "leftIcon"
    | "rightIcon"
    | "contentAlign"
  > {
  selected: boolean;
  title: ReactNode;
  description?: ReactNode;
  helper?: ReactNode;
  leading?: ReactNode;
  indicator?: ReactNode;
  showIndicator?: boolean;
}

export function SelectableCard({
  selected,
  title,
  description,
  helper,
  leading,
  indicator,
  showIndicator = true,
  size = "lg",
  radius = "lg",
  fullWidth = true,
  ...props
}: SelectableCardProps) {
  const resolvedIndicator = indicator ?? (
    <span
      aria-hidden="true"
      className={[
        "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
        selected
          ? "border-indigo-500 bg-indigo-600 text-white"
          : "border-gray-200 bg-white text-transparent",
      ].join(" ")}
    >
      <Check size={12} />
    </span>
  );

  return (
    <Button
      {...props}
      variant="select-card"
      selected={selected}
      size={size}
      radius={radius}
      fullWidth={fullWidth}
      contentAlign="start"
      preserveChildLayout
      aria-pressed={selected}
    >
      <div className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {leading ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-all">
              {leading}
            </div>
          ) : null}

          <div className="min-w-0 flex-1 text-left">
            <div
              className={[
                "text-sm font-medium leading-tight break-words",
                selected ? "text-indigo-900" : "text-gray-900",
              ].join(" ")}
            >
              {title}
            </div>

            {description ? (
              <div
                className={[
                  "mt-1 text-xs leading-5",
                  selected ? "text-indigo-700" : "text-gray-500",
                ].join(" ")}
              >
                {description}
              </div>
            ) : null}

            {helper ? (
              <div className="mt-2 text-xs font-medium text-indigo-600">
                {helper}
              </div>
            ) : null}
          </div>
        </div>

        {showIndicator ? <span className="ml-3 shrink-0">{resolvedIndicator}</span> : null}
      </div>
    </Button>
  );
}
