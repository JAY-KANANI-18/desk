import { useState } from "react";
import { AlertCircle, CheckCircle2, MoreVertical, Plus, Search, X } from "lucide-react";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
import { useIsMobile } from "../../../hooks/useIsMobile";
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
  const isMobile = useIsMobile();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const closeActionsMenu = () => setShowActionsMenu(false);

  const actionItems = (
    <>
      <button
        onClick={() => {
          closeActionsMenu();
          onOpenImport();
        }}
        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        Import
      </button>
      <button
        onClick={() => {
          closeActionsMenu();
          onExport();
        }}
        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        Export
      </button>
      <button
        onClick={() => {
          closeActionsMenu();
          onOpenImportJobs();
        }}
        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        Import Process
      </button>
    </>
  );

  useMobileHeaderActions(
    isMobile
      ? {
          actions: [
            {
              id: "contacts-search",
              label: mobileSearchOpen ? "Close search" : "Search contacts",
              icon: mobileSearchOpen ? <X size={17} /> : <Search size={17} />,
              active: mobileSearchOpen,
              hasIndicator: !mobileSearchOpen && Boolean(searchQuery),
              onClick: () => setMobileSearchOpen((value) => !value),
            },
            {
              id: "contacts-new",
              label: "New contact",
              icon: <Plus size={18} />,
              onClick: onNewContact,
            },
            {
              id: "contacts-actions",
              label: "Contact actions",
              icon: <MoreVertical size={17} />,
              active: showActionsMenu,
              onClick: () => setShowActionsMenu((prev) => !prev),
            },
          ],
          panel: mobileSearchOpen ? (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                autoFocus
                className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-9 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search contacts..."
                type="text"
                value={searchQuery}
              />
              {searchQuery ? (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          ) : null,
        }
      : {},
    [isMobile, mobileSearchOpen, searchQuery, showActionsMenu],
  );

  return (
    <div
      className={`bg-white px-3 md:border-b md:border-gray-200 md:p-4 ${
        toast || selectedLifecycle || sortOption ? "pb-3" : ""
      }`}
    >
      {toast && (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm md:border ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 md:border-red-200"
              : "bg-green-50 text-green-700 md:border-green-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
          <button className="ml-auto" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="hidden md:flex md:items-center md:gap-3">
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

        <div className="ml-auto flex items-center gap-2">
          <div className="relative flex-none">
            <button
              onClick={() => setShowActionsMenu((prev) => !prev)}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              aria-label="Open contact actions"
            >
              <MoreVertical size={16} />
            </button>

            {!isMobile && showActionsMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {actionItems}
              </div>
            )}
          </div>

          <button
            onClick={onNewContact}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
          >
            <Plus size={15} />
            <span>New Contact</span>
          </button>
        </div>
      </div>

      {(selectedLifecycle || sortOption) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Filters:</span>
          {selectedLifecycle && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 md:border md:border-indigo-200">
              {selectedLifecycle}
              <button onClick={() => setSelectedLifecycle(null)}>
                <X size={11} />
              </button>
            </span>
          )}
          {sortOption && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 md:border md:border-sky-200">
              Sort: {sortOption.label}
              <button onClick={() => setSortOption(null)}>
                <X size={11} />
              </button>
            </span>
          )}
          <span className="w-full text-xs text-gray-400 md:ml-auto md:w-auto">
            {contactsCount} on this page of {totalContacts} contacts
          </span>
        </div>
      )}

      {isMobile && showActionsMenu ? (
        <MobileSheet
          open={showActionsMenu}
          onClose={closeActionsMenu}
          borderless
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Contacts
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Actions
              </h2>
            </div>
          }
        >
          <div className="p-4">
            <div className="overflow-hidden rounded-[24px] bg-slate-50">
              {actionItems}
            </div>
          </div>
        </MobileSheet>
      ) : null}
    </div>
  );
}
