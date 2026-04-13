import { AlertCircle, CheckCircle2, MoreVertical, Plus, Search, X } from "lucide-react";
import type { ContactsToast, SortOption } from "../types";

interface ContactsHeaderProps {
  contactsCount: number;
  totalContacts: number;
  toast: ContactsToast | null;
  setToast: (toast: ContactsToast | null) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showActionsMenu: boolean;
  setShowActionsMenu: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedLifecycle: string | null;
  setSelectedLifecycle: (value: string | null) => void;
  sortOption: SortOption | null;
  setSortOption: (value: SortOption | null) => void;
  onOpenImport: () => void;
  onExport: () => void;
  onOpenImportJobs: () => void;
  onNewContact: () => void;
}

export function ContactsHeader({
  contactsCount,
  totalContacts,
  toast,
  setToast,
  searchQuery,
  setSearchQuery,
  showActionsMenu,
  setShowActionsMenu,
  selectedLifecycle,
  setSelectedLifecycle,
  sortOption,
  setSortOption,
  onOpenImport,
  onExport,
  onOpenImportJobs,
  onNewContact,
}: ContactsHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white p-3 md:p-4">
      {toast && (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
          <button className="ml-auto" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative w-full md:w-72 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setShowActionsMenu((prev) => !prev)}
            className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            aria-label="Open contact actions"
          >
            <MoreVertical size={16} />
          </button>

          {showActionsMenu && (
            <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  onOpenImport();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  onExport();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export
              </button>
              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  onOpenImportJobs();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Import Process
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onNewContact}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
        >
          <Plus size={15} />
          <span>New Contact</span>
        </button>
      </div>

      {(selectedLifecycle || sortOption) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Filters:</span>
          {selectedLifecycle && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
              {selectedLifecycle}
              <button onClick={() => setSelectedLifecycle(null)}>
                <X size={11} />
              </button>
            </span>
          )}
          {sortOption && (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
              Sort: {sortOption.label}
              <button onClick={() => setSortOption(null)}>
                <X size={11} />
              </button>
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {contactsCount} on this page of {totalContacts} contacts
          </span>
        </div>
      )}
    </div>
  );
}
