import React, { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
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
  SnippetSuggestionMenu,
  useInboxAiComposer,
  useWorkspaceSnippets,
} from './composerShared';
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
import {
  createMentionTokenElement,
  createVariableTokenElement,
  createRichVariableFragmentFromClipboard,
  extractMentionIds,
  formatMentionToken,
  formatVariableToken,
  MENTION_TRIGGER_PATTERN,
  sanitizeRichVariableHtml,
  serializeRichVariableEditorHtml,
  renderVariableTokenHtml,
  VARIABLE_TRIGGER_PATTERN,
} from '../../components/ui/variable-editor';
import { workspaceUserLabel } from './contact-sidebar/utils';
import type { WorkspaceUserLike } from './contact-sidebar/types';
import {
  filterSnippets,
  getSnippetTriggerQuery,
  replaceSnippetTrigger,
  type SnippetAttachment,
} from '../../lib/snippets';

type AttachedFile = {
  file: { name: string; type: string };
  type: AttachmentType;
  url: string;
  previewUrl?: string;
};
type TriggerState = { type: 'variable' | 'mention'; query: string } | null;
const BLOCK_ELEMENT_TAGS = new Set(['DIV', 'P', 'LI']);

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

function snippetAttachmentToAttachedFile(attachment: SnippetAttachment): AttachedFile {
  return {
    file: {
      name: attachment.name,
      type: attachment.mimeType ?? '',
    },
    type: attachment.type,
    url: attachment.url,
    previewUrl: attachment.type === 'image' ? attachment.url : undefined,
  };
}

function isEditorSelection(editor: HTMLElement, selection: Selection | null) {
  if (!selection || !selection.anchorNode) return false;
  return editor.contains(selection.anchorNode);
}

function setCaretAfter(node: Node) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function serializeEditorNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const variable = element.dataset.variable;
  const mentionId = element.dataset.mentionId;
  const mentionLabel = element.dataset.mentionLabel;

  if (variable) {
    return formatVariableToken(variable);
  }

  if (mentionId && mentionLabel) {
    return formatMentionToken(mentionId, mentionLabel);
  }

  if (element.tagName === 'BR') {
    return '\n';
  }

  return Array.from(element.childNodes).map(serializeEditorNode).join('');
}

function extractEditorText(editor: HTMLElement) {
  const pieces = Array.from(editor.childNodes).map((node, index, nodes) => {
    const text = serializeEditorNode(node);
    const isBlock =
      node.nodeType === Node.ELEMENT_NODE &&
      BLOCK_ELEMENT_TAGS.has((node as HTMLElement).tagName);
    const hasNext = index < nodes.length - 1;

    if (isBlock && hasNext && !text.endsWith('\n')) {
      return `${text}\n`;
    }

    return text;
  });

  return pieces.join('').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n');
}

function renderEditorHtml(text: string) {
  return renderVariableTokenHtml(text).replace(/\n/g, '<br />');
}

function getEditorHtmlForSend(editor: HTMLElement) {
  return serializeRichVariableEditorHtml(editor);
}

function insertEditorFragment(editor: HTMLElement, fragment: DocumentFragment) {
  const selection = window.getSelection();
  let range: Range;

  if (selection?.rangeCount && isEditorSelection(editor, selection)) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);

  if (lastNode) {
    setCaretAfter(lastNode);
  }
}

type EmailThreadDraft = {
  to: string;
  cc?: string;
  subject: string;
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
};

function ensureReplySubject(subject?: string | null) {
  const clean = subject?.trim();
  if (!clean) return '';
  return /^Re:/i.test(clean) ? clean : `Re: ${clean}`;
}

