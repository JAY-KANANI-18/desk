import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
  type ReactNode,
} from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Tag } from "../../../components/ui/Tag";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { Tooltip } from "../../../components/ui/Tooltip";
import { CheckboxInput } from "../../../components/ui/inputs/CheckboxInput";
import { resolveTagBaseColor } from "../../../lib/tagAppearance";
import { channelConfig } from "../../inbox/data";
import type {
  Contact,
  ContactTagOption,
  SortField,
  SortOption,
  WorkspaceUser,
} from "../types";
import type { LifecycleStage } from "../../workspace/types";
import { MAX_VISIBLE_CHANNELS, MAX_VISIBLE_TAGS } from "../constants";
import { ContactsPagination } from "./ContactsPagination";
import { TruncatedText } from "../../../components/ui/TruncatedText";

interface ContactsTableProps {
  loading: boolean;
  mobileLoadingMore: boolean;
  contacts: Contact[];
  totalContacts: number;
  availableTags: ContactTagOption[];
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  sortOption: SortOption | null;
  someSelected: boolean;
  selectedIds: Set<number | string>;
  setSelectedIds: (value: Set<number | string>) => void;
  handleDeleteSelected: () => Promise<void>;
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  handleColSort: (field: SortField) => void;
  toggleSelectOne: (id: number | string) => void;
  openEditModal: (contact: Contact) => void;
  handleDeleteOne: (id: number | string) => Promise<void>;
  safePage: number;
  totalPages: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
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

function getLifecycleMeta(contact: Contact, stages: LifecycleStage[]) {
  const lifecycleName =
    typeof contact.lifecycle === "string"
      ? contact.lifecycle
      : contact.lifecycle?.name;
  const stage = stages.find(
    (item) =>
      String(item.id) === String(contact.lifecycleId) ||
      (lifecycleName ? item.name === lifecycleName : false),
  );

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
  if (!color) return undefined;
  return LIFECYCLE_COLOR_MAP[color] ?? color;
}

function getContactName(contact: Contact) {
  return `${contact.firstName} ${contact.lastName ?? ""}`.trim();
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

function ChannelIcons({ contact, compact = false }: { contact: Contact; compact?: boolean }) {
  const visibleChannels = contact.contactChannels?.slice(0, MAX_VISIBLE_CHANNELS) ?? [];
  const overflowChannels = Math.max(
    0,
    (contact.contactChannels?.length ?? 0) - MAX_VISIBLE_CHANNELS,
  );

  if (visibleChannels.length === 0) {
    return <span className="text-sm text-gray-300">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {visibleChannels.map((channel, index) => {
        const icon = channelConfig[channel.channelType ?? ""]?.icon;
        const label = `${channel.channelType ?? "channel"}: ${channel.channelId ?? channel.identifier ?? ""}`;

        return (
          <Tooltip
            key={`${channel.channelType}-${index}`}
            content={label}
            position="top"
          >
            <div className={`flex items-center justify-center rounded-full bg-white ${compact ? "h-7 w-7" : "h-6 w-6"}`}>
              {icon ? (
                <img
                  src={icon}
                  alt={channel.channelType}
                  className={compact ? "h-4 w-4 object-contain" : "h-3.5 w-3.5 object-contain"}
                />
              ) : null}
            </div>
          </Tooltip>
        );
      })}
      {overflowChannels > 0 ? (
        <span className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 font-semibold text-slate-500 ${compact ? "h-7 min-w-7 text-[10px]" : "h-6 min-w-6 text-[10px]"}`}>
          +{overflowChannels}
        </span>
      ) : null}
    </div>
  );
}

export function ContactsTable({
  loading,
  mobileLoadingMore,
  contacts,
  totalContacts,
  availableTags,
  workspaceUsers,
  stages,
  sortOption,
  someSelected,
  selectedIds,
  setSelectedIds,
  handleDeleteSelected,
  allFilteredSelected,
  toggleSelectAll,
  handleColSort,
  toggleSelectOne,
  openEditModal,
  handleDeleteOne,
  safePage,
  totalPages,
  setCurrentPage,
}: ContactsTableProps) {
  const tagMetaById = new Map(availableTags.map((tag) => [String(tag.id), tag]));
  const tagMetaByName = new Map(availableTags.map((tag) => [tag.name, tag]));

  const renderTags = (contact: Contact, mobile = false) => {
    if (!contact.tags?.length) {
      return <span className="text-sm text-gray-300">-</span>;
    }

    return (
      <div className={`flex min-w-0 ${mobile ? "flex-wrap gap-1.5" : "items-center gap-1"}`}>
        {contact.tags.slice(0, MAX_VISIBLE_TAGS).map((tag, index) => {
          const tagMeta =
            tagMetaByName.get(tag) ??
            (contact.tagIds?.[index] ? tagMetaById.get(String(contact.tagIds[index])) : undefined);
          const tagColor = tagMeta?.color;

          return (
            mobile ? (
              <span
                key={tag}
                className={`${mobile ? "max-w-full break-words px-2.5 py-1" : "max-w-[72px] truncate px-2 py-0.5"} inline-flex items-center gap-1 rounded-full border text-[11px] font-medium`}
                style={{
                  backgroundColor: `${resolveTagBaseColor(tagColor) ?? "var(--color-gray-200)"}1F`,
                  borderColor: `${resolveTagBaseColor(tagColor) ?? "var(--color-gray-300)"}59`,
                  color: resolveTagBaseColor(tagColor),
                }}
              >
                {tagMeta?.emoji ? <span>{tagMeta.emoji}</span> : null}
                <span className={mobile ? "max-w-full break-words" : "truncate"}>{tag}</span>
              </span>
            ) : (
              <Tag
                key={tag}
                label={tag}
                emoji={tagMeta?.emoji}
                bgColor={tagColor}
                size="sm"
              />
            )
          );
        })}
        {contact.tags.length > MAX_VISIBLE_TAGS ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">
            +{contact.tags.length - MAX_VISIBLE_TAGS}
          </span>
        ) : null}
      </div>
    );
  };

  const columns: Array<DataTableColumn<Contact, SortField>> = [
    {
      id: "select",
      header: (
        <div className="flex justify-center">
          <CheckboxInput
            aria-label="Select all contacts"
            checked={allFilteredSelected}
            ref={(element) => {
              if (element) {
                element.indeterminate = someSelected && !allFilteredSelected;
              }
            }}
            onChange={() => toggleSelectAll()}
            className="justify-center"
          />
        </div>
      ),
      align: "center",
      className: "w-8",
      mobile: "hidden",
      cell: (contact) => (
        <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
          <CheckboxInput
            aria-label={`Select ${contact.firstName} ${contact.lastName ?? ""}`.trim()}
            checked={selectedIds.has(contact.id)}
            onChange={() => toggleSelectOne(contact.id)}
            className="justify-center"
          />
        </div>
      ),
    },
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortField: "name",
      mobile: "primary",
      cell: (contact) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            src={contact.avatarUrl ?? undefined}
            name={getContactName(contact)}
            size="sm"
          />
          <span className="truncate whitespace-nowrap text-sm font-medium text-gray-800">
            {getContactName(contact)}
          </span>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Channel",
      mobile: "detail",
      cell: (contact) => <ChannelIcons contact={contact} />,
    },
    {
      id: "assignee",
      header: "Assignee",
      mobile: "detail",
      cell: (contact) => {
        const assigneeName = getAssigneeName(contact, workspaceUsers);
        return assigneeName ? (
          <TruncatedText maxLength={20} text={assigneeName} />
        ) : (
          <span className="text-xs text-gray-300">-</span>
        );
      },
    },
    {
      id: "lifecycle",
      header: "Lifecycle",
      sortable: true,
      sortField: "lifecycle",
      mobile: "secondary",
      cell: (contact) => {
        const lifecycleLabel = getLifecycleLabel(contact, stages);
        return lifecycleLabel === "-" ? (
          <span className="text-xs text-gray-300">-</span>
        ) : (

          <TruncatedText maxLength={20} text={lifecycleLabel} />
        
        );
      },
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      sortField: "email",
      mobile: "detail",
      cell: (contact) => <span className=" text-gray-800">{contact.email || "-"}</span>,
    },
    {
      id: "phone",
      header: "Phone",
      sortable: true,
      sortField: "phone",
      mobile: "detail",
      cell: (contact) => (
        <span className="whitespace-nowrap text-gray-800">{contact.phone || "-"}</span>
      ),
    },
    {
      id: "tags",
      header: "Tags",
      mobile: "detail",
      cell: (contact) => renderTags(contact),
    },
  ];

  const renderMobileCard = (contact: Contact, actions: ReactNode) => {
    const assigneeName = getAssigneeName(contact, workspaceUsers) || "Unassigned";
    const lifecycle = getLifecycleMeta(contact, stages);
    const company = contact.company?.trim();

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
        className="relative min-w-0 max-w-full cursor-pointer overflow-visible rounded-[28px] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={contact.avatarUrl ?? undefined}
                name={getContactName(contact)}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold leading-tight text-slate-900">
                      {getContactName(contact)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Tag
                        label={lifecycle.label}
                        bgColor={normalizeVisualColor(lifecycle.color)}
                        size="sm"
                        maxWidth={220}
                      />
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    <ChannelIcons contact={contact} compact />
                    {actions}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-2.5 rounded-[22px] bg-white p-3">
              <DetailLine icon={UserRound} value={assigneeName} />
              {contact.email ? <DetailLine icon={Mail} value={contact.email} breakWords /> : null}
              {contact.phone ? <DetailLine icon={Phone} value={contact.phone} breakWords /> : null}
              {company ? <DetailLine icon={Building2} value={company} /> : null}
            </div>

            {contact.tags?.length ? renderTags(contact, true) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      {someSelected ? (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-600 px-4 py-3 text-sm text-white">
          <span className="font-medium">{selectedIds.size} selected</span>
          <Button
            onClick={handleDeleteSelected}
            className="ml-auto"
            variant="danger"
            leftIcon={<Trash2 size={13} />}
          >
          </Button>
          <Tooltip content="Clear selection" position="top">
            <span className="inline-flex">
              <Button
                onClick={() => setSelectedIds(new Set())}
                variant="secondary"
                iconOnly
                leftIcon={<X size={15} />}
                aria-label="Clear selection"
              />
            </span>
          </Tooltip>
        </div>
      ) : null}

      <DataTable
        rows={contacts}
        columns={columns}
        getRowId={(contact) => contact.id}
        loading={loading}
        loadingLabel="Loading contacts..."
        emptyTitle="No contacts match your search."
        sort={{
          field: sortOption?.field,
          direction: sortOption?.dir ?? "asc",
          onChange: handleColSort,
        }}
        rowActions={(contact) => [
          {
            id: "edit",
            label: "Edit",
            icon: <Pencil size={13} />,
            onClick: () => openEditModal(contact),
          },
          {
            id: "delete",
            label: "Delete",
            icon: <Trash2 size={13} />,
            tone: "danger",
            onClick: () => handleDeleteOne(contact.id),
          },
        ]}
        onRowClick={openEditModal}
        getRowClassName={(contact) => (selectedIds.has(contact.id) ? "bg-indigo-50/60" : "")}
        renderMobileCard={(contact, helpers) => renderMobileCard(contact, helpers.actions)}
        minTableWidth={980}
        mobileLoadMore={{
          hasMore: safePage < totalPages,
          loading: mobileLoadingMore,
          onLoadMore: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
          loadingLabel: "Loading more contacts...",
        }}
        footer={
          !loading ? (
            <ContactsPagination
              totalContacts={totalContacts}
              currentPage={safePage}
              totalPages={totalPages}
              visibleCount={contacts.length}
              setCurrentPage={setCurrentPage}
            />
          ) : null
        }
      />
    </>
  );
}
