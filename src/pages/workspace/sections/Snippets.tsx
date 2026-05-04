import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { TextareaInput } from "../../../components/ui/inputs/TextareaInput";
import { CenterModal } from "../../../components/ui/modal/CenterModal";
import { Tag } from "../../../components/ui/Tag";
import { TruncatedText } from "../../../components/ui/TruncatedText";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { Snippet } from "../types";

const EMPTY_FORM = { shortcut: "", title: "", content: "" };

export const Snippets = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editSnippet, setEditSnippet] = useState<Snippet | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnippets(await workspaceApi.getSnippets());
    } catch {
      setError("Failed to load snippets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = snippets.filter((snippet) => {
    const query = search.toLowerCase();
    return (
      snippet.title.toLowerCase().includes(query) ||
      snippet.shortcut.toLowerCase().includes(query)
    );
  });

  const closeModal = () => {
    setShowAdd(false);
    setEditSnippet(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.shortcut.trim() || !form.content.trim()) return;

    const payload = {
      shortcut: form.shortcut.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
    };

    setSaving(true);
    setError(null);
    try {
      if (editSnippet) {
        await workspaceApi.updateSnippet(editSnippet.id, payload);
        setSnippets((prev) =>
          prev.map((snippet) =>
            snippet.id === editSnippet.id ? { ...snippet, ...payload } : snippet,
          ),
        );
      } else {
        const created = await workspaceApi.addSnippet(payload);
        setSnippets((prev) => [...prev, created]);
      }
      closeModal();
    } catch {
      setError("Failed to save snippet.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSnippets((prev) => prev.filter((snippet) => snippet.id !== id));
    try {
      await workspaceApi.deleteSnippet(id);
    } catch {
      void load();
    }
  };

  const openCreate = () => {
    setEditSnippet(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
  };

  const openEdit = (snippet: Snippet) => {
    setEditSnippet(snippet);
    setForm({
      shortcut: snippet.shortcut,
      title: snippet.title,
      content: snippet.content,
    });
    setShowAdd(true);
  };

  if (loading) return <DataLoader type="snippets" />;
  if (error && snippets.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Canned responses</h2>
            <p className="mt-0.5 text-xs text-gray-500">Type a shortcut in the reply box to insert</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-44">
              <BaseInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search snippets..."
                size="sm"
                leftIcon={<Search size={14} />}
                aria-label="Search snippets"
              />
            </div>
            <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
              Add snippet
            </Button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map((snippet) => (
            <div key={snippet.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
              <Tag label={snippet.shortcut} size="sm" bgColor="tag-indigo" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{snippet.title}</p>
                <TruncatedText
                  text={snippet.content}
                  maxLines={1}
                  className="mt-0.5 text-xs text-gray-500"
                />
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <IconButton
                  onClick={() => openEdit(snippet)}
                  icon={<Edit2 size={14} />}
                  variant="ghost"
                  size="xs"
                  aria-label={`Edit ${snippet.title || snippet.shortcut}`}
                />
                <IconButton
                  onClick={() => handleDelete(snippet.id)}
                  icon={<Trash2 size={14} />}
                  variant="danger-ghost"
                  size="xs"
                  aria-label={`Delete ${snippet.title || snippet.shortcut}`}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No snippets found</div>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <CenterModal
        isOpen={showAdd}
        onClose={closeModal}
        title={editSnippet ? "Edit snippet" : "Add snippet"}
        size="md"
        secondaryAction={
          <Button onClick={closeModal} variant="secondary">
            Cancel
          </Button>
        }
        primaryAction={
          <Button
            onClick={handleSave}
            disabled={saving || !form.shortcut.trim() || !form.content.trim()}
            loading={saving}
            loadingMode="inline"
          >
            {saving ? "Saving..." : editSnippet ? "Save changes" : "Add snippet"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BaseInput
              label="Shortcut"
              value={form.shortcut}
              onChange={(event) => setForm({ ...form, shortcut: event.target.value })}
              placeholder="/shortcut"
              className="font-mono"
            />
            <BaseInput
              label="Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Snippet title"
            />
          </div>
          <TextareaInput
            label="Content"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            rows={4}
            placeholder="Message content. Use {{contact.firstName}} for variables."
          />
        </div>
      </CenterModal>
    </div>
  );
};
