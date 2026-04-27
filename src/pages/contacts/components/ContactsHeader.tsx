import { AlertCircle, CheckCircle2, MoreVertical, Plus, Search, X } from "lucide-react";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { MobileSheet } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { useDisclosure } from "../../../hooks/useDisclosure";
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
  desktopMode?: "standalone" | "embedded";
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
  desktopMode = "standalone",
}: ContactsHeaderProps) {
  const isMobile = useIsMobile();
  const mobileSearch = useDisclosure();

  const closeActionsMenu = () => setShowActionsMenu(false);

  const actionItems = (
    <>
      <Button
        onClick={() => {
          closeActionsMenu();
          onOpenImport();
        }}
        variant="ghost"
        fullWidth
        contentAlign="start"
      >
        Import
      </Button>
      <Button
        onClick={() => {
          closeActionsMenu();
          onExport();
        }}
        variant="ghost"
        fullWidth
        contentAlign="start"
      >
        Export
      </Button>
      <Button
        onClick={() => {
          closeActionsMenu();
          onOpenImportJobs();
        }}
        variant="ghost"
        fullWidth
        contentAlign="start"
      >
        Import Process
      </Button>
    </>
  );

  useMobileHeaderActions(
    isMobile
      ? {
          actions: [
            {
              id: "contacts-search",
              label: mobileSearch.isOpen ? "Close search" : "Search contacts",
              icon: mobileSearch.isOpen ? <X size={17} /> : <Search size={17} />,
              active: mobileSearch.isOpen,
              hasIndicator: !mobileSearch.isOpen && Boolean(searchQuery),
              onClick: mobileSearch.toggle,
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
          panel: mobileSearch.isOpen ? (
            <div className="relative">
              <BaseInput
                autoFocus
                appearance="toolbar"
                type="search"
                inputMode="search"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search contacts..."
                value={searchQuery}
                leftIcon={<Search size={15} />}
                aria-label="Search contacts"
              />
              {searchQuery ? (
                <IconButton
                  icon={<X size={13} />}
                  aria-label="Clear contact search"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                  type="button"
                />
              ) : null}
            </div>
          ) : null,
        }
      : {},
    [isMobile, mobileSearch.isOpen, searchQuery, showActionsMenu],
  );

  return (
    <div
      className={
        desktopMode === "embedded"
          ? ""
          : `bg-white px-3 md:border-b md:border-gray-200 md:p-4 ${
              toast || selectedLifecycle || sortOption ? "pb-3" : ""
            }`
      }
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
          <IconButton
            className="ml-auto"
            icon={<X size={14} />}
            aria-label="Dismiss contacts toast"
            variant="ghost"
            size="sm"
            onClick={() => setToast(null)}
          />
        </div>
      )}

      <div className="hidden md:flex md:items-center md:gap-3">
        <div className="relative w-full md:w-72 lg:w-80">
          <BaseInput
            type="search"
            appearance="toolbar"
            leftIcon={<Search size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search contacts..."
            aria-label="Search contacts"
          />
          {searchQuery && (
            <IconButton
              type="button"
              icon={<X size={14} />}
              aria-label="Clear contact search"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            />
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">

          <Button
            onClick={onNewContact}
            leftIcon={<Plus size={15} />}
          >
            <span>New Contact</span>
          </Button>
          <div className="relative flex-none">
            <Button
              onClick={() => setShowActionsMenu((prev) => !prev)}
              variant="secondary"
              iconOnly
              leftIcon={<MoreVertical size={16} />}
              aria-label="Open contact actions"
            />

            {!isMobile && showActionsMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {actionItems}
              </div>
            )}
          </div>
        </div>
      </div>

      {(selectedLifecycle || sortOption) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Filters:</span>
          {selectedLifecycle && (
            <Tag
              label={selectedLifecycle}
              bgColor="primary"
              size="sm"
              onRemove={() => setSelectedLifecycle(null)}
            />
          )}
          {sortOption && (
            <Tag
              label={`Sort: ${sortOption.label}`}
              bgColor="info"
              size="sm"
              onRemove={() => setSortOption(null)}
            />
          )}
          <span className="w-full text-xs text-gray-400 md:ml-auto md:w-auto">
            {contactsCount} on this page of {totalContacts} contacts
          </span>
        </div>
      )}

      {isMobile && showActionsMenu ? (
        <MobileSheet
          isOpen={showActionsMenu}
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
