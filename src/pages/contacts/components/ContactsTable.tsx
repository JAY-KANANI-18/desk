import {
  Pencil,
  Trash2,
  X,
} from "@/components/ui/icons";
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
import { FeatureGate, useFeatureFlags, type FeatureFlags } from "../../../context/FeatureFlagContext";
import { getIntegrationMetadata } from "../../../config/integrationMetadata";

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
  "bg-[var(--color-primary)]": "var(--color-primary)",
  "bg-pink-500": "#ec4899",
};

const CONTACT_TABLE_MIN_WIDTH = 1600;
const DESKTOP_VISIBLE_TAGS = 2;
const DESKTOP_TAG_MAX_WIDTH = 184;

const CONTACT_COLUMN_WIDTHS = {
  select: 40,
  name: 250,
  channel: 132,
  source: 120,
  assignee: 140,
  lifecycle: 160,
  email: 280,
  phone: 124,
  tags: 300,
} as const;

const CONTACT_COLUMN_CLASS_NAMES = {
  select: "w-10 max-w-10",
  name: "w-[250px] max-w-[250px]",
  channel: "w-[132px] max-w-[132px] overflow-hidden",
  source: "w-[120px] max-w-[120px] overflow-hidden",
  assignee: "w-[140px] max-w-[140px]",
  lifecycle: "w-[160px] max-w-[160px]",
  email: "w-[280px] max-w-[280px]",
  phone: "w-[124px] max-w-[124px]",
  tags: "w-[300px] max-w-[300px]",
} as const;

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
    return { label: contact.lifecycle, color: "var(--color-primary)" };
  }

  if (contact.lifecycle && typeof contact.lifecycle === "object") {
    return {
      label: [contact.lifecycle.emoji, contact.lifecycle.name].filter(Boolean).join(" "),
      color: "var(--color-primary)",
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

function getContactDisplayName(contact: Contact) {
  return getContactName(contact) || contact.email || contact.phone || "Unknown contact";
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
    <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden">
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

type ContactIntegrationSource = NonNullable<Contact["contactIntegrations"]>[number];

function getIntegrationSourceProvider(source: ContactIntegrationSource) {
  return (source.provider ?? source.integration?.provider ?? "").toLowerCase();
}

function isIntegrationSourceFeatureEnabled(provider: string, flags: FeatureFlags) {
  if (provider === "shopify") return flags.shopifyIntegration;
  if (provider === "meta_ads") return flags.metaAdsIntegration;
  return true;
}

function getVisibleIntegrationSources(contact: Contact, flags: FeatureFlags) {
  return (contact.contactIntegrations ?? []).filter((source) =>
    isIntegrationSourceFeatureEnabled(getIntegrationSourceProvider(source), flags),
  );
}

function IntegrationSourceIcons({
  contact,
  compact = false,
  flags,
}: {
  contact: Contact;
  compact?: boolean;
  flags: FeatureFlags;
}) {
  const sources = getVisibleIntegrationSources(contact, flags);
  const visibleSources = sources.slice(0, MAX_VISIBLE_CHANNELS);
  const overflowSources = Math.max(
    0,
    sources.length - MAX_VISIBLE_CHANNELS,
  );

  if (visibleSources.length === 0) {
    return <span className="text-sm text-gray-300">-</span>;
  }

  return (
    <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden">
      {visibleSources.map((source, index) => {
        const provider = source.provider ?? source.integration?.provider ?? "";
        const metadata = getIntegrationMetadata(provider);
        const accountName =
          source.integration?.externalAccountName ??
          source.resource?.name ??
          source.integration?.name;
        const externalLabel = source.externalId ? ` (${source.externalId})` : "";
        const providerName = metadata?.name ?? (provider || "Integration");
        const label = [
          providerName,
          accountName ? `from ${accountName}` : null,
          source.role ? `${source.role}${externalLabel}` : externalLabel.trim(),
        ].filter(Boolean).join(" - ");
        const initials = providerName.slice(0, 2).toUpperCase();

        return (
          <Tooltip
            key={`${provider}-${source.externalId ?? index}`}
            content={label}
            position="top"
          >
            <div className={`flex items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm ${compact ? "h-7 w-7" : "h-6 w-6"}`}>
              {metadata?.simpleIconUrl ? (
                <img
                  src={metadata.simpleIconUrl}
                  alt={metadata.name}
                  className={compact ? "h-4 w-4 object-contain" : "h-3.5 w-3.5 object-contain"}
                />
              ) : (
                <span className="text-[9px] font-semibold text-slate-500">{initials}</span>
              )}
            </div>
          </Tooltip>
        );
      })}
      {overflowSources > 0 ? (
        <span className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 font-semibold text-slate-500 ${compact ? "h-7 min-w-7 text-[10px]" : "h-6 min-w-6 text-[10px]"}`}>
          +{overflowSources}
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
  const { flags } = useFeatureFlags();
  const showIntegrationSources =
    flags.shopifyIntegration ||
    flags.metaAdsIntegration ||
    contacts.some((contact) => getVisibleIntegrationSources(contact, flags).length > 0);
  const tableMinWidth =
    CONTACT_TABLE_MIN_WIDTH - (showIntegrationSources ? 0 : CONTACT_COLUMN_WIDTHS.source);
  const tagMetaById = new Map(availableTags.map((tag) => [String(tag.id), tag]));
  const tagMetaByName = new Map(availableTags.map((tag) => [tag.name, tag]));

  const renderTags = (contact: Contact, mobile = false) => {
    if (!contact.tags?.length) {
      return <span className="text-sm text-gray-300">-</span>;
    }

    const visibleTagLimit = mobile ? MAX_VISIBLE_TAGS : DESKTOP_VISIBLE_TAGS;

    return (
      <div className={`flex min-w-0 max-w-full ${mobile ? "flex-wrap gap-1.5" : "items-center gap-1 overflow-hidden"}`}>
        {contact.tags.slice(0, visibleTagLimit).map((tag, index) => {
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
                maxWidth={mobile ? undefined : DESKTOP_TAG_MAX_WIDTH}
                className="shrink-0"
              />
            )
          );
        })}
        {contact.tags.length > visibleTagLimit ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">
            +{contact.tags.length - visibleTagLimit}
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
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.select,
      className: CONTACT_COLUMN_CLASS_NAMES.select,
      width: CONTACT_COLUMN_WIDTHS.select,
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
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.name,
      className: `${CONTACT_COLUMN_CLASS_NAMES.name} overflow-hidden`,
      width: CONTACT_COLUMN_WIDTHS.name,
      cell: (contact) => {
        const displayName = getContactDisplayName(contact);

        return (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar
              src={contact.avatarUrl ?? undefined}
              name={displayName}
              size="sm"
            />
            <TruncatedText
              text={displayName}
              maxLines={1}
              maxLength={42}
              className="min-w-0 text-sm font-medium text-gray-800"
            />
          </div>
        );
      },
    },
    {
      id: "channel",
      header: "Channel",
      mobile: "detail",
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.channel,
      className: CONTACT_COLUMN_CLASS_NAMES.channel,
      width: CONTACT_COLUMN_WIDTHS.channel,
      cell: (contact) => <ChannelIcons contact={contact} />,
    },
    ...(showIntegrationSources
      ? [
          {
            id: "source",
            header: "Source",
            mobile: "detail",
            headerClassName: CONTACT_COLUMN_CLASS_NAMES.source,
            className: CONTACT_COLUMN_CLASS_NAMES.source,
            width: CONTACT_COLUMN_WIDTHS.source,
            cell: (contact) => <IntegrationSourceIcons contact={contact} flags={flags} />,
          } satisfies DataTableColumn<Contact, SortField>,
        ]
      : []),
    {
      id: "assignee",
      header: "Assignee",
      mobile: "detail",
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.assignee,
      className: `${CONTACT_COLUMN_CLASS_NAMES.assignee} overflow-hidden`,
      width: CONTACT_COLUMN_WIDTHS.assignee,
      cell: (contact) => {
        const assigneeName = getAssigneeName(contact, workspaceUsers);
        return assigneeName ? (
          <TruncatedText
            text={assigneeName}
            maxLines={1}
            maxLength={22}
            className="min-w-0 text-gray-800"
          />
        ) : (
          <span className="text-xs text-gray-300">-</span>
        );
      },
    },
    ...(flags.lifecycle
      ? [
          {
            id: "lifecycle",
            header: "Lifecycle",
            sortable: true,
            sortField: "lifecycle",
            mobile: "secondary",
            headerClassName: CONTACT_COLUMN_CLASS_NAMES.lifecycle,
            className: `${CONTACT_COLUMN_CLASS_NAMES.lifecycle} overflow-hidden`,
            width: CONTACT_COLUMN_WIDTHS.lifecycle,
            cell: (contact) => {
              const lifecycleLabel = getLifecycleLabel(contact, stages);
              return lifecycleLabel === "-" ? (
                <span className="text-xs text-gray-300">-</span>
              ) : (

                <TruncatedText
                  text={lifecycleLabel}
                  maxLines={1}
                  maxLength={22}
                  className="min-w-0 text-gray-800"
                />
              
              );
            },
          } satisfies DataTableColumn<Contact, SortField>,
        ]
      : []),
    {
      id: "email",
      header: "Email",
      sortable: true,
      sortField: "email",
      mobile: "detail",
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.email,
      className: `${CONTACT_COLUMN_CLASS_NAMES.email} overflow-hidden`,
      width: CONTACT_COLUMN_WIDTHS.email,
      cell: (contact) =>
        contact.email ? (
          <TruncatedText
            text={contact.email}
            maxLines={1}
            maxLength={46}
            className="min-w-0 text-gray-800"
          />
        ) : (
          <span className="text-xs text-gray-300">-</span>
        ),
    },
    {
      id: "phone",
      header: "Phone",
      sortable: true,
      sortField: "phone",
      mobile: "detail",
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.phone,
      className: `${CONTACT_COLUMN_CLASS_NAMES.phone} overflow-hidden`,
      width: CONTACT_COLUMN_WIDTHS.phone,
      cell: (contact) => (
        contact.phone ? (
          <TruncatedText
            text={contact.phone}
            maxLines={1}
            maxLength={18}
            className="min-w-0 text-gray-800"
          />
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )
      ),
    },
    {
      id: "tags",
      header: "Tags",
      mobile: "detail",
      headerClassName: CONTACT_COLUMN_CLASS_NAMES.tags,
      className: `${CONTACT_COLUMN_CLASS_NAMES.tags} overflow-hidden`,
      width: CONTACT_COLUMN_WIDTHS.tags,
      cell: (contact) => renderTags(contact),
    },
  ];

  const renderMobileCard = (contact: Contact) => {
    const lifecycle = getLifecycleMeta(contact, stages);

    return (
      <article
        key={contact.id}
        className="relative min-w-0 max-w-full overflow-visible rounded-2xl bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors"
      >
        <div className="min-w-0">
          <div className="min-w-0 space-y-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => openEditModal(contact)}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2"
              >
                <Avatar
                  src={contact.avatarUrl ?? undefined}
                  name={getContactName(contact)}
                  size="base"
                />

                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold leading-tight text-slate-900">
                      {getContactName(contact)}
                    </p>
                    <FeatureGate flag="lifecycle">
                      <div className={`mt-1 flex min-w-0 flex-wrap items-center gap-2 ${ lifecycle.label ?  "text-slate-400" : "text-gray-300"}`}>
                        <span className="text-xs"
                         
                        > {lifecycle.label}</span>
                      </div>
                    </FeatureGate>
                  </div>
                </div>
              </button>

              <div className="flex flex-shrink-0 items-center gap-1">
                <ChannelIcons contact={contact} compact />
                {showIntegrationSources ? (
                  <IntegrationSourceIcons contact={contact} compact flags={flags} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      {someSelected ? (
        <div className="flex flex-wrap items-center gap-3 bg-[var(--color-primary)] px-4 py-3 text-sm text-white">
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
        getRowClassName={(contact) => (selectedIds.has(contact.id) ? "bg-[var(--color-primary-light)]" : "")}
        renderMobileCard={(contact) => renderMobileCard(contact)}
        minTableWidth={tableMinWidth}
        density="compact"
        tableLayout="fixed"
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
