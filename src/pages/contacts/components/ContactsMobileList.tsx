import {
  Building2,
  ChevronRight,
  Mail,
  Phone,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import { getTagSurfaceStyle, resolveTagBaseColor } from "../../../lib/tagAppearance";
import { channelConfig } from "../../inbox/data";
import { MAX_VISIBLE_CHANNELS, MAX_VISIBLE_TAGS } from "../constants";
import type { Contact, ContactTagOption, WorkspaceUser } from "../types";
import type { LifecycleStage } from "../../workspace/types";

interface ContactsMobileListProps {
  contacts: Contact[];
  availableTags: ContactTagOption[];
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  openEditModal: (contact: Contact) => void;
}

const LIFECYCLE_COLOR_MAP: Record<string, string> = {
  "bg-gray-500": "#64748b",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-yellow-500": "#eab308",
  "bg-green-500": "#22c55e",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-purple-500": "#a855f7",
  "bg-pink-500": "#ec4899",
};

function getAssigneeName(contact: Contact, workspaceUsers: WorkspaceUser[] | null) {
  const workspaceAssignee =
    workspaceUsers?.find((user) => user.id === contact.assigneeId) ?? null;

  if (workspaceAssignee) {
    return `${workspaceAssignee.firstName} ${workspaceAssignee.lastName ?? ""}`.trim();
  }

  if (contact.assignee) {
    return `${contact.assignee.firstName} ${contact.assignee.lastName ?? ""}`.trim();
  }

  return "";
}

function getLifecycleMeta(contact: Contact, stages: LifecycleStage[]) {
  const stage = stages.find((item) => {
    const lifecycleName =
      typeof contact.lifecycle === "string"
        ? contact.lifecycle
        : contact.lifecycle?.name;

    return (
      String(item.id) === String(contact.lifecycleId) ||
      (lifecycleName ? item.name === lifecycleName : false)
    );
  });
  if (stage) {
    return {
      label: [stage.emoji, stage.name].filter(Boolean).join(" "),
      color: stage.color,
    };
  }

  if (typeof contact.lifecycle === "string" && contact.lifecycle) {
    return { label: contact.lifecycle, color: "#6366f1" };
  }

  if (contact.lifecycle && typeof contact.lifecycle === "object") {
    return {
      label: [contact.lifecycle.emoji, contact.lifecycle.name].filter(Boolean).join(" "),
      color: "#6366f1",
    };
  }

  return { label: "No lifecycle", color: "#94a3b8" };
}

function normalizeVisualColor(color?: string | null) {
  if (!color) {
    return undefined;
  }

  return LIFECYCLE_COLOR_MAP[color] ?? color;
}

function DetailLine({
  icon: Icon,
  value,
  breakWords = false,
}: {
  icon: LucideIcon;
  value: string;
  breakWords?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400">
        <Icon size={13} />
      </span>
      <span
        className={`min-w-0 text-[13px] font-medium text-slate-700 ${
          breakWords ? "break-all" : "truncate"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function ContactsMobileList({
  contacts,
  availableTags,
  workspaceUsers,
  stages,
  openEditModal,
}: ContactsMobileListProps) {
  if (contacts.length === 0) {
    return null;
  }

  const tagMetaById = new Map(availableTags.map((tag) => [tag.id, tag]));
  const tagMetaByName = new Map(availableTags.map((tag) => [tag.name, tag]));

  return (
    <div className="grid min-w-0 max-w-full gap-3 overflow-x-hidden p-3 md:hidden">
      {contacts.map((contact) => {
        const assigneeName = getAssigneeName(contact, workspaceUsers) || "Unassigned";
        const lifecycle = getLifecycleMeta(contact, stages);
        const company = contact.company?.trim();
        const visibleChannels = contact.contactChannels?.slice(0, MAX_VISIBLE_CHANNELS) ?? [];
        const overflowChannels = Math.max(
          0,
          (contact.contactChannels?.length ?? 0) - MAX_VISIBLE_CHANNELS,
        );

        return (
          <article
            key={contact.id}
            role="button"
            tabIndex={0}
            onClick={() => openEditModal(contact)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openEditModal(contact);
              }
            }}
            className="relative min-w-0 max-w-full cursor-pointer overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition-colors"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300"
            >
              <ChevronRight size={16} />
            </span>

            <div className="min-w-0 pr-7">
              <div className="min-w-0 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.firstName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{contact.firstName?.charAt(0)?.toUpperCase() ?? "?"}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[17px] font-semibold leading-tight text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                      </div>

                      {visibleChannels.length > 0 ? (
                        <div className="mr-1 flex flex-shrink-0 items-center gap-1">
                          {visibleChannels.map((channel, index) => {
                            const icon = channelConfig[channel.channelType]?.icon;

                            return (
                              <div
                                key={`${channel.channelType}-${index}`}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white"
                              >
                                {icon ? (
                                  <img
                                    src={icon}
                                    alt={channel.channelType}
                                    className="h-4 w-4 object-contain"
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                          {overflowChannels > 0 ? (
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-500">
                              +{overflowChannels}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          ...getTagSurfaceStyle(normalizeVisualColor(lifecycle.color)),
                          color: resolveTagBaseColor(normalizeVisualColor(lifecycle.color)),
                        }}
                      >
                        <span className="truncate">{lifecycle.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-0 gap-2.5 rounded-[22px] bg-white p-3">
                  <DetailLine icon={UserRound} value={assigneeName} />
                  {contact.email ? (
                    <DetailLine icon={Mail} value={contact.email} breakWords />
                  ) : null}
                  {contact.phone ? (
                    <DetailLine icon={Phone} value={contact.phone} breakWords />
                  ) : null}
                  {company ? <DetailLine icon={Building2} value={company} /> : null}
                </div>

                {contact.tags?.length ? (
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {contact.tags.slice(0, MAX_VISIBLE_TAGS).map((tag, index) => {
                      const tagMeta =
                        tagMetaByName.get(tag) ??
                        (contact.tagIds?.[index]
                          ? tagMetaById.get(contact.tagIds[index])
                          : undefined);
                      const tagColor = tagMeta?.color;

                      return (
                        <span
                          key={tag}
                          className="inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            ...getTagSurfaceStyle(tagColor),
                            color: resolveTagBaseColor(tagColor),
                          }}
                        >
                          {tagMeta?.emoji ? <span>{tagMeta.emoji}</span> : null}
                          <span className="max-w-full break-words">{tag}</span>
                        </span>
                      );
                    })}
                    {contact.tags.length > MAX_VISIBLE_TAGS && (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                        +{contact.tags.length - MAX_VISIBLE_TAGS}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
