interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
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
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 text-sm">
      <span className="text-xs text-gray-500">
        Showing {from}-{to} of {total} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className={`h-8 w-8 rounded-lg border text-xs transition-colors ${
                page === item ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next {"->"}
        </button>
      </div>
    </div>
  );
}
