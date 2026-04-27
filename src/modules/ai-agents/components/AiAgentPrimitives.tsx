import { type ReactNode } from "react";
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
import { PageLayout } from "../../../components/ui/PageLayout";
import { Tag, type TagPresetColor } from "../../../components/ui/Tag";
import { useIsMobile } from "../../../hooks/useIsMobile";
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

const channelIcons: Record<string, ReactNode> = {
  whatsapp: <Phone size={13} />,
  instagram: <MessageCircle size={13} />,
  messenger: <MessageSquare size={13} />,
  email: <Mail size={13} />,
  webchat: <Globe2 size={13} />,
};

interface AiPageLayoutProps {
  title: string;
  eyebrow?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function AiPageLayout({
  title,
  eyebrow,
  description,
  leading,
  actions,
  toolbar,
  children,
}: AiPageLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <PageLayout
      leading={leading}
      eyebrow={eyebrow}
      title={title}
      subtitle={typeof description === "string" ? description : undefined}
      actions={actions}
      toolbar={toolbar}
      className="bg-[#f7f8fb]"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-[#f7f8fb] px-0 py-0"
    >
      <div className="flex h-full min-h-0 flex-col bg-[#f7f8fb]">
        {isMobile ? (
          <div className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex min-w-0 items-start gap-3">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              <div className="min-w-0 flex-1">
                {eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-1 truncate text-xl font-semibold text-slate-950">{title}</h1>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
              </div>
            </div>
            {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
            {toolbar ? <div className="mt-4">{toolbar}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </PageLayout>
  );
}

const statusColors: Record<string, TagPresetColor> = {
  active: "success",
  completed: "success",
  published: "success",
  ready: "success",
  draft: "gray",
  pending: "warning",
  paused: "warning",
  indexing: "info",
  waiting_approval: "info",
  archived: "error",
  failed: "error",
  disabled: "gray",
  escalated: "warning",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status?: AiAgentStatus | string | null }) {
  const normalized = status || "draft";
  const icon =
    normalized === "active" || normalized === "completed" || normalized === "published" || normalized === "ready" ? (
      <CheckCircle2 size={12} />
    ) : normalized === "paused" ? (
      <CirclePause size={12} />
    ) : normalized === "draft" || normalized === "pending" || normalized === "indexing" ? (
      <Clock3 size={12} />
    ) : null;

  return (
    <Tag
      label={formatStatus(String(normalized))}
      icon={icon}
      size="sm"
      bgColor={statusColors[String(normalized)] || "gray"}
    />
  );
}

export function ChannelPills({ channels = [] }: { channels?: string[] }) {
  if (!channels.length) {
    return <span className="text-xs text-slate-400">All connected channels</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => (
        <Tag
          key={channel}
          label={channelLabels[channel] || channel}
          icon={channelIcons[channel] || <Bot size={13} />}
          size="sm"
          bgColor="gray"
        />
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
  icon?: ReactNode;
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
  action?: ReactNode;
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
