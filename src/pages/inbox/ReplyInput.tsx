/**
  * ReplyInput.tsx  — chat reply composer (WhatsApp / Instagram / Messenger / Chat)
 *
 * Changes vs. previous version:
 * ──────────────────────────────
 * 1. Accepts SharedInputProps (inputMode, onInputModeChange, replyContext, onClearReplyContext)
 * 2. Shows a WhatsApp-style quoted reply banner when replyContext.type === "chat"
 * 3. Sends replyTo metadata with the message so the BE knows which message is quoted
 * 4. Mode switcher (Reply / Note) is two tiny icon-pills in the toolbar —
 *    no external tab bar needed — saves vertical space
 * 5. Note mode turns the composer background amber; send builds type:"comment"
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Paperclip, Smile, X,
  LayoutTemplate,
  MessageSquare, StickyNote,
  Play, File as FileIcon,
  Wand2, Sparkles, AtSign, AlertTriangle, Clock3,
} from 'lucide-react';
import { variables } from './data';
import type { MediaAttachment, AttachmentType } from './types';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';
import { Template, TemplateModal } from './TemplateModal';
import { Button } from '../../components/ui/Button';
import {
  ChannelSelectMenu,
  MentionSuggestionMenu,
  VariableSuggestionMenu,
  type MentionSuggestionOption,
} from '../../components/ui/Select';
import { TextareaInput } from '../../components/ui/inputs/TextareaInput';
import { useInbox } from '../../context/InboxContext';
import type { SharedInputProps } from './InputArea';
import type { ReplyContext } from './MessageArea';
import {
  AiComposerInlineStatus,
  AiPromptMenu,
  ComposerAttachmentPreviewStrip,
  useInboxAiComposer,
} from './composerShared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { extractMentionIds } from './utils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDisclosure } from '../../hooks/useDisclosure';
import { findMatchingContactChannel, getContactScopedChannels, isSameChannel } from './channelUtils';
import { workspaceUserLabel } from './contact-sidebar/utils';
import type { WorkspaceUserLike } from './contact-sidebar/types';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type AttachedFile = { file: globalThis.File; type: AttachmentType; url: string; previewUrl?: string };

const WINDOW_RESTRICTED_CHANNELS = new Set(['whatsapp', 'messenger', 'instagram']);
const FIRST_MESSAGE_RESTRICTED_CHANNELS = new Set(['messenger', 'instagram']);

function getMentionStatus(user: WorkspaceUserLike): MentionSuggestionOption['status'] | undefined {
  switch (user.activityStatus?.toLowerCase()) {
    case 'online':
      return 'online';
    case 'away':
      return 'away';
    case 'busy':
      return 'busy';
    case 'offline':
      return 'offline';
    default:
      return undefined;
  }
}

function getMentionStatusLabel(status: MentionSuggestionOption['status'] | undefined) {
  if (!status) return undefined;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getAttachmentType(file: globalThis.File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}

function parseTimestamp(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && Number.isNaN(Number(value))) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
}

function formatWindowExpiry(value: number | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/* ─── Quoted-reply banner ────────────────────────────────────────────────────── */

