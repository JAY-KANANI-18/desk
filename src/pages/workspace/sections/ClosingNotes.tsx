import { useCallback, useEffect, useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { CenterModal } from "../../../components/ui/modal/CenterModal";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { ClosingNoteSettings } from "../types";

export const ClosingNotes = () => {
  const [settings, setSettings] = useState<ClosingNoteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", text: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await workspaceApi.getClosingNoteSettings());
    } catch {
      setError("Failed to load closing note settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const closeAddModal = () => {
    setShowAdd(false);
    setNewNote({ title: "", text: "" });
  };

  const handleToggleRequired = async (required: boolean) => {
    if (!settings) return;

    setSettings({ ...settings, required });
    try {
      await workspaceApi.updateClosingNoteRequired(required);
    } catch {
      void load();
    }
  };

  const handleAdd = async () => {
    if (!newNote.title.trim() || !newNote.text.trim() || !settings) return;

    setAdding(true);
    setError(null);
    try {
      const created = await workspaceApi.addClosingNoteTemplate({
        title: newNote.title.trim(),
        text: newNote.text.trim(),
      });
      setSettings({ ...settings, templates: [...settings.templates, created] });
      closeAddModal();
    } catch {
      setError("Failed to add template.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      templates: settings.templates.filter((template) => template.id !== id),
    });
    try {
      await workspaceApi.deleteClosingNoteTemplate(id);
    } catch {
      void load();
    }
  };

  if (loading) return <DataLoader type="closing notes" />;
  if (error || !settings) {
    return <SectionError message={error ?? "Unknown error"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Require closing notes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Agents must add a note before closing a conversation
            </p>
          </div>
          <ToggleSwitch
            checked={settings.required}
            onChange={handleToggleRequired}
            aria-label="Require closing notes"
          />
        </div>
        {settings.required ? (
          <div className="mt-4 rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-primary-light)] p-3">
            <p className="flex items-center gap-1.5 text-xs text-[var(--color-primary)]">
              <Info size={13} /> Agents will see a prompt to add a closing note when resolving conversations.
            </p>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Note templates</h2>
            <p className="mt-0.5 text-xs text-gray-500">Quick-select templates for agents</p>
          </div>
          <Button onClick={() => setShowAdd(true)} leftIcon={<Plus size={16} />}>
            Add template
          </Button>
        </div>
        <div className="divide-y divide-gray-100">
          {settings.templates.map((template) => (
            <div key={template.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{template.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{template.text}</p>
              </div>
              <IconButton
                onClick={() => handleDelete(template.id)}
                icon={<Trash2 size={14} />}
                variant="danger-ghost"
                size="xs"
                aria-label={`Delete ${template.title}`}
              />
            </div>
          ))}
        </div>
      </div>

      <CenterModal
        isOpen={showAdd}
        onClose={closeAddModal}
        title="Add note template"
        size="sm"
        secondaryAction={
          <Button onClick={closeAddModal} variant="secondary">
            Cancel
          </Button>
        }
        primaryAction={
          <Button
            onClick={handleAdd}
            disabled={adding || !newNote.title.trim() || !newNote.text.trim()}
            loading={adding}
            loadingMode="inline"
          >
            {adding ? "Adding..." : "Add template"}
          </Button>
        }
      >
        <div className="space-y-4">
          <BaseInput
            label="Title"
            value={newNote.title}
            onChange={(event) => setNewNote({ ...newNote, title: event.target.value })}
            placeholder="e.g. Issue resolved"
          />
          <TextareaInput
            label="Note text"
            value={newNote.text}
            onChange={(event) => setNewNote({ ...newNote, text: event.target.value })}
            rows={3}
            placeholder="Template text agents will see..."
          />
        </div>
      </CenterModal>
    </div>
  );
};
