import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { FileText, Paperclip, Pencil, Plus, Trash2, X } from '@/components/ui/icons';

import { ConfirmDeleteModal, CenterModal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { ListPagination } from '../../../components/ui/ListPagination';
import { BaseInput, SearchInput, TextareaInput } from '../../../components/ui/inputs';
import { BaseSelect } from '../../../components/ui/select/BaseSelect';
import { Tag } from '../../../components/ui/Tag';
import { TruncatedText } from '../../../components/ui/TruncatedText';
import { useMobileHeaderActions } from '../../../components/mobileHeaderActions';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { uploadPresignedFile } from '../../../lib/inboxApi';
import {
  getSnippetLabel,
  snippetAttachmentTypeFromFile,
  type Snippet,
  type SnippetAttachment,
  type SnippetUpsertPayload,
} from '../../../lib/snippets';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';
import { SectionError } from '../components/SectionError';

interface SnippetFormValue {
  name: string;
  shortcut: string;
  content: string;
  topic: string;
  attachments: SnippetAttachment[];
}

const EMPTY_FORM: SnippetFormValue = {
  name: '',
  shortcut: '',
  content: '',
  topic: '',
  attachments: [],
};

const formatUpdatedAt = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const Snippets = () => {
  const isMobile = useIsMobile();
  const { activeWorkspace } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [form, setForm] = useState<SnippetFormValue>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteSnippet, setDeleteSnippet] = useState<Snippet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const topicOptions = useMemo(() => {
    const topics = Array.from(
      new Set(
        snippets
          .map((snippet) => snippet.topic?.trim())
          .filter((topic): topic is string => Boolean(topic)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: 'all', label: 'All topics' },
      ...topics.map((topic) => ({ value: topic, label: topic })),
    ];
  }, [snippets]);

  const load = useCallback(async (
    nextPage = page,
    nextSearch = search,
    nextTopic = topicFilter,
  ) => {
    const append = isMobile && nextPage > 1;
    if (append) {
      setMobileLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await workspaceApi.listSnippets({
        page: nextPage,
        limit: pagination.limit,
        search: nextSearch || undefined,
        topic: nextTopic !== 'all' ? nextTopic : undefined,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      setSnippets((current) => {
        if (!append) return items;
        const seen = new Set(current.map((snippet) => snippet.id));
        return [...current, ...items.filter((snippet) => !seen.has(snippet.id))];
      });
      setPagination(
        response?.pagination ?? {
          total: items.length,
          page: nextPage,
          limit: pagination.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snippets');
    } finally {
      if (append) {
        setMobileLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [isMobile, page, pagination.limit, search, topicFilter]);

  useEffect(() => {
    void load(page, search, topicFilter);
  }, [load, page, search, topicFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const openCreate = useCallback(() => {
    setEditingSnippet(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet);
    setForm({
      name: getSnippetLabel(snippet),
      shortcut: snippet.shortcut,
      content: snippet.content,
      topic: snippet.topic ?? '',
      attachments: snippet.attachments ?? [],
    });
    setFormError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (saving || uploadingFile) return;
    setModalOpen(false);
    setEditingSnippet(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }, [saving, uploadingFile]);

  const handleAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!activeWorkspace?.id) {
      setFormError('Select a workspace before uploading a snippet file.');
      return;
    }

    const remainingSlots = Math.max(0, 5 - form.attachments.length);
    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      setFormError('A snippet can include up to 5 files.');
      return;
    }

    setUploadingFile(true);
    setFormError(null);
    try {
      const uploaded = await Promise.all(
        selectedFiles.map(async (file) => {
          const contentType = file.type || 'application/octet-stream';
          const url = await uploadPresignedFile(
            {
              type: 'snippet-attachment',
              entityId: activeWorkspace.id,
              fileName: file.name,
              contentType,
            },
            file,
          );

          return {
            type: snippetAttachmentTypeFromFile(file),
            url,
            name: file.name,
            mimeType: contentType,
            size: file.size,
          } satisfies SnippetAttachment;
        }),
      );

      setForm((current) => ({
        ...current,
        attachments: [...current.attachments, ...uploaded],
      }));
    } catch {
      setFormError('Failed to upload file. Try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index: number) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((_attachment, currentIndex) => currentIndex !== index),
    }));
  };

  const buildPayload = (): SnippetUpsertPayload | null => {
    const name = form.name.trim();
    const shortcut = form.shortcut.trim();
    const content = form.content.trim();
    const topic = form.topic.trim();

    if (!name || !shortcut || !content) {
      setFormError('Name, snippet ID, and message are required.');
      return null;
    }

    return {
      name,
      shortcut,
      content,
      topic: topic || null,
      attachments: form.attachments,
    };
  };

  const handleSave = async () => {
    if (saving || uploadingFile) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    setFormError(null);
    try {
      if (editingSnippet) {
        await workspaceApi.updateSnippet(editingSnippet.id, payload);
      } else {
        await workspaceApi.addSnippet(payload);
      }
      await load(1, search, topicFilter);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save snippet.');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = useCallback((snippet: Snippet) => {
    setDeleteSnippet(snippet);
    setDeleteError(null);
  }, []);

  const closeDelete = useCallback(() => {
    if (deleting) return;
    setDeleteSnippet(null);
    setDeleteError(null);
  }, [deleting]);

  const handleConfirmDelete = async () => {
    if (!deleteSnippet || deleting) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await workspaceApi.deleteSnippet(deleteSnippet.id);
      await load(page, search, topicFilter);
      setDeleteSnippet(null);
    } catch {
      setDeleteError('Failed to delete snippet.');
    } finally {
      setDeleting(false);
    }
  };

  const loadNextMobilePage = useCallback(() => {
    if (loading || mobileLoadingMore || !pagination.hasNextPage) return;
    setPage((current) => Math.min(pagination.totalPages, current + 1));
  }, [loading, mobileLoadingMore, pagination.hasNextPage, pagination.totalPages]);

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <SearchInput
              appearance="toolbar"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search snippets..."
              onClear={() => setSearchDraft('')}
              clearAriaLabel="Clear snippet search"
              aria-label="Search snippets"
            />
          ),
        }
      : {},
    [isMobile, searchDraft],
  );

  const snippetColumns: Array<DataTableColumn<Snippet>> = [
    {
      id: 'snippet',
      header: 'Snippet',
      mobile: 'primary',
      cell: (snippet) => (
        <div className="flex min-w-0 items-start gap-3">
          <Tag label={snippet.shortcut} size="sm" bgColor="tag-indigo" maxWidth={140} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{getSnippetLabel(snippet)}</p>
            <TruncatedText
              as="p"
              text={snippet.content}
              maxLines={1}
              className="mt-0.5 text-xs text-gray-500"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'topic',
      header: 'Topic',
      mobile: 'secondary',
      cell: (snippet) =>
        snippet.topic ? (
          <Tag label={snippet.topic} size="sm" bgColor="gray" maxWidth={160} />
        ) : (
          <span className="text-sm italic text-gray-400">No topic</span>
        ),
    },
    {
      id: 'files',
      header: 'Files',
      align: 'right',
      mobile: 'detail',
      cell: (snippet) => {
        const count = snippet.attachments?.length ?? 0;
        return (
          <span className="inline-flex items-center justify-end gap-1 text-sm font-medium text-gray-700">
            <Paperclip size={13} className="text-gray-400" />
            {count}
          </span>
        );
      },
    },
    {
      id: 'updated',
      header: 'Updated',
      align: 'right',
      mobile: 'detail',
      cell: (snippet) => (
        <span className="text-sm text-gray-500">{formatUpdatedAt(snippet.updatedAt)}</span>
      ),
    },
  ];

  const canSave =
    Boolean(form.name.trim()) &&
    Boolean(form.shortcut.trim()) &&
    Boolean(form.content.trim()) &&
    !saving &&
    !uploadingFile;

  if (loading) return <DataLoader type="snippets" />;
  if (error && snippets.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="settings-data-panel">
        <div className={`${isMobile ? 'hidden' : 'settings-data-header'}`}>
          <div className="settings-page-intro">
            <p className="settings-page-intro__copy">
              Save replies your team sends often, so they can answer faster without retyping.
            </p>
            <div className="settings-page-actions">
              <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
                Add snippet
              </Button>
            </div>
          </div>
        </div>

        <div className={`${isMobile ? 'hidden' : 'settings-toolbar-row'}`}>
          <div className="settings-filter-row">
            <div className="settings-filter-row__search">
              <SearchInput
                appearance="toolbar"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search snippets..."
                onClear={() => setSearchDraft('')}
                clearAriaLabel="Clear snippet search"
                aria-label="Search snippets"
              />
            </div>
            <div className="w-full md:w-56">
              <BaseSelect
                value={topicFilter}
                options={topicOptions}
                onChange={(value) => {
                  setPage(1);
                  setTopicFilter(value);
                }}
                placeholder="Filter by topic"
              />
            </div>
          </div>
        </div>

        <div className="min-h-[320px] min-w-0 flex-1 overflow-hidden">
          <DataTable
            className="h-full"
            rows={snippets}
            columns={snippetColumns}
            getRowId={(snippet) => snippet.id}
            emptyTitle="No snippets found"
            emptyDescription="Try another search or create a snippet."
            rowActions={(snippet) => [
              {
                id: 'edit',
                label: 'Edit',
                icon: <Pencil size={13} />,
                onClick: () => openEdit(snippet),
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={13} />,
                tone: 'danger',
                onClick: () => requestDelete(snippet),
              },
            ]}
            minTableWidth={820}
            mobileLoadMore={{
              hasMore: pagination.hasNextPage,
              loading: mobileLoadingMore,
              onLoadMore: loadNextMobilePage,
              loadingLabel: 'Loading more snippets...',
            }}
            footer={
              <ListPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                itemLabel="snippets"
                onPageChange={setPage}
              />
            }
          />
        </div>
      </div>

      <FloatingActionButton
        label="Add snippet"
        icon={<Plus size={24} />}
        onClick={openCreate}
      />

      <CenterModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingSnippet ? 'Edit snippet' : 'Create snippet'}
        subtitle="Save a message your team can reuse later."
        size="md"
        secondaryAction={
          <Button onClick={closeModal} variant="secondary" disabled={saving || uploadingFile}>
            Cancel
          </Button>
        }
        primaryAction={
          <Button
            onClick={handleSave}
            disabled={!canSave}
            loading={saving}
            loadingMode="inline"
          >
            {saving ? 'Saving...' : editingSnippet ? 'Save changes' : 'Create'}
          </Button>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <BaseInput
            label="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Greeting"
            required
          />

          <BaseInput
            label="Snippet ID"
            value={form.shortcut}
            onChange={(event) => setForm((current) => ({ ...current, shortcut: event.target.value }))}
            placeholder="greeting"
            hint='Type "/" followed by this ID while writing a reply.'
            required
          />

          <TextareaInput
            label="Message"
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            rows={5}
            placeholder="Hi {{contact_name}}, how can we help you?"
            hint="Supported variables: {{contact_name}}, {{agent_name}}, {{last_message}}"
            required
          />

          <BaseInput
            label="Topic (optional)"
            value={form.topic}
            onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
            placeholder="Support, Sales, Billing"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700">Upload file (optional)</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                loading={uploadingFile}
                loadingMode="inline"
                disabled={uploadingFile || form.attachments.length >= 5}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFile ? 'Uploading...' : 'Add file'}
              </Button>
            </div>

            {form.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
                {form.attachments.map((attachment, index) => (
                  <span
                    key={`${attachment.url}-${index}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                  >
                    <FileText size={13} className="shrink-0 text-gray-400" />
                    <span className="max-w-[12rem] truncate font-medium">{attachment.name}</span>
                    <Button
                      type="button"
                      variant="danger-ghost"
                      size="2xs"
                      iconOnly
                      radius="full"
                      aria-label={`Remove ${attachment.name}`}
                      leftIcon={<X size={9} />}
                      onClick={() => removeAttachment(index)}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-400">
                No files attached
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                void handleAddFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </div>
        </div>
      </CenterModal>

      <ConfirmDeleteModal
        open={Boolean(deleteSnippet)}
        entityName={deleteSnippet ? getSnippetLabel(deleteSnippet) : 'this snippet'}
        entityType="snippet"
        title="Delete snippet"
        body={
          <div className="space-y-2">
            <p>This snippet will no longer appear in reply shortcuts.</p>
            {deleteError ? <p className="font-medium text-red-600">{deleteError}</p> : null}
          </div>
        }
        confirmLabel="Delete snippet"
        isDeleting={deleting}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
