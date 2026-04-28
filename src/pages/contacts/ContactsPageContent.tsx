import type { ContactsPageContentProps } from "./types";
import { Plus } from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { CONTACT_SIDEBAR_WIDTH } from "../inbox/contact-sidebar/DesktopShell";
import { ContactsHeader } from "./components/ContactsHeader";
import { ContactsTable } from "./components/ContactsTable";
import { CreateContactModal } from "./components/CreateContactModal";
import { EditContactModal } from "./components/EditContactModal";
import { ImportContactsModal } from "./components/ImportContactsModal";

export function ContactsPageContent({
  showDesktopHeader = true,
  renderDesktopSidebar = true,
  navigate,
  contacts,
  totalContacts,
  loading,
  mobileLoadingMore,
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
  const handleCloseEditingContact = () => setEditingContact(null);
  const handleDeleteEditingContact = editingContact
    ? () => {
        const contactId = editingContact.id;
        setEditingContact(null);
        void handleDeleteOne(contactId);
      }
    : undefined;
  const editContactModal = (
    <EditContactModal
      contact={editingContact}
      stages={stages}
      workspaceUsers={workspaceUsers}
      onClose={handleCloseEditingContact}
      onDelete={handleDeleteEditingContact}
      onContactChange={handlePersistedContact}
      desktopVariant="inline"
      desktopTitle="Contact details"
      desktopContainerClassName="flex h-full"
    />
  );

  return (
    <div className="relative flex h-full min-h-0 bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {(showDesktopHeader || isMobile) && (
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
            onOpenImport={() => navigate("/contacts/import")}
            onExport={() => void handleExport()}
            onOpenImportJobs={() => navigate("/contacts/import-jobs")}
            onNewContact={() => setShowNewContact(true)}
          />
        )}

        <ContactsTable
          loading={loading}
          mobileLoadingMore={mobileLoadingMore}
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

      {renderDesktopSidebar ? (
        <div
          className="hidden min-h-0 flex-shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out md:flex"
          style={{
            width: editingContact && !isMobile ? CONTACT_SIDEBAR_WIDTH : 0,
            opacity: editingContact && !isMobile ? 1 : 0,
          }}
        >
          {!isMobile ? editContactModal : null}
        </div>
      ) : null}

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

      {isMobile ? editContactModal : null}

      <FloatingActionButton
        label="New contact"
        icon={<Plus size={24} />}
        onClick={() => setShowNewContact(true)}
      />

      {showActionsMenu && <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />}
    </div>
  );
}
