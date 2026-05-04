import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  MessageSquare,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  StickyNote,
  Strikethrough,
  Underline,
  Wand2,
  X,
} from '@/components/ui/icons';
import type { AttachmentType, MediaAttachment } from './types';
import { variables } from './data';
import { useInbox } from '../../context/InboxContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { SharedInputProps } from './InputArea';
import { EmojiPicker } from './EmojiPicker';
import {
  AiComposerInlineStatus,
  AiPromptMenu,
  ComposerAttachmentPreviewStrip,
  useInboxAiComposer,
} from './composerShared';
import { extractMentionIds } from './utils';
import { normalizeEmailChannelConfig } from '../../lib/emailChannel';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDisclosure } from '../../hooks/useDisclosure';
import { getContactScopedChannels, isSameChannel } from './channelUtils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ChannelSelectMenu,
  MentionSuggestionMenu,
  VariableSuggestionMenu,
  type MentionSuggestionOption,
} from '../../components/ui/Select';
import { workspaceUserLabel } from './contact-sidebar/utils';
import type { WorkspaceUserLike } from './contact-sidebar/types';

type AttachedFile = { file: File; type: AttachmentType; url: string; previewUrl: string };
type SelectedMention = { id: string; label: string };
type TriggerState = { type: 'variable' | 'mention'; query: string } | null;

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
  const { uploadFile, channels, selectedConversation, selectedChannel, selectedContact } = useInbox();
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
  const [selectedMentions, setSelectedMentions] = useState<SelectedMention[]>([]);
  const [trigger, setTrigger] = useState<TriggerState>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const emojiMenu = useDisclosure();
  const aiMenu = useDisclosure();

  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const triggerMenuRef = useRef<HTMLDivElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

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
  const availableEmailChannels = useMemo(
    () => getContactScopedChannels(channels, selectorContactChannels),
    [channels, selectorContactChannels],
  );
  const activeComposerChannel = useMemo(() => {
    if (availableEmailChannels.length === 0) return selectedChannel ?? null;
    return (
      availableEmailChannels.find((channel) => isSameChannel(channel, selectedChannel)) ??
      availableEmailChannels[0]
    );
  }, [availableEmailChannels, selectedChannel]);
  const normalizedChannel = useMemo(() => normalizeEmailChannelConfig(activeComposerChannel), [activeComposerChannel]);
  const handleComposerChannelChange = useCallback((
    _value: string,
    nextChannel: (typeof availableEmailChannels)[number] | null,
  ) => {
    if (nextChannel) {
      onChannelChange(nextChannel);
    }
  }, [onChannelChange]);

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

  const filteredVariableTriggerItems = useMemo(() => {
    if (trigger?.type !== 'variable') return [];

    return variables.filter((item) =>
      item.key.toLowerCase().includes(trigger.query.toLowerCase()) ||
      item.label.toLowerCase().includes(trigger.query.toLowerCase()),
    );
  }, [trigger?.query, trigger?.type]);
  const filteredMentionUsers = useMemo(() => {
    if (trigger?.type !== 'mention') return [];

    return (workspaceUsers ?? []).filter((user) =>
      workspaceUserLabel(user).toLowerCase().includes(trigger.query.toLowerCase()),
    );
  }, [trigger?.query, trigger?.type, workspaceUsers]);
  const mentionOptions = useMemo(
    () =>
      filteredMentionUsers.map((user) => {
        const status = getMentionStatus(user);

        return {
          id: String(user.id),
          label: workspaceUserLabel(user),
          subtitle: user.email ?? undefined,
          avatarSrc: user.avatarUrl ?? undefined,
          status,
          statusLabel: getMentionStatusLabel(status),
        };
      }),
    [filteredMentionUsers],
  );
  const triggerOptionCount =
    trigger?.type === 'variable'
      ? filteredVariableTriggerItems.length
      : trigger?.type === 'mention'
        ? filteredMentionUsers.length
        : 0;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiRef.current && !emojiRef.current.contains(target)) emojiMenu.close();
      if (triggerMenuRef.current && !triggerMenuRef.current.contains(target) && editorRef.current && !editorRef.current.contains(target)) {
        setTrigger(null);
      }
      if (aiMenuRef.current && !aiMenuRef.current.contains(target)) {
        aiMenu.close();
        aiComposer.setActivePromptParent(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aiComposer, aiMenu, emojiMenu]);

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
    setSelectedMentions([]);
    setDraftText('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    onClearReplyContext?.();
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (isNote || availableEmailChannels.length === 0) return;
    if (availableEmailChannels.some((channel) => isSameChannel(channel, selectedChannel))) return;
    onChannelChange(availableEmailChannels[0]);
  }, [availableEmailChannels, isNote, onChannelChange, selectedChannel]);

  const updateDraftState = useCallback(() => {
    aiComposer.clearAiComposerNotice();
    const text = editorRef.current?.innerText?.replace(/\n{3,}/g, '\n\n') ?? '';
    setDraftText(text.trimEnd());
    setSelectedMentions((prev) =>
      prev.filter((mention) => text.includes(`@${mention.label}`)),
    );
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

  const insertMention = useCallback((user: WorkspaceUserLike) => {
    const label = workspaceUserLabel(user);
    setSelectedMentions((prev) => {
      const nextMention = { id: String(user.id), label };
      return prev.some((mention) => mention.id === nextMention.id)
        ? prev.map((mention) => (mention.id === nextMention.id ? nextMention : mention))
        : [...prev, nextMention];
    });
    insertAtSelection(`@${label} `, /@([\w.-]*)$/);
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
  const actionButtonSize = 'xs';

  const handleSend = () => {
    if (!canSend) return;

    if (isNote) {
      onSendNote({
        text: draftText.trim(),
        mentionedUserIds: Array.from(
          new Set([
            ...extractMentionIds(draftText),
            ...selectedMentions
              .filter((mention) => draftText.includes(`@${mention.label}`))
              .map((mention) => mention.id),
          ]),
        ),
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
        channel: activeComposerChannel,
        channelId: activeComposerChannel?.id,
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
    setSelectedMentions([]);
    if (editorRef.current) editorRef.current.innerHTML = '';
    if (!isNote) setSubject('');
    onClearReplyContext?.();
  };

  const activeBg = isNote ? 'bg-amber-50' : 'bg-white';
  const borderClass = isNote ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50';
  const channelSelector = !isNote && activeComposerChannel ? (
    <ChannelSelectMenu
      channels={availableEmailChannels}
      selectedChannel={activeComposerChannel}
      onChange={handleComposerChannelChange}
      variant="inline"
      valueMode="type-id"
      groupLabel="Send via channel"
    />
  ) : null;
  const assistButton = !isNote ? (
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
    <div className="flex flex-col transition-colors duration-150">
      <div className={`mx-2 mb-2 rounded-[20px] border bg-clip-padding p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow sm:mx-3 sm:mb-2.5 sm:rounded-xl ${activeBg}`}>
        {!isNote && (channelSelector || assistButton) && (
          <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1.5 sm:pt-1 sm:pb-1">
            {channelSelector}
            {assistButton}
          </div>
        )}

        {!isNote && (
          <div className={`${isMobile ? 'border-0' : 'border-t border-gray-200'} divide-y divide-gray-100`}>
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Sub</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                appearance="composer-inline"
                inputSize="sm"
                placeholder="Subject"
                autoComplete="off"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {!showCc && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowCc(true)}
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowBcc(true)}
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>
            {showCc && (
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
                <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Cc</span>
                <Input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  appearance="composer-inline"
                  inputSize="sm"
                  placeholder="cc@example.com"
                  autoComplete="off"
                />
                <Button
                  onClick={() => { setShowCc(false); setCc(''); }}
                  variant="ghost"
                  size="xs"
                  iconOnly
                  radius="full"
                  aria-label="Remove cc field"
                  leftIcon={<X size={13} />}
                />
              </div>
            )}
            {showBcc && (
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
                <span className="w-8 flex-shrink-0 text-[11px] font-semibold text-gray-400">Bcc</span>
                <Input
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  appearance="composer-inline"
                  inputSize="sm"
                  placeholder="bcc@example.com"
                  autoComplete="off"
                />
                <Button
                  onClick={() => { setShowBcc(false); setBcc(''); }}
                  variant="ghost"
                  size="xs"
                  iconOnly
                  radius="full"
                  aria-label="Remove bcc field"
                  leftIcon={<X size={13} />}
                />
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
              <Button
                key={command}
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.focus();
                  document.execCommand(command, false);
                  updateDraftState();
                }}
                variant="ghost"
                size="xs"
                iconOnly
                aria-label={`Apply ${command} formatting`}
                leftIcon={icon}
              >
                {icon}
              </Button>
            ))}
            <Button
              onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }}
              variant="ghost"
              size="xs"
              iconOnly
              aria-label="Insert link"
              leftIcon={<Link size={14} />}
            />
          </div>
        )}

        <div className={`relative min-h-[80px] max-h-[220px] overflow-y-auto ${activeBg}`}>
          {trigger?.type === 'variable' ? (
            <VariableSuggestionMenu
              ref={triggerMenuRef}
              isOpen
              query={trigger.query}
              options={filteredVariableTriggerItems}
              highlightedIndex={highlightIndex}
              onHighlightChange={setHighlightIndex}
              onSelect={insertVariable}
              showEmptyState={Boolean(trigger.query)}
              className="left-2 right-2 w-auto sm:left-4 sm:right-auto sm:w-[320px]"
            />
          ) : null}
          <MentionSuggestionMenu
            ref={triggerMenuRef}
            isOpen={trigger?.type === 'mention'}
            query={trigger?.type === 'mention' ? trigger.query : ""}
            title="Mention teammate"
            options={mentionOptions}
            highlightedIndex={highlightIndex}
            onHighlightChange={setHighlightIndex}
            onSelect={(option) => {
              const user = filteredMentionUsers.find((item) => String(item.id) === option.id);
              if (user) {
                insertMention(user);
              }
            }}
            showEmptyState={trigger?.type === 'mention' && Boolean(trigger.query)}
            className="left-2 right-2 w-auto sm:left-4 sm:right-auto sm:w-80"
          />

          <AiComposerInlineStatus
            loadingAction={aiComposer.aiLoadingAction}
            notice={aiComposer.aiComposerNotice}
          />

          {!draftText && !aiComposer.aiLoadingAction && !aiComposer.aiComposerNotice && (
            <div className={`absolute left-3 top-3 pr-3 text-[13px] pointer-events-none select-none sm:left-4 sm:text-sm ${isNote ? 'text-amber-400' : 'text-gray-400'}`}>
              {isNote ? "Internal note... type '@' to mention teammates" : <>Write your email... type <span className="font-mono text-[var(--color-primary)]">$</span> for variables</>}
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
              if (trigger && triggerOptionCount > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((value) => Math.min(value + 1, triggerOptionCount - 1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((value) => Math.max(value - 1, 0)); return; }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (trigger.type === 'variable') {
                    const item = filteredVariableTriggerItems[highlightIndex];
                    if (item) insertVariable(item);
                  } else {
                    const item = filteredMentionUsers[highlightIndex];
                    if (item) insertMention(item);
                  }
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
            className={`min-h-[80px] px-3 py-3 text-[13px] leading-6 text-gray-800 focus:outline-none sm:px-4 sm:text-sm sm:leading-relaxed [&_a]:text-[var(--color-primary)] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${isAiBusy ? 'cursor-wait opacity-70' : ''} ${activeBg}`}
            style={{ wordBreak: 'break-word' }}
          />
        </div>

        <ComposerAttachmentPreviewStrip
          files={attachedFiles}
          onRemove={removeFile}
        />

        <div className="relative" ref={aiMenuRef}>
          {!isNote && (
            <AiPromptMenu
              open={aiMenu.isOpen}
              prompts={aiComposer.rewritePrompts}
              activePromptParent={aiComposer.activePromptParent}
              onClose={aiMenu.close}
              onSelectPrompt={aiComposer.handleRewrite}
              onSetActiveParent={aiComposer.setActivePromptParent}
            />
          )}
          <div className={`flex items-center gap-2 border-t px-2.5 py-1.5 sm:flex-wrap sm:py-2 ${borderClass}`}>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pr-1 sm:flex-wrap sm:overflow-visible sm:pr-0">
            {!isNote && (
              <Button
                onClick={aiMenu.toggle}
                variant={aiMenu.isOpen ? 'soft-primary' : 'ghost'}
                size="xs"
                iconOnly
                aria-label="Open AI prompts"
                leftIcon={<Wand2 size={16} />}
                className="mr-1"
              />
            )}

            <Button
              onClick={() => fileRef.current?.click()}
              variant="ghost"
              size="xs"
              iconOnly
              aria-label="Attach file"
              leftIcon={<Paperclip size={16} />}
            />

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
                <EmojiPicker
                  mode="reply"
                  accent="gray"
                  onSelect={(emoji) => {
                    editorRef.current?.focus();
                    document.execCommand('insertText', false, emoji);
                    emojiMenu.close();
                    updateDraftState();
                  }}
                />
              )}
            </div>

            {isNote && (
              <Button
                onMouseDown={(e) => {
                  e.preventDefault();
                  editorRef.current?.focus();
                  document.execCommand('insertText', false, '@');
                  updateDraftState();
                }}
                variant="soft-warning"
                size="xs"
                iconOnly
                aria-label="Mention teammate"
                leftIcon={<AtSign size={16} />}
              >
                <AtSign size={16} />
              </Button>
            )}
          </div>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">
            {!isNote && (
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
            <Button
              onClick={handleSend}
              disabled={!canSend}
              variant={canSend ? (isNote ? 'warning' : 'primary') : 'soft'}
              size="sm"
              iconOnly
              aria-label={isNote ? 'Add note' : 'Send email'}
              leftIcon={<Send size={14} />}
            />
          </div>
        </div>
        </div>
      </div>

      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
