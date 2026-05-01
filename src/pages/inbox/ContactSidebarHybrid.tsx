import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  GitMerge,
  Loader2,
  Mail,
  Phone,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react';
import {
  contactsApi,
  type ContactDuplicateSuggestion,
  type ContactMergePreview,
} from '../../lib/contactApi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceApi } from '../../lib/workspaceApi';
import { AiConversationPanel } from '../../modules/ai-agents/components/AiConversationPanel';
import type { LifecycleStage } from '../workspace/types';
import { ContactSidebarDesktopShell } from './contact-sidebar/DesktopShell';
import { ContactNameRow, FieldRow } from './contact-sidebar/EditableRows';
import { MergeModal } from './contact-sidebar/MergeModal';
import type {
  SidebarContact,
  SidebarConversation,
  WorkspaceTag,
  WorkspaceUserLike,
} from './contact-sidebar/types';
import {
  CHANNEL_META,
  conflictFromReasons,
  contactName,
  resolveLifecycleLabel,
} from './contact-sidebar/utils';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Tooltip } from '../../components/ui/Tooltip';
import { IconButton } from '../../components/ui/button/IconButton';
import {
  AssigneeSelectMenu,
  LifecycleSelectMenu,
  WorkspaceTagManager,
  type WorkspaceTagSelectOption,
} from '../../components/ui/select';

