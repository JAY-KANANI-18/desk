import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { workspaceApi } from '../../lib/workspaceApi';
import { inboxApi } from '../../lib/inboxApi';
import type { AIPrompt } from '../workspace/types';

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
  const [aiLoadingAction, setAiLoadingAction] = useState<'rewrite' | 'assist' | 'summarize' | null>(null);

  useEffect(() => {
    workspaceApi.getAIPrompts()
      .then((rows) => setAiPrompts(rows))
      .catch(() => setAiPrompts([]));
  }, []);

  const rewritePrompts = aiPrompts.filter((prompt) => prompt.kind === 'rewrite' && (prompt.isEnabled ?? true));

  const handleRewrite = async (prompt: AIPrompt, optionValue?: string) => {
    if (!conversationId) return;
    const draft = getDraft().trim();
    if (!draft) return;

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
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleAssistDraft = async () => {
    if (!conversationId) return;
    setAiLoadingAction('assist');
    try {
      const result = await inboxApi.generateAiDraft(conversationId);
      switchToReply();
      setDraft(result.text);
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleSummarize = async () => {
    if (!conversationId) return;
    setAiLoadingAction('summarize');
    try {
      const result = await inboxApi.summarizeConversation(conversationId);
      switchToNote();
      setDraft(result.text);
    } finally {
      setAiLoadingAction(null);
    }
  };

  return {
    rewritePrompts,
    aiPromptMenuOpen,
    setAiPromptMenuOpen,
    activePromptParent,
    setActivePromptParent,
    aiLoadingAction,
    handleRewrite,
    handleAssistDraft,
    handleSummarize,
  };
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
  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 flex gap-2 z-50">
      <div className="w-80 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">AI Prompts</p>
        </div>
        <div className="py-2">
          {prompts.map((prompt) => {
            const hasOptions = Array.isArray(prompt.options) && prompt.options.length > 0;
            return (
              <button
                key={prompt.id}
                onClick={() => hasOptions ? onSetActiveParent(prompt) : onSelectPrompt(prompt)}
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
        <div className="w-72 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{activePromptParent.name}</p>
          </div>
          <div className="py-2">
            {activePromptParent.options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelectPrompt(activePromptParent, option.value)}
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
