import { PAGE_SIZE } from "../constants";
import { useEffect, useRef, useState } from "react";

interface ContactsPaginationProps {
  totalContacts: number;
  currentPage: number;
  totalPages: number;
  visibleCount: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
}

function MobilePageSentinel({
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestedPageRef = useRef(currentPage);
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  useEffect(() => {
    requestedPageRef.current = currentPage;
    setPendingPage((value) => {
      if (value === null) return value;
      return currentPage >= value ? null : value;
    });
  }, [currentPage]);

  useEffect(() => {
    if (currentPage >= totalPages) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextPage = currentPage + 1;
        if (entry.isIntersecting && requestedPageRef.current < nextPage) {
          requestedPageRef.current = nextPage;
          setPendingPage(nextPage);
          setCurrentPage(nextPage);
        }
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [currentPage, setCurrentPage, totalPages]);

  return (
    <div ref={sentinelRef} className="flex min-h-10 items-center justify-center px-4 py-3 md:hidden">
      {currentPage < totalPages ? (
        pendingPage && pendingPage > currentPage ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
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
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return pages.reduce<Array<number | "...">>((accumulator, page, index) => {
    const previousPage = pages[index - 1];
    if (previousPage && page - previousPage > 1) {
      accumulator.push("...");
    }
    accumulator.push(page);
    return accumulator;
  }, []);
}

export function ContactsPagination({
  totalContacts,
  currentPage,
  totalPages,
  visibleCount,
  setCurrentPage,
}: ContactsPaginationProps) {
  if (totalContacts <= PAGE_SIZE) {
    return null;
  }

  const paginationItems = buildPagination(currentPage, totalPages);

  return (
    <>
    <MobilePageSentinel
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
    />
    <div className="sticky bottom-0 hidden flex-col gap-3 bg-white px-4 py-3 text-sm md:flex md:flex-row md:items-center md:justify-between md:border-t md:border-gray-200">
      <span className="text-xs text-gray-500">
        Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min((currentPage - 1) * PAGE_SIZE + visibleCount, totalContacts)} of{" "}
        {totalContacts} contacts
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 md:border md:border-gray-300 md:bg-white md:hover:bg-gray-50"
        >
          {"<-"} Prev
        </button>
        {paginationItems.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => setCurrentPage(item)}
              className={`h-8 w-8 rounded-lg text-xs transition-colors md:border ${
                currentPage === item ? "bg-indigo-600 text-white md:border-indigo-600" : "bg-slate-100 text-gray-700 hover:bg-slate-200 md:border-gray-300 md:bg-white md:hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 md:border md:border-gray-300 md:bg-white md:hover:bg-gray-50"
        >
          Next {"->"}
        </button>
      </div>
    </div>
    </>
  );
}