export interface ContactSidebarHybridProps {
  selectedConversation?: SidebarConversation | null;
  contactDetails: SidebarContact | null;
  mode?: 'desktop' | 'mobile';
  workspaceUsers?: WorkspaceUserLike[] | null;
  lifecycleStages?: LifecycleStage[];
  refreshContact?: () => Promise<void>;
  refreshConversations?: () => Promise<SidebarConversation[]>;
  conversationList?: SidebarConversation[];
  onSelectConversation?: (conversation: SidebarConversation) => void;
  onDelete?: () => void;
  onContactChange?: (contact: SidebarContact) => void | Promise<void>;
  showAiPanel?: boolean;
  desktopVariant?: 'inline' | 'floating';
  desktopEyebrow?: string;
  desktopTitle?: string;
  onDesktopClose?: () => void;
  desktopContainerClassName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readOptionalString(value: unknown): string | null | undefined {
  return typeof value === 'string' ? value : undefined;
}

function workspaceTagFromOptionData(data: unknown): WorkspaceTag | null {
  if (!isRecord(data)) return null;

  const rawId = data.id;
  const rawName = data.name;
  if (
    (typeof rawId !== 'string' && typeof rawId !== 'number') ||
    typeof rawName !== 'string'
  ) {
    return null;
  }

  const rawBundle = data.bundle;
  const bundle = isRecord(rawBundle)
    ? {
        color: readOptionalString(rawBundle.color),
        emoji: readOptionalString(rawBundle.emoji),
        description: readOptionalString(rawBundle.description),
      }
    : undefined;

  return {
    id: String(rawId),
    name: rawName,
    color: readOptionalString(data.color),
    emoji: readOptionalString(data.emoji),
    description: readOptionalString(data.description),
    bundle,
  };
}

export function ContactSidebarHybrid({
  selectedConversation = null,
  contactDetails,
  mode = 'desktop',
  workspaceUsers,
  lifecycleStages,
  refreshContact,
  refreshConversations,
  conversationList = [],
  onSelectConversation,
  onDelete,
  onContactChange,
  showAiPanel = Boolean(selectedConversation?.id),
  desktopVariant = 'inline',
  desktopEyebrow,
  desktopTitle,
  onDesktopClose,
  desktopContainerClassName,
}: ContactSidebarHybridProps) {
  const { workspaceUsers: workspaceUsersFromContext } = useWorkspace();
  const isMobileMode = mode === 'mobile';
  const [currentContact, setCurrentContact] = useState<SidebarContact | null>(contactDetails);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [duplicateSuggestions, setDuplicateSuggestions] = useState<ContactDuplicateSuggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<ContactMergePreview | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const [workspaceTags, setWorkspaceTags] = useState<WorkspaceTag[]>([]);
  const [tagBusyName, setTagBusyName] = useState<string | null>(null);
  const [identifierCopied, setIdentifierCopied] = useState(false);
  const [loadedLifecycleStages, setLoadedLifecycleStages] = useState<LifecycleStage[]>(lifecycleStages ?? []);

  const contact = currentContact ?? contactDetails;
  const resolvedWorkspaceUsers = workspaceUsers ?? workspaceUsersFromContext;
  const resolvedLifecycleStages = lifecycleStages?.length ? lifecycleStages : loadedLifecycleStages;
  const channels = useMemo(() => ((contact as any)?.contactChannels ?? []) as any[], [contact]);
  const selectedSuggestion = useMemo(
    () => duplicateSuggestions.find((item) => String((item.contact as any).id) === selectedSuggestionId) ?? duplicateSuggestions[0] ?? null,
    [duplicateSuggestions, selectedSuggestionId],
  );
  const tagMetaByValue = useMemo(
    () =>
      workspaceTags.reduce<Record<string, WorkspaceTag>>((acc, tag) => {
        acc[tag.name] = {
          ...tag,
          color: tag.bundle?.color || tag.color,
          emoji: tag.bundle?.emoji || tag.emoji,
          description: tag.bundle?.description || tag.description,
        };
        acc[String(tag.id)] = acc[tag.name];
        return acc;
      }, {}),
    [workspaceTags],
  );
  const visibleContactTags = useMemo(() => {
    const rawTagNames = Array.isArray(contact?.tags) ? contact.tags : [];
    const rawTagIds = Array.isArray(contact?.tagIds) ? contact.tagIds : [];
    const rawTags = rawTagNames.length ? rawTagNames : rawTagIds;
    const tagsByKey = new Map<
      string,
      {
        key: string;
        id?: string;
        name: string;
        color?: string | null;
        emoji?: string | null;
      }
    >();

    rawTags.forEach((rawTag, index) => {
      const value = String(rawTag ?? '').trim();
      if (!value) return;

      const fallbackId = rawTagIds[index] ? String(rawTagIds[index]) : undefined;
      const meta = tagMetaByValue[value] ?? (fallbackId ? tagMetaByValue[fallbackId] : undefined);
      const id = meta?.id ? String(meta.id) : fallbackId;
      const name = meta?.name ?? value;
      const key = id ? `tag-id-${id}` : `tag-name-${name}`;

      if (!tagsByKey.has(key)) {
        tagsByKey.set(key, {
          key,
          id,
          name,
          color: meta?.color,
          emoji: meta?.emoji,
        });
      }
    });

    return Array.from(tagsByKey.values());
  }, [contact?.tagIds, contact?.tags, tagMetaByValue]);
  const visibleContactTagValues = useMemo(
    () => visibleContactTags.map((tag) => tag.id ?? tag.name),
    [visibleContactTags],
  );
  const contactTagOptions = useMemo(() => {
    const options = workspaceTags.map((tag) => ({
      value: String(tag.id),
      label: tag.name,
      color: tag.bundle?.color || tag.color || 'tag-indigo',
      emoji: tag.bundle?.emoji || tag.emoji || '\u{1F3F7}\uFE0F',
      description: tag.bundle?.description || tag.description,
      data: tag,
      busy: tagBusyName === tag.name,
    }));
    const existingValues = new Set(options.map((option) => option.value));

    visibleContactTags.forEach((tag) => {
      const value = tag.id ?? tag.name;
      if (existingValues.has(value)) {
        return;
      }

      options.unshift({
        value,
        label: tag.name,
        color: tag.color || 'tag-indigo',
        emoji: tag.emoji || '\u{1F3F7}\uFE0F',
        data: tagMetaByValue[value] ?? null,
        busy: tagBusyName === tag.name || tagBusyName === tag.id,
      });
    });

    return options;
  }, [tagBusyName, visibleContactTags, workspaceTags]);
  const lifecycleValue = contact?.lifecycleId != null ? String(contact.lifecycleId) : '';
  const lifecycleFallbackLabel = lifecycleValue
    ? resolveLifecycleLabel(contact, resolvedLifecycleStages)
    : undefined;
  const assigneeValue = contact?.assigneeId ? String(contact.assigneeId) : '';

  useEffect(() => {
    setCurrentContact(contactDetails);
  }, [contactDetails]);

  useEffect(() => {
    if (lifecycleStages?.length) {
      setLoadedLifecycleStages(lifecycleStages);
    }
  }, [lifecycleStages]);

  useEffect(() => {
    if (lifecycleStages?.length) return;

    let cancelled = false;

    async function loadLifecycleStages() {
      try {
        const response = await workspaceApi.getLifecycleStages();
        if (!cancelled) {
          setLoadedLifecycleStages(Array.isArray(response) ? response : []);
        }
      } catch {
        if (!cancelled) {
          setLoadedLifecycleStages([]);
        }
      }
    }

    void loadLifecycleStages();
    return () => {
      cancelled = true;
    };
  }, [lifecycleStages]);

  useEffect(() => {
    let cancelled = false;

    async function loadDuplicates() {
      if (!contact?.id || (contact as any)?.mergedIntoContactId) {
        setDuplicateSuggestions([]);
        setSelectedSuggestionId(null);
        return;
      }

      setDuplicatesLoading(true);
      try {
        const response = await contactsApi.getDuplicateSuggestions(contact.id);
        if (!cancelled) {
          setDuplicateSuggestions(response.suggestions);
          setSelectedSuggestionId(response.suggestions[0] ? String((response.suggestions[0].contact as any).id) : null);
        }
      } catch {
        if (!cancelled) {
          setDuplicateSuggestions([]);
          setSelectedSuggestionId(null);
        }
      } finally {
        if (!cancelled) setDuplicatesLoading(false);
      }
    }

    void loadDuplicates();
    return () => {
      cancelled = true;
    };
  }, [contact?.id, (contact as any)?.mergedIntoContactId]);

  useEffect(() => {
    setActiveField(null);
    setActivePreview(null);
  }, [contact?.id, selectedConversation?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaceTags() {
      if (!contact?.id) return;

      try {
        const response = await workspaceApi.getTags();
        if (!cancelled) {
          setWorkspaceTags(Array.isArray(response) ? response : []);
        }
      } catch {
        if (!cancelled) {
          setWorkspaceTags([]);
        }
      }
    }

    void loadWorkspaceTags();
    return () => {
      cancelled = true;
    };
  }, [contact?.id]);

  const flash = () => {
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 1800);
  };

