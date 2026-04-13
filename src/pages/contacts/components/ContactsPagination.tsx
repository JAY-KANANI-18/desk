import { PAGE_SIZE } from "../constants";

interface ContactsPaginationProps {
  totalContacts: number;
  currentPage: number;
  totalPages: number;
  visibleCount: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
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
    <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 text-sm">
      <span className="text-xs text-gray-500">
        Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min((currentPage - 1) * PAGE_SIZE + visibleCount, totalContacts)} of{" "}
        {totalContacts} contacts
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className={`h-8 w-8 rounded-lg border text-xs transition-colors ${
                currentPage === item ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next {"->"}
        </button>
      </div>
    </div>
  );
}
