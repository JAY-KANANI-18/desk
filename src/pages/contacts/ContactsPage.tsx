import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import type {
  CreateContactPayload,
  UpdateContactPayload,
} from "../../lib/contactApi";
import { contactsApi } from "../../lib/contactApi";
import { workspaceApi } from "../../lib/workspaceApi";
import type { LifecycleStage } from "../workspace/types";
import { DUMMY_MODE, PAGE_SIZE, SEED_CONTACTS } from "./constants";
import { ContactsPageContent } from "./ContactsPageContent";
import { contactsToCSV, parseCSV, sampleToCSV } from "./csv";
import { DeleteContactsModal } from "./components/DeleteContactsModal";
import {
  buildPhoneNumber,
  DEFAULT_PHONE_COUNTRY_CODE,
  splitPhoneNumber,
} from "./phoneUtils";
import type {
  Contact,
  ContactFormState,
  ContactTagOption,
  ContactsToast,
  EditContactFormState,
  SortDir,
  SortField,
  SortOption,
} from "./types";

const createEmptyContactForm = (): ContactFormState => ({
  firstName: "",
  lastName: "",
  company: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  customPhoneCountryCode: "",
  phoneLocalNumber: "",
  email: "",
  lifecycle: "",
  assigneeId: "",
  tagIds: [],
});

const createEmptyEditForm = (): EditContactFormState => ({
  id: "",
  ...createEmptyContactForm(),
});

function normalizeTagOptions(value: unknown): ContactTagOption[] {
  if (Array.isArray(value)) {
    return value as ContactTagOption[];
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: ContactTagOption[] }).items)
  ) {
    return (value as { items: ContactTagOption[] }).items;
  }

  return [];
}

function mapTagIdsToNames(
  tagIds: string[],
  availableTags: ContactTagOption[],
) {
  const tagNameById = new Map(availableTags.map((tag) => [tag.id, tag.name]));
  return tagIds
    .map((tagId) => tagNameById.get(tagId))
    .filter((tagName): tagName is string => Boolean(tagName));
}

function buildFormFromContact(contact: Contact): EditContactFormState {
  const parsedPhone = splitPhoneNumber(contact.phone);

  return {
    id: contact.id,
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    company: contact.company ?? "",
    phoneCountryCode: parsedPhone.phoneCountryCode,
    customPhoneCountryCode: parsedPhone.customPhoneCountryCode,
    phoneLocalNumber: parsedPhone.phoneLocalNumber,
    email: contact.email ?? "",
    lifecycle: contact.lifecycleId ? String(contact.lifecycleId) : "",
    assigneeId: contact.assigneeId ?? "",
    tagIds: contact.tagIds ?? [],
  };
}

function buildContactPayload(
  form: ContactFormState,
): CreateContactPayload | UpdateContactPayload {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const company = form.company.trim();
  const email = form.email.trim();
  const phone = buildPhoneNumber(
    form.phoneCountryCode,
    form.customPhoneCountryCode,
    form.phoneLocalNumber,
  );

  return {
    firstName,
    lastName: lastName || undefined,
    company: company || undefined,
    email: email || undefined,
    phone: phone || undefined,
  };
}

