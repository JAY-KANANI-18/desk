import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  ArrowUpDown,
  Check,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Pencil,
  UserPlus,
  UserPlus2,
  Loader2,
} from "lucide-react";
import { contactsApi } from "../lib/contactApi";
import { DataLoader } from "./Loader";
import { workspaceApi } from "../lib/workspaceApi";
import { useWorkspace } from "../context/WorkspaceContext";
import { LifecycleStage } from "./workspace/types";
import { CHANNEL_META } from "./channels/ManageChannelPage";
import { Tooltip } from "../components/ui/Tooltip";
import { channelConfig } from "./inbox/data";

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY MODE
// Set to `false` when your real API is ready.
// Every action below will automatically call the API layer instead.
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_MODE = false;

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// Replace fetch() stubs with your actual API client (axios, react-query, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Contact {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lifecycle?: string;
  lifecycleId?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  };
  avatarUrl?: string;
  contactChannels?: Array<{
    channelType?: string;
    channelId?: string | number;
  }>;
  channel?: string;
  tags?: string[];
}
// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const lifecycleStages = [
  { name: "New Lead", color: "bg-indigo-500", count: 1 },
  { name: "Hot Lead", color: "bg-orange-500", count: 1 },
  { name: "Payment", color: "bg-green-500", count: 0 },
  { name: "Customer", color: "bg-purple-500", count: 0 },
  { label: "Phone A â†’ Z", field: "phone", dir: "asc" },
  { label: "Phone Z â†’ A", field: "phone", dir: "desc" },
];

const lostStages = [{ name: "Cold Lead", color: "bg-gray-500", count: 0 }];

const segments = [
  "Contacts created <7 days",
  "Contacts inactive >3 months",
  "Contacts with tags",
  "Country known",
  "Language known",
];

type SortField = "name" | "email" | "lifecycle" | "phone";
type SortDir = "asc" | "desc";

const MAX_VISIBLE_CHANNELS = 3;
const MAX_VISIBLE_TAGS = 3;

const SORT_OPTIONS: { label: string; field: SortField; dir: SortDir }[] = [
  { label: "Name A → Z", field: "name", dir: "asc" },
  { label: "Name Z → A", field: "name", dir: "desc" },
  { label: "Email A → Z", field: "email", dir: "asc" },
  { label: "Email Z → A", field: "email", dir: "desc" },
  { label: "Lifecycle A → Z", field: "lifecycle", dir: "asc" },
  { label: "Lifecycle Z → A", field: "lifecycle", dir: "desc" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Lifecycle",
  "Channel",
  "Tags",
];

const SAMPLE_CSV_ROWS: Omit<Contact, "id">[] = [
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phone: "+1 555-0101",
    lifecycle: "New Lead",
    channel: "email",
    tags: ["VIP"],
  },
  {
    firstName: "Rahul",
    lastName: "Sharma",
    email: "rahul@example.com",
    phone: "+91 9876543210",
    lifecycle: "Hot Lead",
    channel: "whatsapp",
    tags: ["Follow-up"],
  },
  {
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria@example.com",
    phone: "+34 612345678",
    lifecycle: "Customer",
    channel: "instagram",
    tags: [],
  },
];

