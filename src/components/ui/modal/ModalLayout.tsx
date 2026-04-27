import type { CSSProperties, ReactNode } from "react";
import { cx } from "../inputs/shared";

export interface ModalLayoutProps {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  columns?: 1 | 2;
}

const paddingStyles: Record<NonNullable<ModalLayoutProps["padding"]>, CSSProperties> =
  {
    sm: { padding: "var(--spacing-sm)" },
    md: { padding: "var(--spacing-md)" },
    lg: { padding: "var(--spacing-lg)" },
  };

export function ModalLayout({
  children,
  padding = "md",
  columns = 1,
}: ModalLayoutProps) {
  return (
    <div
      className={cx(
        "grid gap-[var(--spacing-md)]",
        columns === 2 && "md:grid-cols-2",
      )}
      style={paddingStyles[padding]}
    >
      {children}
    </div>
  );
}
