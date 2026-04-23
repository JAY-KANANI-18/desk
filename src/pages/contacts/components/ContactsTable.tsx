import { ArrowUpDown, Search, Trash2, X } from "lucide-react";
import { DataLoader } from "../../Loader";
import type {
  Contact,
  ContactTagOption,
  SortField,
  SortOption,
  WorkspaceUser,
} from "../types";
import type { LifecycleStage } from "../../workspace/types";
import { ContactsPagination } from "./ContactsPagination";
import { ContactsMobileList } from "./ContactsMobileList";
import { ContactsTableRow } from "./ContactsTableRow";

interface ContactsTableProps {
  loading: boolean;
  contacts: Contact[];
  totalContacts: number;
  availableTags: ContactTagOption[];
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  sortOption: SortOption | null;
  someSelected: boolean;
  selectedIds: Set<number | string>;
  setSelectedIds: (value: Set<number | string>) => void;
  handleDeleteSelected: () => Promise<void>;
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  handleColSort: (field: SortField) => void;
  toggleSelectOne: (id: number | string) => void;
  openEditModal: (contact: Contact) => void;
  handleDeleteOne: (id: number | string) => Promise<void>;
  safePage: number;
  totalPages: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
}

const columns: Array<{ label: string; field?: SortField; align?: "left" | "center" }> = [
  { label: "Name", field: "name" },
  { label: "Channel" },
  { label: "Assignee" },
  { label: "Lifecycle", field: "lifecycle" },
  { label: "Email", field: "email" },
  { label: "Phone", field: "phone" },
  { label: "Tags" },
  { label: "Actions", align: "center" },
];

export function ContactsTable({
  loading,
  contacts,
  totalContacts,
  availableTags,
  workspaceUsers,
  stages,
  sortOption,
  someSelected,
  selectedIds,
  setSelectedIds,
  handleDeleteSelected,
  allFilteredSelected,
  toggleSelectAll,
  handleColSort,
  toggleSelectOne,
  openEditModal,
  handleDeleteOne,
  safePage,
  totalPages,
  setCurrentPage,
}: ContactsTableProps) {
  return (
    <>
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-600 px-4 py-3 text-sm text-white">
          <span className="font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleDeleteSelected}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            <Trash2 size={13} />
            Delete selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded p-1 hover:bg-indigo-500"
            title="Clear selection"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden md:overflow-x-auto">
        {loading ? (
          <DataLoader type="contacts" />
        ) : (
          <div className="min-w-0 max-w-full overflow-x-hidden">
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-sm text-gray-400">
                <Search size={28} className="text-gray-300" />
                <span className="mt-2">No contacts match your search.</span>
              </div>
            ) : (
              <>
                <ContactsMobileList
                  contacts={contacts}
                  availableTags={availableTags}
                  workspaceUsers={workspaceUsers}
                  stages={stages}
                  openEditModal={openEditModal}
                />

                <div className="hidden min-w-[800px] md:block">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 border-b border-gray-100 bg-white">
                      <tr>
                        <th className="w-8 px-3 py-2">
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded"
                            checked={allFilteredSelected}
                            ref={(element) => {
                              if (element) {
                                element.indeterminate =
                                  someSelected && !allFilteredSelected;
                              }
                            }}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        {columns.map(({ label, field, align }) => (
                          <th
                            key={label}
                            onClick={() => field && handleColSort(field)}
                            className={`whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${
                              field
                                ? "cursor-pointer select-none hover:text-gray-700"
                                : ""
                            } ${align === "center" ? "text-center" : "text-left"}`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              {field && (
                                <ArrowUpDown
                                  size={11}
                                  className={
                                    sortOption?.field === field
                                      ? "text-indigo-500"
                                      : "text-gray-300"
                                  }
                                />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {contacts.map((contact) => (
                        <ContactsTableRow
                          key={contact.id}
                          contact={contact}
                          workspaceUsers={workspaceUsers}
                          stages={stages}
                          selected={selectedIds.has(contact.id)}
                          onToggleSelect={toggleSelectOne}
                          onEdit={openEditModal}
                          onDelete={handleDeleteOne}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <ContactsPagination
              totalContacts={totalContacts}
              currentPage={safePage}
              totalPages={totalPages}
              visibleCount={contacts.length}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </div>
    </>
  );
}
