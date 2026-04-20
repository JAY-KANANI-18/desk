import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  GitMerge,
  Loader2,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  Plus,
  Search,
  Smile,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import {
  contactsApi,
  type ContactDuplicateSuggestion,
  type ContactMergePreview,
} from '../../lib/contactApi';
import { useInbox } from '../../context/InboxContext';
import { workspaceApi } from '../../lib/workspaceApi';
import { AiConversationPanel } from '../../modules/ai-agents/components/AiConversationPanel';
import { getTagSurfaceStyle, TAG_COLOR_OPTIONS } from '../../lib/tagAppearance';
import type { Contact, Conversation } from './types';
import { EmojiPicker } from './EmojiPicker';

const CHANNEL_META: Record<string, { icon: string; label: string }> = {
  whatsapp: { icon: 'https://cdn.simpleicons.org/whatsapp', label: 'WhatsApp' },
  email: { icon: 'https://cdn.simpleicons.org/maildotru', label: 'Email' },
  webchat: { icon: 'https://cdn.simpleicons.org/googlechat', label: 'Web Chat' },
  instagram: { icon: 'https://cdn.simpleicons.org/instagram', label: 'Instagram' },
  twitter: { icon: 'https://cdn.simpleicons.org/x', label: 'X' },
  messenger: { icon: 'https://cdn.simpleicons.org/messenger', label: 'Messenger' },
  facebook: { icon: 'https://cdn.simpleicons.org/meta', label: 'Facebook' },
  gmail: { icon: 'https://cdn.simpleicons.org/gmail', label: 'Gmail' },
};

const MERGE_FIELDS = [
  { key: 'avatarUrl', label: 'Profile photo' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'company', label: 'Company' },
  { key: 'lifecycleId', label: 'Lifecycle', isLifecycle: true },
  { key: 'tags', label: 'Tags', isTags: true },
] as const;

function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
}

function contactName(contact?: Partial<Contact> | null) {
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || 'Unnamed';
}

function conflictFromReasons(reasons: string[]) {
  if (reasons.includes('exact_email')) return 'email';
  if (reasons.includes('exact_phone')) return 'phone';
  return 'email';
}

type WorkspaceTag = {
  id: string;
  name: string;
  color?: string | null;
  emoji?: string | null;
  description?: string | null;
  bundle?: {
    color?: string | null;
    emoji?: string | null;
    description?: string | null;
  };
  _count?: { contacts: number };
};

function SimpleAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 'md',
}: {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const classes = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-16 h-16 text-xs';

  return avatarUrl ? (
    <img src={avatarUrl} alt="" className={`${classes} rounded-full object-cover`} />
  ) : (
    <div className={`${classes} bg-indigo-100 rounded-full flex items-center justify-center font-semibold text-indigo-700`}>
      {initials(firstName ?? '', lastName ?? '')}
    </div>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        navigator.clipboard.writeText(value).catch(() => undefined);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-[#f0f2f5] transition-all flex-shrink-0"
      title="Copy"
    >
      {ok ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-[#b8bec9]" />}
    </button>
  );
}

function FieldRow({
  fieldKey,
  label,
  icon,
  value,
  placeholder = 'Not set',
  type = 'text',
  copyable,
  warn,
  activeField,
  onActivate,
  onDeactivate,
  onSave,
}: {
  fieldKey: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  placeholder?: string;
  type?: string;
  copyable?: boolean;
  warn?: boolean;
  activeField: string | null;
  onActivate: (key: string) => void;
  onDeactivate: () => void;
  onSave: (value: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = activeField === fieldKey;
  const isBlocked = activeField !== null && !isActive;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isActive]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      onDeactivate();
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await onSave(trimmed);
      onDeactivate();
    } catch (error: any) {
      setErr(error?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`transition-opacity ${isBlocked ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-[#c8cdd8]">{icon}</span>}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#b0b8c8]">{label}</span>
        {warn && <span className="text-[9px] text-amber-400 font-semibold ml-1">merge suggestion</span>}
      </div>

      {isActive ? (
        <div className="space-y-1.5 pb-1">
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
              if (event.key === 'Escape') {
                setDraft(value);
                onDeactivate();
              }
            }}
            className={`w-full text-[13px] px-3 py-2 rounded-lg border focus:outline-none transition-all placeholder:text-[#c8cdd8] text-[#1c2030] ${
              warn
                ? 'border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-200'
                : 'border-[#e0e4ed] bg-[#fafbfc] focus:ring-2 focus:ring-[#1c2030]/15 focus:border-[#1c2030]'
            }`}
            placeholder={placeholder}
          />
          {err ? <p className="text-[11px] text-red-500 px-0.5">{err}</p> : null}
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2030] text-white text-[11px] font-semibold rounded-lg hover:bg-[#2e3450] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Save
            </button>
            <button
              onClick={() => {
                setDraft(value);
                onDeactivate();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-[#7a8394] text-[11px] rounded-lg hover:bg-[#f0f2f7] transition-all"
            >
              <X size={10} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group/row flex items-center justify-between gap-1 cursor-pointer py-0.5" onClick={() => onActivate(fieldKey)}>
          <span className={`text-[13px] leading-snug truncate ${value ? 'text-[#1c2030]' : 'text-[#c8cdd8] italic font-normal'}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
            {copyable && value ? <CopyBtn value={value} /> : null}
            <span className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-[#f0f2f5] transition-all">
              <Pencil size={10} className="text-[#b8bec9]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MergeModal({
  current,
  duplicate,
  preview,
  conflictField,
  onMerge,
  onCancel,
  loading,
}: {
  current: Contact;
  duplicate: Contact;
  preview: ContactMergePreview;
  conflictField: 'email' | 'phone';
  onMerge: (resolution: Record<string, any>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [sel, setSel] = useState<Record<string, 'current' | 'duplicate'>>(() => {
    const selection: Record<string, 'current' | 'duplicate'> = {};
    MERGE_FIELDS.forEach((field) => {
      if (field.isTags) {
        selection[field.key] = 'current';
        return;
      }

      const suggested = (preview.suggestedResolution as any)?.[field.key];
      selection[field.key] = suggested !== undefined && suggested === (duplicate as any)?.[field.key] ? 'duplicate' : 'current';
    });
    return selection;
  });
  const [mergeTags, setMergeTags] = useState(true);

  const contactCards = [
    {
      key: 'current',
      contact: current,
      roleLabel: 'Primary Contact',
      roleTone: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      key: 'duplicate',
      contact: duplicate,
      roleLabel: 'Merge Suggestion',
      roleTone: 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ] as const;

  const doMerge = () => {
    const resolution: Record<string, any> = {};

    MERGE_FIELDS.forEach((field) => {
      if (field.isTags) {
        resolution.tags = mergeTags
          ? [...new Set([...(current.tags || []), ...(duplicate.tags || [])])]
          : sel[field.key] === 'current'
            ? [...(current.tags || [])]
            : [...(duplicate.tags || [])];
        return;
      }

      if (field.isLifecycle) {
        resolution.lifecycleId =
          sel[field.key] === 'current'
            ? current.lifecycleId ?? null
            : duplicate.lifecycleId ?? null;
        return;
      }

      resolution[field.key] =
        sel[field.key] === 'current' ? (current as any)[field.key] : (duplicate as any)[field.key];
    });
    if ((preview.suggestedResolution as any)?.marketingOptOut !== undefined) {
      resolution.marketingOptOut = (preview.suggestedResolution as any).marketingOptOut;
    }

    onMerge(resolution);
  };

  const resolveChannel = (contact: Contact) => {
    const channel = contact.contactChannels?.[0];
    if (!channel) return null;
    return {
      ...channel,
      meta: CHANNEL_META[channel.channelType] ?? {
        icon: 'https://cdn.simpleicons.org/googlechat',
        label: channel.channelType || 'Channel',
      },
    };
  };

  const assigneeLabel = (contact: Contact) => {
    if ((contact as any)?.assignee?.firstName || (contact as any)?.assignee?.lastName) {
      return contactName((contact as any).assignee);
    }
    return contact.assigneeId ? 'Assigned' : 'Unassigned';
  };

  const renderVal = (contact: Contact, field: (typeof MERGE_FIELDS)[number]) => {
    if (field.key === 'avatarUrl') {
      return (
        <div className="flex items-center gap-3">
          <SimpleAvatar
            firstName={contact.firstName}
            lastName={contact.lastName}
            avatarUrl={(contact as any).avatarUrl}
            size="sm"
          />
          <span className="text-[13px] text-[#1f2937]">
            {(contact as any).avatarUrl ? 'Keep this photo' : 'Not provided'}
          </span>
        </div>
      );
    }

    if (field.isTags) {
      const tags = contact.tags || [];
      return tags.length ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-[#f0f2f7] text-[#5a6280] text-[10px] rounded-md font-medium">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[#c0c6d4] text-[11px] italic">No tags</span>
      );
    }

    if (field.isLifecycle) {
      return (
        <span className={`text-[13px] ${(contact.lifecycleStage || contact.lifecycleId) ? 'text-[#1f2937]' : 'text-[#9ca3af] italic'}`}>
          {contact.lifecycleStage || (contact.lifecycleId ? 'Selected lifecycle' : 'Not provided')}
        </span>
      );
    }

    const value = (contact as any)[field.key];
    return value ? (
      <span className="text-[13px] text-[#1f2937]">{value}</span>
    ) : (
      <span className="text-[#9ca3af] text-[13px] italic">Not provided</span>
    );
  };

  const impactCards = [
    { label: 'Conversations', value: preview.impact.conversationsToMove, icon: <MessageSquareText size={12} /> },
    { label: 'Channels', value: preview.impact.channelsToMove, icon: <Users size={12} /> },
    { label: 'Workflow runs', value: preview.impact.workflowRunsToMove, icon: <Workflow size={12} /> },
    { label: 'Email history', value: preview.impact.notificationHistoryToMove, icon: <Mail size={12} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827]">Merge Contact</h2>
            <p className="text-sm text-[#6b7280] mt-0.5">
              Review and select information to be merged here.
            </p>
          </div>
          <button onClick={onCancel} className="text-[#6b7280] hover:text-[#111827] p-1 rounded-lg hover:bg-[#f3f4f6]">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 bg-[#fafafa]">
          <div className="grid grid-cols-2 gap-4">
            {contactCards.map(({ key, contact, roleLabel, roleTone }) => {
              const channel = resolveChannel(contact);
              return (
                <div key={key} className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SimpleAvatar
                        firstName={contact.firstName}
                        lastName={contact.lastName}
                        avatarUrl={contact.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-[#111827] truncate">{contactName(contact)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#eef2ff] text-indigo-600"
                    >
                      Open
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {channel ? (
                        <img src={channel.meta.icon} alt={channel.meta.label} className="w-5 h-5 rounded-full" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#eef2ff] flex items-center justify-center">
                          <Users size={11} className="text-indigo-600" />
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${roleTone}`}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-[#4b5563]">
                    <span>Assigned to</span>
                    <span className="w-5 h-5 rounded-full bg-[#fee2e2] flex items-center justify-center">
                      <Users size={11} className="text-[#b91c1c]" />
                    </span>
                    <span className="truncate">{assigneeLabel(contact)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[15px] font-semibold text-[#374151]">Select contact fields to merge</p>
              <p className="text-xs text-[#6b7280] mt-1">
                Merge suggestion detected from matching {conflictField}. Choose what should stay on the primary contact.
              </p>
            </div>

            <div className="space-y-4">
            {MERGE_FIELDS.map((field) => (
              <div key={field.key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#374151]">{field.label}</span>
                  {!field.isTags && field.key === conflictField ? (
                    <span className="text-[11px] text-indigo-600 font-medium">Matched field</span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                {(['current', 'duplicate'] as const).map((side, index) => {
                  const contact = side === 'current' ? current : duplicate;
                  const chosen = field.isTags ? !mergeTags && sel[field.key] === side : sel[field.key] === side;
                  const dimmed = field.isTags && mergeTags;

                  return (
                    <button
                      type="button"
                      key={side}
                      onClick={() => {
                        if (field.isTags) setMergeTags(false);
                        setSel((prev) => ({ ...prev, [field.key]: side }));
                      }}
                      className={`min-h-[56px] w-full p-4 rounded-xl text-left border transition-all ${
                        dimmed
                          ? 'border-[#e5e7eb] bg-[#f9fafb] opacity-50'
                          : chosen
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600/10'
                            : 'border-[#d1d5db] hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            chosen ? 'border-indigo-600' : 'border-[#9ca3af]'
                          }`}
                        >
                          {chosen ? <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> : null}
                        </span>
                        <div className="min-w-0 flex-1">{renderVal(contact, field)}</div>
                      </div>
                    </button>
                  );
                })}
                {field.isTags ? (
                  <div className="col-span-2">
                    <label
                      onClick={() => setMergeTags(true)}
                      className={`mt-3 flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border transition-all ${
                        mergeTags ? 'border-indigo-600 bg-indigo-50' : 'border-[#d1d5db] hover:border-indigo-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                          mergeTags ? 'border-indigo-600' : 'border-[#9ca3af]'
                        }`}
                      >
                        {mergeTags ? <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> : null}
                      </span>
                      <span className="text-[13px] text-[#374151] font-medium">Merge all tags from both contacts</span>
                      {mergeTags ? (
                        <div className="ml-auto flex flex-wrap gap-1">
                          {[...new Set([...(current.tags || []), ...(duplicate.tags || [])])].map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] rounded-md font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </label>
                  </div>
                ) : null}
                </div>
              </div>
            ))}
          </div>

            <div className="mt-5 rounded-xl border border-[#e0e7ff] bg-[#f8faff] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#374151]">
                <AlertTriangle size={14} className="text-indigo-600" />
                Merge impact
              </div>
              <div className="grid grid-cols-2 gap-3">
                {impactCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-indigo-600">{card.icon}</div>
                    <div className="text-lg font-semibold text-[#111827]">{card.value}</div>
                    <div className="text-[12px] text-[#6b7280]">{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb] bg-white">
          <p className="text-xs text-[#6b7280]">One contact and one conversation will remain after merge.</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-[#d1d5db] rounded-xl hover:bg-[#f9fafb] text-sm font-medium text-[#374151]"
            >
              Cancel
            </button>
            <button
              onClick={doMerge}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <GitMerge size={14} />}
              Merge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactSidebarHybrid({
  selectedConversation,
  contactDetails,
  mode = 'desktop',
}: {
  selectedConversation: Conversation;
  contactDetails: Contact | null;
  mode?: 'desktop' | 'mobile';
}) {
  const { convList, refreshContact, refreshConversations, selectConversation } = useInbox();
  const isMobileMode = mode === 'mobile';
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
  const [newTag, setNewTag] = useState({ name: '', color: 'tag-indigo', emoji: '😀', description: '' });
  const [creatingTag, setCreatingTag] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagEmojiRef = useRef<HTMLDivElement>(null);
  const [tagEmojiOpen, setTagEmojiOpen] = useState(false);

  const channels = useMemo(() => ((contactDetails as any)?.contactChannels ?? []) as any[], [contactDetails]);
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
  const tagMetaByName = useMemo(
    () =>
      workspaceTags.reduce<Record<string, { color?: string | null; emoji?: string | null; description?: string | null }>>((acc, tag) => {
        acc[tag.name] = {
          color: tag.bundle?.color || tag.color,
          emoji: tag.bundle?.emoji || tag.emoji,
          description: tag.bundle?.description || tag.description,
        };
        return acc;
      }, {}),
    [workspaceTags],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDuplicates() {
      if (!contactDetails?.id || (contactDetails as any)?.mergedIntoContactId) {
        setDuplicateSuggestions([]);
        setSelectedSuggestionId(null);
        return;
      }

      setDuplicatesLoading(true);
      try {
        const response = await contactsApi.getDuplicateSuggestions(contactDetails.id);
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

    loadDuplicates();
    return () => {
      cancelled = true;
    };
  }, [contactDetails?.id, (contactDetails as any)?.mergedIntoContactId]);

  useEffect(() => {
    setActiveField(null);
    setActivePreview(null);
    setTagPickerOpen(false);
    setTagQuery('');
  }, [selectedConversation?.id]);

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
      if (!contactDetails?.id) return;

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

    loadWorkspaceTags();
    return () => {
      cancelled = true;
    };
  }, [contactDetails?.id]);

  const flash = () => {
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 1800);
  };

  const persist = async (updates: Partial<Contact>) => {
    if (!contactDetails?.id) return;

    const merged = { ...contactDetails, ...updates };
    setContactLoading(true);
    try {
      await contactsApi.updateContact(contactDetails.id, {
        firstName: merged.firstName,
        lastName: merged.lastName,
        email: merged.email,
        phone: merged.phone,
        company: merged.company,
      });
      await refreshContact();
      flash();
    } finally {
      setContactLoading(false);
    }
  };

  const refreshSidebarContact = async () => {
    await refreshContact();
  };

  const attachTag = async (tag: WorkspaceTag) => {
    if (!contactDetails?.id) return;
    setTagBusyName(tag.name);
    try {
      await contactsApi.addTagToContact(contactDetails.id, tag.id);
      await refreshSidebarContact();
      setTagQuery('');
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const detachTag = async (tagName: string) => {
    if (!contactDetails?.id) return;
    const match = workspaceTags.find((tag) => tag.name === tagName);
    if (!match) return;

    setTagBusyName(tagName);
    try {
      await contactsApi.removeTagFromContact(contactDetails.id, match.id);
      await refreshSidebarContact();
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const handleCreateTag = async () => {
    const nextName = newTag.name.trim();
    if (!nextName || !contactDetails?.id) return;

    setCreatingTag(true);
    try {
      const created = await workspaceApi.addTag({
        name: nextName,
        color: newTag.color,
        emoji: newTag.emoji,
        description: newTag.description,
      });
      setWorkspaceTags((prev) => [created, ...prev]);
      await contactsApi.addTagToContact(contactDetails.id, created.id);
      await refreshSidebarContact();
      setTagQuery('');
      setNewTag({ name: '', color: 'tag-indigo', emoji: '😀', description: '' });
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
      emoji: exactTagMatch?.bundle?.emoji || exactTagMatch?.emoji || '😀',
      description: exactTagMatch?.bundle?.description || exactTagMatch?.description || '',
    });
    setShowCreateTagModal(true);
    setTagPickerOpen(false);
  };

  const createAndAttachTag = async () => {
    if (!normalizedTagQuery || exactTagMatch || !contactDetails?.id) return;

    setTagBusyName(tagQuery.trim());
    try {
      const created = await workspaceApi.addTag({
        name: tagQuery.trim(),
        color: 'tag-indigo',
        emoji: '😀',
        description: '',
      });
      setWorkspaceTags((prev) => [created, ...prev]);
      await contactsApi.addTagToContact(contactDetails.id, created.id);
      await refreshSidebarContact();
      setTagQuery('');
      flash();
    } finally {
      setTagBusyName(null);
    }
  };

  const openMergeModal = async () => {
    if (!contactDetails?.id || !selectedSuggestion) return;

    setPreviewLoading(true);
    try {
      const preview = await contactsApi.getMergePreview(contactDetails.id, (selectedSuggestion.contact as any).id);
      setActivePreview(preview);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMerge = async (resolution: Record<string, any>) => {
    if (!contactDetails?.id || !activePreview) return;

    setMergeLoading(true);
    try {
      const mergeResult = await contactsApi.mergeContactIntoPrimary(contactDetails.id, (activePreview.secondary as any).id, {
        source: 'inbox_sidebar',
        confidenceScore: activePreview.confidenceScore,
        reasonCodes: activePreview.reasonCodes,
        resolution,
      });
      const refreshedConversations = await refreshConversations();
      await refreshContact();
      const response = await contactsApi.getDuplicateSuggestions(contactDetails.id);
      setDuplicateSuggestions(response.suggestions);
      setSelectedSuggestionId(response.suggestions[0] ? String((response.suggestions[0].contact as any).id) : null);
      setActivePreview(null);

      if (mergeResult.survivorConversationId) {
        const survivorConversation =
          refreshedConversations.find((conversation) => conversation.id === mergeResult.survivorConversationId) ??
          convList.find((conversation) => conversation.id === mergeResult.survivorConversationId);

        if (survivorConversation) {
          selectConversation(survivorConversation as any);
        }
      }

      flash();
    } finally {
      setMergeLoading(false);
    }
  };

  const conflictField = selectedSuggestion ? conflictFromReasons(selectedSuggestion.reasons) : 'email';
  const fieldProps = {
    activeField,
    onActivate: setActiveField,
    onDeactivate: () => setActiveField(null),
  };
  const containerClassName = isMobileMode
    ? 'flex min-h-0 flex-1 flex-col overflow-y-auto bg-white'
    : 'hidden xl:flex flex-col w-[248px] bg-white border-l overflow-y-auto flex-shrink-0';
  const loadingClassName = isMobileMode
    ? 'flex min-h-[18rem] flex-col bg-white'
    : 'hidden xl:flex flex-col w-[248px] bg-white border-l flex-shrink-0';

  if (!contactDetails || contactLoading) {
    return (
      <div
        className={loadingClassName}
        style={{ borderColor: '#edf0f8', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
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
  }

  return (
    <>
      <div
        className={containerClassName}
        style={{ borderColor: '#edf0f8', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        <div className="relative flex flex-col items-center pt-8 pb-5 px-5">
          {flashSaved ? (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg animate-pulse">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-semibold">Saved</span>
            </div>
          ) : null}

          <div className="relative mb-3.5">
            <SimpleAvatar
              firstName={contactDetails?.firstName}
              lastName={contactDetails?.lastName}
              avatarUrl={contactDetails?.avatarUrl}
            />
          </div>

          <p className="font-semibold text-[15px] text-[#1c2030] text-center leading-tight">
            {contactName(contactDetails)}
          </p>
          <p className="text-[11px] text-[#b0b8c8] mt-1 text-center truncate w-full px-2">
            {contactDetails?.email || contactDetails?.phone || <span className="italic">No contact info</span>}
          </p>
        </div>

        {(contactDetails as any)?.mergedIntoContact ? (
          <div className="mx-4 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-[#f3d9b8] bg-[#fff4e7]">
            <AlertTriangle size={12} className="text-[#c47a1f] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[#8b5a17]">
              This contact was already merged into <b>{contactName((contactDetails as any).mergedIntoContact)}</b>.
            </p>
          </div>
        ) : null}

        {!duplicatesLoading && selectedSuggestion ? (
          <div className="mx-4 mb-2">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-amber-700 leading-5">
                  <b>{contactName(selectedSuggestion.contact)}</b> is a merge suggestion.
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
                      {contactName(item.contact)}
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
                    key={channel.id}
                    onMouseEnter={() => setHoveredChannelId(channel.id)}
                    onFocus={() => setHoveredChannelId(channel.id)}
                    onMouseLeave={() => setHoveredChannelId(null)}
                    className="relative"
                  >
                    <button
                      className="w-[24px] h-[24px] rounded-md flex items-center justify-center hover:bg-[#f3f5f9] transition-colors"
                      title={meta.label}
                    >
                      <img src={meta.icon} alt={meta.label} className="w-3.5 h-3.5 object-contain opacity-80" />
                    </button>
                    {hoveredChannelId === channel.id ? (
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
          <FieldRow {...fieldProps} fieldKey="firstName" label="First Name" value={contactDetails?.firstName ?? ''} placeholder="First name" onSave={(value) => persist({ firstName: value })} />
          <FieldRow {...fieldProps} fieldKey="lastName" label="Last Name" value={contactDetails?.lastName ?? ''} placeholder="Last name" onSave={(value) => persist({ lastName: value })} />
        </div>

        <div className="mx-4 border-t border-[#f0f2f8]" />

        <div className="px-4 py-3 space-y-3.5">
          <FieldRow
            {...fieldProps}
            fieldKey="email"
            label="Email"
            icon={<Mail size={10} />}
            value={contactDetails?.email ?? ''}
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
            value={contactDetails?.phone ?? ''}
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
            value={contactDetails?.company ?? ''}
            placeholder="Company name"
            copyable
            onSave={(value) => persist({ company: value })}
          />
        </div>

        <div className="mx-4 border-t border-[#f0f2f8]" />

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
                    const selected = !!contactDetails?.tags?.includes(tag.name);
                    const busy = tagBusyName === tag.name;
                    const tagColor = tag.bundle?.color || tag.color;
                    const tagEmoji = tag.bundle?.emoji || tag.emoji || '🏷️';
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
            {contactDetails?.tags?.length ? (
              contactDetails.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] border"
                  style={getTagSurfaceStyle(tagMetaByName[tag]?.color)}
                >
                  <span>{tagMetaByName[tag]?.emoji || '🏷️'}</span>
                  {tag}
                  <button
                    type="button"
                    onClick={() => detachTag(tag)}
                    disabled={tagBusyName === tag}
                    className="text-[#6b7280] hover:text-[#111827] disabled:opacity-50"
                  >
                    {tagBusyName === tag ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[12px] text-[#9ca3af] italic">No tags added</span>
            )}
          </div>
        </div>

        <AiConversationPanel conversationId={selectedConversation?.id} />

      
      </div>

      {activePreview && selectedSuggestion ? (
        <MergeModal
          current={contactDetails as Contact}
          duplicate={selectedSuggestion.contact as Contact}
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
                <span>{newTag.emoji || '🏷️'}</span>
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
                    Adding…
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
}
