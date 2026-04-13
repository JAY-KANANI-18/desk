import { CSV_HEADERS, SAMPLE_CSV_ROWS } from "./constants";
import type { Contact } from "./types";

export function resolveLifecycleName(contact: Contact) {
  if (typeof contact.lifecycle === "string") return contact.lifecycle;
  if (contact.lifecycle?.name) return contact.lifecycle.name;
  return contact.lifecycleStage ?? "";
}

export function resolveChannelNames(contact: Contact) {
  if (Array.isArray(contact.contactChannels) && contact.contactChannels.length) {
    return contact.contactChannels
      .map((channel) => channel.channelType)
      .filter(Boolean)
      .join("; ");
  }

  return contact.channel ?? "";
}

export function contactsToCSV(contacts: Contact[]): string {
  const rows = contacts.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      resolveLifecycleName(contact),
      contact.company ?? "",
      contact.status ?? "",
      contact.assignee?.email ?? "",
      resolveChannelNames(contact),
      Array.isArray(contact.tags) ? contact.tags.join("; ") : "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function sampleToCSV(): string {
  const rows = SAMPLE_CSV_ROWS.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      resolveLifecycleName(contact),
      contact.company ?? "",
      contact.status ?? "",
      contact.assignee?.email ?? "",
      resolveChannelNames(contact),
      Array.isArray(contact.tags) ? contact.tags.join("; ") : "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function parseCSV(text: string): Omit<Contact, "id">[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const cols = line
      .split(",")
      .map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

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
