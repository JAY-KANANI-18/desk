import { useEffect, useRef, useState } from "react";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

function MobilePageSentinel({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestedPageRef = useRef(page);
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  useEffect(() => {
    requestedPageRef.current = page;
    setPendingPage((current) => {
      if (current === null) return current;
      return page >= current ? null : current;
    });
  }, [page]);

  useEffect(() => {
    if (page >= totalPages) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextPage = page + 1;
        if (entry.isIntersecting && requestedPageRef.current < nextPage) {
          requestedPageRef.current = nextPage;
          setPendingPage(nextPage);
          onPageChange(nextPage);
        }
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [onPageChange, page, totalPages]);

  return (
    <div ref={sentinelRef} className="flex min-h-10 items-center justify-center px-4 py-3 md:hidden">
      {page < totalPages ? (
        pendingPage && pendingPage > page ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />
            Loading more...
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm">
            Scroll for more
          </span>
        )
      ) : null}
    </div>
  );
}

function buildPagination(currentPage: number, totalPages: number) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - currentPage) <= 1,
  );

  return pages.reduce<Array<number | "...">>((acc, value, index) => {
    const previous = pages[index - 1];
    if (previous && value - previous > 1) {
      acc.push("...");
    }
    acc.push(value);
    return acc;
  }, []);
}

export function ListPagination({
  page,
  totalPages,
  total,
  limit,
  itemLabel,
  onPageChange,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const items = buildPagination(page, totalPages);

  return (
    <>
    <MobilePageSentinel page={page} totalPages={totalPages} onPageChange={onPageChange} />
    <div className="hidden items-center justify-between bg-white px-4 py-3 text-sm md:flex md:border-t md:border-gray-200">
      <span className="text-xs text-gray-500">
        Showing {from}-{to} of {total} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 md:border md:border-gray-300 md:bg-white md:hover:bg-gray-50"
        >
          {"<-"} Prev
        </button>
        {items.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`h-8 w-8 rounded-lg text-xs transition-colors md:border ${
                page === item ? "bg-[var(--color-primary)] text-white md:border-[var(--color-primary)]" : "bg-slate-100 text-gray-700 hover:bg-slate-200 md:border-gray-300 md:bg-white md:hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 md:border md:border-gray-300 md:bg-white md:hover:bg-gray-50"
        >
          Next {"->"}
        </button>
      </div>
    </div>
    </>
  );
}
