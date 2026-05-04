import { Link, useLocation } from "react-router-dom";
import { Compass, Home, SearchX } from "@/components/ui/icons";

export const WorkspaceNotFound = () => {
  const location = useLocation();

  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <SearchX className="h-7 w-7" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
          This workspace page does not exist
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          We could not find anything at
          <span className="ml-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 sm:text-sm">
            {location.pathname}
          </span>
          .
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/inbox"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            Go to inbox
          </Link>
          <Link
            to="/sitemap"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Compass className="h-4 w-4" />
            Browse sitemap
          </Link>
        </div>
      </div>
    </div>
  );
};
