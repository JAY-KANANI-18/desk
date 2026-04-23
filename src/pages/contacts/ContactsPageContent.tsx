import type { ContactsPageContentProps } from "./types";
import { MobileSheet } from "../../components/topbar/MobileSheet";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ContactSidebarHybrid } from "../inbox/ContactSidebarHybrid";
import { CONTACT_SIDEBAR_WIDTH } from "../inbox/contact-sidebar/DesktopShell";
import { ContactsHeader } from "./components/ContactsHeader";
import { ContactsTable } from "./components/ContactsTable";
import { CreateContactModal } from "./components/CreateContactModal";
import { ImportContactsModal } from "./components/ImportContactsModal";

export function ContactsPageContent({
  navigate,
  contacts,
  totalContacts,
  loading,
  availableTags,
  workspaceUsers,
  stages,
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
  someSelected,
  selectedIds,
  setSelectedIds,
  handleDeleteSelected,
  allFilteredSelected,
  toggleSelectAll,
  handleColSort,
  paginatedContacts,
  toggleSelectOne,
  openEditModal,
  handleDeleteOne,
  safePage,
  totalPages,
  setCurrentPage,
  showNewContact,
  setShowNewContact,
  newContact,
  setNewContact,
  handleCreateContact,
  handleExport,
  showImportModal,
  setShowImportModal,
  handleDownloadSample,
  importParsed,
  importDragging,
  setImportDragging,
  handleDrop,
  fileInputRef,
  handleFileInputChange,
  importFileName,
  setImportParsed,
  setImportFileName,
  importFileError,
  handleConfirmImport,
  editingContact,
  setEditingContact,
  handlePersistedContact,
}: ContactsPageContentProps) {
  const isMobile = useIsMobile();
  const mobileSidebarTitle = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Contacts
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">
        Contact Details
      </h2>
    </div>
  );
  const handleCloseEditingContact = () => setEditingContact(null);
  const handleDeleteEditingContact = editingContact
    ? () => {
        const contactId = editingContact.id;
        setEditingContact(null);
        void handleDeleteOne(contactId);
      }
    : undefined;

  return (
    <div className="relative flex h-full min-h-0 bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ContactsHeader
          contactsCount={contacts.length}
          totalContacts={totalContacts}
          toast={toast}
          setToast={setToast}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showActionsMenu={showActionsMenu}
          setShowActionsMenu={setShowActionsMenu}
          selectedLifecycle={selectedLifecycle}
          setSelectedLifecycle={setSelectedLifecycle}
          sortOption={sortOption}
          setSortOption={setSortOption}
          onOpenImport={() => navigate("/contacts/import") }
          onExport={() => void handleExport()}
          onOpenImportJobs={() => navigate("/contacts/import-jobs")}
          onNewContact={() => setShowNewContact(true)}
        />

        <ContactsTable
          loading={loading}
          contacts={paginatedContacts}
          totalContacts={totalContacts}
          availableTags={availableTags}
          workspaceUsers={workspaceUsers}
          stages={stages}
          sortOption={sortOption}
          someSelected={someSelected}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          handleDeleteSelected={handleDeleteSelected}
          allFilteredSelected={allFilteredSelected}
          toggleSelectAll={toggleSelectAll}
          handleColSort={handleColSort}
          toggleSelectOne={toggleSelectOne}
          openEditModal={openEditModal}
          handleDeleteOne={handleDeleteOne}
          safePage={safePage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <div
        className="hidden min-h-0 flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out md:flex"
        style={{
          width: editingContact && !isMobile ? CONTACT_SIDEBAR_WIDTH : 0,
          opacity: editingContact && !isMobile ? 1 : 0,
        }}
      >
        {editingContact && !isMobile ? (
          <ContactSidebarHybrid
            contactDetails={editingContact}
            mode="desktop"
            workspaceUsers={workspaceUsers}
            lifecycleStages={stages}
            onDelete={handleDeleteEditingContact}
            onContactChange={(nextContact) =>
              handlePersistedContact(nextContact as any)
            }
            showAiPanel={false}
            desktopVariant="inline"
            desktopTitle="Contact details"
            desktopContainerClassName="flex h-full"
            onDesktopClose={handleCloseEditingContact}
          />
        ) : null}
      </div>

      <CreateContactModal
        open={showNewContact}
        onClose={() => setShowNewContact(false)}
        stages={stages}
        availableTags={availableTags}
        value={newContact}
        onChange={setNewContact}
        onSubmit={handleCreateContact}
      />

      <ImportContactsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onDownloadSample={handleDownloadSample}
        importParsed={importParsed}
        importDragging={importDragging}
        setImportDragging={setImportDragging}
        onDrop={handleDrop}
        fileInputRef={fileInputRef}
        onFileInputChange={handleFileInputChange}
        importFileName={importFileName}
        setImportParsed={setImportParsed}
        setImportFileName={setImportFileName}
        importFileError={importFileError}
        onConfirmImport={handleConfirmImport}
      />

      {editingContact && isMobile ? (
        <MobileSheet
          open
          onClose={handleCloseEditingContact}
          borderless
          title={mobileSidebarTitle}
        >
          <ContactSidebarHybrid
            contactDetails={editingContact}
            mode="mobile"
            workspaceUsers={workspaceUsers}
            lifecycleStages={stages}
            onDelete={handleDeleteEditingContact}
            onContactChange={(nextContact) =>
              handlePersistedContact(nextContact as any)
            }
            showAiPanel={false}
          />
        </MobileSheet>
      ) : null}

      {showActionsMenu && <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />}
    </div>
  );
}
