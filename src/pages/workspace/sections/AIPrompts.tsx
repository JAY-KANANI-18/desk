import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Sparkles } from 'lucide-react';

import { SectionError } from '../components/SectionError';
import type { AIPrompt } from '../types';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';
import { Button } from '../../../components/ui/Button';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { CenterModal } from '../../../components/ui/Modal';
import { Tag } from '../../../components/ui/Tag';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import { ConfirmDeleteModal, MobileSheet } from '../../../components/ui/modal';
import { useIsMobile } from '../../../hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editPrompt, setEditPrompt] = useState<AIPrompt | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<AIPrompt | null>(null);
  const [form, setForm] = useState<PromptFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const requestDelete = (prompt: AIPrompt) => {
    setDeletePrompt(prompt);
    setDeleteError(null);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeletePrompt(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletePrompt || deleting) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await workspaceApi.deleteAIPrompt(deletePrompt.id);
      await load();
      setDeletePrompt(null);
    } catch {
      setDeleteError('Failed to delete prompt.');
    } finally {
      setDeleting(false);
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

  const editorContent = (
    <div className="space-y-4 p-4 sm:p-0">
      <BaseInput
        label="Prompt Name"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Name of your prompt"
      />

      <TextareaInput
        label="Prompt Action"
        value={form.prompt}
        onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
        rows={4}
        placeholder="Write exactly what you want your prompt to do. Always start with a verb. Ex: Make concise"
      />

      <BaseInput
        label="Description"
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Short description shown in AI prompts list"
      />
    </div>
  );

  const editorFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
      <Button onClick={closeEditor} variant="secondary" >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={!form.name.trim() || !form.prompt.trim()}
        loading={saving}
        loadingMode="inline"
        loadingLabel="Saving..."
        
      >
        Save
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-slate-50/80 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 sm:h-10 sm:w-10">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">AI Prompts</h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                These prompts are used for rewrite actions in the inbox composer. Default prompts can be enabled or disabled, and custom prompts support full CRUD.
              </p>
            </div>
          </div>

          {!isMobile ? (
            <Button
              onClick={openCreate}
              leftIcon={<Plus size={16} />}
            >
              Add AI prompt
            </Button>
          ) : null}
        </div>
      </div>

      {error && <SectionError message={error} onRetry={load} />}

      <div className="space-y-3">
        {prompts.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/80 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-gray-900">No AI prompts yet</p>
            <p className="mt-1 text-sm text-gray-500">Create your first custom prompt to speed up inbox rewrites.</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`rounded-2xl px-4 py-4 transition-colors sm:px-5 sm:py-5 ${
                prompt.isEnabled ? 'bg-indigo-50/60' : 'bg-slate-50/80'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{prompt.name}</p>
                    <Tag
                      label={prompt.isDefault ? 'Default' : 'Custom'}
                      bgColor={prompt.isDefault ? 'gray' : 'primary'}
                      size="sm"
                    />
                    <Tag
                      label={prompt.isEnabled ? 'Enabled' : 'Disabled'}
                      bgColor={prompt.isEnabled ? 'success' : 'gray'}
                      size="sm"
                    />
                  </div>
                  <p className="mt-1 break-words text-sm leading-5 text-gray-500">{prompt.description ?? prompt.prompt}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {!prompt.isDefault && (
                    <Button
                      onClick={() => requestDelete(prompt)}
                      variant="danger-ghost"
       
                      leftIcon={<Trash2 size={15} />}
                      fullWidth={isMobile}
                    >
                      Delete
                    </Button>
                  )}
                  {!prompt.isDefault && (
                    <Button
                      onClick={() => openEdit(prompt)}
                      variant="secondary"
                  
                      leftIcon={<Edit2 size={15} />}
                      fullWidth={isMobile}
                    >
                      Edit
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1.5 sm:ml-0">
                    <span className="text-xs font-medium text-gray-600">{prompt.isEnabled ? 'On' : 'Off'}</span>
                    <ToggleSwitch
                      checked={Boolean(prompt.isEnabled)}
                      onChange={() => void handleToggle(prompt)}
                      aria-label={prompt.isEnabled ? 'Disable prompt' : 'Enable prompt'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <FloatingActionButton
        label="Add AI prompt"
        icon={<Plus size={24} />}
        onClick={openCreate}
      />

      {showEditor && isMobile ? (
        <MobileSheet
          isOpen={showEditor}
          onClose={closeEditor}
          title={<h3 className="text-base font-semibold text-slate-900">{editPrompt ? 'Edit AI prompt' : 'New AI prompt'}</h3>}
          footer={editorFooter}
        >
          {editorContent}
        </MobileSheet>
      ) : null}

      {showEditor && !isMobile ? (
        <CenterModal
          isOpen={showEditor}
          onClose={closeEditor}
          title={editPrompt ? 'Edit AI prompt' : 'New AI prompt'}
          subtitle="Create a reusable rewrite action for the inbox composer."
          size="sm"
          footer={editorFooter}
        >
          {editorContent}
        </CenterModal>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deletePrompt)}
        entityName={deletePrompt?.name ?? 'this prompt'}
        entityType="AI prompt"
        title="Delete AI prompt"
        body={
          <div className="space-y-2">
            <p>
              This prompt will be removed from the inbox rewrite actions list.
            </p>
            {deleteError ? (
              <p className="font-medium text-red-600">{deleteError}</p>
            ) : null}
          </div>
        }
        confirmLabel="Delete prompt"
        isDeleting={deleting}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