function buildThreadDraftFromMessage(
  message: { direction?: string; subject?: string; metadata?: Record<string, any> },
  fallbackTo: string,
): EmailThreadDraft {
  const email = message.metadata?.email ?? {};
  const messageId = email.messageId ?? message.metadata?.messageId;
  const references = email.references ?? message.metadata?.references;
  const to =
    message.direction === 'incoming'
      ? email.from ?? message.metadata?.from ?? fallbackTo
      : email.to ?? message.metadata?.to ?? fallbackTo;

  return {
    to,
    cc: email.cc ?? message.metadata?.cc,
    subject: ensureReplySubject(email.subject ?? message.subject),
    threadId: email.threadId,
    messageId,
    inReplyTo: messageId,
    references: [references, messageId].filter(Boolean).join(' ').trim() || undefined,
  };
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
  const { uploadFile, channels, selectedConversation, selectedChannel, selectedContact, timeline } = useInbox();
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
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [snippetHighlightIndex, setSnippetHighlightIndex] = useState(0);
  const [dismissedSnippetDraft, setDismissedSnippetDraft] = useState<string | null>(null);
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
    () => getContactScopedChannels(
      channels,
      selectorContactChannels,
      hasLoadedSelectedContact ? selectedContact : selectedConversation?.contact,
    ),
    [channels, hasLoadedSelectedContact, selectedContact, selectedConversation?.contact, selectorContactChannels],
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
      if (editorRef.current) editorRef.current.innerHTML = renderEditorHtml(text);
    },
    switchToReply: () => onInputModeChange('reply'),
    switchToNote: () => onInputModeChange('note'),
  });
  const isAiBusy = aiComposer.aiLoadingAction !== null;
  const { snippets, snippetsLoading } = useWorkspaceSnippets();

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
  const snippetQuery = getSnippetTriggerQuery(draftText);
  const snippetMenuOpen =
    !isNote &&
    !isAiBusy &&
    snippetQuery !== null &&
    dismissedSnippetDraft !== draftText;
  const snippetOptions = useMemo(
    () => (snippetQuery === null ? [] : filterSnippets(snippets, snippetQuery)),
    [snippetQuery, snippets],
  );
  const latestEmailThread = useMemo<EmailThreadDraft | null>(() => {
    const fallbackTo = selectedConversation?.contact?.email ?? '';
    const latestEmailItem = [...(timeline ?? [])]
      .reverse()
      .find((item) => {
        const message = item.type === 'message' ? item.message : null;
        return (
          message?.channelType === 'email' ||
          Boolean(message?.metadata?.email) ||
          Boolean(message?.metadata?.messageId)
        );
      });

    return latestEmailItem?.message
      ? buildThreadDraftFromMessage(latestEmailItem.message, fallbackTo)
      : null;
  }, [selectedConversation?.contact?.email, timeline]);
  const activeEmailReply = emailReply ?? latestEmailThread;
  const activeEmailReplyKey = activeEmailReply
    ? [
        emailReply ? 'explicit' : 'latest',
        activeEmailReply.to,
        activeEmailReply.subject,
        activeEmailReply.messageId,
        activeEmailReply.references,
      ].join('|')
    : `empty:${selectedConversation?.id ?? ''}`;

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
    setAttachedFiles([]);
    setTrigger(null);
    setDismissedSnippetDraft(null);
    setDraftText('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    onClearReplyContext?.();
  }, [selectedConversation?.id]);

  useEffect(() => {
    setTo(activeEmailReply?.to ?? selectedConversation?.contact?.email ?? '');
    setCc(activeEmailReply?.cc ?? '');
    setBcc('');
    setSubject(activeEmailReply?.subject ?? '');
    setShowCc(Boolean(activeEmailReply?.cc));
    setShowBcc(false);
  }, [activeEmailReplyKey, selectedConversation?.contact?.email]);

  useEffect(() => {
    if (isNote || availableEmailChannels.length === 0) return;
    if (availableEmailChannels.some((channel) => isSameChannel(channel, selectedChannel))) return;
    onChannelChange(availableEmailChannels[0]);
  }, [availableEmailChannels, isNote, onChannelChange, selectedChannel]);

  const updateDraftState = useCallback(() => {
    aiComposer.clearAiComposerNotice();
    const editor = editorRef.current;
    const text = editor ? extractEditorText(editor) : '';
    const nextText = text.trimEnd();
    setDraftText(nextText);
    if (nextText !== draftText) {
      setDismissedSnippetDraft(null);
    }
    const selection = window.getSelection();
    if (!editor || !isEditorSelection(editor, selection) || !selection?.rangeCount) {
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
      const mentionMatch = textBeforeCursor.match(MENTION_TRIGGER_PATTERN);
      if (mentionMatch) {
        setTrigger({ type: 'mention', query: mentionMatch[1] ?? '' });
        setHighlightIndex(0);
        return;
      }
    }
    const variableMatch = textBeforeCursor.match(VARIABLE_TRIGGER_PATTERN);
    if (variableMatch) {
      setTrigger({ type: 'variable', query: variableMatch[1] ?? '' });
      setHighlightIndex(0);
      return;
    }
    setTrigger(null);
  }, [aiComposer, draftText, isNote]);

  const insertTokenAtSelection = useCallback((token: HTMLElement, pattern: RegExp) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return;
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

    const space = document.createTextNode(' ');
    const fragment = document.createDocumentFragment();
    fragment.append(token, space);
    replacementRange.insertNode(fragment);
    setCaretAfter(space);
    setTrigger(null);
    updateDraftState();
    editor.focus();
  }, [updateDraftState]);

  useEffect(() => {
    setSnippetHighlightIndex(0);
  }, [snippetQuery, snippetOptions.length]);

  const handleSelectSnippet = useCallback((snippet: (typeof snippets)[number]) => {
    const nextDraft = replaceSnippetTrigger(draftText, snippet.content);
    setDraftText(nextDraft);
    setDismissedSnippetDraft(null);
    setTrigger(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = renderEditorHtml(nextDraft);
    }
    if (snippet.attachments?.length) {
      setAttachedFiles((current) => [
        ...current,
        ...snippet.attachments.map(snippetAttachmentToAttachedFile),
      ]);
    }
    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }, [draftText]);

  const handleSnippetKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!snippetMenuOpen) return false;

    if (event.key === 'Escape') {
      event.preventDefault();
      setDismissedSnippetDraft(draftText);
      return true;
    }

    if (snippetOptions.length === 0) return false;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSnippetHighlightIndex((index) => Math.min(index + 1, snippetOptions.length - 1));
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSnippetHighlightIndex((index) => Math.max(index - 1, 0));
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const snippet = snippetOptions[snippetHighlightIndex];
      if (snippet) handleSelectSnippet(snippet);
      return true;
    }

    return false;
  }, [draftText, handleSelectSnippet, snippetHighlightIndex, snippetMenuOpen, snippetOptions]);

  const insertVariable = useCallback((variable: typeof variables[number]) => {
    insertTokenAtSelection(createVariableTokenElement(variable.key), VARIABLE_TRIGGER_PATTERN);
  }, [insertTokenAtSelection]);

  const insertMention = useCallback((user: WorkspaceUserLike) => {
    const label = workspaceUserLabel(user);
    insertTokenAtSelection(
      createMentionTokenElement(String(user.id), label),
      MENTION_TRIGGER_PATTERN,
    );
  }, [insertTokenAtSelection]);

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

  const handleEditorPaste = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
    if (isNote) return;

    event.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    const fragment = createRichVariableFragmentFromClipboard(html, text);

    insertEditorFragment(editor, fragment);
    updateDraftState();
  }, [isNote, updateDraftState]);

  const canSend = !isAiBusy && (draftText.trim().length > 0 || attachedFiles.length > 0);
  const actionButtonSize = 'xs';

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
        name: file.file.name,
        url: file.url,
        mimeType: file.file.type,
      }));
      const signatureHtml = normalizedChannel.signatureEnabled && normalizedChannel.signatureHtml
        ? `<div data-email-signature="true">${sanitizeRichVariableHtml(normalizedChannel.signatureHtml)}</div>`
        : '';
      const htmlBody = `${editorRef.current ? getEditorHtmlForSend(editorRef.current) : ''}${signatureHtml}`;

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
            ...(activeEmailReply ? {
              threadId: activeEmailReply.threadId,
              messageId: activeEmailReply.messageId,
              inReplyTo: activeEmailReply.inReplyTo ?? activeEmailReply.messageId,
              references: activeEmailReply.references,
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

        <div className="relative">
          <SnippetSuggestionMenu
            open={snippetMenuOpen}
            query={snippetQuery ?? ''}
            options={snippetOptions}
            highlightedIndex={snippetHighlightIndex}
            onHighlightChange={setSnippetHighlightIndex}
            onSelect={handleSelectSnippet}
            loading={snippetsLoading}
          />
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
                anchorRef={editorRef}
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
              <div className={`pointer-events-none absolute left-3 top-2 select-none pr-3 text-[13px] leading-6 transition-transform duration-150 sm:left-4 sm:text-sm sm:leading-relaxed ${isEditorFocused ? 'translate-x-[6px]' : ''} ${isNote ? 'text-amber-400' : 'text-gray-400'}`}>
                {isNote ? "Internal note... type '@' to mention teammates" : <>Write your email... type <span className="font-mono text-[var(--color-primary)]">$</span> for variables</>}
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable={!isAiBusy}
              suppressContentEditableWarning
              onInput={updateDraftState}
              onFocus={() => setIsEditorFocused(true)}
              onBlur={() => setIsEditorFocused(false)}
              onKeyUp={updateDraftState}
              onMouseUp={updateDraftState}
              onPaste={handleEditorPaste}
              onKeyDown={(e) => {
                if (isAiBusy) {
                  e.preventDefault();
                  return;
                }
                if (handleSnippetKeyDown(e)) return;
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
              className={`min-h-[80px] whitespace-pre-wrap px-3 py-2 text-[13px] leading-6 text-gray-800 focus:outline-none sm:px-4 sm:text-sm sm:leading-relaxed [&_a]:text-[var(--color-primary)] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${isAiBusy ? 'cursor-wait opacity-70' : ''} ${activeBg}`}
              style={{ wordBreak: 'break-word' }}
            />
          </div>
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
