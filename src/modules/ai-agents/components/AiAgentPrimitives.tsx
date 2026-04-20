import React from "react";
import {
  Bot,
  CheckCircle2,
  CirclePause,
  Clock3,
  Database,
  Globe2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
} from "lucide-react";
import type { AiAgentStatus, AiAgentType } from "../types";

export const agentTypeLabels: Record<AiAgentType, string> = {
  sales: "Sales",
  support: "Support",
  receptionist: "Receptionist",
  custom: "Custom",
};

export const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  email: "Email",
  webchat: "Webchat",
};

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <Phone size={13} />,
  instagram: <MessageCircle size={13} />,
  messenger: <MessageSquare size={13} />,
  email: <Mail size={13} />,
  webchat: <Globe2 size={13} />,
};

export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col bg-[#f7f8fb]">{children}</div>;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 truncate text-xl font-semibold text-slate-950">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status?: AiAgentStatus | string | null }) {
  const normalized = status || "draft";
  const styles: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    draft: "border-slate-200 bg-slate-50 text-slate-600",
    paused: "border-amber-200 bg-amber-50 text-amber-700",
    archived: "border-rose-200 bg-rose-50 text-rose-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    escalated: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-rose-200 bg-rose-50 text-rose-700",
    waiting_approval: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${styles[normalized] || styles.draft}`}>
      {normalized === "active" || normalized === "completed" ? <CheckCircle2 size={12} /> : null}
      {normalized === "paused" ? <CirclePause size={12} /> : null}
      {normalized === "draft" ? <Clock3 size={12} /> : null}
      {String(normalized).replace(/_/g, " ")}
    </span>
  );
}

export function ChannelPills({ channels = [] }: { channels?: string[] }) {
  if (!channels.length) {
    return <span className="text-xs text-slate-400">All connected channels</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => (
        <span
          key={channel}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600"
        >
          {channelIcons[channel] || <Bot size={13} />}
          {channelLabels[channel] || channel}
        </span>
      ))}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
          <Database size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[1fr_140px_160px_140px] sm:px-6">
          <div className="h-4 animate-pulse rounded bg-slate-100" />
          <div className="h-4 animate-pulse rounded bg-slate-100" />
          <div className="h-4 animate-pulse rounded bg-slate-100" />
          <div className="h-4 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
