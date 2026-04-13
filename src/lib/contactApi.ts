

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// Replace apiFetch() stubs with your actual API client (axios, react-query, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./api";
import { apiFetch } from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Contact {
    id: number | string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    lifecycle?: string | { id?: string; name?: string; emoji?: string } | null;
    lifecycleStage?: string | null;
    company?: string | null;
    status?: string | null;
    assignee?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        avatarUrl?: string;
    } | null;
    contactChannels?: Array<{
        channelType?: string;
        channelId?: string | number;
        identifier?: string;
    }>;
    channel?: string;
    tags?: string[];
}

export interface ContactListParams {
    search?: string;
    lifecycle?: string;
    sortField?: "name" | "email" | "lifecycle" | "phone";
    sortDir?: "asc" | "desc";
    page?: number;
    limit?: number;
}

export interface ContactListResponse {
    data: Contact[];
    total: number;
    page: number;
    limit: number;
}

export interface ContactDuplicateSuggestion {
    contact: any;
    score: number;
    reasons: string[];
    conversationCount: number;
    openConversationCount: number;
}

export interface ContactMergePreview {
    primary: any;
    secondary: any;
    confidenceScore: number;
    reasonCodes: string[];
    suggestedResolution: Record<string, any>;
    impact: {
        conversationsToMove: number;
        channelsToMove: number;
        workflowRunsToMove: number;
        notificationHistoryToMove: number;
    };
}

export interface ContactMergeResult {
    mergeRunId: string;
    contact: Contact;
    survivorConversationId?: string | null;
    mergedConversationIds?: string[];
}

export interface ContactTagMutationResult {
    contactId: string;
    tagId: string;
    tags: string[];
}
// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const lifecycleStages = [
    { name: "New Lead", color: "bg-blue-500", count: 1 },
    { name: "Hot Lead", color: "bg-orange-500", count: 1 },
    { name: "Payment", color: "bg-green-500", count: 0 },
    { name: "Customer", color: "bg-purple-500", count: 0 },
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
            c.tags.join(";"),
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
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
            c.tags.join(";"),
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
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

export const contactsApi = {
    /** GET /contacts — returns all contacts */
    getContacts: async (params?: ContactListParams): Promise<ContactListResponse> => {
        const searchParams = new URLSearchParams();
        if (params?.search?.trim()) searchParams.set("search", params.search.trim());
        if (params?.lifecycle) searchParams.set("lifecycle", params.lifecycle);
        if (params?.sortField) searchParams.set("sortField", params.sortField);
        if (params?.sortDir) searchParams.set("sortDir", params.sortDir);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        const query = searchParams.toString();
        const res = await api.get(`/contacts${query ? `?${query}` : ""}`);
        return res;
    },

    getContact: async (contactId: number | string): Promise<Contact> => {
        const res = await api.get(`/contacts/${contactId}`);
        return res;
    },

    getDuplicateSuggestions: async (contactId: number | string): Promise<{
        contactId: string;
        suggestions: ContactDuplicateSuggestion[];
    }> => {
        const res = await api.get(`/contacts/${contactId}/duplicates`);
        return res;
    },

    getMergePreview: async (
        primaryContactId: number | string,
        duplicateContactId: number | string,
    ): Promise<ContactMergePreview> => {
        const res = await api.get(
            `/contacts/${primaryContactId}/merge-preview?duplicateContactId=${duplicateContactId}`,
        );
        return res;
    },

    mergeContactIntoPrimary: async (
        primaryContactId: number | string,
        secondaryContactId: number | string,
        payload?: {
            source?: string;
            reasonCodes?: string[];
            confidenceScore?: number;
            resolution?: Record<string, unknown>;
        },
    ): Promise<ContactMergeResult> => {
        const res = await api.post(`/contacts/${primaryContactId}/merge`, {
            secondaryContactId,
            ...(payload ?? {}),
        });
        return res;
    },

  

    SaveContact: async (contact: Omit<Contact, "id">): Promise<Contact> => {
        const res = await api.post("/contacts", contact);
        return res;
    },
    // CreateContact: async (contact: Omit<Contact, "id">): Promise<Contact> => {
    //     const res = await api.post("/contacts", contact);
    //     return res;
    // },
    updateContact: async (id: number | string, updates: Partial<Contact>): Promise<Contact> => {
        const res = await api.patch(`/contacts/${id}`, updates);
        return res;
    },
    addTagToContact: async (
        contactId: number | string,
        tagId: string,
    ): Promise<ContactTagMutationResult> => {
        const res = await api.post(`/contacts/${contactId}/tags`, { tagId });
        return res;
    },
    removeTagFromContact: async (
        contactId: number | string,
        tagId: string,
    ): Promise<ContactTagMutationResult> => {
        const res = await api.delete(`/contacts/${contactId}/tags/${tagId}`);
        return res;
    },
    MergeContacts: async (keepId: number | string | undefined, removeId: number | string, merged: Contact): Promise<any> => {
        const res = await api.post(`/contacts/merge`, {
            keepId,
            removeId,
            merged,
        });
        return res;
    },
    /** POST /contacts — creates a new contact */
    createContact: async (contact: Omit<Contact, "id">): Promise<Contact> => {
        const res = await api.post("/contacts", contact);
        return res;
    },

    /** PUT /contacts/:id — updates a contact */
    // updateContact: async (
    //     id: number,
    //     updates: Partial<Contact>
    // ): Promise<Contact> => {
    //     const res = await apiFetch(`/contacts/${id}`, {
    //         method: "PATCH",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(updates),
    //     });
    //     if (!res.ok) throw new Error("Failed to update contact");
    //     return res.json();
    // },

    /** DELETE /contacts/:id — deletes a single contact */
    deleteContact: async (id: number): Promise<void> => {
        const res = await api.delete(`/contacts/${id}`);
        // if (!res.ok) throw new Error("Failed to delete contact");
    },

    /** DELETE /contacts — bulk delete */
    deleteContacts: async (ids: number[]): Promise<void> => {
        const res = await api.delete("/contacts",{ ids });
    },

    /** POST /contacts/import — bulk import from CSV rows */
    importContacts: async (
        contacts: Omit<Contact, "id">[]
    ): Promise<Contact[]> => {
        const res = await api.post("/contacts/import",{ contacts });
        if (!res.ok) throw new Error("Failed to import contacts");
        return res.json();
    },

    /** GET /contacts/export?lifecycle=X — export contacts as JSON (convert to CSV client-side) */
    exportContacts: async (filters?: {
        lifecycle?: string;
        search?: string;
        sortField?: "name" | "email" | "lifecycle" | "phone";
        sortDir?: "asc" | "desc";
    }): Promise<Contact[]> => {
        const params = new URLSearchParams();
        if (filters?.lifecycle) params.set("lifecycle", filters.lifecycle);
        if (filters?.search?.trim()) params.set("search", filters.search.trim());
        if (filters?.sortField) params.set("sortField", filters.sortField);
        if (filters?.sortDir) params.set("sortDir", filters.sortDir);
        const res = await api.get(`/contacts/export?${params}`);
        return res;
    },
};
