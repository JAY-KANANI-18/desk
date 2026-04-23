import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search, Smile, Trash2, X } from 'lucide-react';

import { MobileSheet } from '../../../components/topbar/MobileSheet';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { ListPagination } from '../../../components/ui/ListPagination';
import { useMobileHeaderActions } from '../../../components/mobileHeaderActions';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { workspaceApi } from '../../../lib/workspaceApi';
import {
  getTagSurfaceStyle,
  resolveTagBaseColor,
  TAG_COLOR_OPTIONS,
} from '../../../lib/tagAppearance';
import { DataLoader } from '../../Loader';
import { EmojiPicker } from '../../inbox/EmojiPicker';
import { SectionError } from '../components/SectionError';
import type { ConversationTag } from '../types';

const INITIAL_TAG = {
  name: '',
  color: 'tag-indigo',
  emoji: '',
  description: '',
};

export const Tags = () => {
  const isMobile = useIsMobile();
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState(INITIAL_TAG);
  const [adding, setAdding] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const emojiRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!emojiOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!emojiRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [emojiOpen]);

  const handleAdd = async () => {
    if (!newTag.name.trim() || adding) return;

    setAdding(true);
    try {
      await workspaceApi.addTag(newTag);
      await load(1, search);
      setNewTag(INITIAL_TAG);
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    await workspaceApi.deleteTag(id);
    await load(page, search);
  };

  const loadNextMobilePage = useCallback(() => {
    if (loading || mobileLoadingMore || !pagination.hasNextPage) return;
    setPage((current) => Math.min(pagination.totalPages, current + 1));
  }, [loading, mobileLoadingMore, pagination.hasNextPage, pagination.totalPages]);

  useMobileHeaderActions(
    isMobile
      ? {
          actions: [
            {
              id: 'tags-search',
              label: mobileSearchOpen ? 'Close search' : 'Search tags',
              icon: mobileSearchOpen ? <X size={17} /> : <Search size={17} />,
              active: mobileSearchOpen,
              hasIndicator: !mobileSearchOpen && Boolean(searchDraft),
              onClick: () => setMobileSearchOpen((value) => !value),
            },
            {
              id: 'tags-add',
              label: 'Add tag',
              icon: <Plus size={18} />,
              onClick: () => setShowAdd(true),
            },
          ],
          panel: mobileSearchOpen ? (
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search tags..."
                className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : null,
        }
      : {},
    [isMobile, mobileSearchOpen, searchDraft],
  );

  if (loading) return <DataLoader type="tags" />;
  if (error && tags.length === 0) return <SectionError message={error} onRetry={load} />;

  const tagColumns: Array<DataTableColumn<ConversationTag>> = [
    {
      id: 'tag',
      header: 'Tag',
      mobile: 'primary',
      cell: (tag) => (
        <span
          className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium"
          style={getTagSurfaceStyle(tag.bundle?.color || tag.color)}
        >
          <span>{tag.bundle?.emoji || tag.emoji || 'Tag'}</span>
          <span className="truncate">{tag.name}</span>
        </span>
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
      id: 'color',
      header: 'Color',
      mobile: 'detail',
      cell: (tag) => {
        const baseColor = resolveTagBaseColor(tag.bundle?.color || tag.color);
        return (
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: baseColor }} />
            <span className="truncate">{tag.bundle?.color || tag.color}</span>
          </div>
        );
      },
    },
    {
      id: 'contacts',
      header: 'Contacts',
      align: 'right',
      mobile: 'detail',
      cell: (tag) => <span className="font-medium text-gray-700">{tag.count}</span>,
    },
  ];

  const formContent = (
    <div className="space-y-4 p-4 md:p-0">
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
        <span>{newTag.emoji || 'Tag'}</span>
        <span className="text-sm text-gray-600">{newTag.name || 'New tag'}</span>
      </div>
      <div className="grid grid-cols-[76px_1fr] gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Emoji</label>
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setEmojiOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span>{newTag.emoji || 'Tag'}</span>
              <Smile size={16} className="text-indigo-600" />
            </button>
            {emojiOpen ? (
              <EmojiPicker
                mode="tag"
                accent="indigo"
                onSelect={(emoji) => {
                  setNewTag({ ...newTag, emoji });
                  setEmojiOpen(false);
                }}
              />
            ) : null}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            value={newTag.name}
            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
            placeholder="e.g. Priority"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Colors</label>
        <div className="flex flex-wrap items-center gap-3">
          {TAG_COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setNewTag({ ...newTag, color: option.value })}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                newTag.color === option.value ? 'scale-110 border-gray-800' : 'border-transparent'
              }`}
              style={{ backgroundColor: option.hex }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={newTag.description}
          onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );

  const formFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        onClick={() => setShowAdd(false)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={handleAdd}
        disabled={adding}
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {adding ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Adding...
          </>
        ) : (
          'Add tag'
        )}
      </button>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white">
        <div className={`${isMobile ? 'hidden' : 'px-6 py-4'} flex-shrink-0 border-b border-gray-100`}>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Conversation tags</h2>
            <p className="mt-0.5 text-xs text-gray-500">Organize and filter conversations with tags</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 flex w-fit items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add tag
          </button>
        </div>
        <div className={`${isMobile ? 'hidden' : 'px-6 py-4'} flex-shrink-0 border-b border-gray-100`}>
          <div className="relative w-full md:max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search tags..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 size={13} />,
                tone: 'danger',
                onClick: () => handleDelete(tag.id),
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

      {showAdd && isMobile ? (
        <MobileSheet
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title={<h3 className="text-base font-semibold text-slate-900">Create Tag</h3>}
          footer={formFooter}
        >
          {formContent}
        </MobileSheet>
      ) : null}

      {showAdd && !isMobile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Tag</h3>
              <button onClick={() => setShowAdd(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            {formContent}
            <div className="mt-6">{formFooter}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
