import { useEffect, useState, type CSSProperties } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  FileText,
  Loader2,
  Mic,
  Minus,
  Video,
  X,
} from 'lucide-react';
import { workspaceApi } from '../../lib/workspaceApi';
import { inboxApi } from '../../lib/inboxApi';
import type { AIPrompt } from '../workspace/types';
import type { AttachmentType } from './types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDisclosure } from '../../hooks/useDisclosure';
import { Button } from '../../components/ui/Button';

export type AiLoadingAction = 'rewrite' | 'assist' | 'summarize';
export type AiComposerNotice = {
  tone: 'warning' | 'error';
  message: string;
} | null;

export function renderTemplateText(template: string, context: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => context[key] ?? '');
}

export function useInboxAiComposer(options: {
  conversationId?: string;
  getDraft: () => string;
  setDraft: (text: string) => void;
  switchToReply: () => void;
  switchToNote: () => void;
}) {
  const { conversationId, getDraft, setDraft, switchToReply, switchToNote } = options;
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const aiPromptMenu = useDisclosure();
  const [activePromptParent, setActivePromptParent] = useState<AIPrompt | null>(null);
  const [aiLoadingAction, setAiLoadingAction] = useState<AiLoadingAction | null>(null);
  const [aiComposerNotice, setAiComposerNotice] = useState<AiComposerNotice>(null);

  const setAiPromptMenuOpen = (value: boolean | ((open: boolean) => boolean)) => {
    const nextValue = typeof value === 'function' ? value(aiPromptMenu.isOpen) : value;
    if (nextValue) {
      aiPromptMenu.open();
      return;
    }
    aiPromptMenu.close();
  };

  useEffect(() => {
    workspaceApi.getAIPrompts()
      .then((rows) => setAiPrompts(rows))
      .catch(() => setAiPrompts([]));
  }, []);

  const rewritePrompts = aiPrompts.filter((prompt) => prompt.kind === 'rewrite' && (prompt.isEnabled ?? true));

  const handleRewrite = async (prompt: AIPrompt, optionValue?: string) => {
    if (!conversationId) {
      setAiComposerNotice({ tone: 'error', message: 'Select a conversation before using AI prompts.' });
      return;
    }
    const draft = getDraft().trim();
    if (!draft) {
      setAiComposerNotice({ tone: 'warning', message: 'Type a draft first, then choose an AI prompt.' });
      return;
    }

    setAiComposerNotice(null);
    setAiLoadingAction('rewrite');
    try {
      const result = await inboxApi.rewriteWithPrompt(conversationId, {
        draft,
        promptId: String(prompt.id),
        optionValue,
      });
      setDraft(result.text);
      aiPromptMenu.close();
      setActivePromptParent(null);
    } catch {
      setAiComposerNotice({ tone: 'error', message: 'Could not rewrite this draft. Try again.' });
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleAssistDraft = async () => {
    if (!conversationId) {
      setAiComposerNotice({ tone: 'error', message: 'Select a conversation before asking AI to draft.' });
      return;
    }
    setAiComposerNotice(null);
    setAiLoadingAction('assist');
    try {
      const result = await inboxApi.generateAiDraft(conversationId);
      switchToReply();
      setDraft(result.text);
    } catch {
      setAiComposerNotice({ tone: 'error', message: 'Could not generate a reply. Try again.' });
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleSummarize = async () => {
    if (!conversationId) {
      setAiComposerNotice({ tone: 'error', message: 'Select a conversation before summarizing.' });
      return;
    }
    setAiComposerNotice(null);
    setAiLoadingAction('summarize');
    try {
      const result = await inboxApi.summarizeConversation(conversationId);
      switchToNote();
      setDraft(result.text);
    } catch {
      setAiComposerNotice({ tone: 'error', message: 'Could not summarize this conversation. Try again.' });
    } finally {
      setAiLoadingAction(null);
    }
  };

  const clearAiComposerNotice = () => setAiComposerNotice(null);

  return {
    rewritePrompts,
    aiPromptMenuOpen: aiPromptMenu.isOpen,
    setAiPromptMenuOpen,
    activePromptParent,
    setActivePromptParent,
    aiLoadingAction,
    aiComposerNotice,
    clearAiComposerNotice,
    handleRewrite,
    handleAssistDraft,
    handleSummarize,
  };
}

const AI_LOADING_COPY: Record<AiLoadingAction, string> = {
  rewrite: 'Rewriting your draft...',
  assist: 'Drafting a reply...',
  summarize: 'Summarizing this conversation...',
};

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

const tinyRemoveButtonStyle = {
  padding: 0,
  width: '0.875rem',
  minWidth: '0.875rem',
  height: '0.875rem',
  minHeight: '0.875rem',
  borderRadius: 'var(--radius-full)',
  lineHeight: 1,
} satisfies CSSProperties;

const thumbnailRemoveButtonStyle = {
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 10,
  transform: 'translate(50%, -50%)',
  padding: 0,
  width: 'var(--spacing-md)',
  minWidth: 'var(--spacing-md)',
  height: 'var(--spacing-md)',
  minHeight: 'var(--spacing-md)',
  borderRadius: 'var(--radius-full)',
  lineHeight: 1,
} satisfies CSSProperties;

export function AiComposerInlineStatus({
  loadingAction,
  notice,
}: {
  loadingAction: AiLoadingAction | null;
  notice: AiComposerNotice;
}) {
  if (loadingAction) {
    return (
      <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-3 py-2 text-sm text-[var(--color-primary)] sm:mx-4">
        <Loader2 size={14} className="flex-shrink-0 animate-spin" />
        <span>{AI_LOADING_COPY[loadingAction]}</span>
      </div>
    );
  }

  if (!notice) return null;

  const toneClass =
    notice.tone === 'error'
      ? 'border-red-100 bg-red-50 text-red-700'
      : 'border-amber-100 bg-amber-50 text-amber-700';

  return (
    <div className={`mx-3 mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm sm:mx-4 ${toneClass}`}>
      <AlertCircle size={14} className="flex-shrink-0" />
      <span>{notice.message}</span>
    </div>
  );
}

export interface ComposerAttachmentPreviewFile {
  file: {
    name: string;
  };
  type: AttachmentType;
  previewUrl?: string;
}

export function ComposerAttachmentPreviewStrip({
  files,
  onRemove,
  locked = false,
  tone = 'reply',
}: {
  files: ComposerAttachmentPreviewFile[];
  onRemove: (index: number) => void;
  locked?: boolean;
  tone?: 'reply' | 'note';
}) {
  if (files.length === 0) return null;

  const surfaceClass =
    tone === 'note'
      ? 'border-amber-200 bg-amber-50'
      : 'border-gray-100 bg-white';

  const getFileChipClass = (type: AttachmentType) => {
    if (type === 'audio') return 'border-red-200 bg-red-50 text-red-700';
    if (type === 'video') return 'border-[var(--color-primary-light)] bg-[var(--color-primary-light)] text-[var(--color-primary)]';
    return 'border-[var(--color-primary-light)] bg-[var(--color-primary-light)] text-[var(--color-primary)]';
  };

  return (
    <div className={`border-t px-2 pb-1.5 pt-2.5 sm:px-3 ${surfaceClass}`}>
      <div className="flex flex-wrap items-start gap-1.5">
        {files.map((file, index) =>
          file.type === 'image' ? (
            <span key={`${file.file.name}-${index}`} className="relative inline-flex h-12 w-12 shrink-0 overflow-visible">
              <img
                src={file.previewUrl}
                alt={file.file.name}
                className="h-12 w-12 rounded-lg border border-gray-200 object-cover shadow-sm"
              />
              {!locked ? (
                <Button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onRemove(index);
                  }}
                  variant="danger"
                  size="2xs"
                  iconOnly
                  radius="full"
                  aria-label={`Remove ${file.file.name}`}
                  leftIcon={<Minus size={9} />}
                  className="shadow-sm ring-2 ring-white"
                  style={thumbnailRemoveButtonStyle}
                />
              ) : null}
            </span>
          ) : (
            <span
              key={`${file.file.name}-${index}`}
              className={`inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border px-2 pr-1 text-xs ${getFileChipClass(file.type)}`}
            >
              {file.type === 'audio' ? (
                <Mic size={11} className="shrink-0" />
              ) : file.type === 'video' ? (
                <Video size={11} className="shrink-0" />
              ) : (
                <FileText size={11} className="shrink-0" />
              )}
              <span className="max-w-[8rem] truncate font-medium sm:max-w-[10rem]">
                {file.file.name}
              </span>
              {!locked ? (
                <Button
                  type="button"
                  variant="danger-ghost"
                  size="2xs"
                  iconOnly
                  radius="full"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onRemove(index);
                  }}
                  aria-label={`Remove ${file.file.name}`}
                  leftIcon={<X size={8} />}
                  className="shrink-0"
                  style={tinyRemoveButtonStyle}
                />
              ) : null}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function AiPromptMenu({
  open,
  prompts,
  activePromptParent,
  onClose,
  onSelectPrompt,
  onSetActiveParent,
}: {
  open: boolean;
  prompts: AIPrompt[];
  activePromptParent: AIPrompt | null;
  onClose: () => void;
  onSelectPrompt: (prompt: AIPrompt, optionValue?: string) => void;
  onSetActiveParent: (prompt: AIPrompt | null) => void;
}) {
  const isMobile = useIsMobile();

  if (!open) return null;

  const handleClose = () => {
    onSetActiveParent(null);
    onClose();
  };

  const handleSelect = (prompt: AIPrompt, optionValue?: string) => {
    onSetActiveParent(null);
    onClose();
    onSelectPrompt(prompt, optionValue);
  };

  if (isMobile) {
    const activeOptions = Array.isArray(activePromptParent?.options)
      ? activePromptParent.options
      : [];

    return (
      <>
        <Button
          type="button"
          variant="unstyled"
          aria-label="Close AI prompts"
          className="fixed inset-0 z-[140] bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          style={classDrivenButtonStyle}
          onClick={handleClose}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[150] flex max-h-[78dvh] flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.18)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="AI prompts"
        >
          <div className="border-b border-slate-100 px-4 pb-2.5 pt-3">
            <div className="mb-2.5 flex justify-center">
              <div className="h-1 w-12 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center gap-3">
              {activePromptParent ? (
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => onSetActiveParent(null)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                  style={classDrivenButtonStyle}
                  aria-label="Back to AI prompts"
                  preserveChildLayout
                >
                  <ChevronLeft size={18} />
                </Button>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {activePromptParent ? activePromptParent.name : 'AI prompts'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {activePromptParent ? 'Choose how to apply this prompt.' : 'Improve the current draft before sending.'}
                </p>
              </div>
              <Button
                type="button"
                variant="unstyled"
                onClick={handleClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                style={classDrivenButtonStyle}
                aria-label="Close AI prompts"
                preserveChildLayout
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {activePromptParent ? (
              <div className="space-y-1">
                {activeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="unstyled"
                    onClick={() => handleSelect(activePromptParent, option.value)}
                    className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-[var(--color-gray-50)]"
                    style={classDrivenButtonStyle}
                    fullWidth
                    contentAlign="start"
                    preserveChildLayout
                  >
                    {option.label}
                  </Button>
                ))}
                {activeOptions.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-400">No options available</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                {prompts.map((prompt) => {
                  const hasOptions = Array.isArray(prompt.options) && prompt.options.length > 0;
                  return (
                    <Button
                      key={prompt.id}
                      type="button"
                      variant="unstyled"
                      onClick={() => hasOptions ? onSetActiveParent(prompt) : handleSelect(prompt)}
                      className="flex min-h-[54px] w-full items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-gray-50)]"
                      style={classDrivenButtonStyle}
                      fullWidth
                      contentAlign="start"
                      preserveChildLayout
                    >
                      <span className="flex w-full min-w-0 items-center gap-2.5 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{prompt.name}</span>
                          {prompt.description ? (
                            <span className="mt-0.5 line-clamp-2 block text-xs font-medium leading-4 text-slate-500">{prompt.description}</span>
                          ) : null}
                        </span>
                        {hasOptions ? <ChevronDown size={13} className="shrink-0 -rotate-90 text-slate-400" /> : null}
                      </span>
                    </Button>
                  );
                })}
                {prompts.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-400">No AI prompts available</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:max-w-none sm:flex-row">
      <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">AI Prompts</p>
        </div>
        <div className="p-1.5">
          {prompts.map((prompt) => {
            const hasOptions = Array.isArray(prompt.options) && prompt.options.length > 0;
            const isActive = activePromptParent?.id === prompt.id;

            return (
              <Button
                key={prompt.id}
                type="button"
                variant="unstyled"
                onClick={() => hasOptions ? onSetActiveParent(prompt) : handleSelect(prompt)}
                className={`flex min-h-[56px] w-full items-center rounded-lg border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-transparent hover:bg-[var(--color-gray-50)]'
                }`}
                style={classDrivenButtonStyle}
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <span className="flex w-full min-w-0 items-center gap-2.5 text-left">
                  <span className="block min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-800">{prompt.name}</span>
                    {prompt.description ? (
                      <span className="mt-0.5 line-clamp-2 block text-xs font-medium leading-4 text-gray-500">
                        {prompt.description}
                      </span>
                    ) : null}
                  </span>
                  {hasOptions ? (
                    <ChevronDown
                      size={13}
                      className={`shrink-0 -rotate-90 ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {activePromptParent && Array.isArray(activePromptParent.options) && activePromptParent.options.length > 0 && (
        <div className="w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">{activePromptParent.name}</p>
          </div>
          <div className="px-2 py-2">
            {activePromptParent.options.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="unstyled"
                onClick={() => handleSelect(activePromptParent, option.value)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-[var(--color-gray-50)]"
                style={classDrivenButtonStyle}
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
