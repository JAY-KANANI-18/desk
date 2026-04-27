import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search, Smile, Trash2, X } from 'lucide-react';

import { MobileSheet } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/Button';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';
import { ListPagination } from '../../../components/ui/ListPagination';
import { CenterModal } from '../../../components/ui/Modal';
import { Tag } from '../../../components/ui/Tag';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { TagColorSwatchPicker } from '../../../components/ui/inputs/TagColorSwatchPicker';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { useMobileHeaderActions } from '../../../components/mobileHeaderActions';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { workspaceApi } from '../../../lib/workspaceApi';
import { resolveTagBaseColor, TAG_COLOR_OPTIONS } from '../../../lib/tagAppearance';
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

  const closeAddTag = useCallback(() => {
    setShowAdd(false);
    setEmojiOpen(false);
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
      closeAddTag();
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
            <BaseInput
              autoFocus
              appearance="toolbar"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search tags..."
              leftIcon={<Search size={15} />}
            />
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

  const formContent = (
    <div className="space-y-4 p-4 md:p-0">
      <Tag
        label={newTag.name || 'New tag'}
        emoji={newTag.emoji || 'Tag'}
        bgColor={newTag.color}
        maxWidth="100%"
      />

      <div className="grid grid-cols-[76px_1fr] gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Emoji</label>
          <div className="relative" ref={emojiRef}>
            <Button
              onClick={() => setEmojiOpen((prev) => !prev)}
              variant="secondary"
              fullWidth
              preserveChildLayout
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-lg leading-none">{newTag.emoji || 'Tag'}</span>
                <Smile size={16} className="text-indigo-600" />
              </span>
            </Button>
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

        <BaseInput
          label="Name"
          value={newTag.name}
          onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
          placeholder="e.g. Priority"
        />
      </div>

      <TagColorSwatchPicker
        label="Colors"
        value={newTag.color}
        options={TAG_COLOR_OPTIONS}
        onChange={(color) => setNewTag({ ...newTag, color })}
      />

      <TextareaInput
        label="Description"
        value={newTag.description}
        onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
        rows={4}
      />
    </div>
  );

  const formFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={closeAddTag}>
        Cancel
      </Button>
      <Button
        onClick={handleAdd}
        disabled={adding || !newTag.name.trim()}
        loading={adding}
      >
        {adding ? 'Adding...' : 'Add tag'}
      </Button>
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
          <div className="mt-4">
            <Button
              onClick={() => setShowAdd(true)}
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
          isOpen={showAdd}
          onClose={closeAddTag}
          title={<h3 className="text-base font-semibold text-slate-900">Create Tag</h3>}
          footer={formFooter}
        >
          {formContent}
        </MobileSheet>
      ) : null}

      {showAdd && !isMobile ? (
        <CenterModal
          isOpen={showAdd}
          onClose={closeAddTag}
          title="Create Tag"
          size="sm"
          footer={formFooter}
        >
          {formContent}
        </CenterModal>
      ) : null}
    </div>
  );
};