function normalizeComparableText(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeComparableEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getContactDisplayName(contact?: Contact | null) {
  const name = [contact?.firstName, contact?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "this contact";
}

interface PendingDeleteState {
  ids: Array<number | string>;
  contactName?: string;
}

export function ContactsPage() {
  const navigate = useNavigate();
  const { workspaceUsers } = useWorkspace();
  const isMobile = useIsMobile();

  const [contacts, setContacts] = useState<Contact[]>(
    DUMMY_MODE ? SEED_CONTACTS : [],
  );
  const [loading, setLoading] = useState(!DUMMY_MODE);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(
    new Set(),
  );
  const [showNewContact, setShowNewContact] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(
    null,
  );
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [toast, setToast] = useState<ContactsToast | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(
    DUMMY_MODE ? SEED_CONTACTS.length : 0,
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [availableTags, setAvailableTags] = useState<ContactTagOption[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [importDragging, setImportDragging] = useState(false);
  const [importParsed, setImportParsed] = useState<Omit<Contact, "id">[] | null>(
    null,
  );
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<ContactFormState>(
    createEmptyContactForm(),
  );
  const [editForm, setEditForm] = useState<EditContactFormState>(
    createEmptyEditForm(),
  );
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (!editingContact) {
      setEditForm(createEmptyEditForm());
    }
  }, [editingContact]);

  const load = useCallback(async () => {
    const append = isMobile && currentPage > 1;
    if (append) {
      setMobileLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const [lifecycleResult, tagsResult] = await Promise.allSettled([
        workspaceApi.getLifecycleStages(),
        workspaceApi.getTags(),
      ]);

      if (lifecycleResult.status === "fulfilled") {
        setStages(lifecycleResult.value);
      }

      if (tagsResult.status === "fulfilled") {
        setAvailableTags(normalizeTagOptions(tagsResult.value));
      } else {
        setAvailableTags([]);
      }

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

      setContacts((current) => {
        if (!append) return result.data;
        const seen = new Set(current.map((contact) => String(contact.id)));
        return [
          ...current,
          ...result.data.filter((contact) => !seen.has(String(contact.id))),
        ];
      });
      setTotalContacts(result.total);
    } finally {
      if (append) {
        setMobileLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [currentPage, debouncedSearchQuery, isMobile, selectedLifecycle, sortOption]);

  useEffect(() => {
    loadRef.current = load;
    void load();
  }, [load]);

  const allFilteredSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id));
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
    if (ids.length === 0) {
      return;
    }

    setPendingDelete({ ids });
  };

  const handleDeleteOne = async (id: number | string) => {
    const contact =
      contacts.find((item) => item.id === id) ??
      (editingContact?.id === id ? editingContact : null);

    setPendingDelete({
      ids: [id],
      contactName: getContactDisplayName(contact),
    });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    const ids = pendingDelete.ids;
    setDeleting(true);

    if (DUMMY_MODE) {
      setContacts((previous) =>
        previous.filter((contact) => !ids.includes(contact.id)),
      );
      setSelectedIds((previous) => {
        const next = new Set(previous);
        ids.forEach((contactId) => next.delete(contactId));
        return next;
      });
      if (editingContact && ids.includes(editingContact.id)) {
        setEditingContact(null);
      }
      setPendingDelete(null);
      setDeleting(false);
      showToast(
        "success",
        `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted.`,
      );
      return;
    }

    try {
      const results = await Promise.allSettled(
        ids.map((contactId) => contactsApi.deleteContact(contactId)),
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      const failureCount = results.length - successCount;

      setSelectedIds((previous) => {
        const next = new Set(previous);
        ids.forEach((contactId) => next.delete(contactId));
        return next;
      });
      if (editingContact && ids.includes(editingContact.id)) {
        setEditingContact(null);
      }
      await loadRef.current?.();

      if (failureCount === 0) {
        showToast(
          "success",
          `${successCount} contact${successCount > 1 ? "s" : ""} deleted.`,
        );
      } else if (successCount > 0) {
        showToast(
          "error",
          `${successCount} contact${successCount > 1 ? "s were" : " was"} deleted, but ${failureCount} failed.`,
        );
      } else {
        showToast(
          "error",
          ids.length > 1 ? "Failed to delete contacts." : "Failed to delete contact.",
        );
      }
    } catch {
      showToast(
        "error",
        ids.length > 1 ? "Failed to delete contacts." : "Failed to delete contact.",
      );
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm(buildFormFromContact(contact));
  };

  const syncEditingContact = async (contactId: number | string) => {
    if (DUMMY_MODE) {
      const contact = contacts.find((item) => item.id === contactId);
      if (contact) {
        setEditingContact(contact);
        setEditForm(buildFormFromContact(contact));
      }
      return;
    }

    try {
      const refreshed = await contactsApi.getContact(contactId);
      setEditingContact(refreshed);
      setEditForm(buildFormFromContact(refreshed));
    } catch {
      setEditingContact(null);
    }
  };

  const handlePersistedContact = useCallback(
    async (nextContact: Contact) => {
      setEditingContact(nextContact);

      if (DUMMY_MODE) {
        setContacts((previous) =>
          previous.map((contact) =>
            contact.id === nextContact.id ? { ...contact, ...nextContact } : contact,
          ),
        );
        return;
      }

      await loadRef.current?.();
    },
    [],
  );

  const handleUpdateContact = async () => {
    if (!editingContact || !editForm.firstName.trim()) {
      return;
    }

    const payload = buildContactPayload(editForm) as UpdateContactPayload;
    const nextLifecycleId = editForm.lifecycle || null;
    const nextAssigneeId = editForm.assigneeId || null;
    const existingTagIds = editingContact.tagIds ?? [];
    const nextTagIds = editForm.tagIds;
    const addedTagIds = nextTagIds.filter(
      (tagId) => !existingTagIds.includes(tagId),
    );
    const removedTagIds = existingTagIds.filter(
      (tagId) => !nextTagIds.includes(tagId),
    );

    const requiresBasicUpdate =
      normalizeComparableText(editingContact.firstName) !==
        normalizeComparableText(payload.firstName) ||
      normalizeComparableText(editingContact.lastName) !==
        normalizeComparableText(payload.lastName) ||
      normalizeComparableText(editingContact.company) !==
        normalizeComparableText(payload.company) ||
      normalizeComparableEmail(editingContact.email) !==
        normalizeComparableEmail(payload.email) ||
      normalizeComparableText(editingContact.phone) !==
        normalizeComparableText(payload.phone);

    const lifecycleChanged =
      String(editingContact.lifecycleId ?? "") !== String(nextLifecycleId ?? "");
    const assigneeChanged =
      String(editingContact.assigneeId ?? "") !== String(nextAssigneeId ?? "");

    if (DUMMY_MODE) {
      const tagNames = mapTagIdsToNames(nextTagIds, availableTags);
      const assignee =
        workspaceUsers?.find((user) => user.id === nextAssigneeId) ?? null;

      setContacts((previous) =>
        previous.map((contact) =>
          contact.id === editingContact.id
            ? {
                ...contact,
                ...payload,
                lifecycleId: nextLifecycleId ?? undefined,
                assigneeId: nextAssigneeId ?? undefined,
                assignee:
                  assignee && nextAssigneeId
                    ? {
                        id: assignee.id,
                        firstName: assignee.firstName,
                        lastName: assignee.lastName,
                        avatarUrl: assignee.avatarUrl,
                        email: assignee.email,
                      }
                    : null,
                tags: tagNames,
                tagIds: [...nextTagIds],
              }
            : contact,
        ),
      );
      setEditingContact(null);
      showToast("success", "Contact updated.");
      return;
    }

    try {
      if (requiresBasicUpdate) {
        await contactsApi.updateContact(editingContact.id, payload);
      }

      if (lifecycleChanged) {
        await contactsApi.updateContactLifecycle(editingContact.id, nextLifecycleId);
      }

      if (assigneeChanged) {
        await contactsApi.assignContact(editingContact.id, {
          assigneeId: nextAssigneeId,
        });
      }

      if (addedTagIds.length > 0 || removedTagIds.length > 0) {
        await Promise.all([
          ...addedTagIds.map((tagId) =>
            contactsApi.addTagToContact(editingContact.id, tagId),
          ),
          ...removedTagIds.map((tagId) =>
            contactsApi.removeTagFromContact(editingContact.id, tagId),
          ),
        ]);
      }

      setEditingContact(null);
      await loadRef.current?.();
      showToast("success", "Contact updated.");
    } catch {
      await syncEditingContact(editingContact.id);
      await loadRef.current?.();
      showToast("error", "Some contact changes could not be saved.");
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.firstName.trim()) {
      return;
    }

    const payload = buildContactPayload(newContact) as CreateContactPayload;
    const lifecycleId = newContact.lifecycle || "";

    if (lifecycleId) {
      payload.lifecycleId = lifecycleId;
    }

    if (DUMMY_MODE) {
      const tagNames = mapTagIdsToNames(newContact.tagIds, availableTags);

      setContacts((previous) => [
        ...previous,
        {
          id: Date.now(),
          ...payload,
          lifecycleId: lifecycleId || undefined,
          tags: tagNames,
          tagIds: [...newContact.tagIds],
        },
      ]);
      setShowNewContact(false);
      setNewContact(createEmptyContactForm());
      showToast("success", "Contact created.");
      return;
    }

    try {
      const created = await contactsApi.createContact(payload);
      let tagsSaveFailed = false;

      if (newContact.tagIds.length > 0) {
        try {
          await Promise.all(
            newContact.tagIds.map((tagId) =>
              contactsApi.addTagToContact(created.id, tagId),
            ),
          );
        } catch {
          tagsSaveFailed = true;
        }
      }

      setShowNewContact(false);
      setNewContact(createEmptyContactForm());
      setCurrentPage(1);
      await loadRef.current?.();
      showToast(
        tagsSaveFailed ? "error" : "success",
        tagsSaveFailed
          ? "Contact created, but some tags could not be saved."
          : "Contact created.",
      );
    } catch {
      showToast("error", "Failed to create contact.");
    }
  };

  const handleExport = async () => {
    let data = contacts;

    if (!DUMMY_MODE) {
      try {
        data = await contactsApi.exportContacts({
          lifecycle: selectedLifecycle ?? undefined,
        });
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
      const newContacts: Contact[] = importParsed.map((contact, index) => ({
        ...contact,
        id: Date.now() + index,
      }));
      setContacts((previous) => [...previous, ...newContacts]);
      setShowImportModal(false);
      setImportParsed(null);
      setImportFileName(null);
      showToast(
        "success",
        `${newContacts.length} contact${newContacts.length > 1 ? "s" : ""} imported.`,
      );
      return;
    }

    try {
      const created = await contactsApi.importContacts(importParsed);
      setShowImportModal(false);
      setImportParsed(null);
      setImportFileName(null);
      setCurrentPage(1);
      await loadRef.current?.();
      showToast(
        "success",
        `${created.length} contact${created.length > 1 ? "s" : ""} imported.`,
      );
    } catch {
      showToast("error", "Import failed. Please try again.");
    }
  };

  const handleColSort = (field: SortField) => {
    const nextDir: SortDir =
      sortOption?.field === field && sortOption.dir === "asc" ? "desc" : "asc";
    const nextLabel = `${field.charAt(0).toUpperCase()}${field.slice(1)} ${
      nextDir === "asc" ? "A to Z" : "Z to A"
    }`;
    setSortOption({ field, dir: nextDir, label: nextLabel });
  };

  return (
    <>
      <ContactsPageContent
        navigate={navigate}
        contacts={contacts}
        totalContacts={totalContacts}
        loading={loading}
        mobileLoadingMore={mobileLoadingMore}
        availableTags={availableTags}
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
        handlePersistedContact={handlePersistedContact}
      />

      <DeleteContactsModal
        open={!!pendingDelete}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
        count={pendingDelete?.ids.length ?? 0}
        contactName={pendingDelete?.contactName}
      />
    </>
  );
}
