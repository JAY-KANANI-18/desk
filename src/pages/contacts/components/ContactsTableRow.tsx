import { Pencil, Trash2 } from "lucide-react";
import { Tooltip } from "../../../components/ui/Tooltip";
import { channelConfig } from "../../inbox/data";
import { MAX_VISIBLE_CHANNELS, MAX_VISIBLE_TAGS } from "../constants";
import type { Contact, WorkspaceUser } from "../types";
import type { LifecycleStage } from "../../workspace/types";

interface ContactsTableRowProps {
  contact: Contact;
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  selected: boolean;
  onToggleSelect: (id: number | string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number | string) => Promise<void>;
}

function getAssigneeName(contact: Contact, workspaceUsers: WorkspaceUser[] | null) {
  const workspaceAssignee = workspaceUsers?.find((user) => user.id === contact.assigneeId) ?? null;
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

  return "-";
}

export function ContactsTableRow({
  contact,
  workspaceUsers,
  stages,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: ContactsTableRowProps) {
  const assigneeName = getAssigneeName(contact, workspaceUsers);
  const lifecycleLabel = getLifecycleLabel(contact, stages);

  return (
    <tr
      tabIndex={0}
      onClick={() => onEdit(contact)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(contact);
        }
      }}
      className={`group cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
        selected ? "bg-indigo-50/60" : ""
      }`}
    >
      <td className="px-3 py-2">
        <input
          type="checkbox"
          className="cursor-pointer rounded"
          checked={selected}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleSelect(contact.id)}
        />
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
            {contact.avatarUrl ? (
              <img src={contact.avatarUrl} alt={contact.firstName} className="h-full w-full object-cover" />
            ) : (
              <span>{contact.firstName?.charAt(0)?.toUpperCase() ?? "?"}</span>
            )}
          </div>
          <span className="whitespace-nowrap text-sm font-medium text-gray-800">
            {contact.firstName} {contact.lastName}
          </span>
        </div>
      </td>

      <td className="px-3 py-2">
        {contact.contactChannels?.length ? (
          <div className="flex items-center gap-1">
            {contact.contactChannels.slice(0, MAX_VISIBLE_CHANNELS).map((channel, index) => {
              const icon = channelConfig[channel.channelType]?.icon;
              return (
                <Tooltip key={`${channel.channelType}-${index}`} content={`${channel.channelType}: ${channel.channelId}`} side="top">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50">
                    {icon && <img src={icon} alt={channel.channelType} className="h-3.5 w-3.5 object-contain" />}
                  </div>
                </Tooltip>
              );
            })}
            {contact.contactChannels.length > MAX_VISIBLE_CHANNELS && (
              <Tooltip
                content={contact.contactChannels
                  .slice(MAX_VISIBLE_CHANNELS)
                  .map((channel) => channel.channelType ?? "channel")
                  .join(", ")}
                side="top"
              >
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500">
                  +{contact.contactChannels.length - MAX_VISIBLE_CHANNELS}
                </span>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-300">-</span>
        )}
      </td>

      <td className="px-3 py-2">
        {assigneeName ? (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {assigneeName}
          </span>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </td>

      <td className="px-3 py-2">
        <span className="whitespace-nowrap text-xs text-gray-600">{lifecycleLabel}</span>
      </td>

      <td className="px-3 py-2">
        <span className="text-xs text-gray-600">{contact.email || "-"}</span>
      </td>

      <td className="px-3 py-2">
        <span className="whitespace-nowrap text-xs text-gray-600">{contact.phone || "-"}</span>
      </td>

      <td className="px-3 py-2">
        {contact.tags?.length ? (
          <div className="flex items-center gap-1">
            {contact.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <Tooltip key={tag} content={tag} side="top">
                <span className="max-w-[72px] truncate rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                  {tag}
                </span>
              </Tooltip>
            ))}
            {contact.tags.length > MAX_VISIBLE_TAGS && (
              <Tooltip content={contact.tags.slice(MAX_VISIBLE_TAGS).join(", ")} side="top">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500">
                  +{contact.tags.length - MAX_VISIBLE_TAGS}
                </span>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-300">-</span>
        )}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit(contact);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              void onDelete(contact.id);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
