import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronLeft, Loader2, X } from 'lucide-react';
import { workspaceApi } from '../../lib/workspaceApi';
import { inboxApi } from '../../lib/inboxApi';
import type { AIPrompt } from '../workspace/types';
import { useIsMobile } from '../../hooks/useIsMobile';

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
  const [aiPromptMenuOpen, setAiPromptMenuOpen] = useState(false);
  const [activePromptParent, setActivePromptParent] = useState<AIPrompt | null>(null);
  const [aiLoadingAction, setAiLoadingAction] = useState<AiLoadingAction | null>(null);
  const [aiComposerNotice, setAiComposerNotice] = useState<AiComposerNotice>(null);

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
      setAiPromptMenuOpen(false);
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
    aiPromptMenuOpen,
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

export function AiComposerInlineStatus({
  loadingAction,
  notice,
}: {
  loadingAction: AiLoadingAction | null;
  notice: AiComposerNotice;
}) {
  if (loadingAction) {
    return (
      <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700 sm:mx-4">
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
        <button
          type="button"
          aria-label="Close AI prompts"
          className="fixed inset-0 z-[140] bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          onClick={handleClose}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[150] flex max-h-[82dvh] flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.18)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="AI prompts"
        >
          <div className="border-b border-slate-100 px-4 pb-3 pt-4">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-14 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center gap-3">
              {activePromptParent ? (
                <button
                  type="button"
                  onClick={() => onSetActiveParent(null)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                  aria-label="Back to AI prompts"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900">
                  {activePromptParent ? activePromptParent.name : 'AI prompts'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {activePromptParent ? 'Choose how to apply this prompt.' : 'Improve the current draft before sending.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close AI prompts"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {activePromptParent ? (
              <div className="space-y-1">
                {activeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(activePromptParent, option.value)}
                    className="flex min-h-[52px] w-full items-center rounded-lg px-3 py-3 text-left text-[15px] font-medium text-slate-800 transition-colors hover:bg-violet-50"
                  >
                    {option.label}
                  </button>
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
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => hasOptions ? onSetActiveParent(prompt) : handleSelect(prompt)}
                      className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-violet-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-slate-900">{prompt.name}</span>
                        {prompt.description ? (
                          <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-slate-500">{prompt.description}</span>
                        ) : null}
                      </span>
                      {hasOptions ? <ChevronDown size={16} className="flex-shrink-0 -rotate-90 text-slate-400" /> : null}
                    </button>
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
      <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden sm:w-80">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">AI Prompts</p>
        </div>
        <div className="py-2">
          {prompts.map((prompt) => {
            const hasOptions = Array.isArray(prompt.options) && prompt.options.length > 0;
            return (
              <button
                key={prompt.id}
                onClick={() => hasOptions ? onSetActiveParent(prompt) : handleSelect(prompt)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${activePromptParent?.id === prompt.id ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{prompt.name}</p>
                  {prompt.description && <p className="text-xs text-gray-500 mt-0.5">{prompt.description}</p>}
                </div>
                {hasOptions && <ChevronDown size={14} className="-rotate-90 text-gray-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {activePromptParent && Array.isArray(activePromptParent.options) && activePromptParent.options.length > 0 && (
        <div className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden sm:w-72">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{activePromptParent.name}</p>
          </div>
          <div className="py-2">
            {activePromptParent.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(activePromptParent, option.value)}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