function QuotedReplyBanner({
  ctx,
  onDismiss,
}: {
  ctx: ReplyContext;
  onDismiss: () => void;
}) {
  if (ctx.type !== 'chat' || !ctx.quotedMessage) return null;
  const q = ctx.quotedMessage;

  return (
    <div className="flex items-start gap-2 px-2.5 pb-0 pt-2 sm:px-3 sm:pt-2.5">
      <div className="flex-1 flex items-start gap-2 bg-gray-50 border-l-[3px] border-indigo-500 rounded-r-lg px-3 py-2 min-w-0">
        {/* attachment thumb */}
        {q.attachmentType === 'image' && q.attachmentUrl && (
          <img src={q.attachmentUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
        )}
        {q.attachmentType === 'video' && (
          <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <Play size={14} className="text-gray-500 ml-0.5" />
          </div>
        )}
        {q.attachmentType === 'file' && (
          <div className="w-9 h-9 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <FileIcon size={14} className="text-indigo-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-indigo-600 mb-0.5">{q.author}</p>
          {q.text ? (
            <p className="text-[12px] text-gray-600 truncate leading-snug">{q.text}</p>
          ) : q.attachmentType ? (
            <p className="text-[12px] text-gray-400 italic">
              {q.attachmentType === 'image' ? '📷 Photo' : q.attachmentType === 'video' ? '🎥 Video' : q.attachmentType === 'audio' ? '🎤 Voice message' : '📄 File'}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        onClick={onDismiss}
        variant="unstyled"
        size="xs"
        iconOnly
        radius="full"
        aria-label="Dismiss quoted reply"
        leftIcon={<X size={13} />}
        className="mt-0.5 flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      />
    </div>
  );
}

/* ─── ReplyInput ─────────────────────────────────────────────────────────────── */

export function ReplyInput({
  
  onChannelChange,
  onSendMessage,
  onSendNote,
  inputMode,
  onInputModeChange,
  replyContext,
  onClearReplyContext,
}: SharedInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const emojiMenu = useDisclosure();
  const [showRecorder, setShowRecorder] = useState(false);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const templateModal = useDisclosure();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);
  const aiPromptMenuRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const minHeight = isMobile ? 52 : 44;
    const maxHeight = isMobile ? 132 : 200;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)}px`;
  }, [isMobile]);

  const { uploadFile,selectedChannel,channels,selectedConversation, selectedContact } = useInbox();
  const { workspaceUsers } = useWorkspace();
  const aiComposer = useInboxAiComposer({
    conversationId: selectedConversation?.id ? String(selectedConversation.id) : undefined,
    getDraft: () => message,
    setDraft: (text) => {
      setMessage(text);
      requestAnimationFrame(() => {
        resizeTextarea();
        textareaRef.current?.focus();
      });
    },
    switchToReply: () => onInputModeChange('reply'),
    switchToNote: () => onInputModeChange('note'),
  });
  const isAiBusy = aiComposer.aiLoadingAction !== null;

  const isNote = inputMode === 'note';
  const selectedConversationContactId =
    selectedConversation?.contactId ?? selectedConversation?.contact?.id ?? null;
  const hasLoadedSelectedContact =
    selectedContact?.id !== undefined &&
    selectedContact?.id !== null &&
    selectedConversationContactId !== null &&
    String(selectedContact.id) === String(selectedConversationContactId);
  const selectorContactChannels = useMemo(
    () =>
      (hasLoadedSelectedContact
        ? (selectedContact?.contactChannels as any[] | undefined)
        : (selectedConversation?.contact?.contactChannels as any[] | undefined)) ?? [],
    [
      hasLoadedSelectedContact,
      selectedContact?.contactChannels,
      selectedConversation?.contact?.contactChannels,
    ],
  );
  const availableReplyChannels = useMemo(
    () => getContactScopedChannels(channels, selectorContactChannels),
    [channels, selectorContactChannels],
  );
  const activeComposerChannel = useMemo(() => {
    if (availableReplyChannels.length === 0) return selectedChannel ?? null;
    return (
      availableReplyChannels.find((channel) => isSameChannel(channel, selectedChannel)) ??
      availableReplyChannels[0]
    );
  }, [availableReplyChannels, selectedChannel]);
  const handleReplyChannelChange = useCallback((
    _value: string,
    nextChannel: (typeof availableReplyChannels)[number] | null,
  ) => {
    if (nextChannel) {
      onChannelChange(nextChannel);
    }
  }, [onChannelChange]);
  const validatedContactChannels = hasLoadedSelectedContact
    ? ((selectedContact?.contactChannels as any[] | undefined) ?? [])
    : [];
  const channelType = activeComposerChannel?.type ?? selectedConversation?.channel?.type;
  const selectedContactChannel = useMemo(
    () => findMatchingContactChannel(validatedContactChannels, activeComposerChannel),
    [activeComposerChannel, validatedContactChannels],
  );
  const hasValidatedSelectedContactChannel = hasLoadedSelectedContact && Boolean(selectedContactChannel);
  const normalizedChannelType = String(channelType ?? '').toLowerCase();
  const hasChannelIdentifier = Boolean(selectedContactChannel?.identifier);
  const messageWindowExpiry = parseTimestamp(selectedContactChannel?.messageWindowExpiry);
  const isWindowRestrictedChannel = WINDOW_RESTRICTED_CHANNELS.has(normalizedChannelType);
  const requiresInboundFirst = FIRST_MESSAGE_RESTRICTED_CHANNELS.has(normalizedChannelType);
  const isChannelInitiationBlocked =
    hasValidatedSelectedContactChannel && requiresInboundFirst && !hasChannelIdentifier;
  const isMessageWindowClosed =
    hasValidatedSelectedContactChannel &&
    isWindowRestrictedChannel &&
    messageWindowExpiry !== null &&
    messageWindowExpiry <= Date.now();
  const isFreeFormReplyBlocked =
    hasValidatedSelectedContactChannel &&
    (
      isChannelInitiationBlocked ||
      (normalizedChannelType === 'whatsapp' && isWindowRestrictedChannel && messageWindowExpiry === null) ||
      isMessageWindowClosed
    );
  const canSendFreeFormReply = !isFreeFormReplyBlocked;
  const showWindowRestrictionWarning = !isNote && hasValidatedSelectedContactChannel && isFreeFormReplyBlocked;
  const isReplyComposerLocked = !isNote && hasValidatedSelectedContactChannel && isFreeFormReplyBlocked;
  const formattedWindowExpiry = formatWindowExpiry(messageWindowExpiry);
  const restrictionCopy = isChannelInitiationBlocked
    ? normalizedChannelType === 'instagram'
      ? 'This contact has not messaged you on Instagram yet. You can only reply after they start the conversation.'
      : 'This contact has not messaged you on Messenger yet. You can only reply after they start the conversation.'
    : normalizedChannelType === 'whatsapp'
      ? 'This WhatsApp contact channel is not open for free-form messaging. Send a template to message the contact.'
      : normalizedChannelType === 'instagram'
        ? 'This Instagram contact channel is outside the reply window. Wait for a new inbound message before sending a normal reply.'
        : 'This Messenger contact channel is outside the messaging window. Wait for a new inbound message before sending a normal reply.';
  const contactName = [selectedConversation?.contact?.firstName, selectedConversation?.contact?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || selectedConversation?.contact?.email || selectedConversation?.contact?.phone || 'Customer';
  const contactIdentifier =
    selectedConversation?.contact?.identifier ||
    selectedConversation?.contact?.phone ||
    selectedConversation?.contact?.email ||
    undefined;

  const filteredVariables = variableQuery !== null
    ? variables.filter(v =>
      v.key.toLowerCase().includes(variableQuery.toLowerCase()) ||
      v.label.toLowerCase().includes(variableQuery.toLowerCase())
    )
    : [];
  const filteredMentionUsers = mentionQuery !== null
    ? (workspaceUsers ?? []).filter((user) => {
      const label = workspaceUserLabel(user);
      return label.toLowerCase().includes(mentionQuery.toLowerCase());
    })
    : [];
  const mentionOptions = filteredMentionUsers.map((user) => {
    const status = getMentionStatus(user);

    return {
      id: String(user.id),
      label: workspaceUserLabel(user),
      subtitle: user.email ?? undefined,
      avatarSrc: user.avatarUrl ?? undefined,
      status,
      statusLabel: getMentionStatusLabel(status),
    };
  });

  // click-outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) emojiMenu.close();
      if (aiPromptMenuRef.current && !aiPromptMenuRef.current.contains(e.target as Node)) {
        aiComposer.setAiPromptMenuOpen(false);
        aiComposer.setActivePromptParent(null);
      }
      if (
        variableDropdownRef.current && !variableDropdownRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) setVariableQuery(null);
      if (
        mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) setMentionQuery(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aiComposer, emojiMenu]);

  useEffect(() => {
    if (!isReplyComposerLocked) return;
    emojiMenu.close();
    aiComposer.setAiPromptMenuOpen(false);
    aiComposer.setActivePromptParent(null);
    setShowRecorder(false);
    setVariableQuery(null);
    setMentionQuery(null);
  }, [aiComposer, emojiMenu, isReplyComposerLocked]);

  useEffect(() => {
    if (isNote || availableReplyChannels.length === 0) return;
    if (availableReplyChannels.some((channel) => isSameChannel(channel, selectedChannel))) return;
    onChannelChange(availableReplyChannels[0]);
  }, [availableReplyChannels, isNote, onChannelChange, selectedChannel]);

  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  // auto-grow textarea
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReplyComposerLocked) return;
    aiComposer.clearAiComposerNotice();
    const val = e.target.value;
    setMessage(val);
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = isNote ? textBeforeCursor.match(/@([\w.-]*)$/) : null;
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionHighlight(0);
      setVariableQuery(null);
    } else if (isNote && textBeforeCursor.endsWith('@')) {
      setMentionQuery('');
      setMentionHighlight(0);
      setVariableQuery(null);
    } else {
      setMentionQuery(null);
      const varMatch = textBeforeCursor.match(/\$(\w*)$/);
      if (varMatch) { setVariableQuery(varMatch[1]); setVariableHighlight(0); }
      else setVariableQuery(null);
    }
    // auto-grow
    resizeTextarea();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isReplyComposerLocked) return;
    if (isAiBusy) {
      e.preventDefault();
      return;
    }
    if (mentionQuery !== null && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionHighlight(h => Math.min(h + 1, filteredMentionUsers.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); insertMention(filteredMentionUsers[mentionHighlight]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }
    if (variableQuery !== null && filteredVariables.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setVariableHighlight(h => Math.min(h + 1, filteredVariables.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setVariableHighlight(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); insertVariable(filteredVariables[variableHighlight]); return; }
      if (e.key === 'Escape') { setVariableQuery(null); return; }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  };

  const insertMention = (user: WorkspaceUserLike) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([\w.-]*)$/) || textBeforeCursor.match(/@$/);
    if (!mentionMatch) return;

    const start = cursorPos - mentionMatch[0].length;
    const label = workspaceUserLabel(user);
    const insertion = `@[${user.id}|${label}] `;
    const newText = message.slice(0, start) + insertion + message.slice(cursorPos);
    setMessage(newText);
    setMentionQuery(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + insertion.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const insertVariable = (variable: typeof variables[0]) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const varMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (varMatch) {
      const start = cursorPos - varMatch[0].length;
      const insertion = `{{${variable.key}}}`;
      const newText = message.slice(0, start) + insertion + message.slice(cursorPos);
      setMessage(newText);
      setVariableQuery(null);
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = start + insertion.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (isReplyComposerLocked) return;
    if (!files || !selectedConversation?.id) return;
    const uploaded: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const previewUrl = URL.createObjectURL(file);
      const uploadedUrl = await uploadFile(file, selectedConversation.id);
      uploaded.push({ file, type: getAttachmentType(file), previewUrl, url: uploadedUrl || '' });
    }
    setAttachedFiles(prev => [...prev, ...uploaded]);
  };

  const removeFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const hasComposerContent = message.trim().length > 0 || attachedFiles.length > 0;
  const canSend = !isAiBusy && (isNote ? hasComposerContent : hasComposerContent && canSendFreeFormReply);
  const handleSend = () => {
    if (!canSend) return;
    const attachments: MediaAttachment[] = attachedFiles.map(af => ({
      type: af.type, filename: af.file.name, url: af.url, mimeType: af.file.type,
    }));

    if (!isNote) {
      onSendMessage({
        id: Date.now(),
        conversationId: selectedConversation?.id,
        type: isNote ? 'comment' : 'reply',
        text: message.trim(),
        author: 'You',
        initials: 'ME',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        direction: 'outgoing',
        channel: activeComposerChannel,
        channelId: activeComposerChannel?.id,
        attachments: attachments.length > 0 ? attachments : undefined,
        // attach quoted context for BE
        metadata:{
          contactIdentifier,
          ...(replyContext?.type === 'chat' && replyContext.quotedMessage
            ? { quotedMessage: replyContext.quotedMessage }
            : {}),
        },


      } as any);
    } else {
      const mentionedUserIds = extractMentionIds(message);
      onSendNote({
        text: message.trim(),
        mentionedUserIds,
      } as any);
    }

    setMessage('');
    setAttachedFiles([]);
    onClearReplyContext?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    if (isReplyComposerLocked) return;
    if (!selectedConversation?.id) return;
    const file = new globalThis.File([audioBlob], 'audio_recording.m4a', { type: 'audio/x-m4a' });
    const url = await uploadFile(file, selectedConversation.id);
    onSendMessage({
      id: Date.now(),
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      text: '',
      author: 'You',
      initials: 'ME',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      direction: 'outgoing',
      channel: activeComposerChannel,
      channelId: activeComposerChannel?.id,
      attachments: [{ type: 'audio', filename: file.name, url, mimeType: file.type }],
    } as any);
    setShowRecorder(false);
  };

  const handleTemplateUse = (template: Template) => {

    onSendMessage({
      
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      author: 'You',
      channel: activeComposerChannel,
      channelId: activeComposerChannel?.id,
      metadata:{
        template
      }
    } as any);

    // setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const templateContextValues: Record<string, string> = {
    conversation_id: String(selectedConversation?.id ?? ''),
    contact_name: contactName,
  };

  /* ── bg ── */
  const actionButtonSize = 'xs';
  const borderClr = isNote ? 'border-amber-300' : 'border-gray-300';
  const channelSelector = !isNote && activeComposerChannel ? (
    <ChannelSelectMenu
      channels={availableReplyChannels}
      selectedChannel={activeComposerChannel}
      onChange={handleReplyChannelChange}
      variant="inline"
      valueMode="type-id"
      groupLabel="Send via channel"
    />
  ) : null;
  const assistButton = !isNote && !isReplyComposerLocked ? (
    <Button
      onClick={aiComposer.handleAssistDraft}
      disabled={aiComposer.aiLoadingAction !== null}
      variant="link"
      size={actionButtonSize}
      radius="full"
      loading={aiComposer.aiLoadingAction === 'assist'}
      loadingMode="inline"
      leftIcon={<Sparkles size={15} />}
    >
      AI Assist
    </Button>
  ) : null;
  return (
    <div className="transition-colors duration-150">
      <TemplateModal open={templateModal.isOpen}  onClose={templateModal.close} onUse={handleTemplateUse} contextValues={templateContextValues} />

      {/* ── Quoted reply banner ── */}
      {replyContext?.type === 'chat' && (
        <QuotedReplyBanner ctx={replyContext} onDismiss={() => onClearReplyContext?.()} />
      )}

      {showRecorder ? (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <AudioRecorder onSend={handleAudioSend} onCancel={() => setShowRecorder(false)} />
        </div>
      ) : (
        <div className={`mx-2 mb-2 rounded-[20px] border ${borderClr} ${isNote ? 'bg-amber-50/80' : 'bg-white'} p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow sm:mx-3 sm:mb-2.5 sm:rounded-xl`}>
         
          {!isNote && (channelSelector || assistButton) && (
            <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1.5 sm:pt-1 sm:pb-1">
              {channelSelector}
              {assistButton}
            </div>
          )}

          {/* Variable dropdown */}
          <div className="relative">
            <MentionSuggestionMenu
              ref={mentionDropdownRef}
              isOpen={mentionQuery !== null}
              query={mentionQuery ?? ""}
              title="Mention a teammate"
              options={mentionOptions}
              highlightedIndex={mentionHighlight}
              onHighlightChange={setMentionHighlight}
              onSelect={(option) => {
                const user = filteredMentionUsers.find((item) => String(item.id) === option.id);
                if (user) {
                  insertMention(user);
                }
              }}
              showEmptyState={Boolean(mentionQuery)}
            />
            <VariableSuggestionMenu
              ref={variableDropdownRef}
              isOpen={variableQuery !== null}
              query={variableQuery ?? ""}
              options={filteredVariables}
              highlightedIndex={variableHighlight}
              onHighlightChange={setVariableHighlight}
              onSelect={insertVariable}
              showEmptyState={Boolean(variableQuery)}
            />

            {/* Textarea */}
            <AiComposerInlineStatus
              loadingAction={aiComposer.aiLoadingAction}
              notice={aiComposer.aiComposerNotice}
            />
            {!isReplyComposerLocked ? (
              <TextareaInput
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              readOnly={isAiBusy}
              placeholder={isAiBusy ? "AI is working..." : isNote ? "Write an internal note… type '@' to mention teammates" : "Reply… type '$' for variables"}
              appearance={isNote ? 'composer-note' : 'composer'}
              autoResize
              rows={1}
              maxRows={isMobile ? 4 : 7}
            />
            ) : null}
      
          </div>
           {showWindowRestrictionWarning && (
            <div className="mx-2 mt-2 mb-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-900">{restrictionCopy}</p>
                  {formattedWindowExpiry && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                      <Clock3 size={12} />
                      Window expired at {formattedWindowExpiry}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}


          <ComposerAttachmentPreviewStrip
            files={attachedFiles}
            onRemove={removeFile}
            locked={isReplyComposerLocked}
            tone={isNote ? 'note' : 'reply'}
          />

          {/* Bottom toolbar */}
          <div className="relative" ref={aiPromptMenuRef}>
            {!isNote && !isReplyComposerLocked && (
              <AiPromptMenu
                open={aiComposer.aiPromptMenuOpen}
                prompts={aiComposer.rewritePrompts}
                activePromptParent={aiComposer.activePromptParent}
                onClose={() => aiComposer.setAiPromptMenuOpen(false)}
                onSelectPrompt={aiComposer.handleRewrite}
                onSetActiveParent={aiComposer.setActivePromptParent}
              />
            )}
            <div className={`flex items-center gap-2 border-t px-2.5 py-1.5 sm:flex-wrap sm:py-2 ${isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>

            {/* Left: attachments + emoji + mic + template */}
            <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pr-1 sm:flex-wrap sm:overflow-visible sm:pr-0">
              {!isNote && !isReplyComposerLocked && (
                <Button
                  onClick={() => aiComposer.setAiPromptMenuOpen((open) => !open)}
                  variant={aiComposer.aiPromptMenuOpen ? 'soft-primary' : 'ghost'}
                  size="xs"
                  iconOnly
                  aria-label="Open AI prompts"
                  leftIcon={<Wand2 size={16} />}
                  className="mr-1"
                />
              )}

              {/* <button onClick={() => imageRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach image"><ImageIcon size={16} /></button>
              <button onClick={() => videoRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach video"><Video size={16} /></button> */}
              {!isReplyComposerLocked && (
                <Button
                  onClick={() => fileRef.current?.click()}
                  variant="ghost"
                  size="xs"
                  iconOnly
                  aria-label="Attach file"
                  leftIcon={<Paperclip size={16} />}
                />
              )}

              {!isReplyComposerLocked && (
                <div className="relative" ref={emojiRef}>
                  <Button
                    onClick={emojiMenu.toggle}
                    variant={emojiMenu.isOpen ? 'soft-warning' : 'ghost'}
                    size="xs"
                    iconOnly
                    aria-label="Insert emoji"
                    leftIcon={<Smile size={16} />}
                  />
                  {emojiMenu.isOpen && (
                    <EmojiPicker mode="reply" accent="gray" onSelect={emoji => { setMessage(prev => prev + emoji); emojiMenu.close(); }} />
                  )}
                </div>
              )}

              {isNote && (
                <Button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const pos = textareaRef.current?.selectionStart ?? message.length;
                    const nextValue = message.slice(0, pos) + '@' + message.slice(pos);
                    setMessage(nextValue);
                    setMentionQuery('');
                    setMentionHighlight(0);
                    setTimeout(() => {
                      textareaRef.current?.focus();
                      textareaRef.current?.setSelectionRange(pos + 1, pos + 1);
                    }, 0);
                  }}
                  variant="soft-warning"
                  size="xs"
                  iconOnly
                  aria-label="Mention teammate"
                  leftIcon={<AtSign size={16} />}
                />
              )}

              {/* <button onClick={() => setShowRecorder(true)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors" title="Record voice"><Mic size={16} /></button> */}

              {!isNote && ['whatsapp', 'messenger'].includes(activeComposerChannel?.type) && (
                <Button
                  onClick={templateModal.open}
                  variant="ghost"
                  size="xs"
                  iconOnly
                  aria-label="Insert template"
                  leftIcon={<LayoutTemplate size={16} />}
                />
              )}
            </div>

            {/* Right: mode pills + send */}
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">

              {/* ── Mode switcher: two compact pills ── */}
              {!isNote && !isReplyComposerLocked && (
                <Button
                  onClick={aiComposer.handleSummarize}
                  disabled={aiComposer.aiLoadingAction !== null}
                  variant="link"
                  size="xs"
                  iconOnly={isMobile}
                  aria-label="Summarize conversation"
                  loading={aiComposer.aiLoadingAction === 'summarize'}
                  loadingMode="inline"
                  leftIcon={<Sparkles size={14} />}
                >
                  {!isMobile ? 'Summarize' : null}
                </Button>
              )}
              <div className="flex items-center rounded-xl bg-gray-100 p-0.5">
                <Button
                  onClick={() => onInputModeChange('reply')}
                  variant={!isNote ? 'secondary' : 'ghost'}
                  size="xs"
                  leftIcon={<MessageSquare size={11} />}
                >
                  <span className="hidden sm:inline">Reply</span>
                </Button>
                <Button
                  onClick={() => onInputModeChange('note')}
                  variant={isNote ? 'soft-warning' : 'ghost'}
                  size="xs"
                  leftIcon={<StickyNote size={11} />}
                >
                  <span className="hidden sm:inline">Note</span>
                </Button>
              </div>

              {/* Send button */}
              {(!isReplyComposerLocked || isNote) && (
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
                  variant={isNote ? 'warning' : 'primary'}
                  size="sm"
                  iconOnly
                  leftIcon={<Send size={14} />}
                  aria-label={isNote ? 'Send internal note' : 'Send reply'}
                />
              )}
            </div>
          </div>
          </div>

        </div>
      )}

      {!isReplyComposerLocked && <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />}
      {!isReplyComposerLocked && <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />}
      {!isReplyComposerLocked && <input ref={fileRef} type="file" className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />}
    </div>
  );
}
