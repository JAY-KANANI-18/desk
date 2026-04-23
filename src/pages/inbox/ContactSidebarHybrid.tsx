import { useEffect, useMemo, useRef, useState } from 'react';
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
  Plus,
  Search,
  Smile,
  Trash2,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import {
  contactsApi,
  type ContactDuplicateSuggestion,
  type ContactMergePreview,
} from '../../lib/contactApi';
import { ContactAvatar } from '../../components/contact/ContactAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceApi } from '../../lib/workspaceApi';
import { AiConversationPanel } from '../../modules/ai-agents/components/AiConversationPanel';
import { getTagSurfaceStyle, TAG_COLOR_OPTIONS } from '../../lib/tagAppearance';
import type { LifecycleStage } from '../workspace/types';
import { EmojiPicker } from './EmojiPicker';
import { ContactSidebarDesktopShell } from './contact-sidebar/DesktopShell';
import { FieldRow, SelectRow } from './contact-sidebar/EditableRows';
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
  resolveAssigneeLabel,
  resolveLifecycleLabel,
  workspaceUserLabel,
} from './contact-sidebar/utils';

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
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [workspaceTags, setWorkspaceTags] = useState<WorkspaceTag[]>([]);
  const [tagBusyName, setTagBusyName] = useState<string | null>(null);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: 'tag-indigo', emoji: '\u{1F600}', description: '' });
  const [creatingTag, setCreatingTag] = useState(false);
  const [identifierCopied, setIdentifierCopied] = useState(false);
  const [loadedLifecycleStages, setLoadedLifecycleStages] = useState<LifecycleStage[]>(lifecycleStages ?? []);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagEmojiRef = useRef<HTMLDivElement>(null);
  const [tagEmojiOpen, setTagEmojiOpen] = useState(false);

  const contact = currentContact ?? contactDetails;
  const resolvedWorkspaceUsers = workspaceUsers ?? workspaceUsersFromContext;
  const resolvedLifecycleStages = lifecycleStages?.length ? lifecycleStages : loadedLifecycleStages;
  const channels = useMemo(() => ((contact as any)?.contactChannels ?? []) as any[], [contact]);
  const selectedSuggestion = useMemo(
    () => duplicateSuggestions.find((item) => String((item.contact as any).id) === selectedSuggestionId) ?? duplicateSuggestions[0] ?? null,
    [duplicateSuggestions, selectedSuggestionId],
  );
  const normalizedTagQuery = tagQuery.trim().toLowerCase();
  const filteredWorkspaceTags = useMemo(
    () =>
      workspaceTags.filter((tag) =>
        !normalizedTagQuery || tag.name.toLowerCase().includes(normalizedTagQuery),
      ),
    [workspaceTags, normalizedTagQuery],
  );
  const exactTagMatch = useMemo(
    () => workspaceTags.find((tag) => tag.name.trim().toLowerCase() === normalizedTagQuery) ?? null,
    [workspaceTags, normalizedTagQuery],
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
  const lifecycleValue = contact?.lifecycleId != null ? String(contact.lifecycleId) : '';
  const lifecycleOptions = useMemo(
    () => [
      { value: '', label: 'No lifecycle' },
      ...resolvedLifecycleStages.map((stage) => ({
        value: String(stage.id),
        label: [stage.emoji, stage.name].filter(Boolean).join(' '),
      })),
    ],
    [resolvedLifecycleStages],
  );
  const assigneeValue = contact?.assigneeId ? String(contact.assigneeId) : '';
  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...(resolvedWorkspaceUsers ?? []).map((user) => ({
        value: String(user.id),
        label: workspaceUserLabel(user),
      })),
    ],
    [resolvedWorkspaceUsers],
  );

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
    setTagPickerOpen(false);
    setTagQuery('');
  }, [contact?.id, selectedConversation?.id]);

  useEffect(() => {
    if (!tagPickerOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!tagDropdownRef.current?.contains(event.target as Node)) {
        setTagPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [tagPickerOpen]);

  useEffect(() => {
    if (!tagEmojiOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!tagEmojiRef.current?.contains(event.target as Node)) {
        setTagEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [tagEmojiOpen]);

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
      setTagQuery('');
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const detachTag = async (tagName: string) => {
    if (!contact?.id) return;
    const match = workspaceTags.find((tag) => tag.name === tagName || String(tag.id) === String(tagName));
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

  const handleCreateTag = async () => {
    const nextName = newTag.name.trim();
    if (!nextName || !contact?.id) return;

    setCreatingTag(true);
    try {
      const created = await workspaceApi.addTag({
        name: nextName,
        color: newTag.color,
        emoji: newTag.emoji,
        description: newTag.description,
      });
      setWorkspaceTags((prev) => [created, ...prev]);
      await contactsApi.addTagToContact(contact.id, created.id);
      await refreshSidebarContact(contact.id);
      setTagQuery('');
      setNewTag({ name: '', color: 'tag-indigo', emoji: '\u{1F600}', description: '' });
      setShowCreateTagModal(false);
      setTagPickerOpen(false);
      setTagEmojiOpen(false);
      flash();
    } finally {
      setCreatingTag(false);
    }
  };

  const openCreateTagModal = () => {
    setNewTag({
      name: tagQuery.trim(),
      color: exactTagMatch?.bundle?.color || exactTagMatch?.color || 'tag-indigo',
      emoji: exactTagMatch?.bundle?.emoji || exactTagMatch?.emoji || '\u{1F600}',
      description: exactTagMatch?.bundle?.description || exactTagMatch?.description || '',
    });
    setShowCreateTagModal(true);
    setTagPickerOpen(false);
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

        <div className="flex items-center gap-3 pr-10">
          <div className="flex-shrink-0">
            <ContactAvatar
              firstName={contact?.firstName ?? undefined}
              lastName={contact?.lastName ?? undefined}
              avatarUrl={contact?.avatarUrl}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-[#1c2030]">
              {contactName(contact)}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="truncate text-[11px] text-[#4b5563]">
                ID: {contactIdentifier}
              </p>
              {contactIdentifier ? (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(contactIdentifier).catch(() => undefined);
                    setIdentifierCopied(true);
                    setTimeout(() => setIdentifierCopied(false), 1500);
                  }}
                  className="inline-flex h-5 w-5 items-center justify-center text-[#98a2b3] transition-colors hover:text-[#1c2030] flex-shrink-0"
                  title="Copy contact ID"
                  aria-label="Copy contact ID"
                >
                  {identifierCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                </button>
              ) : null}
            </div>
          </div>
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
              <button
                onClick={openMergeModal}
                disabled={previewLoading}
                className="mt-2 inline-flex items-center gap-1.5 underline font-bold text-[11px] text-amber-800 disabled:opacity-50"
              >
                {previewLoading ? <Loader2 size={11} className="animate-spin" /> : <GitMerge size={11} />}
                Merge
              </button>
            </div>
          </div>

          {duplicateSuggestions.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {duplicateSuggestions.map((item) => {
                const active = String((item.contact as any).id) === String((selectedSuggestion.contact as any).id);
                return (
                  <button
                    key={(item.contact as any).id}
                    onClick={() => setSelectedSuggestionId(String((item.contact as any).id))}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium border ${
                      active
                        ? 'border-[#1c2030] bg-[#1c2030] text-white'
                        : 'border-[#e2e7f0] text-[#677086] bg-white'
                    }`}
                  >
                    {contactName(item.contact as SidebarContact)}
                  </button>
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
                icon: 'https://cdn.simpleicons.org/googlechat',
                label: channel.channelType || 'Channel',
              };

              return (
                <div
                  key={String(channel.id ?? channel.channelId ?? `${channel.channelType}-${channel.identifier}`)}
                  onMouseEnter={() => setHoveredChannelId(String(channel.id ?? channel.channelId ?? channel.identifier ?? channel.channelType))}
                  onFocus={() => setHoveredChannelId(String(channel.id ?? channel.channelId ?? channel.identifier ?? channel.channelType))}
                  onMouseLeave={() => setHoveredChannelId(null)}
                  className="relative"
                >
                  <button
                    className="w-[24px] h-[24px] rounded-md flex items-center justify-center hover:bg-[#f3f5f9] transition-colors"
                    title={meta.label}
                  >
                    <img src={meta.icon} alt={meta.label} className="w-3.5 h-3.5 object-contain opacity-80" />
                  </button>
                  {hoveredChannelId === String(channel.id ?? channel.channelId ?? channel.identifier ?? channel.channelType) ? (
                    <div className="absolute top-[calc(100%+6px)] left-0 z-20 min-w-[180px] rounded-xl border border-[#e6eaf2] bg-white px-3 py-2 shadow-lg">
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#a8b0c0]">
                        {meta.label}
                      </p>
                      <p className="text-[11px] text-[#5a6280] mt-1 break-all">{channel.identifier}</p>
                      {channel.displayName ? (
                        <p className="text-[10px] text-[#9aa1b2] mt-0.5">{channel.displayName}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="px-4 pt-1 pb-3 space-y-3.5">
        <FieldRow
          {...fieldProps}
          fieldKey="firstName"
          label="First Name"
          value={contact?.firstName ?? ''}
          placeholder="First name"
          onSave={(value) => persist({ firstName: value })}
        />
        <FieldRow
          {...fieldProps}
          fieldKey="lastName"
          label="Last Name"
          value={contact?.lastName ?? ''}
          placeholder="Last name"
          onSave={(value) => persist({ lastName: value })}
        />
      </div>

      <div className="mx-4 border-t border-[#f0f2f8]" />

      <div className="px-4 py-3 space-y-3.5">
        <FieldRow
          {...fieldProps}
          fieldKey="email"
          label="Email"
          icon={<Mail size={10} />}
          value={contact?.email ?? ''}
          placeholder="email@example.com"
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
          placeholder="+1 234 567 8900"
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
          placeholder="Company name"
          copyable
          onSave={(value) => persist({ company: value })}
        />
      </div>

      {showWorkspaceDetails ? (
        <>
          <div className="mx-4 border-t border-[#f0f2f8]" />

          <div className="px-4 py-3 space-y-3.5">
            <SelectRow
              {...fieldProps}
              fieldKey="lifecycle"
              label="Lifecycle"
              icon={<Workflow size={10} />}
              value={lifecycleValue}
              placeholder={resolveLifecycleLabel(contact, resolvedLifecycleStages)}
              options={lifecycleOptions}
              onSave={persistLifecycle}
            />
            <SelectRow
              {...fieldProps}
              fieldKey="assignee"
              label="Assignee"
              icon={<Users size={10} />}
              value={assigneeValue}
              placeholder={resolveAssigneeLabel(contact, resolvedWorkspaceUsers)}
              options={assigneeOptions}
              onSave={persistAssignee}
            />
          </div>

          <div className="mx-4 border-t border-[#f0f2f8]" />
        </>
      ) : (
        <div className="mx-4 border-t border-[#f0f2f8]" />
      )}

      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-2 relative" ref={tagDropdownRef}>
          <span className="text-[12px] font-semibold text-[#374151]">Tags</span>
          <button
            type="button"
            onClick={() => setTagPickerOpen((prev) => !prev)}
            className="w-8 h-8 rounded-xl border border-[#d1d5db] bg-white flex items-center justify-center text-[#4b5563] hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Plus size={14} />
          </button>

          {tagPickerOpen ? (
            <div className="absolute right-0 bottom-[calc(100%+8px)] z-30 w-[230px] rounded-2xl border border-[#e5e7eb] bg-white shadow-xl p-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#d1d5db] bg-[#f9fafb]">
                <Search size={14} className="text-[#9ca3af]" />
                <input
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder="Search and select tags"
                  className="flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
                />
              </div>

              <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
                {filteredWorkspaceTags.map((tag) => {
                  const selected = visibleContactTags.some(
                    (selectedTag) => selectedTag.name === tag.name || selectedTag.id === String(tag.id),
                  );
                  const busy = tagBusyName === tag.name;
                  const tagColor = tag.bundle?.color || tag.color;
                  const tagEmoji = tag.bundle?.emoji || tag.emoji || '\u{1F3F7}\uFE0F';
                  const tagStyle = getTagSurfaceStyle(tagColor);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={busy}
                      onClick={() => (selected ? detachTag(tag.name) : attachTag(tag))}
                      className="w-full flex items-center gap-2.5 text-left rounded-xl px-1 py-1 hover:bg-[#f8fafc] transition-colors disabled:opacity-60"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] text-[#374151]" style={tagStyle}>
                          <span>{tagEmoji}</span>
                          {tag.name}
                        </span>
                      </span>
                      <span className="w-4 h-4 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        {busy ? <Loader2 size={12} className="animate-spin" /> : selected ? <Check size={13} /> : null}
                      </span>
                    </button>
                  );
                })}

                {!filteredWorkspaceTags.length && normalizedTagQuery ? (
                  <button
                    type="button"
                    onClick={openCreateTagModal}
                    disabled={!!tagBusyName}
                    className="w-full rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-left text-[13px] text-indigo-700 font-medium hover:bg-indigo-100 transition-colors disabled:opacity-60"
                  >
                    Create "{tagQuery.trim()}" tag
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleContactTags.length ? (
            visibleContactTags.map((tag) => {
              const busy = tagBusyName === tag.name || tagBusyName === tag.id;

              return (
              <span
                key={tag.key}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] border"
                style={getTagSurfaceStyle(tag.color)}
              >
                <span>{tag.emoji || '\u{1F3F7}\uFE0F'}</span>
                {tag.name}
                <button
                  type="button"
                  onClick={() => detachTag(tag.id ?? tag.name)}
                  disabled={busy}
                  className="text-[#6b7280] hover:text-[#111827] disabled:opacity-50"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                </button>
              </span>
              );
            })
          ) : (
            <span className="text-[12px] text-[#9ca3af] italic">No tags added</span>
          )}
        </div>
      </div>

      {onDelete ? (
        <>
          <div className="mx-4 border-t border-[#f0f2f8]" />
          <div className="px-4 py-4">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Delete contact
            </button>
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

      {showCreateTagModal ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110]">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add tag</h3>
              <button onClick={() => setShowCreateTagModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span>{newTag.emoji || '\u{1F3F7}\uFE0F'}</span>
                <span className="text-sm text-gray-600">{newTag.name || 'New tag'}</span>
              </div>
              <div className="grid grid-cols-[76px_1fr] gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <div className="relative" ref={tagEmojiRef}>
                    <button
                      type="button"
                      onClick={() => setTagEmojiOpen((prev) => !prev)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <span>{newTag.emoji}</span>
                      <Smile size={16} className="text-indigo-600" />
                    </button>
                    {tagEmojiOpen ? (
                      <EmojiPicker
                        mode="tag"
                        accent="indigo"
                        onSelect={(emoji) => {
                          setNewTag((prev) => ({ ...prev, emoji }));
                          setTagEmojiOpen(false);
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={newTag.name}
                    onChange={(event) => setNewTag((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g. Priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {TAG_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewTag((prev) => ({ ...prev, color: option.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${newTag.color === option.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: option.hex }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTag.description}
                  onChange={(event) => setNewTag((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateTagModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                disabled={creatingTag || !newTag.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
              >
                {creatingTag ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add tag'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (isMobileMode) {
    return (
      <>
        <div
          className="flex min-h-0 flex-1 flex-col bg-white"
          style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
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