  const syncExternalContact = async (nextContact: SidebarContact) => {
    await Promise.allSettled([
      Promise.resolve(onContactChange?.(nextContact)),
      Promise.resolve(refreshContact?.()),
    ]);
  };

  const refreshSidebarContact = async (contactId = contact?.id) => {
    if (!contactId) return null;

    const refreshed = (await contactsApi.getContact(contactId)) as SidebarContact;
    setCurrentContact(refreshed);
    await syncExternalContact(refreshed);
    return refreshed;
  };

  const persist = async (updates: Partial<SidebarContact>) => {
    if (!contact?.id) return;

    const merged = { ...contact, ...updates };
    setContactLoading(true);
    try {
      await contactsApi.updateContact(contact.id, {
        firstName: merged.firstName ?? '',
        lastName: merged.lastName ?? undefined,
        email: merged.email ?? undefined,
        phone: merged.phone ?? undefined,
        company: merged.company ?? undefined,
      });
      await refreshSidebarContact(contact.id);
      flash();
    } finally {
      setContactLoading(false);
    }
  };

  const persistLifecycle = async (nextLifecycleId: string) => {
    if (!contact?.id) return;

    setContactLoading(true);
    try {
      await contactsApi.updateContactLifecycle(contact.id, nextLifecycleId || null);
      await refreshSidebarContact(contact.id);
      flash();
    } finally {
      setContactLoading(false);
    }
  };

  const persistAssignee = async (nextAssigneeId: string) => {
    if (!contact?.id) return;

    setContactLoading(true);
    try {
      await contactsApi.assignContact(contact.id, {
        assigneeId: nextAssigneeId || null,
      });
      await refreshSidebarContact(contact.id);
      flash();
    } finally {
      setContactLoading(false);
    }
  };