function contactsToCSV(contacts: Contact[]): string {
  const rows = contacts.map((c) =>
    [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.lifecycle,
      c.channel,
      // c.tags.join(";"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

function sampleToCSV(): string {
  const rows = SAMPLE_CSV_ROWS.map((c) =>
    [
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.lifecycle,
      c.channel,
      // c.tags.join(";"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

function parseCSV(text: string): Omit<Contact, "id">[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const cols = line
      .split(",")
      .map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    return {
      firstName: cols[0] || "",
      lastName: cols[1] || "",
      email: cols[2] || "",
      phone: cols[3] || "",
      lifecycle: cols[4] || "New Lead",
      channel: cols[5] || "email",
      tags: cols[6] ? cols[6].split(";").filter(Boolean) : [],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const SEED_CONTACTS: Contact[] = [
  {
    id: 1,
    firstName: "JAY",
    lastName: "KANANI",
    email: "98789489489@gmail.com",
    phone: "+91 9878948948",
    lifecycle: "Hot Lead",
    channel: "whatsapp",
    tags: ["VIP"],
  },
  {
    id: 2,
    firstName: "Jay",
    lastName: "kanani",
    email: "N/A",
    phone: "+91 9878948948",
    lifecycle: "New Lead",
    channel: "instagram",
    tags: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const Contacts = () => {
  const { workspaceUsers } = useWorkspace();
  const [contacts, setContacts] = useState<Contact[]>(
    DUMMY_MODE ? SEED_CONTACTS : [],
  );
  const [loading, setLoading] = useState(!DUMMY_MODE);

  // ── Bootstrap (API mode) ──────────────────────────────────────────────────
  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [showNewContact, setShowNewContact] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(
    null,
  );
  const [lifecycleExpanded, setLifecycleExpanded] = useState(true);
  const [segmentsExpanded, setSegmentsExpanded] = useState(true);
  const [sortOption, setSortOption] = useState<
    (typeof SORT_OPTIONS)[number] | null
  >(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(
    DUMMY_MODE ? SEED_CONTACTS.length : 0,
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [stages, setStages] = useState<
    { name: string; color: string; count: number }[]
  >([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState<
    Omit<Contact, "id"> & { id: number }
  >({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    lifecycle: "",
    channel: "email",
    tags: [],
  });

  const loadRef = useRef<() => Promise<void>>();
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: LifecycleStage[] = await workspaceApi.getLifecycleStages();
      setStages(data);
      if (DUMMY_MODE) {
        setContacts(SEED_CONTACTS);
        setTotalContacts(SEED_CONTACTS.length);
      } else {
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
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, selectedLifecycle, sortOption]);

  loadRef.current = load;

  useEffect(() => {
    load();
  }, [load]);

  // Import modal state
  const [importDragging, setImportDragging] = useState(false);
  const [importParsed, setImportParsed] = useState<
    Omit<Contact, "id">[] | null
  >(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    lifecycle: "",
    tags: [] as string[],
  });

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Reset page when filters change ───────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLifecycle, sortOption]);

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filteredContacts = contacts;
  // (() => {
  //   let list = contacts.filter((c) => {
  //     const q = searchQuery.toLowerCase();
  //     const matchesSearch =
  //       c.firstName.toLowerCase().includes(q) ||
  //       c.lastName.toLowerCase().includes(q) ||
  //       c.email.toLowerCase().includes(q) ||
  //       c.phone.toLowerCase().includes(q);
  //     const matchesLifecycle =
  //       !selectedLifecycle || c.lifecycle === selectedLifecycle;
  //     return matchesSearch && matchesLifecycle;
  //   });

  //   if (sortOption) {
  //     list = [...list].sort((a, b) => {
  //       let aVal = "",
  //         bVal = "";
  //       if (sortOption.field === "name") {
  //         aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
  //         bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
  //       } else if (sortOption.field === "email") {
  //         aVal = a.email.toLowerCase();
  //         bVal = b.email.toLowerCase();
  //       } else if (sortOption.field === "lifecycle") {
  //         aVal = a.lifecycle.toLowerCase();
  //         bVal = b.lifecycle.toLowerCase();
  //       } else if (sortOption.field === "phone") {
  //         aVal = a.phone.toLowerCase();
  //         bVal = b.phone.toLowerCase();
  //       }
  //       return sortOption.dir === "asc"
  //         ? aVal.localeCompare(bVal)
  //         : bVal.localeCompare(aVal);
  //     });
  //   }
  //   return list;
  // })();

  console.log({ filteredContacts });

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(totalContacts / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedContacts = filteredContacts;
  console.log({ paginatedContacts });

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        filteredContacts.forEach((c) => n.delete(c.id));
        return n;
      });
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        filteredContacts.forEach((c) => n.add(c.id));
        return n;
      });
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── CRUD actions ──────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    if (DUMMY_MODE) {
      setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      showToast(
        "success",
        `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted.`,
      );
    } else {
      try {
        await contactsApi.deleteContacts(ids);
        setSelectedIds(new Set());
        await loadRef.current?.();
        showToast(
          "success",
          `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted.`,
        );
      } catch {
        showToast("error", "Failed to delete contacts.");
      }
    }
  };

  const handleDeleteOne = async (id: number) => {
    if (DUMMY_MODE) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("success", "Contact deleted.");
    } else {
      try {
        await contactsApi.deleteContact(id);
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        await loadRef.current?.();
        showToast("success", "Contact deleted.");
      } catch {
        showToast("error", "Failed to delete contact.");
      }
    }
  };

  // ── Edit contact ──────────────────────────────────────────────────────────
  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({ ...contact });
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !editForm.firstName || !editForm.email) return;
    const updates: Partial<Contact> = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      lifecycleId: editForm.lifecycle,
      // lifecycle: editForm.lifecycle || "New Lead",
      // channel: editForm.channel,
      // tags: editForm?.tags,
    };

    if (DUMMY_MODE) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id ? { ...c, ...updates } : c,
        ),
      );
      setEditingContact(null);
      showToast("success", "Contact updated.");
    } else {
      try {
        await contactsApi.updateContact(
          editingContact.id,
          updates,
        );
        setEditingContact(null);
        await loadRef.current?.();
        showToast("success", "Contact updated.");
      } catch {
        showToast("error", "Failed to update contact.");
      }
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.firstName || !newContact.email) return;
    const payload: Omit<Contact, "id"> = {
      firstName: newContact.firstName,
      lastName: newContact.lastName,
      email: newContact.email,
      phone: newContact.phone,
      lifecycleId: newContact.lifecycle,
      // channel: "email",
      // tags: newContact.tags,
    };

    if (DUMMY_MODE) {
      setContacts((prev) => [...prev, { ...payload, id: Date.now() }]);
      setShowNewContact(false);
      setNewContact({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        lifecycle: "",
        tags: [],
      });
      showToast("success", "Contact created.");
    } else {
      try {
        await contactsApi.createContact(payload);
        setShowNewContact(false);
        setNewContact({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          lifecycle: "",
          tags: [],
        });
        console.log("succes contact create");
        setCurrentPage(1);
        await loadRef.current?.();
        showToast("success", "Contact created.");
      } catch {
        showToast("error", "Failed to create contact.");
      }
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    let data = filteredContacts;
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
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import modal helpers ──────────────────────────────────────────────────
  const openImportModal = () => {
    setImportParsed(null);
    setImportFileName(null);
    setImportFileError(null);
    setShowImportModal(true);
  };

  const handleDownloadSample = () => {
    const csv = sampleToCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = (file: File) => {
    setImportFileError(null);
    if (!file.name.endsWith(".csv")) {
      setImportFileError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = async () => {
    if (!importParsed) return;
    if (DUMMY_MODE) {
      const newContacts: Contact[] = importParsed.map((c, i) => ({
        ...c,
        id: Date.now() + i,
      }));
      setContacts((prev) => [...prev, ...newContacts]);
      setShowImportModal(false);
      showToast(
        "success",
        `${newContacts.length} contact${newContacts.length > 1 ? "s" : ""} imported.`,
      );
    } else {
      try {
        const created = await contactsApi.importContacts(importParsed);
        setShowImportModal(false);
        setCurrentPage(1);
        await loadRef.current?.();
        showToast(
          "success",
          `${created.length} contact${created.length > 1 ? "s" : ""} imported.`,
        );
      } catch {
        showToast("error", "Import failed. Please try again.");
      }
    }
  };

  // ── Column sort click helper ──────────────────────────────────────────────
  const handleColSort = (field: SortField) => {
    const nextDir: SortDir =
      sortOption?.field === field && sortOption.dir === "asc" ? "desc" : "asc";
    const nextLabel = `${field.charAt(0).toUpperCase()}${field.slice(1)} ${
      nextDir === "asc" ? "A â†’ Z" : "Z â†’ A"
    }`;
    setSortOption({ field, dir: nextDir, label: nextLabel });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-white flex-col md:flex-row">
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      {/* <div className="hidden md:flex w-full md:w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Contacts</h2>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg">
            <Search size={16} />
            <span>All</span>
            <span className="ml-auto text-gray-500">{contacts.length}</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg mt-2">
            <span className="text-xs">🤖</span>
            <span>Create AI Agent</span>
            <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
              Beta
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <button
              onClick={() => setLifecycleExpanded(!lifecycleExpanded)}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="text-xs font-semibold text-gray-600">
                Lifecycle
              </span>
              {lifecycleExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {lifecycleExpanded && (
              <>
                <div className="text-xs text-gray-500 mb-2">
                  Lifecycle Stages
                </div>
                {lifecycleStages.map((stage) => (
                  <button
                    key={stage.name}
                    onClick={() =>
                      setSelectedLifecycle(
                        selectedLifecycle === stage.name ? null : stage.name
                      )
                    }
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg mb-1 ${selectedLifecycle === stage.name ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <div className={`w-3 h-3 ${stage.color} rounded-sm`} />
                    <span>{stage.name}</span>
                    {stage.count > 0 && (
                      <span className="ml-auto text-gray-500">
                        {stage.count}
                      </span>
                    )}
                  </button>
                ))}
                <div className="text-xs text-gray-500 mt-4 mb-2">
                  Lost Stages
                </div>
                {lostStages.map((stage) => (
                  <button
                    key={stage.name}
                    onClick={() =>
                      setSelectedLifecycle(
                        selectedLifecycle === stage.name ? null : stage.name
                      )
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg mb-1"
                  >
                    <div className={`w-3 h-3 ${stage.color} rounded-sm`} />
                    <span>{stage.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>

          <div>
            <button
              onClick={() => setSegmentsExpanded(!segmentsExpanded)}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="text-xs font-semibold text-gray-600">
                Segments
              </span>
              {segmentsExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {segmentsExpanded && (
              <>
                {segments.map((segment) => (
                  <button
                    key={segment}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg mb-1"
                  >
                    {segment}
                    {segment === "Contacts created <7 days" && (
                      <span className="ml-2 text-gray-500">
                        {contacts.length}
                      </span>
                    )}
                  </button>
                ))}
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg mt-2">
                  Blocked Contacts
                </button>
              </>
            )}
          </div>
        </div>
      </div> */}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-3 md:p-4">
          {/* Toast */}
          {toast && (
            <div
              className={`mb-3 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              {toast.msg}
              <button className="ml-auto" onClick={() => setToast(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search contacts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${sortOption ? "border-indigo-500 text-indigo-600 bg-indigo-50" : "border-gray-300 text-gray-700"}`}
              >
                <ArrowUpDown size={15} />
                <span>{sortOption ? sortOption.label : "Sort"}</span>
                <ChevronDown size={14} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {sortOption && (
                    <button
                      onClick={() => {
                        setSortOption(null);
                        setShowSortMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 border-b border-gray-100"
                    >
                      Clear sort
                    </button>
                  )}
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setSortOption(opt);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${sortOption?.label === opt.label ? "text-indigo-600 font-medium" : "text-gray-700"}`}
                    >
                      {opt.label}
                      {sortOption?.label === opt.label && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              onClick={openImportModal}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload size={15} />
              <span>Import</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowNewContact(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={15} />
              <span>New Contact</span>
            </button>
          </div>

          {/* Active filters row */}
          {(selectedLifecycle || sortOption) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">Filters:</span>
              {selectedLifecycle && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                  {selectedLifecycle}
                  <button onClick={() => setSelectedLifecycle(null)}>
                    <X size={11} />
                  </button>
                </span>
              )}
              {sortOption && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                  Sort: {sortOption.label}
                  <button onClick={() => setSortOption(null)}>
                    <X size={11} />
                  </button>
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {contacts.length} on this page of {totalContacts} contacts
              </span>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-3 text-sm">
            <span className="font-medium">{selectedIds.size} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-white text-xs font-medium"
            >
              <Trash2 size={13} />
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 hover:bg-indigo-500 rounded"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <DataLoader type={"contacts"} />
          ) : (
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead className="border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {/* Checkbox */}
                    <th className="text-left px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate =
                              someSelected && !allFilteredSelected;
                        }}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {/* Name */}
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800"
                      onClick={() => handleColSort("name")}
                    >
                      <span className="flex items-center gap-1">
                        Name
                        <ArrowUpDown
                          size={12}
                          className={
                            sortOption?.field === "name"
                              ? "text-indigo-500"
                              : "text-gray-400"
                          }
                        />
                      </span>
                    </th>
                    {/* Channel */}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">
                      Channel
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">
                      Assignee
                    </th>
                    {/* Lifecycle */}
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 w-36"
                      onClick={() => handleColSort("lifecycle")}
                    >
                      <span className="flex items-center gap-1">
                        Lifecycle
                        <ArrowUpDown
                          size={12}
                          className={
                            sortOption?.field === "lifecycle"
                              ? "text-indigo-500"
                              : "text-gray-400"
                          }
                        />
                      </span>
                    </th>
                    {/* Email */}
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800"
                      onClick={() => handleColSort("email")}
                    >
                      <span className="flex items-center gap-1">
                        Email
                        <ArrowUpDown
                          size={12}
                          className={
                            sortOption?.field === "email"
                              ? "text-indigo-500"
                              : "text-gray-400"
                          }
                        />
                      </span>
                    </th>
                    {/* Phone */}
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 w-40"
                      onClick={() => handleColSort("phone")}
                    >
                      <span className="flex items-center gap-1">
                        Phone
                        <ArrowUpDown
                          size={12}
                          className={
                            sortOption?.field === "phone"
                              ? "text-indigo-500"
                              : "text-gray-400"
                          }
                        />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-52">
                      Tags
                    </th>
                    {/* Actions */}
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-16 text-center text-gray-400 text-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-gray-300" />
                          <span>No contacts match your search.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((contact) => {
                      const stage = stages.find(
                        (s) => s.id === contact.lifecycleId,
                      );
                      const workspaceAssignee =
                        workspaceUsers?.find((user) => user.id === contact.assigneeId) ?? null;
                      const assigneeName = workspaceAssignee
                        ? `${workspaceAssignee.firstName} ${workspaceAssignee.lastName ?? ""}`.trim()
                        : contact.assignee
                          ? `${contact.assignee.firstName} ${contact.assignee.lastName ?? ""}`.trim()
                          : "";

                      return (
                        <tr
                          key={contact.id}
                          className={`group hover:bg-gray-50 transition-colors ${selectedIds.has(contact.id) ? "bg-indigo-50" : ""}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="rounded cursor-pointer"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleSelectOne(contact.id)}
                            />
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center
                    text-sm font-semibold bg-gray-200`}
                              >
                                {contact?.avatarUrl ? (
                                  <img
                                    src={contact.avatarUrl}
                                    alt={contact.firstName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>
                                    {contact?.firstName
                                      ?.charAt(0)
                                      ?.toUpperCase() ?? "?"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {contact.firstName} {contact.lastName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Channel */}
                          <td className="px-4 py-3">
                            {contact.contactChannels?.length ? (
                              <div className="flex h-9 items-center gap-2 overflow-hidden">
                                {contact.contactChannels.slice(0, MAX_VISIBLE_CHANNELS).map(
                                  (channel, index) => {
                                    const icon =
                                      channelConfig[channel?.channelType]?.icon;

                                    return (
                                      <Tooltip
                                        key={`${channel?.channelType}-${index}`}
                                        content={channel?.channelType + " : " + channel?.channelId}
                                        side="top"
                                      >
                                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent">
                                          {icon ? (
                                            <img
                                              src={icon}
                                              alt={channel?.channelType}
                                              className="h-4 w-4 object-contain"
                                            />
                                          ) : null}
                                        </div>
                                      </Tooltip>
                                    );
                                  },
                                )}
                                {contact.contactChannels.length > MAX_VISIBLE_CHANNELS && (
                                  <Tooltip
                                    content={contact.contactChannels
                                      .slice(MAX_VISIBLE_CHANNELS)
                                      .map((channel) => channel.channelType ?? "channel")
                                      .join(", ")}
                                    side="top"
                                  >
                                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-medium text-gray-600">
                                      +{contact.contactChannels.length - MAX_VISIBLE_CHANNELS}
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>

                          {/* Assignee */}
                          <td className="px-4 py-3">
                            {assigneeName ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                {assigneeName}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>

                          {/* Lifecycle */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium">
                              {stage ? stage.emoji + stage.name : "—"}
                            </span>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {contact.email ? contact.email : "—"}{" "}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {contact.phone ? contact.phone : "—"}
                            </span>
                          </td>

                          {/* Tags */}
                          <td className="px-4 py-3">
                            {contact?.tags?.length ? (
                              <div className="flex h-9 items-center gap-1 overflow-hidden">
                                {contact.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                                  <Tooltip key={tag} content={tag} side="top">
                                    <span className="max-w-[88px] truncate rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                      {tag}
                                    </span>
                                  </Tooltip>
                                ))}
                                {contact.tags.length > MAX_VISIBLE_TAGS && (
                                  <Tooltip
                                    content={contact.tags.slice(MAX_VISIBLE_TAGS).join(", ")}
                                    side="top"
                                  >
                                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-medium text-gray-600">
                                      +{contact.tags.length - MAX_VISIBLE_TAGS}
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(contact)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit contact"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteOne(contact.id)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete contact"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination footer */}
              {totalContacts > PAGE_SIZE && (
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between text-sm sticky bottom-0">
                  <span className="text-gray-500 text-xs">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min((safePage - 1) * PAGE_SIZE + paginatedContacts.length, totalContacts)} of{" "}
                    {totalContacts} contacts
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - safePage) <= 1,
                      )
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (
                          idx > 0 &&
                          (p as number) - (arr[idx - 1] as number) > 1
                        )
                          acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="px-2 text-gray-400 text-xs"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            className={`w-8 h-8 text-xs rounded-lg border transition-colors ${safePage === p ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={safePage === totalPages}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── New Contact Modal ─────────────────────────────────────────────── */}
      {showNewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8  rounded-full flex items-center justify-center">
                  <UserPlus2 size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">New Contact</h2>
              </div>
              <button
                onClick={() => setShowNewContact(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Add First Name"
                  value={newContact.firstName}
                  onChange={(e) =>
                    setNewContact({ ...newContact, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Add Last Name"
                  value={newContact.lastName}
                  onChange={(e) =>
                    setNewContact({ ...newContact, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>IN +91</option>
                    <option>US +1</option>
                    <option>UK +44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="+91"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Add Email Address"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lifecycle
                </label>
                <select
                  value={newContact.lifecycle}
                  onChange={(e) =>
                    setNewContact({ ...newContact, lifecycle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select Lifecycle</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.emoji}
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewContact(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContact}
                disabled={!newContact.firstName || !newContact.email}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ──────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Upload size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Import Contacts
                  </h2>
                  <p className="text-xs text-gray-500">
                    Upload a CSV file to bulk-import contacts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Sample format section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={15} className="text-gray-400" />
                    Required CSV Format
                  </h3>
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Download size={13} />
                    Download Sample CSV
                  </button>
                </div>

                {/* Column headers */}
                <div className="rounded-lg border border-gray-200 overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white border">
                        <tr>
                          {CSV_HEADERS.map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-r border-gray-200 last:border-r-0"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {SAMPLE_CSV_ROWS.map((row, i) => (
                          <tr key={i} className="bg-white">
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.firstName}
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.lastName}
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.email}
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.phone}
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.lifecycle}
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-r border-gray-100">
                              {row.channel}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {row.tags.join(";")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <ul className="mt-2 space-y-1">
                  {[
                    "First row must be the header row (exactly as shown above)",
                    "Lifecycle values: New Lead, Hot Lead, Payment, Customer, Cold Lead",
                    "Channel values: email, whatsapp, instagram, messenger, webchat",
                    "Multiple tags separated by semicolons (;) — e.g. VIP;Follow-up",
                  ].map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-1.5 text-xs text-gray-500"
                    >
                      <span className="mt-0.5 text-gray-400">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upload area */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Upload Your File
                </h3>
                {!importParsed ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setImportDragging(true);
                    }}
                    onDragLeave={() => setImportDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${importDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"}`}
                  >
                    <Upload
                      size={28}
                      className={`mx-auto mb-2 ${importDragging ? "text-indigo-500" : "text-gray-400"}`}
                    />
                    <p className="text-sm font-medium text-gray-700">
                      Drag & drop your CSV file here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      or{" "}
                      <span className="text-indigo-600 font-medium">
                        click to browse
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports .csv files only
                    </p>
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="text-green-500 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800">
                        {importFileName}
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {importParsed.length} contact
                        {importParsed.length > 1 ? "s" : ""} ready to import
                      </p>
                      {/* Preview first 3 rows */}
                      <div className="mt-3 rounded-lg border border-green-200 overflow-hidden text-xs">
                        <table className="w-full">
                          <thead className="bg-green-100">
                            <tr>
                              <th className="px-2 py-1.5 text-left text-green-700 font-semibold">
                                Name
                              </th>
                              <th className="px-2 py-1.5 text-left text-green-700 font-semibold">
                                Email
                              </th>
                              <th className="px-2 py-1.5 text-left text-green-700 font-semibold">
                                Lifecycle
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-100 bg-white">
                            {importParsed.slice(0, 3).map((c, i) => (
                              <tr key={i}>
                                <td className="px-2 py-1.5 text-gray-700">
                                  {c.firstName} {c.lastName}
                                </td>
                                <td className="px-2 py-1.5 text-gray-700">
                                  {c.email}
                                </td>
                                <td className="px-2 py-1.5 text-gray-700">
                                  {c.lifecycle}
                                </td>
                              </tr>
                            ))}
                            {importParsed.length > 3 && (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-2 py-1.5 text-gray-400 text-center"
                                >
                                  +{importParsed.length - 3} more…
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImportParsed(null);
                        setImportFileName(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {importFileError && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    {importFileError}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                {importParsed
                  ? `${importParsed.length} contacts will be added to your list.`
                  : "No file selected yet."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!importParsed}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  <Upload size={14} />
                  Import {importParsed ? `${importParsed.length} Contacts` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Contact Modal ────────────────────────────────────────────── */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${editingContact.lifecycle === "Hot Lead" ? "bg-red-500" : "bg-gray-700"}`}
                >
                  {editForm.firstName[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Edit Contact
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingContact.firstName} {editingContact.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingContact(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lifecycle
                </label>
                <select
                  value={editForm?.lifecycle}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lifecycle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Hot Lead">Hot Lead</option>
                  <option value="Payment">Payment</option>
                  <option value="Customer">Customer</option>
                  <option value="Cold Lead">Cold Lead</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select
                  value={editForm?.channel}
                  onChange={(e) =>
                    setEditForm({ ...editForm, channel: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="messenger">Messenger</option>
                  <option value="webchat">Website Chat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tags
                </label>
                {/* <input
                  type="text"
                  placeholder="Comma-separated tags (e.g. VIP, Follow-up)"
                  value={editForm?.tags.join(", ")}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                /> */}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditingContact(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateContact}
                disabled={!editForm.firstName || !editForm.email}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <Check size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
};
