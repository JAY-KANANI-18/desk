import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  GitMerge,
  Loader2,
  Mail,
  MessageSquareText,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import type { ContactMergePreview } from '../../../lib/contactApi';
import { ContactAvatar } from '../../../components/contact/ContactAvatar';
import type { SidebarContact } from './types';
import { CHANNEL_META, conflictFromReasons, contactName } from './utils';

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

export function getConflictField(reasons: string[]) {
  return conflictFromReasons(reasons);
}

interface MergeModalProps {
  current: SidebarContact;
  duplicate: SidebarContact;
  preview: ContactMergePreview;
  conflictField: 'email' | 'phone';
  onMerge: (resolution: Record<string, any>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function MergeModal({
  current,
  duplicate,
  preview,
  conflictField,
  onMerge,
  onCancel,
  loading,
}: MergeModalProps) {
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

  const resolveChannel = (contact: SidebarContact) => {
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

  const assigneeLabel = (contact: SidebarContact) => {
    if ((contact as any)?.assignee?.firstName || (contact as any)?.assignee?.lastName) {
      return contactName((contact as any).assignee);
    }
    return contact.assigneeId ? 'Assigned' : 'Unassigned';
  };

  const renderVal = (contact: SidebarContact, field: (typeof MERGE_FIELDS)[number]) => {
    if (field.key === 'avatarUrl') {
      return (
        <div className="flex items-center gap-3">
          <ContactAvatar
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
                      <ContactAvatar
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
                    {(['current', 'duplicate'] as const).map((side) => {
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
