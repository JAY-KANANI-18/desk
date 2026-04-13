import type { ContactsPageContentProps } from "./types";
import { ContactsHeader } from "./components/ContactsHeader";
import { ContactsTable } from "./components/ContactsTable";
import { CreateContactModal } from "./components/CreateContactModal";
import { EditContactModal } from "./components/EditContactModal";
import { ImportContactsModal } from "./components/ImportContactsModal";

export function ContactsPageContent({
  navigate,
  contacts,
  totalContacts,
  loading,
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
  editForm,
  setEditForm,
  handleUpdateContact,
}: ContactsPageContentProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex min-w-0 flex-1 flex-col">
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
          onOpenImport={() => setShowImportModal(true)}
          onExport={() => void handleExport()}
          onOpenImportJobs={() => navigate("/contacts/import-jobs")}
          onNewContact={() => setShowNewContact(true)}
        />

        <ContactsTable
          loading={loading}
          contacts={paginatedContacts}
          totalContacts={totalContacts}
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

      <CreateContactModal
        open={showNewContact}
        onClose={() => setShowNewContact(false)}
        stages={stages}
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

      <EditContactModal
        contact={editingContact}
        stages={stages}
        value={editForm}
        onChange={setEditForm}
        onClose={() => setEditingContact(null)}
        onSubmit={handleUpdateContact}
      />

      {showActionsMenu && <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />}
    </div>
  );
}
