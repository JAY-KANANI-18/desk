import type {
  Contact,
  SortOption,
} from "./types";

export const DUMMY_MODE = false;
export const PAGE_SIZE = 10;

export const lifecycleStages = [
  { name: "New Lead", color: "bg-[var(--color-primary)]", count: 1 },
  { name: "Hot Lead", color: "bg-orange-500", count: 1 },
  { name: "Payment", color: "bg-green-500", count: 0 },
  { name: "Customer", color: "bg-[var(--color-primary)]", count: 0 },
];

export const lostStages = [{ name: "Cold Lead", color: "bg-gray-500", count: 0 }];

export const segments = [
  "Contacts created <7 days",
  "Contacts inactive >3 months",
  "Contacts with tags",
  "Country known",
  "Language known",
];

export const MAX_VISIBLE_CHANNELS = 3;
export const MAX_VISIBLE_TAGS = 3;

export const SORT_OPTIONS: SortOption[] = [
  { label: "Name A to Z", field: "name", dir: "asc" },
  { label: "Name Z to A", field: "name", dir: "desc" },
  { label: "Email A to Z", field: "email", dir: "asc" },
  { label: "Email Z to A", field: "email", dir: "desc" },
  { label: "Lifecycle A to Z", field: "lifecycle", dir: "asc" },
  { label: "Lifecycle Z to A", field: "lifecycle", dir: "desc" },
  { label: "Phone A to Z", field: "phone", dir: "asc" },
  { label: "Phone Z to A", field: "phone", dir: "desc" },
];

export const CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Lifecycle",
  "Company",
  "Status",
  "Assignee Email",
  "Channels",
  "Tags",
];

export const SAMPLE_CSV_ROWS: Omit<Contact, "id">[] = [
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

export const SEED_CONTACTS: Contact[] = [
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