  const attachTag = async (tag: WorkspaceTag) => {
    if (!contact?.id) return;
    setTagBusyName(tag.name);
    try {
      await contactsApi.addTagToContact(contact.id, tag.id);
      await refreshSidebarContact(contact.id);
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const detachTag = async (tagName: string, fallbackTag?: WorkspaceTag | null) => {
    if (!contact?.id) return;
    const match =
      fallbackTag ??
      workspaceTags.find((tag) => tag.name === tagName || String(tag.id) === String(tagName));
    if (!match) return;

    setTagBusyName(match.name);
    try {
      await contactsApi.removeTagFromContact(contact.id, match.id);
      await refreshSidebarContact(contact.id);
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const toggleContactTag = async (
    option: WorkspaceTagSelectOption,
    nextSelected: boolean,
  ) => {
    const optionTag = workspaceTagFromOptionData(option.data);

    if (nextSelected) {
      const match =
        optionTag ??
        workspaceTags.find(
          (tag) => String(tag.id) === option.value || tag.name === option.label,
        );
      if (match) {
        await attachTag(match);
      }
      return;
    }

    await detachTag(option.value, optionTag);
  };

  const openMergeModal = async () => {
    if (!contact?.id || !selectedSuggestion) return;

    setPreviewLoading(true);
    try {
      const preview = await contactsApi.getMergePreview(contact.id, (selectedSuggestion.contact as any).id);
      setActivePreview(preview);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMerge = async (resolution: Record<string, any>) => {
    if (!contact?.id || !activePreview) return;

    setMergeLoading(true);
    try {
      const mergeResult = await contactsApi.mergeContactIntoPrimary(contact.id, (activePreview.secondary as any).id, {
        source: selectedConversation ? 'inbox_sidebar' : 'contacts_sidebar',
        confidenceScore: activePreview.confidenceScore,
        reasonCodes: activePreview.reasonCodes,
        resolution,
      });
      const refreshedConversations = refreshConversations ? await refreshConversations() : [];
      await refreshSidebarContact(contact.id);
      const response = await contactsApi.getDuplicateSuggestions(contact.id);
      setDuplicateSuggestions(response.suggestions);
      setSelectedSuggestionId(response.suggestions[0] ? String((response.suggestions[0].contact as any).id) : null);
      setActivePreview(null);

      if (mergeResult.survivorConversationId && onSelectConversation) {
        const survivorConversation =
          refreshedConversations.find((conversation) => conversation.id === mergeResult.survivorConversationId) ??
          conversationList.find((conversation) => conversation.id === mergeResult.survivorConversationId);

        if (survivorConversation) {
          onSelectConversation(survivorConversation);
        }
      }

      flash();
    } finally {
      setMergeLoading(false);
    }
  };

  const conflictField = selectedSuggestion ? conflictFromReasons(selectedSuggestion.reasons) : 'email';
  const showWorkspaceDetails = !selectedConversation;
  const contactIdentifier =
    (typeof (contact as any)?.identifier === 'string' && (contact as any).identifier.trim()) ||
    channels.find((channel) => channel?.identifier)?.identifier ||
    String(contact?.id ?? '');
  const fieldProps = {
    activeField,
    onActivate: setActiveField,
    onDeactivate: () => setActiveField(null),
  };
  const isEditingName = activeField === 'name';

  const desktopHeaderContent =
    desktopEyebrow || desktopTitle ? (
      <div className="flex min-h-[26px] items-center">
        <h2 className="truncate text-[14px] font-semibold text-[#1c2030]">
          {desktopTitle || desktopEyebrow}
        </h2>
      </div>
    ) : null;

  const loadingBody = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
            <Loader2 size={18} className="animate-spin text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Loading contact</p>
            <p className="text-xs text-gray-500">Updating sidebar details</p>
          </div>
        </div>
      </div>
    </div>
  );

  const loadedBody = contact ? (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white">
      <div className="relative px-4 pt-5 pb-4">
        {flashSaved ? (
          <div className="absolute top-3 right-4 flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg animate-pulse">
            <CheckCircle2 size={10} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-semibold">Saved</span>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Avatar
                src={contact?.avatarUrl ?? undefined}
                name={contactName(contact)}
                size="base"
                fallbackTone="neutral"
              />
            </div>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <p className="truncate text-[15px] font-semibold leading-tight text-[#1c2030]">
                  {contactName(contact)}
                </p>
              ) : (
                <ContactNameRow
                  {...fieldProps}
                  fieldKey="name"
                  firstName={contact?.firstName ?? ''}
                  lastName={contact?.lastName ?? ''}
                  displayName={contactName(contact)}
                  onSave={(value) => persist(value)}
                />
              )}
              <div className="group/row mt-0.5 flex items-center gap-1.5">
                <p className="truncate text-[11px] text-[#4b5563]">
                  ID: {contactIdentifier}
                </p>
                {contactIdentifier ? (
                  <Tooltip content={identifierCopied ? 'Copied' : 'Copy contact ID'}>
                    <span className="inline-flex shrink-0 opacity-60 transition-opacity md:pointer-events-none md:opacity-0 md:group-hover/row:pointer-events-auto md:group-hover/row:opacity-70 md:group-focus-within/row:pointer-events-auto md:group-focus-within/row:opacity-100">
                      <IconButton
                        type="button"
                        aria-label={identifierCopied ? 'Copied' : 'Copy contact ID'}
                        icon={
                          identifierCopied ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )
                        }
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(contactIdentifier).catch(() => undefined);
                          setIdentifierCopied(true);
                          setTimeout(() => setIdentifierCopied(false), 1500);
                        }}
                      />
                    </span>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>

          {isEditingName ? (
            <ContactNameRow
              {...fieldProps}
              fieldKey="name"
              firstName={contact?.firstName ?? ''}
              lastName={contact?.lastName ?? ''}
              displayName={contactName(contact)}
              onSave={(value) => persist(value)}
            />
          ) : null}
        </div>
      </div>

      {(contact as any)?.mergedIntoContact ? (
        <div className="mx-4 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-[#f3d9b8] bg-[#fff4e7]">
          <AlertTriangle size={12} className="text-[#c47a1f] mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#8b5a17]">
            This contact was already merged into <b>{contactName((contact as any).mergedIntoContact)}</b>.
          </p>
        </div>
      ) : null}

      {!duplicatesLoading && selectedSuggestion ? (
        <div className="mx-4 mb-2">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-amber-700 leading-5">
                <b>{contactName(selectedSuggestion.contact as SidebarContact)}</b> is a merge suggestion.
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Suggested from identity overlap</p>
              <Button
                type="button"
                onClick={() => void openMergeModal()}
                loading={previewLoading}
                loadingMode="inline"
                variant="link"
                size="xs"
                leftIcon={<GitMerge size={11} />}
              >
                Merge
              </Button>
            </div>
          </div>

          {duplicateSuggestions.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {duplicateSuggestions.map((item) => {
                const active = String((item.contact as any).id) === String((selectedSuggestion.contact as any).id);
                return (
                  <Button
                    key={(item.contact as any).id}
                    type="button"
                    onClick={() => setSelectedSuggestionId(String((item.contact as any).id))}
                    size="xs"
                    radius="full"
                    variant={active ? 'primary' : 'secondary'}
                  >
                    {contactName(item.contact as SidebarContact)}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {channels.length ? (
        <div className="mx-4 mb-2">
          <div className="flex items-center gap-1.5">
            {channels.map((channel) => {
              const meta = CHANNEL_META[channel.channelType] ?? {
                ...CHANNEL_META.webchat,
                label: channel.channelType || CHANNEL_META.webchat.label,
              };
              const channelKey = String(
                channel.id ??
                  channel.channelId ??
                  `${channel.channelType}-${channel.identifier}`,
              );

              return (
                <Tooltip
                  key={channelKey}
                  content={
                    <div className="min-w-[180px]">
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/70">
                        {meta.label}
                      </p>
                      <p className="mt-1 break-all text-[11px] text-white">
                        {channel.identifier || 'No identifier available'}
                      </p>
                      {channel.displayName ? (
                        <p className="mt-0.5 text-[10px] text-white/80">{channel.displayName}</p>
                      ) : null}
                    </div>
                  }
                >
                  <span
                    tabIndex={0}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[#f3f5f9] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-1"
                  >
                    <img src={meta.icon} alt={meta.label} className="w-3.5 h-3.5 object-contain opacity-80" />
                  </span>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mx-4 border-t border-[#eef1f6]" />

      <div className="px-4 py-3.5 space-y-4">
        <FieldRow
          {...fieldProps}
          fieldKey="email"
          label="Email"
          icon={<Mail size={10} />}
          value={contact?.email ?? ''}
          placeholder="Add email address"
          type="email"
          copyable
          warn={!!selectedSuggestion && conflictField === 'email'}
          onSave={(value) => persist({ email: value })}
        />
        <FieldRow
          {...fieldProps}
          fieldKey="phone"
          label="Phone"
          icon={<Phone size={10} />}
          value={contact?.phone ?? ''}
          placeholder="Add phone number"
          type="tel"
          copyable
          warn={!!selectedSuggestion && conflictField === 'phone'}
          onSave={(value) => persist({ phone: value })}
        />
        <FieldRow
          {...fieldProps}
          fieldKey="company"
          label="Company"
          icon={<Building2 size={10} />}
          value={contact?.company ?? ''}
          placeholder="Add company"
          copyable
          onSave={(value) => persist({ company: value })}
        />
      </div>

      {showWorkspaceDetails ? (
        <>
          <div className="mx-4 border-t border-[#f0f2f8]" />

          <div className="px-4 py-3.5 space-y-4">
            <div className={`transition-opacity ${activeField !== null ? 'opacity-50 pointer-events-none select-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[#8b95a5]"><Workflow size={10} /></span>
                <span className="text-[10px] font-semibold uppercase text-[#5f6b7a]">Lifecycle</span>
              </div>
              <LifecycleSelectMenu
                value={lifecycleValue}
                stages={resolvedLifecycleStages}
                onChange={(stageId) => {
                  void persistLifecycle(stageId ?? '');
                }}
                variant="sidebar"
                noneLabel="No Stage"
                fallbackLabel={lifecycleFallbackLabel}
                dropdownPlacement="top"
                dropdownAlign="end"
                dropdownWidth="sm"
              />
            </div>
            <div className={`transition-opacity ${activeField !== null ? 'opacity-50 pointer-events-none select-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[#8b95a5]"><Users size={10} /></span>
                <span className="text-[10px] font-semibold uppercase text-[#5f6b7a]">Assignee</span>
              </div>
              <AssigneeSelectMenu
                value={assigneeValue}
                users={resolvedWorkspaceUsers ?? []}
                onChange={(userId) => {
                  void persistAssignee(userId ?? '');
                }}
                variant="sidebar"
                dropdownPlacement="top"
                dropdownAlign="end"
                dropdownWidth="sm"
                searchable
              />
            </div>
          </div>

          <div className="mx-4 border-t border-[#f0f2f8]" />
        </>
      ) : (
        <div className="mx-4 border-t border-[#f0f2f8]" />
      )}

      <div className="px-4 py-3.5">
        <WorkspaceTagManager
          label="Tags"
          labelAppearance="sidebar"
          options={contactTagOptions}
          value={visibleContactTagValues}
          onToggleOption={toggleContactTag}
          searchPlaceholder="Search and select tags"
          emptyMessage="No matching workspace tags."
          emptyActionLabel={(query) => `Create "${query}" tag`}
          allowCreate
          createActionLabel="Add tag"
          selectedDisplay="below"
          selectedAppearance="tag"
          optionAppearance="tag"
          dropdownPlacement="top"
          dropdownAlign="end"
          dropdownWidth="sm"
          menuTitle=""
          emptySelectedContent={
            <span className="text-[12px] text-[#9ca3af] italic">No tags added</span>
          }
        />
      </div>

      {onDelete ? (
        <>
          <div className="mx-4 border-t border-[#f0f2f8]" />
          <div className="px-4 py-4">
            <Button
              type="button"
              onClick={onDelete}
              variant="danger-ghost"
              
              leftIcon={<Trash2 size={13} />}
            >
              Delete contact
            </Button>
          </div>
        </>
      ) : null}

      {showAiPanel && selectedConversation?.id ? (
        <AiConversationPanel conversationId={selectedConversation.id} />
      ) : null}
    </div>
  ) : null;

  const sidebarBody = !contact || contactLoading ? loadingBody : loadedBody;

  const modalLayer = (
    <>
      {activePreview && selectedSuggestion ? (
        <MergeModal
          current={contact as SidebarContact}
          duplicate={selectedSuggestion.contact as SidebarContact}
          preview={activePreview}
          conflictField={conflictField}
          onMerge={handleMerge}
          onCancel={() => setActivePreview(null)}
          loading={mergeLoading}
        />
      ) : null}

    </>
  );

  if (isMobileMode) {
    return (
      <>
        <div
          className="flex min-h-0 flex-1 flex-col bg-white"
        >
          {sidebarBody}
        </div>
        {modalLayer}
      </>
    );
  }

  return (
    <>
      <ContactSidebarDesktopShell
        variant={desktopVariant}
        headerContent={desktopHeaderContent}
        onClose={onDesktopClose}
        containerClassName={desktopContainerClassName}
      >
        {sidebarBody}
      </ContactSidebarDesktopShell>
      {modalLayer}
    </>
  );
}
