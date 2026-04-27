import type { ReactNode } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

export interface PageLayoutProps {
  leading?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  toolbar?: ReactNode;
  aside?: ReactNode;
  asideOpen?: boolean;
  asideWidth?: number | string;
  asideClassName?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageLayout({
  leading,
  eyebrow,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  toolbar,
  aside,
  asideOpen,
  asideWidth,
  asideClassName,
  children,
  className,
  contentClassName,
}: PageLayoutProps) {
  const isMobile = useIsMobile();
  const hasHeaderControls = Boolean(actions) || Boolean(toolbar);
  const rootClassName = [
    "flex h-full min-h-0 flex-col bg-[var(--color-gray-50)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const resolvedContentClassName =
    contentClassName ??
    "min-h-0 flex-1 overflow-y-auto px-[var(--spacing-lg)] py-[var(--spacing-lg)]";
  const hasControlledAside =
    typeof asideOpen === "boolean" || asideWidth !== undefined || Boolean(asideClassName);
  const isAsideOpen = asideOpen ?? Boolean(aside);
  const resolvedAsideWidth =
    typeof asideWidth === "number" ? `${asideWidth}px` : asideWidth;
  const asideContainerClassName = [
    "flex min-h-0 flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out",
    asideClassName,
  ]
    .filter(Boolean)
    .join(" ");

  if (isMobile) {
    return <>{children}</>;
  }

  const pageMain = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="bg-white px-[var(--spacing-lg)] py-[var(--spacing-md)]">
        {breadcrumbs.length > 0 ? (
          <div className="mb-[var(--spacing-md)]">
            <Breadcrumb items={breadcrumbs} />
          </div>
        ) : null}

        <div className="flex min-w-0 items-start gap-[var(--spacing-sm)]">
          {leading ? <div className="flex-shrink-0">{leading}</div> : null}

          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-[var(--spacing-xs)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="truncate text-2xl font-semibold text-[var(--color-gray-900)]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-[var(--spacing-xs)] max-w-3xl text-sm text-[var(--color-gray-500)]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {hasHeaderControls ? (
          <div className="mt-[var(--spacing-md)] border-t border-[var(--color-gray-100)] pt-[var(--spacing-md)]">
            <div className="flex flex-col gap-[var(--spacing-sm)] md:flex-row md:items-center md:justify-between md:gap-[var(--spacing-lg)]">
              {toolbar ? (
                <div className="min-w-0 flex-1">{toolbar}</div>
              ) : (
                <div className="hidden md:block md:flex-1" />
              )}

              {actions ? (
                <div className="flex flex-wrap items-center gap-[var(--spacing-sm)] md:flex-shrink-0 md:justify-end">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={resolvedContentClassName}>{children}</div>
    </div>
  );

  return (
    <div className={rootClassName}>
      {aside ? (
        <div className="flex min-h-0 flex-1">
          {pageMain}
          {hasControlledAside ? (
            <div
              className={asideContainerClassName}
              style={{
                width: isAsideOpen ? resolvedAsideWidth : 0,
                opacity: isAsideOpen ? 1 : 0,
              }}
            >
              {aside}
            </div>
          ) : (
            aside
          )}
        </div>
      ) : (
        pageMain
      )}
    </div>
  );
}
