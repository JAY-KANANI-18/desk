import React from "react";
import {
  CornerUpLeft,
  ExternalLink,
  Phone,
  type LucideIcon,
} from "lucide-react";
import type { WaTemplateButtonType } from "./types";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAudioTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMsgTime(
  createdAt?: string | Date,
  fallback?: string,
): string {
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime()))
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {}
  }
  return fallback ?? "";
}

export function highlightText(text: string, term: string): React.ReactNode {
  if (!term || !text) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function dateBadgeLabel(dateKey: string): string {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

export function getFailedMessageCopy(message: {
  metadata?: {
    error?: string;
    providerError?: string;
    lastError?: string;
  };
}) {
  return (
    message.metadata?.error ??
    message.metadata?.providerError ??
    message.metadata?.lastError ??
    "Message failed to send"
  );
}

export function formatWaBody(text: string): string {
  return text
    .replace(/\n{2,}/g, "\n")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/_([^_]+)_/g, "<i>$1</i>")
    .replace(/~([^~]+)~/g, "<s>$1</s>")
    .replace(/```([\s\S]*?)```/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function getWaTemplateButtonIcon(
  type?: WaTemplateButtonType,
): LucideIcon {
  if (type === "URL") {
    return ExternalLink;
  }

  if (type === "PHONE_NUMBER") {
    return Phone;
  }

  return CornerUpLeft;
}
