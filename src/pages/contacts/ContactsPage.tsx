import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { contactsApi } from "../../lib/contactApi";
import { workspaceApi } from "../../lib/workspaceApi";
import type { LifecycleStage } from "../workspace/types";
import { DUMMY_MODE, PAGE_SIZE, SEED_CONTACTS } from "./constants";
import { ContactsPageContent } from "./ContactsPageContent";
import { contactsToCSV, parseCSV, sampleToCSV } from "./csv";
import type {
  Contact,
  ContactFormState,
  ContactsToast,
  EditContactFormState,
  SortDir,
  SortField,
  SortOption,
} from "./types";

const emptyContactForm: ContactFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  lifecycle: "",
  tags: [],
};

const emptyEditForm: EditContactFormState = {
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  lifecycle: "",
  channel: "email",
  tags: [],
};

export function ContactsPage() {
  const navigate = useNavigate();
  const { workspaceUsers } = useWorkspace();

  const [contacts, setContacts] = useState<Contact[]>(DUMMY_MODE ? SEED_CONTACTS : []);
  const [loading, setLoading] = useState(!DUMMY_MODE);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [showNewContact, setShowNewContact] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [toast, setToast] = useState<ContactsToast | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(DUMMY_MODE ? SEED_CONTACTS.length : 0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [importDragging, setImportDragging] = useState(false);
  const [importParsed, setImportParsed] = useState<Omit<Contact, "id">[] | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<ContactFormState>(emptyContactForm);
  const [editForm, setEditForm] = useState<EditContactFormState>(emptyEditForm);

  const loadRef = useRef<() => Promise<void>>();
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLifecycle, sortOption]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lifecycleData = await workspaceApi.getLifecycleStages();
      setStages(lifecycleData);

      if (DUMMY_MODE) {
        setContacts(SEED_CONTACTS);
        setTotalContacts(SEED_CONTACTS.length);
        return;
      }

      const result = await contactsApi.getContacts({
        search: debouncedSearchQuery || undefined,
        lifecycle: selectedLifecycle ?? undefined,
        sortField: sortOption?.field,
        sortDir: sortOption?.dir,
        page: currentPage,
        limit: PAGE_SIZE,
      });

      setContacts(result.data);
      setTotalContacts(result.total);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedLifecycle, sortOption]);

  useEffect(() => {
    loadRef.current = load;
    void load();
  }, [load]);

  const allFilteredSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id));
  const someSelected = selectedIds.size > 0;
  const totalPages = Math.max(1, Math.ceil(totalContacts / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        contacts.forEach((contact) => next.delete(contact.id));
        return next;
      });
      return;
    }

    setSelectedIds((previous) => {
      const next = new Set(previous);
      contacts.forEach((contact) => next.add(contact.id));
      return next;
    });
  };

  const toggleSelectOne = (id: number | string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];

    if (DUMMY_MODE) {
      setContacts((previous) => previous.filter((contact) => !selectedIds.has(contact.id)));
      setSelectedIds(new Set());
      showToast("success", `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted.`);
      return;
    }

    try {
      await contactsApi.deleteContacts(ids as number[]);
      setSelectedIds(new Set());
      await loadRef.current?.();
      showToast("success", `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted.`);
    } catch {
      showToast("error", "Failed to delete contacts.");
    }
  };

  const handleDeleteOne = async (id: number | string) => {
    if (DUMMY_MODE) {
      setContacts((previous) => previous.filter((contact) => contact.id !== id));
      setSelectedIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
      showToast("success", "Contact deleted.");
      return;
    }

    try {
      await contactsApi.deleteContact(id as number);
      setSelectedIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
      await loadRef.current?.();
      showToast("success", "Contact deleted.");
    } catch {
      showToast("error", "Failed to delete contact.");
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({ ...contact, id: Number(contact.id), channel: contact.channel ?? "email", tags: contact.tags ?? [] });
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !editForm.firstName || !editForm.email) {
      return;
    }

    const updates: Partial<Contact> = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      lifecycleId: typeof editForm.lifecycle === "string" ? editForm.lifecycle : undefined,
      channel: editForm.channel,
    };

    if (DUMMY_MODE) {
      setContacts((previous) =>
        previous.map((contact) => (contact.id === editingContact.id ? { ...contact, ...updates } : contact)),
      );
      setEditingContact(null);
      showToast("success", "Contact updated.");
      return;
    }

    try {
      await contactsApi.updateContact(editingContact.id, updates);
      setEditingContact(null);
      await loadRef.current?.();
      showToast("success", "Contact updated.");
    } catch {
      showToast("error", "Failed to update contact.");
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.firstName || !newContact.email) {
      return;
    }

    const payload: Omit<Contact, "id"> = {
      firstName: newContact.firstName,
      lastName: newContact.lastName,
      email: newContact.email,
      phone: newContact.phone,
      lifecycleId: newContact.lifecycle,
    };

    if (DUMMY_MODE) {
      setContacts((previous) => [...previous, { ...payload, id: Date.now() }]);
      setShowNewContact(false);
      setNewContact(emptyContactForm);
      showToast("success", "Contact created.");
      return;
    }

    try {
      await contactsApi.createContact(payload);
      setShowNewContact(false);
      setNewContact(emptyContactForm);
      setCurrentPage(1);
      await loadRef.current?.();
      showToast("success", "Contact created.");
    } catch {
      showToast("error", "Failed to create contact.");
    }
  };

  const handleExport = async () => {
    let data = contacts;

    if (!DUMMY_MODE) {
      try {
        data = await contactsApi.exportContacts({ lifecycle: selectedLifecycle ?? undefined });
      } catch {
        showToast("error", "Export failed.");
        return;
      }
    }

    const csv = contactsToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSample = () => {
    const csv = sampleToCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const processFile = (file: File) => {
    setImportFileError(null);
    if (!file.name.endsWith(".csv")) {
      setImportFileError("Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportFileError("No valid contacts found in file.");
          return;
        }
        setImportParsed(parsed);
        setImportFileName(file.name);
      } catch {
        setImportFileError("Failed to parse CSV. Check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setImportDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!importParsed) {
      return;
    }

    if (DUMMY_MODE) {
      const newContacts: Contact[] = importParsed.map((contact, index) => ({ ...contact, id: Date.now() + index }));
      setContacts((previous) => [...previous, ...newContacts]);
      setShowImportModal(false);
      setImportParsed(null);
      setImportFileName(null);
      showToast("success", `${newContacts.length} contact${newContacts.length > 1 ? "s" : ""} imported.`);
      return;
    }

    try {
      const created = await contactsApi.importContacts(importParsed);
      setShowImportModal(false);
      setImportParsed(null);
      setImportFileName(null);
      setCurrentPage(1);
      await loadRef.current?.();
      showToast("success", `${created.length} contact${created.length > 1 ? "s" : ""} imported.`);
    } catch {
      showToast("error", "Import failed. Please try again.");
    }
  };

  const handleColSort = (field: SortField) => {
    const nextDir: SortDir = sortOption?.field === field && sortOption.dir === "asc" ? "desc" : "asc";
    const nextLabel = `${field.charAt(0).toUpperCase()}${field.slice(1)} ${nextDir === "asc" ? "A to Z" : "Z to A"}`;
    setSortOption({ field, dir: nextDir, label: nextLabel });
  };

  return (
    <ContactsPageContent
      navigate={navigate}
      contacts={contacts}
      totalContacts={totalContacts}
      loading={loading}
      workspaceUsers={workspaceUsers}
      stages={stages}
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
      someSelected={someSelected}
      selectedIds={selectedIds}
      setSelectedIds={setSelectedIds}
      handleDeleteSelected={handleDeleteSelected}
      allFilteredSelected={allFilteredSelected}
      toggleSelectAll={toggleSelectAll}
      handleColSort={handleColSort}
      paginatedContacts={contacts}
      toggleSelectOne={toggleSelectOne}
      openEditModal={openEditModal}
      handleDeleteOne={handleDeleteOne}
      safePage={safePage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
      showNewContact={showNewContact}
      setShowNewContact={setShowNewContact}
      newContact={newContact}
      setNewContact={setNewContact}
      handleCreateContact={handleCreateContact}
      handleExport={handleExport}
      showImportModal={showImportModal}
      setShowImportModal={setShowImportModal}
      handleDownloadSample={handleDownloadSample}
      importParsed={importParsed}
      importDragging={importDragging}
      setImportDragging={setImportDragging}
      handleDrop={handleDrop}
      fileInputRef={fileInputRef}
      handleFileInputChange={handleFileInputChange}
      importFileName={importFileName}
      setImportParsed={setImportParsed}
      setImportFileName={setImportFileName}
      importFileError={importFileError}
      handleConfirmImport={handleConfirmImport}
      editingContact={editingContact}
      setEditingContact={setEditingContact}
      editForm={editForm}
      setEditForm={setEditForm}
      handleUpdateContact={handleUpdateContact}
    />
  );
}
