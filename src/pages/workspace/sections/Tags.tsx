import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { ConfirmDeleteModal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { ListPagination } from '../../../components/ui/ListPagination';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { Tag } from '../../../components/ui/Tag';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import {
  INITIAL_WORKSPACE_TAG_FORM,
  WorkspaceTagFormModal,
  type WorkspaceTagFormValue,
} from '../../../components/ui/tag/WorkspaceTagFormModal';
import { useMobileHeaderActions } from '../../../components/mobileHeaderActions';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { workspaceApi } from '../../../lib/workspaceApi';
import { DataLoader } from '../../Loader';
import { SectionError } from '../components/SectionError';
import type { ConversationTag } from '../types';

export const Tags = () => {
  const isMobile = useIsMobile();
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState<WorkspaceTagFormValue>(INITIAL_WORKSPACE_TAG_FORM);
  const [editingTag, setEditingTag] = useState<ConversationTag | null>(null);
  const [deleteTag, setDeleteTag] = useState<ConversationTag | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const closeAddTag = useCallback(() => {
    setShowAdd(false);
  }, []);

  const openCreateTag = useCallback(() => {
    setEditingTag(null);
    setNewTag(INITIAL_WORKSPACE_TAG_FORM);
    setShowAdd(true);
  }, []);

  const openEditTag = useCallback((tag: ConversationTag) => {
    setEditingTag(tag);
    setNewTag({
      name: tag.name,
      color: tag.bundle?.color || tag.color || INITIAL_WORKSPACE_TAG_FORM.color,
      emoji: tag.bundle?.emoji || tag.emoji || '',
      description: tag.bundle?.description || tag.description || '',
    });
    setShowAdd(true);
  }, []);

  const load = useCallback(async (nextPage = page, nextSearch = search) => {
    const append = isMobile && nextPage > 1;
    if (append) {
      setMobileLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await workspaceApi.listTags({
        page: nextPage,
        limit: pagination.limit,
        search: nextSearch || undefined,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      setTags((current) => {
        if (!append) return items;
        const seen = new Set(current.map((tag) => String(tag.id)));
        return [...current, ...items.filter((tag) => !seen.has(String(tag.id)))];
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
    } catch (err: any) {
      setError(err?.message || 'Failed to load tags');
    } finally {
      if (append) {
        setMobileLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [isMobile, page, pagination.limit, search]);

  useEffect(() => {
    void load(page, search);
  }, [load, page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const handleSaveTag = async () => {
    if (!newTag.name.trim() || adding) return;

    setAdding(true);
    try {
      if (editingTag) {
        await workspaceApi.updateTag(editingTag.id, {
          ...newTag,
          name: newTag.name.trim(),
          description: newTag.description.trim(),
        });
      } else {
        await workspaceApi.addTag({
          ...newTag,
          name: newTag.name.trim(),
          description: newTag.description.trim(),
        });
      }
      await load(1, search);
      closeAddTag();
    } finally {
      setAdding(false);
    }
  };

  const closeDeleteTag = useCallback(() => {
    if (deleting) return;
    setDeleteTag(null);
    setDeleteError(null);
  }, [deleting]);

  const requestDeleteTag = useCallback((tag: ConversationTag) => {
    setDeleteTag(tag);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTag || deleting) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await workspaceApi.deleteTag(deleteTag.id);
      await load(page, search);
      setDeleteTag(null);
    } catch {
      setDeleteError('Failed to delete tag.');
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
            <BaseInput
              appearance="toolbar"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search tags..."
              leftIcon={<Search size={15} />}
              aria-label="Search tags"
            />
          ),
        }
      : {},
    [isMobile, searchDraft],
  );

  if (loading) return <DataLoader type="tags" />;
  if (error && tags.length === 0) return <SectionError message={error} onRetry={load} />;

  const tagColumns: Array<DataTableColumn<ConversationTag>> = [
    {
      id: 'tag',
      header: 'Tag',
      mobile: 'primary',
      cell: (tag) => (
        <Tag
          label={tag.name}
          emoji={tag.bundle?.emoji || tag.emoji || 'Tag'}
          bgColor={tag.bundle?.color || tag.color}
          maxWidth={220}
        />
      ),
    },
    {
      id: 'description',
      header: 'Description',
      mobile: 'secondary',
      cell: (tag) =>
        tag.bundle?.description || tag.description || (
          <span className="italic text-gray-400">No description</span>
        ),
    },
   
    {
      id: 'contacts',
      header: 'Contacts',
      align: 'right',
      mobile: 'detail',
      cell: (tag) => <span className="font-medium text-gray-700">{tag.count}</span>,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white">
        <div className={`${isMobile ? 'hidden' : 'px-6 py-4'} flex-shrink-0 border-b border-gray-100`}>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Conversation tags</h2>
            <p className="mt-0.5 text-xs text-gray-500">Organize and filter conversations with tags</p>
          </div>
          <div className="mt-4">
            <Button
              onClick={openCreateTag}
              leftIcon={<Plus size={16} />}
            >
              Add tag
            </Button>
          </div>
        </div>

        <div className={`${isMobile ? 'hidden' : 'px-6 py-4'} flex-shrink-0 border-b border-gray-100`}>
          <div className="w-full md:max-w-xs">
            <BaseInput
              appearance="toolbar"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search tags..."
              leftIcon={<Search size={15} />}
            />
          </div>
        </div>

        <div className="min-h-[320px] min-w-0 flex-1 overflow-hidden">
          <DataTable
            className="h-full"
            rows={tags}
            columns={tagColumns}
            getRowId={(tag) => tag.id}
            emptyTitle="No tags found"
            emptyDescription="Try another search or create a tag."
            rowActions={(tag) => [
              {
                id: 'edit',
                label: 'Edit',
                icon: <Pencil size={13} />,
                onClick: () => openEditTag(tag),
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={13} />,
                tone: 'danger',
                onClick: () => requestDeleteTag(tag),
              },
            ]}
            minTableWidth={760}
            mobileLoadMore={{
              hasMore: pagination.hasNextPage,
              loading: mobileLoadingMore,
              onLoadMore: loadNextMobilePage,
              loadingLabel: 'Loading more tags...',
            }}
            footer={
              <ListPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                itemLabel="tags"
                onPageChange={setPage}
              />
            }
          />
        </div>
      </div>

      <FloatingActionButton
        label="Add tag"
        icon={<Plus size={24} />}
        onClick={openCreateTag}
      />

      <WorkspaceTagFormModal
        open={showAdd}
        mode={editingTag ? 'edit' : 'create'}
        value={newTag}
        saving={adding}
        onChange={setNewTag}
        onClose={closeAddTag}
        onSave={handleSaveTag}
        savingLabel="Saving..."
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTag)}
        entityName={deleteTag?.name ?? 'this tag'}
        entityType="tag"
        title="Delete tag"
        body={
          <div className="space-y-2">
            <p>
              This tag will be removed from workspace tag lists and cannot be
              restored from here.
            </p>
            {deleteError ? (
              <p className="font-medium text-red-600">{deleteError}</p>
            ) : null}
          </div>
        }
        confirmLabel="Delete tag"
        isDeleting={deleting}
        onCancel={closeDeleteTag}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
