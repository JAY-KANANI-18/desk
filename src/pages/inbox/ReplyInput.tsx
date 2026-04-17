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

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Paperclip, Smile, Mic, X, ChevronDown, Check,
  Video, FileText, DollarSign, LayoutTemplate,
  MessageSquare, StickyNote,
  Play, File as FileIcon,
  Wand2, Sparkles, Loader2, AtSign, AlertTriangle, Clock3,
} from 'lucide-react';
import { channelConfig, variables } from './data';
import type { MediaAttachment, AttachmentType } from './types';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';
import { Template, TemplateModal } from './TemplateModal';
import { useInbox } from '../../context/InboxContext';
import type { SharedInputProps } from './InputArea';
import type { ReplyContext } from './MessageArea';
import { AiComposerInlineStatus, AiPromptMenu, useInboxAiComposer } from './composerShared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { extractMentionIds } from './utils';
import { useIsMobile } from '../../hooks/useIsMobile';

/* ─── types ─────────────────────────────────────────────────────────────────── */

type AttachedFile = { file: globalThis.File; type: AttachmentType; url: string; previewUrl?: string };

const WINDOW_RESTRICTED_CHANNELS = new Set(['whatsapp', 'messenger', 'instagram']);
const FIRST_MESSAGE_RESTRICTED_CHANNELS = new Set(['messenger', 'instagram']);

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
      <button onClick={onDismiss} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
        <X size={13} />
      </button>
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [templateOpen, setTemplateOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);
  const aiPromptMenuRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxHeight = isMobile ? 132 : 200;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
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
  const channelType = selectedChannel?.type ?? selectedConversation?.channel?.type;
  const selectedContactChannels =
    (selectedContact?.contactChannels as any[] | undefined) ??
    (selectedConversation?.contact?.contactChannels as any[] | undefined) ??
    [];
  const selectedContactChannel = selectedContactChannels.find((contactChannel) =>
    contactChannel?.channelId === selectedChannel?.id ||
    contactChannel?.channelType === channelType,
  );
  const normalizedChannelType = String(channelType ?? '').toLowerCase();
  const hasChannelIdentifier = Boolean(selectedContactChannel?.identifier);
  const messageWindowExpiry = parseTimestamp(selectedContactChannel?.messageWindowExpiry);
  const isWindowRestrictedChannel = WINDOW_RESTRICTED_CHANNELS.has(normalizedChannelType);
  const requiresInboundFirst = FIRST_MESSAGE_RESTRICTED_CHANNELS.has(normalizedChannelType);
  const isChannelInitiationBlocked = requiresInboundFirst && !hasChannelIdentifier;
  const isMessageWindowClosed = isWindowRestrictedChannel && messageWindowExpiry !== null && messageWindowExpiry <= Date.now();
  const isFreeFormReplyBlocked =
    isChannelInitiationBlocked ||
    (normalizedChannelType === 'whatsapp' && isWindowRestrictedChannel && messageWindowExpiry === null) ||
    isMessageWindowClosed;
  const canSendFreeFormReply = !isFreeFormReplyBlocked;
  const showWindowRestrictionWarning = !isNote && isFreeFormReplyBlocked;
  const isReplyComposerLocked = !isNote && isFreeFormReplyBlocked;
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
    ? (workspaceUsers ?? []).filter((user: any) => {
      const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || '';
      return label.toLowerCase().includes(mentionQuery.toLowerCase());
    })
    : [];

  // click-outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
      if (channelRef.current && !channelRef.current.contains(e.target as Node)) setChannelMenuOpen(false);
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
  }, [aiComposer]);

  useEffect(() => {
    if (!isReplyComposerLocked) return;
    setEmojiOpen(false);
    aiComposer.setAiPromptMenuOpen(false);
    aiComposer.setActivePromptParent(null);
    setShowRecorder(false);
    setVariableQuery(null);
    setMentionQuery(null);
  }, [aiComposer, isReplyComposerLocked]);

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

  const insertMention = (user: any) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([\w.-]*)$/) || textBeforeCursor.match(/@$/);
    if (!mentionMatch) return;

    const start = cursorPos - mentionMatch[0].length;
    const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'User';
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
        channel: selectedChannel?.type,
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
      channel: selectedChannel,
      attachments: [{ type: 'audio', filename: file.name, url, mimeType: file.type }],
    } as any);
    setShowRecorder(false);
  };

  const handleTemplateUse = (template: Template) => {

    onSendMessage({
      
      conversationId: selectedConversation?.id,
      type: isNote ? 'comment' : 'reply',
      author: 'You',
      channel: selectedChannel,
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
  const noteBg = 'bg-amber-50';
  const replyBg = 'bg-white';
  const activeBg = isNote ? noteBg : replyBg;
  const borderClr = isNote ? 'border-amber-300' : 'border-gray-300';
  const channelSelector = !isNote ? (
    <div className="relative" ref={channelRef}>
      <button
        onClick={() => setChannelMenuOpen((open) => !open)}
        className={`flex min-w-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 ${
          isMobile ? 'max-w-[11.5rem]' : ''
        }`}
        title="Switch channel"
      >
        <img
          src={channelConfig[selectedChannel?.type]?.icon}
          alt={selectedChannel?.name}
          className="h-3.5 w-3.5 flex-shrink-0"
        />
        <span className={`truncate ${isMobile ? 'max-w-[7rem]' : 'hidden max-w-[5rem] sm:inline'}`}>
          {selectedChannel?.name}
        </span>
        <ChevronDown
          size={12}
          className={`flex-shrink-0 transition-transform ${channelMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {channelMenuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Send via channel
          </p>
          {channels?.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                onChannelChange(ch);
                setChannelMenuOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                selectedChannel?.id === ch.id ? 'bg-gray-50' : ''
              }`}
            >
              <img src={channelConfig[ch.type]?.icon} alt={ch.name} className="h-4 w-4" />
              <span className="flex-1 text-left font-medium text-gray-700">{ch.name || 'Unnamed'}</span>
              {selectedChannel?.id === ch.id && <Check size={13} className="flex-shrink-0 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;
  const assistButton = !isNote && !isReplyComposerLocked ? (
    <button
      onClick={aiComposer.handleAssistDraft}
      disabled={aiComposer.aiLoadingAction !== null}
      className={`inline-flex items-center gap-2 rounded-xl bg-violet-50 font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      {aiComposer.aiLoadingAction === 'assist' ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Sparkles size={15} />
      )}
      AI Assist
    </button>
  ) : null;
  return (
    <div className={`${activeBg} transition-colors duration-150 `}>
      <TemplateModal open={templateOpen}  onClose={() => setTemplateOpen(false)} onUse={handleTemplateUse} contextValues={templateContextValues} />

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

          {isMobile && !isNote && (
            <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1.5">
              {channelSelector}
              {assistButton}
            </div>
          )}

          {!isMobile && assistButton && (
            <div className="flex items-center justify-end px-2 pt-1 pb-1">
              {assistButton}
            </div>
          )}

          {/* Variable dropdown */}
          <div className="relative">
            {mentionQuery !== null && filteredMentionUsers.length > 0 && (
              <div ref={mentionDropdownRef} className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <AtSign size={13} className="text-amber-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mention a teammate</span>
                  {mentionQuery !== null && <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">@{mentionQuery}</span>}
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {filteredMentionUsers.map((user: any, idx) => {
                    const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'User';
                    return (
                      <button
                        key={user.id}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${mentionHighlight === idx ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700">
                          {label.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {mentionQuery !== null && mentionQuery.length > 0 && filteredMentionUsers.length === 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-gray-400">No teammate matches <span className="font-medium text-gray-600">@{mentionQuery}</span></p>
                </div>
              </div>
            )}
            {variableQuery !== null && filteredVariables.length > 0 && (
              <div ref={variableDropdownRef} className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <DollarSign size={13} className="text-violet-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insert variable</span>
                  {variableQuery && <span className="ml-auto text-xs text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded">${variableQuery}</span>}
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {filteredVariables.map((v, idx) => (
                    <button key={v.key} onMouseDown={e => { e.preventDefault(); insertVariable(v); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${variableHighlight === idx ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={13} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{v.label}</p>
                        <p className="text-xs text-gray-400 truncate">{v.description}</p>
                      </div>
                      <code className="text-[10px] text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{`{{${v.key}}}`}</code>
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[10px] text-gray-400">↑↓ navigate · ↵ select · Esc dismiss</p>
                </div>
              </div>
            )}
            {variableQuery !== null && variableQuery.length > 0 && filteredVariables.length === 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-gray-400">No variable matches <span className="font-medium text-gray-600">${variableQuery}</span></p>
                </div>
              </div>
            )}

            {/* Textarea */}
            <AiComposerInlineStatus
              loadingAction={aiComposer.aiLoadingAction}
              notice={aiComposer.aiComposerNotice}
            />
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              readOnly={isAiBusy}
              placeholder={isAiBusy ? "AI is working..." : isNote ? "Write an internal note… type '@' to mention teammates" : "Reply… type '$' for variables"}
              className={`w-full resize-none px-3 py-2 text-[13px] leading-6 focus:outline-none sm:px-4 sm:py-3 sm:text-sm sm:leading-relaxed ${isReplyComposerLocked ? 'hidden' : ''} ${isAiBusy ? 'cursor-wait text-gray-500' : ''} ${isNote ? 'bg-amber-50 placeholder-amber-400' : 'bg-white placeholder-gray-400'}`}
              rows={1}
              style={{ maxHeight: isMobile ? 132 : 200, overflowY: 'auto' }}
            />
            {isReplyComposerLocked && (
              <div className="px-3 py-3 sm:px-4 sm:py-4">
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3">
                  <p className="text-sm font-medium text-amber-900">Reply actions are hidden while this channel window is closed.</p>
                  <p className="mt-1 text-xs text-amber-700">
                    You can switch channel, add an internal note, or use a template if this channel supports it.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attached file previews */}
          {attachedFiles.length > 0 && (
            <div className={`border-t px-2.5 py-2 sm:px-4 ${isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex flex-wrap gap-2 items-start">
                {attachedFiles.map((af, i) =>
                  af.type === 'image' ? (
                    <div key={i} className="relative group flex-shrink-0">
                      <img src={af.previewUrl} alt={af.file.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      {!isReplyComposerLocked && (
                        <button onMouseDown={e => { e.preventDefault(); removeFile(i); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span key={i} className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 ${af.type === 'audio' ? 'bg-red-50 text-red-700 border-red-200' : af.type === 'video' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                      {af.type === 'audio' ? <Mic size={11} /> : af.type === 'video' ? <Video size={11} /> : <FileText size={11} />}
                      <span className="max-w-[120px] truncate font-medium">{af.file.name}</span>
                      {!isReplyComposerLocked && (
                        <button onMouseDown={e => { e.preventDefault(); removeFile(i); }} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
                      )}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

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
                <button onClick={() => aiComposer.setAiPromptMenuOpen((open) => !open)} className="mr-1 p-1.5 hover:bg-violet-100 rounded-lg text-violet-600 transition-colors" title="AI prompts">
                  <Wand2 size={16} />
                </button>
              )}

              {/* Channel selector (only in reply mode) */}
              {!isMobile && channelSelector}

              {/* <button onClick={() => imageRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach image"><ImageIcon size={16} /></button>
              <button onClick={() => videoRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach video"><Video size={16} /></button> */}
              {!isReplyComposerLocked && (
                <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach file"><Paperclip size={16} /></button>
              )}

              {!isReplyComposerLocked && (
                <div className="relative" ref={emojiRef}>
                  <button onClick={() => setEmojiOpen(o => !o)}
                    className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-200 text-gray-500'}`} title="Emoji">
                    <Smile size={16} />
                  </button>
                  {emojiOpen && (
                    <EmojiPicker mode="reply" accent="gray" onSelect={emoji => { setMessage(prev => prev + emoji); setEmojiOpen(false); }} />
                  )}
                </div>
              )}

              {isNote && (
                <button
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
                  className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors"
                  title="Mention teammate"
                >
                  <AtSign size={16} />
                </button>
              )}

              {/* <button onClick={() => setShowRecorder(true)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors" title="Record voice"><Mic size={16} /></button> */}

              {!isNote && ['whatsapp', 'messenger'].includes(selectedChannel?.type) && (
                <button onClick={() => setTemplateOpen(true)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-500 transition-colors" title="Insert template">
                  <LayoutTemplate size={16} />
                </button>
              )}
            </div>

            {/* Right: mode pills + send */}
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">

              {/* ── Mode switcher: two compact pills ── */}
              {!isNote && !isReplyComposerLocked && (
                <button onClick={aiComposer.handleSummarize} disabled={aiComposer.aiLoadingAction !== null} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm sm:font-medium">
                  {aiComposer.aiLoadingAction === 'summarize' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span className="hidden sm:inline">Summarize</span>
                </button>
              )}
              <div className="flex items-center rounded-xl bg-gray-100 p-0.5">
                <button
                  onClick={() => onInputModeChange('reply')}
                  title="Reply to customer"
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all sm:px-2.5 sm:py-1 sm:text-xs ${!isNote ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <MessageSquare size={11} />
                  <span className="hidden sm:inline">Reply</span>
                </button>
                <button
                  onClick={() => onInputModeChange('note')}
                  title="Internal note"
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all sm:px-2.5 sm:py-1 sm:text-xs ${isNote ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <StickyNote size={11} />
                  <span className="hidden sm:inline">Note</span>
                </button>
              </div>

              {/* Send button */}
              {(!isReplyComposerLocked || isNote) && (
                <button onClick={handleSend} disabled={!canSend}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 ${canSend
                    ? isNote ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                  <Send size={14} />
                </button>
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
