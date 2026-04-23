import { Trash2 } from "lucide-react";
import { channelConfig } from "../../inbox/data";
import { MAX_VISIBLE_CHANNELS, MAX_VISIBLE_TAGS } from "../constants";
import type { Contact, WorkspaceUser } from "../types";
import type { LifecycleStage } from "../../workspace/types";

interface ContactsMobileListProps {
  contacts: Contact[];
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  selectedIds: Set<number | string>;
  toggleSelectOne: (id: number | string) => void;
  openEditModal: (contact: Contact) => void;
  handleDeleteOne: (id: number | string) => Promise<void>;
}

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

function getLifecycleLabel(contact: Contact, stages: LifecycleStage[]) {
  const stage = stages.find((item) => String(item.id) === String(contact.lifecycleId));
  if (stage) {
    return [stage.emoji, stage.name].filter(Boolean).join(" ");
  }

  if (typeof contact.lifecycle === "string" && contact.lifecycle) {
    return contact.lifecycle;
  }

  if (contact.lifecycle && typeof contact.lifecycle === "object") {
    return [contact.lifecycle.emoji, contact.lifecycle.name].filter(Boolean).join(" ");
  }

  return "No lifecycle";
}

export function ContactsMobileList({
  contacts,
  workspaceUsers,
  stages,
  selectedIds,
  toggleSelectOne,
  openEditModal,
  handleDeleteOne,
}: ContactsMobileListProps) {
  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="grid min-w-0 max-w-full gap-3 overflow-x-hidden p-3 md:hidden">
      {contacts.map((contact) => {
        const assigneeName = getAssigneeName(contact, workspaceUsers) || "Unassigned";
        const lifecycleLabel = getLifecycleLabel(contact, stages);
        const selected = selectedIds.has(contact.id);

        return (
          <article
            key={contact.id}
            tabIndex={0}
            onClick={() => openEditModal(contact)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openEditModal(contact);
              }
            }}
            className={`min-w-0 max-w-full cursor-pointer overflow-hidden rounded-[26px] p-4 shadow-sm transition-colors ${
              selected
                ? "bg-indigo-50/80"
                : "bg-white"
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 flex-shrink-0 cursor-pointer rounded"
                checked={selected}
                onClick={(event) => event.stopPropagation()}
                onChange={() => toggleSelectOne(contact.id)}
              />

              <div className="min-w-0 flex-1">
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
                        <p className="truncate text-[17px] font-semibold text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{lifecycleLabel}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteOne(contact.id);
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {contact.contactChannels?.length ? (
                  <div className="mt-3 flex items-center gap-2">
                    {contact.contactChannels
                      .slice(0, MAX_VISIBLE_CHANNELS)
                      .map((channel, index) => {
                        const icon = channelConfig[channel.channelType]?.icon;

                        return (
                          <div
                            key={`${channel.channelType}-${index}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50"
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

                    {contact.contactChannels.length > MAX_VISIBLE_CHANNELS && (
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-500">
                        +{contact.contactChannels.length - MAX_VISIBLE_CHANNELS}
                      </span>
                    )}
                  </div>
                ) : null}

                <div className="mt-4 grid min-w-0 gap-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[84px_minmax(0,1fr)]">
                    <span className="text-slate-400">Assignee</span>
                    <span className="min-w-0 truncate font-medium text-slate-700">
                      {assigneeName}
                    </span>
                  </div>

                  {contact.email ? (
                    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[84px_minmax(0,1fr)]">
                      <span className="text-slate-400">Email</span>
                      <span className="min-w-0 break-all font-medium text-slate-700">
                        {contact.email}
                      </span>
                    </div>
                  ) : null}

                  {contact.phone ? (
                    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[84px_minmax(0,1fr)]">
                      <span className="text-slate-400">Phone</span>
                      <span className="min-w-0 break-all font-medium text-slate-700">
                        {contact.phone}
                      </span>
                    </div>
                  ) : null}
                </div>

                {contact.tags?.length ? (
                  <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                    {contact.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                      <span
                        key={tag}
                        className="max-w-full break-words rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > MAX_VISIBLE_TAGS && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
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
