import { ChevronRight, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "../inputs/shared";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

function getVisibleItems(items: BreadcrumbItem[]) {
  if (items.length <= 4) {
    return items;
  }

  return [items[0], { label: "...ellipsis..." }, ...items.slice(-2)];
}

export function Breadcrumb({
  items,
  separator = <ChevronRight size={14} className="text-[var(--color-gray-400)]" />,
}: BreadcrumbProps) {
  const visibleItems = getVisibleItems(items);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-[var(--spacing-xs)] text-sm">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isEllipsis = item.label === "...ellipsis...";

          return (
            <li key={`${item.label}-${index}`} className="inline-flex max-w-full items-center gap-[var(--spacing-xs)]">
              {isEllipsis ? (
                <span className="inline-flex items-center text-[var(--color-gray-400)]">
                  <MoreHorizontal size={14} />
                </span>
              ) : isLast || (!item.href && !item.onClick) ? (
                <span className="truncate font-medium text-[var(--color-gray-700)]">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  onClick={item.onClick}
                  className={cx(
                    "truncate text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cx(
                    "truncate text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1",
                  )}
                >
                  {item.label}
                </button>
              )}

              {!isLast ? separator : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
