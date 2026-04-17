import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Bold,
  Check,
  ChevronDown,
  DollarSign,
  FileText,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  StickyNote,
  Strikethrough,
  Underline,
  Wand2,
  X,
} from 'lucide-react';
import type { AttachmentType, MediaAttachment } from './types';
import { channelConfig, variables } from './data';
import { useInbox } from '../../context/InboxContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { SharedInputProps } from './InputArea';
import { EmojiPicker } from './EmojiPicker';
import { AiComposerInlineStatus, AiPromptMenu, useInboxAiComposer } from './composerShared';
import { extractMentionIds } from './utils';
import { normalizeEmailChannelConfig } from '../../lib/emailChannel';
import { useIsMobile } from '../../hooks/useIsMobile';

type AttachedFile = { file: File; type: AttachmentType; url: string; previewUrl: string };
type TriggerState = { type: 'variable' | 'mention'; query: string } | null;

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

export function EmailInput({
  onChannelChange,
  onSendMessage,
  onSendNote,
  inputMode,
  onInputModeChange,
  replyContext,
  onClearReplyContext,
}: SharedInputProps) {
  const isMobile = useIsMobile();
  const { uploadFile, channels, selectedConversation, selectedChannel } = useInbox();
  const { workspaceUsers } = useWorkspace();

  const emailReply = replyContext?.type === 'email' ? replyContext.emailReply : null;
  const [to, setTo] = useState(emailReply?.to ?? selectedConversation?.contact?.email ?? '');
  const [cc, setCc] = useState(emailReply?.cc ?? '');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(emailReply?.subject ?? '');
  const [showCc, setShowCc] = useState(Boolean(emailReply?.cc));
  const [showBcc, setShowBcc] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [draftText, setDraftText] = useState('');
  const [trigger, setTrigger] = useState<TriggerState>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  const isNote = inputMode === 'note';
  const normalizedChannel = useMemo(() => normalizeEmailChannelConfig(selectedChannel), [selectedChannel]);

  const aiComposer = useInboxAiComposer({
    conversationId: selectedConversation?.id,
    getDraft: () => draftText,
    setDraft: (text) => {
      setDraftText(text);
      if (editorRef.current) editorRef.current.innerHTML = plainTextToHtml(text);
    },
    switchToReply: () => onInputModeChange('reply'),
    switchToNote: () => onInputModeChange('note'),
  });
  const isAiBusy = aiComposer.aiLoadingAction !== null;

  const filteredTriggerItems = useMemo(() => {
    if (!trigger) return [];
    if (trigger.type === 'variable') {
      return variables.filter((item) =>
        item.key.toLowerCase().includes(trigger.query.toLowerCase()) ||
        item.label.toLowerCase().includes(trigger.query.toLowerCase()),
      );
    }
    return (workspaceUsers ?? []).filter((user: any) => {
      const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || '';
      return label.toLowerCase().includes(trigger.query.toLowerCase());
    });
  }, [trigger, workspaceUsers]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiRef.current && !emojiRef.current.contains(target)) setEmojiOpen(false);
      if (channelRef.current && !channelRef.current.contains(target)) setChannelMenuOpen(false);
      if (triggerMenuRef.current && !triggerMenuRef.current.contains(target) && editorRef.current && !editorRef.current.contains(target)) {
        setTrigger(null);
      }
      if (aiMenuRef.current && !aiMenuRef.current.contains(target)) {
        setAiMenuOpen(false);
        aiComposer.setActivePromptParent(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aiComposer]);

  useEffect(() => {
    if (emailReply) {
      setTo(emailReply.to ?? '');
      setCc(emailReply.cc ?? '');
      setSubject(emailReply.subject ?? '');
      setShowCc(Boolean(emailReply.cc));
    }
  }, [emailReply]);

  useEffect(() => {
    setTo(selectedConversation?.contact?.email ?? '');
    setCc('');
    setBcc('');
    setSubject('');
    setShowCc(false);
    setShowBcc(false);
    setAttachedFiles([]);
    setTrigger(null);
    setDraftText('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    onClearReplyContext?.();
  }, [selectedConversation?.id]);

  const updateDraftState = useCallback(() => {
    aiComposer.clearAiComposerNotice();
    const text = editorRef.current?.innerText?.replace(/\n{3,}/g, '\n\n') ?? '';
    setDraftText(text.trimEnd());
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setTrigger(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setTrigger(null);
      return;
    }
    const textBeforeCursor = (node.textContent ?? '').slice(0, range.startOffset);
    if (isNote) {
      const mentionMatch = textBeforeCursor.match(/@([\w.-]*)$/);
      if (mentionMatch) {
        setTrigger({ type: 'mention', query: mentionMatch[1] });
        setHighlightIndex(0);
        return;
      }
    }
    const variableMatch = textBeforeCursor.match(/\$(\w*)$/);
    if (variableMatch) {
      setTrigger({ type: 'variable', query: variableMatch[1] });
      setHighlightIndex(0);
      return;
    }
    setTrigger(null);
  }, [aiComposer, isNote]);

  const insertAtSelection = useCallback((replacement: string, pattern: RegExp) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const textBeforeCursor = (node.textContent ?? '').slice(0, range.startOffset);
    const match = textBeforeCursor.match(pattern);
    if (!match) return;

    const replacementRange = document.createRange();
    replacementRange.setStart(node, range.startOffset - match[0].length);
    replacementRange.setEnd(node, range.startOffset);
    replacementRange.deleteContents();

    const textNode = document.createTextNode(replacement);
    replacementRange.insertNode(textNode);

    const after = document.createRange();
    after.setStartAfter(textNode);
    after.collapse(true);
    selection.removeAllRanges();
    selection.addRange(after);
    setTrigger(null);
    updateDraftState();
    editorRef.current?.focus();
  }, [updateDraftState]);

  const insertVariable = useCallback((variable: typeof variables[number]) => {
    insertAtSelection(`{{${variable.key}}}`, /\$(\w*)$/);
  }, [insertAtSelection]);

  const insertMention = useCallback((user: any) => {
    const label = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'User';
    insertAtSelection(`@[${user.id}|${label}] `, /@([\w.-]*)$/);
  }, [insertAtSelection]);

  const addFiles = async (files: FileList | null) => {
    if (!files || !selectedConversation?.id) return;
    const uploaded: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const previewUrl = URL.createObjectURL(file);
      const uploadedUrl = await uploadFile(file, selectedConversation.id);
      uploaded.push({ file, type: getAttachmentType(file), previewUrl, url: uploadedUrl || '' });
    }
    setAttachedFiles((prev) => [...prev, ...uploaded]);
  };

  const removeFile = (index: number) => setAttachedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL', 'https://');
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand('createLink', false, url);
    updateDraftState();
  };

  const canSend = !isAiBusy && (draftText.trim().length > 0 || attachedFiles.length > 0);

  const handleSend = () => {
    if (!canSend) return;

    if (isNote) {
      onSendNote({
        text: draftText.trim(),
        mentionedUserIds: extractMentionIds(draftText),
      } as any);
    } else {
      const attachments: MediaAttachment[] = attachedFiles.map((file) => ({
        type: file.type,
        filename: file.file.name,
        url: file.url,
        mimeType: file.file.type,
      }));
      const signatureHtml = normalizedChannel.signatureEnabled && normalizedChannel.signatureHtml
        ? `<div data-email-signature="true">${normalizedChannel.signatureHtml}</div>`
        : '';
      const htmlBody = `${editorRef.current?.innerHTML ?? ''}${signatureHtml}`;

      onSendMessage({
        id: Date.now(),
        conversationId: selectedConversation?.id,
        type: 'reply',
        text: draftText.trim(),
        author: 'You',
        initials: 'ME',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        direction: 'outgoing',
        channel: 'email',
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: {
          email: {
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject,
            htmlBody,
            ...(emailReply ? {
              threadId: emailReply.threadId,
              messageId: emailReply.messageId,
              inReplyTo: emailReply.messageId,
            } : {}),
          },
        },
      } as any);
    }

    setDraftText('');
    setAttachedFiles([]);
    setTrigger(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
    if (!isNote) setSubject('');
    onClearReplyContext?.();
  };

  const toolbarButtonClass = 'p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors';
  const activeBg = isNote ? 'bg-amber-50' : 'bg-white';
  const borderClass = isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50';
  const channelSelector = !isNote ? (
    <div className="relative" ref={channelRef}>
      <button
        onClick={() => setChannelMenuOpen((open) => !open)}
        className={`flex min-w-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 ${
          channelMenuOpen ? 'border-indigo-200 text-indigo-600' : ''
        }`}
        title="Switch channel"
      >
        <img src={channelConfig[selectedChannel?.type]?.icon} alt={selectedChannel?.name} className="h-3.5 w-3.5 flex-shrink-0" />
        <span className={`truncate ${isMobile ? 'max-w-[7rem]' : 'hidden max-w-[5rem] sm:inline'}`}>
          {selectedChannel?.name}
        </span>
        <ChevronDown size={10} className={`flex-shrink-0 transition-transform ${channelMenuOpen ? 'rotate-180' : ''}`} />
      </button>
      {channelMenuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Send via channel
          </p>
          {channels?.map((channel) => (
            <button
              key={channel.id}
              onClick={() => { onChannelChange(channel); setChannelMenuOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${selectedChannel?.id === channel.id ? 'bg-gray-50' : ''}`}
            >
              <img src={channelConfig[channel.type]?.icon} alt={channel.name} className="h-4 w-4" />
              <span className="flex-1 text-left font-medium text-gray-700">{channel.name || 'Unnamed'}</span>
              {selectedChannel?.id === channel.id && <Check size={13} className="flex-shrink-0 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;
  const assistButton = !isNote ? (
    <button
      onClick={aiComposer.handleAssistDraft}
      disabled={aiComposer.aiLoadingAction !== null}
      className={`inline-flex items-center gap-2 rounded-xl bg-violet-50 font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      {aiComposer.aiLoadingAction === 'assist' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
      AI Assist
    </button>
  ) : null;

  return (
    <div className="flex flex-col transition-colors duration-150">
      <div className={`mx-2 mb-2 rounded-[20px] border p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow sm:mx-3 sm:mb-2.5 sm:rounded-xl ${activeBg}`}>
        {!isMobile && assistButton && (
          <div className="flex items-center justify-end px-2 pt-1 pb-1">
            {assistButton}
          </div>
        )}

        {isMobile && !isNote && (
          <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1.5">
            {channelSelector}
            {assistButton}
          </div>
        )}

        {!isNote && (
          <div className={`${isMobile ? 'border-0' : 'border-t border-gray-200'} divide-y divide-gray-100`}>
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Sub</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-transparent text-[13px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none sm:text-sm"
                placeholder="Subject"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {!showCc && <button onClick={() => setShowCc(true)} className="text-xs text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors font-medium">Cc</button>}
                {!showBcc && <button onClick={() => setShowBcc(true)} className="text-xs text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors font-medium">Bcc</button>}
              </div>
            </div>
            {showCc && (
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
                <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Cc</span>
                <input value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none sm:text-sm" placeholder="cc@example.com" />
                <button onClick={() => { setShowCc(false); setCc(''); }} className="text-gray-400 hover:text-gray-600 p-0.5 rounded flex-shrink-0"><X size={13} /></button>
              </div>
            )}
            {showBcc && (
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
                <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Bcc</span>
                <input value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none sm:text-sm" placeholder="bcc@example.com" />
                <button onClick={() => { setShowBcc(false); setBcc(''); }} className="text-gray-400 hover:text-gray-600 p-0.5 rounded flex-shrink-0"><X size={13} /></button>
              </div>
            )}
          </div>
        )}

        {!isNote && (
          <div className="flex items-center gap-0.5 border-t border-gray-100 bg-gray-50 px-2.5 py-1.5 flex-wrap sm:px-3">
            {[
              ['bold', <Bold size={14} key="bold" />],
              ['italic', <Italic size={14} key="italic" />],
              ['underline', <Underline size={14} key="underline" />],
              ['strikeThrough', <Strikethrough size={14} key="strike" />],
              ['insertUnorderedList', <List size={14} key="ul" />],
              ['insertOrderedList', <ListOrdered size={14} key="ol" />],
            ].map(([command, icon]) => (
              <button
                key={command}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.focus();
                  document.execCommand(command, false);
                  updateDraftState();
                }}
                className={toolbarButtonClass}
              >
                {icon}
              </button>
            ))}
            <button onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }} className={toolbarButtonClass}><Link size={14} /></button>
          </div>
        )}

        <div className={`relative min-h-[80px] max-h-[220px] overflow-y-auto ${activeBg}`}>
          {trigger && filteredTriggerItems.length > 0 && (
            <div ref={triggerMenuRef} className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto sm:w-80 mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                {trigger.type === 'variable' ? <DollarSign size={13} className="text-violet-500" /> : <AtSign size={13} className="text-amber-500" />}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {trigger.type === 'variable' ? 'Insert variable' : 'Mention teammate'}
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredTriggerItems.map((item: any, index) => {
                  const isActive = index === highlightIndex;
                  if (trigger.type === 'variable') {
                    return (
                      <button
                        key={item.key}
                        onMouseDown={(e) => { e.preventDefault(); insertVariable(item); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${isActive ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign size={13} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 truncate">{item.description}</p>
                        </div>
                      </button>
                    );
                  }
                  const label = [item.firstName, item.lastName].filter(Boolean).join(' ').trim() || item.email || 'User';
                  return (
                    <button
                      key={item.id}
                      onMouseDown={(e) => { e.preventDefault(); insertMention(item); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${isActive ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700">
                        {label.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <AiComposerInlineStatus
            loadingAction={aiComposer.aiLoadingAction}
            notice={aiComposer.aiComposerNotice}
          />

          {!draftText && !aiComposer.aiLoadingAction && !aiComposer.aiComposerNotice && (
            <div className={`absolute left-3 top-3 pr-3 text-[13px] pointer-events-none select-none sm:left-4 sm:text-sm ${isNote ? 'text-amber-400' : 'text-gray-400'}`}>
              {isNote ? "Internal note... type '@' to mention teammates" : <>Write your email... type <span className="font-mono text-violet-400">$</span> for variables</>}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable={!isAiBusy}
            suppressContentEditableWarning
            onInput={updateDraftState}
            onKeyUp={updateDraftState}
            onMouseUp={updateDraftState}
            onKeyDown={(e) => {
              if (isAiBusy) {
                e.preventDefault();
                return;
              }
              if (trigger && filteredTriggerItems.length > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((value) => Math.min(value + 1, filteredTriggerItems.length - 1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((value) => Math.max(value - 1, 0)); return; }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const item = filteredTriggerItems[highlightIndex];
                  if (trigger.type === 'variable') insertVariable(item);
                  else insertMention(item);
                  return;
                }
                if (e.key === 'Escape') { setTrigger(null); return; }
              }
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            aria-busy={isAiBusy}
            className={`min-h-[80px] px-3 py-3 text-[13px] leading-6 text-gray-800 focus:outline-none sm:px-4 sm:text-sm sm:leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${isAiBusy ? 'cursor-wait opacity-70' : ''} ${activeBg}`}
            style={{ wordBreak: 'break-word' }}
          />
        </div>

        {attachedFiles.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-2.5 py-2 sm:px-4">
            <div className="flex flex-wrap gap-2 items-start">
              {attachedFiles.map((file, index) => (
                file.type === 'image' ? (
                  <div key={index} className="relative group flex-shrink-0">
                    <img src={file.previewUrl} alt={file.file.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    <button onMouseDown={(e) => { e.preventDefault(); removeFile(index); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <span key={index} className="flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                    {file.type === 'audio' ? <Mic size={11} /> : <FileText size={11} />}
                    <span className="max-w-[120px] truncate font-medium">{file.file.name}</span>
                    <button onMouseDown={(e) => { e.preventDefault(); removeFile(index); }} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        <div className="relative" ref={aiMenuRef}>
          {!isNote && (
            <AiPromptMenu
              open={aiMenuOpen}
              prompts={aiComposer.rewritePrompts}
              activePromptParent={aiComposer.activePromptParent}
              onClose={() => setAiMenuOpen(false)}
              onSelectPrompt={aiComposer.handleRewrite}
              onSetActiveParent={aiComposer.setActivePromptParent}
            />
          )}
          <div className={`flex items-center gap-2 border-t px-2.5 py-1.5 sm:flex-wrap sm:py-2 ${borderClass}`}>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pr-1 sm:flex-wrap sm:overflow-visible sm:pr-0">
            {!isNote && (
              <button onClick={() => setAiMenuOpen((value) => !value)} className="mr-1 p-1.5 hover:bg-violet-100 rounded-lg text-violet-600 transition-colors" title="AI prompts">
                <Wand2 size={16} />
              </button>
            )}

            {!isMobile && channelSelector}

            <button onClick={() => fileRef.current?.click()} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Attach file">
              <Paperclip size={16} />
            </button>

            <div className="relative" ref={emojiRef}>
              <button onClick={() => setEmojiOpen((open) => !open)} className={`p-1.5 rounded-lg transition-colors ${emojiOpen ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-200 text-gray-500'}`} title="Emoji">
                <Smile size={16} />
              </button>
              {emojiOpen && (
                <EmojiPicker
                  mode="reply"
                  accent="gray"
                  onSelect={(emoji) => {
                    editorRef.current?.focus();
                    document.execCommand('insertText', false, emoji);
                    setEmojiOpen(false);
                    updateDraftState();
                  }}
                />
              )}
            </div>

            {isNote && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.focus();
                  document.execCommand('insertText', false, '@');
                  updateDraftState();
                }}
                className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors"
                title="Mention teammate"
              >
                <AtSign size={16} />
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">
            {!isNote && (
              <button onClick={aiComposer.handleSummarize} disabled={aiComposer.aiLoadingAction !== null} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-violet-600 hover:bg-violet-50 disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm sm:font-medium">
                {aiComposer.aiLoadingAction === 'summarize' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span className="hidden sm:inline">Summarize</span>
              </button>
            )}
            <div className="flex items-center rounded-xl bg-gray-100 p-0.5">
              <button onClick={() => onInputModeChange('reply')} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all sm:px-2.5 sm:py-1 sm:text-xs ${!isNote ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <MessageSquare size={11} />
                <span className="hidden sm:inline">Reply</span>
              </button>
              <button onClick={() => onInputModeChange('note')} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all sm:px-2.5 sm:py-1 sm:text-xs ${isNote ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <StickyNote size={11} />
                <span className="hidden sm:inline">Note</span>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 ${canSend ? isNote ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        </div>
      </div>

      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
