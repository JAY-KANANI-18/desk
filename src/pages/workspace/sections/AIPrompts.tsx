import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, X, Sparkles } from 'lucide-react';

import { SectionError } from '../components/SectionError';
import type { AIPrompt } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';

type PromptFormState = {
  name: string;
  description: string;
  prompt: string;
};

const EMPTY_FORM: PromptFormState = {
  name: '',
  description: '',
  prompt: '',
};

export const AIPrompts = () => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editPrompt, setEditPrompt] = useState<AIPrompt | null>(null);
  const [form, setForm] = useState<PromptFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPrompts(await workspaceApi.getAIPrompts());
    } catch {
      setError('Failed to load AI prompts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditPrompt(null);
    setForm(EMPTY_FORM);
    setShowEditor(true);
  };

  const openEdit = (prompt: AIPrompt) => {
    setEditPrompt(prompt);
    setForm({
      name: prompt.name,
      description: prompt.description ?? '',
      prompt: prompt.prompt,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditPrompt(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.prompt.trim()) return;

    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      prompt: form.prompt.trim(),
      kind: 'rewrite',
      isEnabled: true,
    };

    try {
      if (editPrompt) {
        await workspaceApi.updateAIPrompt(editPrompt.id, payload);
      } else {
        await workspaceApi.addAIPrompt(payload);
      }
      await load();
      closeEditor();
    } catch {
      setError('Failed to save prompt.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prompt: AIPrompt) => {
    try {
      await workspaceApi.deleteAIPrompt(prompt.id);
      await load();
    } catch {
      setError('Failed to delete prompt.');
    }
  };

  const handleToggle = async (prompt: AIPrompt) => {
    try {
      await workspaceApi.updateAIPrompt(prompt.id, {
        isEnabled: !prompt.isEnabled,
      });
      await load();
    } catch {
      setError('Failed to update prompt.');
    }
  };

  if (loading) return <DataLoader type={'prompts'} />;
  if (error && prompts.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 flex-shrink-0 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">AI Prompts</p>
            <p className="mt-1 text-sm leading-5 text-indigo-700">
              These prompts are only for rewrite actions in the inbox composer. Default prompts can be enabled or disabled. Custom prompts support full CRUD.
            </p>
          </div>
        </div>
      </div>

      {error && <SectionError message={error} onRetry={load} />}

      <button
        onClick={openCreate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
      >
        <Plus size={16} />
        Add AI prompt
      </button>

      <div className="space-y-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{prompt.name}</p>
                  {!prompt.isDefault && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">Custom</span>}
                </div>
                <p className="mt-1 break-words text-sm leading-5 text-gray-500">{prompt.description ?? prompt.prompt}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {!prompt.isDefault && (
                  <button
                    onClick={() => void handleDelete(prompt)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:w-auto"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                )}
                {!prompt.isDefault && (
                  <button
                    onClick={() => openEdit(prompt)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto"
                  >
                    <Edit2 size={15} /> Edit
                  </button>
                )}
                <button
                  onClick={() => void handleToggle(prompt)}
                  className={`ml-auto h-7 w-12 rounded-full transition-colors sm:ml-0 ${prompt.isEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  aria-label={prompt.isEnabled ? 'Disable prompt' : 'Enable prompt'}
                >
                  <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${prompt.isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-2xl">{editPrompt ? 'Edit Prompt' : 'New Prompt'}</h3>
              <button onClick={closeEditor} className="text-gray-500 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Prompt Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name of your prompt"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Prompt Action</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                  placeholder="Write exactly what you want your prompt to do. Always start with a verb. Ex: Make concise"
                  className="min-h-[140px] w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-h-0 sm:px-4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description shown in AI prompts list"
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 px-4 pb-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:pb-5">
              <button onClick={closeEditor} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:w-auto">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-gray-300 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70 enabled:bg-blue-600 enabled:hover:bg-blue-700 sm:w-auto">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
