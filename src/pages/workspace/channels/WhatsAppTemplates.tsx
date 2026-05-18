import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
} from '@/components/ui/icons';

import { Button } from '../../../components/ui/button/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { SearchInput } from '../../../components/ui/inputs';
import { ActionMenu } from '../../../components/ui/menu';
import { CenterModal } from '../../../components/ui/modal/CenterModal';
import { BaseSelect } from '../../../components/ui/select/BaseSelect';
import type { SelectOption } from '../../../components/ui/select/shared';
import { Tag } from '../../../components/ui/tag/Tag';
import { TruncatedText } from '../../../components/ui/truncated-text';
import {
  ChannelApi,
  type WaTemplate,
  type WaTemplatePreview,
} from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import {
  buildWhatsAppTemplatePreviewComponents,
  getWhatsAppTemplateSampleValues,
  normalizeWhatsAppTemplateComponents,
  WhatsAppTemplateMessageWindow,
} from '../../inbox/message-area/WhatsAppTemplatePreview';
import { ConnectedChannel } from '../../channels/ManageChannelPage';

type WhatsAppTemplateSortField =
  | 'name'
  | 'category'
  | 'language'
  | 'variables'
  | 'status';

type SortDirection = 'asc' | 'desc';

const statusOptions: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'PAUSED', label: 'PAUSED' },
];

const categoryOptions: SelectOption[] = [
  { value: '', label: 'All categories' },
  { value: 'MARKETING', label: 'MARKETING' },
  { value: 'UTILITY', label: 'UTILITY' },
  { value: 'AUTHENTICATION', label: 'AUTHENTICATION' },
];

const sortOptions: SelectOption[] = [
  { value: 'name', label: 'Sort by name' },
  { value: 'status', label: 'Sort by status' },
  { value: 'category', label: 'Sort by category' },
  { value: 'language', label: 'Sort by language' },
  { value: 'variables', label: 'Sort by variables' },
];

const isWhatsAppTemplateSortField = (
  value: string,
): value is WhatsAppTemplateSortField =>
  sortOptions.some((option) => option.value === value);

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
    PAUSED: 'gray',
  };

  return (
    <Tag
      label={formatEnumLabel(status)}
      size="sm"
      bgColor={colorMap[status] ?? 'gray'}
    />
  );
};

type ChannelSyncEvent = {
  channelId?: string | number;
  feature?: string;
  synced?: number;
  errors?: number;
};

const formatSyncedAt = (syncedAt?: string) => {
  if (!syncedAt) return 'Not synced';

  const timestamp = new Date(syncedAt).getTime();
  if (Number.isNaN(timestamp)) return 'Not synced';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'just now';

  const units = [
    { label: 'year', seconds: 31_536_000 },
    { label: 'month', seconds: 2_592_000 },
    { label: 'day', seconds: 86_400 },
    { label: 'hour', seconds: 3_600 },
    { label: 'minute', seconds: 60 },
  ];

  const unit = units.find((candidate) => elapsedSeconds >= candidate.seconds);
  if (!unit) return 'just now';

  const value = Math.floor(elapsedSeconds / unit.seconds);
  return `${value} ${unit.label}${value === 1 ? '' : 's'} ago`;
};

const WhatsAppTemplateCard = ({
  template,
  onPreview,
}: {
  template: WaTemplate;
  onPreview: (template: WaTemplate) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const templateComponents = useMemo(
    () => normalizeWhatsAppTemplateComponents(
      template.components,
      getWhatsAppTemplateSampleValues(template.variables),
    ),
    [template],
  );

  const copyTemplateName = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(template.name);
  };

  return (
    <article className="relative flex h-[452px] w-full max-w-[392px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-[#dce1e7] shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <TruncatedText
            as="h3"
            text={template.name}
            maxLines={1}
            className="text-base font-semibold text-gray-950"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={template.status} />
            <span className="text-sm text-gray-600">
              {formatEnumLabel(template.category)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPreview(template)}
          >
            View
          </Button>
          <div className="relative">
            <IconButton
              ref={menuButtonRef}
              icon={<MoreHorizontal size={16} />}
              aria-label={`Actions for ${template.name}`}
              variant="secondary"
              size="sm"
              onClick={() => setMenuOpen((open) => !open)}
            />
            <ActionMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={menuButtonRef}
              items={[
                {
                  id: 'preview',
                  label: 'Preview',
                  icon: <Eye size={14} />,
                  onSelect: () => onPreview(template),
                },
                {
                  id: 'copy-name',
                  label: 'Copy template name',
                  icon: <Copy size={14} />,
                  onSelect: copyTemplateName,
                },
              ]}
              width="sm"
              ariaLabel={`Actions for ${template.name}`}
            />
          </div>
        </div>
      </div>

      <WhatsAppTemplateMessageWindow
        components={templateComponents}
        syncedAt={template.syncedAt}
        className="flex-1"
      />

      <div className="flex min-h-11 items-center justify-between gap-3 px-5 py-2.5 text-sm text-gray-900">
        <span className="font-medium uppercase tracking-normal">
          {template.language}
        </span>
        <span className="text-right">{formatSyncedAt(template.syncedAt)}</span>
      </div>
    </article>
  );
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const PreviewModal = ({
  template,
  channelId,
  onClose,
}: {
  template: WaTemplate;
  channelId: string;
  onClose: () => void;
}) => {
  const [vars, setVars] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<WaTemplatePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template.variables?.length) {
      const initial: Record<string, string> = {};
      template.variables.forEach((variable) => {
        initial[variable] = '';
      });
      setVars(initial);
    } else {
      setVars({});
    }
    setPreview(null);
  }, [template.id, template.variables]);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextPreview = await ChannelApi.previewTemplate(
        channelId,
        template.id,
        vars,
      );
      setPreview(nextPreview);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Preview failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((template.variables?.length ?? 0) === 0) {
      void handlePreview();
    }
  }, [template.id]);

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      title={template.name}
      subtitle={`${template.language} - ${template.category}`}
      size="lg"
    >
      <div className="space-y-4">
        {(template.variables?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Template Variables
            </p>
            {template.variables.map((variable) => (
              <BaseInput
                key={variable}
                value={vars[variable] ?? ''}
                onChange={(event) =>
                  setVars((current) => ({
                    ...current,
                    [variable]: event.target.value,
                  }))
                }
                label={`{{${variable}}}`}
                placeholder={`Value for {{${variable}}}`}
              />
            ))}
            <Button
              onClick={() => void handlePreview()}
              leftIcon={!loading ? <Eye size={13} /> : undefined}
              loading={loading}
              loadingMode="inline"
              loadingLabel="Previewing..."
            >
              Preview
            </Button>
          </div>
        ) : null}

        {preview ? (
          <div className="space-y-2 border-y border-gray-100 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Preview
            </p>
            <WhatsAppTemplateMessageWindow
              components={buildWhatsAppTemplatePreviewComponents({
                header: preview.header,
                body: preview.body,
                footer: preview.footer,
                buttons: preview.buttons,
              })}
              className="h-[360px] rounded-lg"
            />
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
            <AlertCircle size={13} />
            {error}
          </div>
        ) : null}

        <details className="group">
          <summary className="cursor-pointer select-none text-xs text-gray-400 hover:text-gray-600">
            View raw components
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            {JSON.stringify(template.components, null, 2)}
          </pre>
        </details>
      </div>
    </CenterModal>
  );
};

export const WhatsAppTemplatesSection = ({
  channel,
}: {
  channel: ConnectedChannel;
}) => {
  const { socket } = useSocket();
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [catFilter, setCategory] = useState('');
  const [preview, setPreview] = useState<WaTemplate | null>(null);
  const [sortField, setSortField] =
    useState<WhatsAppTemplateSortField>('name');
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextTemplates = await ChannelApi.listWhatsAppTemplates(
        String(channel.id),
        {
          status: statusFilter || undefined,
          category: catFilter || undefined,
          search: search || undefined,
        },
      );
      setTemplates(nextTemplates ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load templates'));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [channel.id, statusFilter, catFilter]);

  useEffect(() => {
    if (!socket) return;

    const onSync = (event: ChannelSyncEvent) => {
      if (
        String(event?.channelId) === String(channel.id) &&
        event?.feature === 'whatsapp_templates'
      ) {
        setSyncMsg(
          `Synced ${event?.synced ?? 0} templates${event?.errors ? ` (${event.errors} errors)` : ''}`,
        );
        void load();
      }
    };

    socket.on('channel:sync', onSync);
    return () => {
      socket.off('channel:sync', onSync);
    };
  }, [channel.id, socket, statusFilter, catFilter, search]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void load();
  };

  const handleSortFieldChange = (field: string) => {
    if (isWhatsAppTemplateSortField(field)) {
      setSortField(field);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
  };

  const sortedTemplates = useMemo(() => {
    const getValue = (template: WaTemplate) => {
      if (sortField === 'variables') return template.variables?.length ?? 0;
      return String(template[sortField] ?? '');
    };

    return [...templates].sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);
      const result =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
      return sortDirection === 'asc' ? result : -result;
    });
  }, [sortDirection, sortField, templates]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await ChannelApi.syncWhatsAppTemplates(String(channel.id));
      setSyncMsg(
        `Synced ${result?.synced ?? 0} templates${result?.errors ? ` (${result.errors} errors)` : ''}`,
      );
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Sync failed'));
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Message Templates</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Approved WhatsApp message templates for your WABA account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {syncMsg ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check size={12} />
              {syncMsg}
            </span>
          ) : null}
          <Button
            onClick={() => void handleSync()}
            variant="secondary"
            size="sm"
            leftIcon={!syncing ? <RefreshCw size={13} /> : undefined}
            loading={syncing}
            loadingMode="inline"
            loadingLabel="Syncing..."
          >
            Sync
          </Button>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-start gap-2">
        <form onSubmit={handleSearch} className="min-w-[200px] flex-1">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            searchIconSize={14}
            onClear={() => setSearch('')}
            clearAriaLabel="Clear template search"
          />
        </form>
        <div className="min-w-[180px]">
          <BaseSelect
            value={statusFilter}
            onChange={setStatus}
            options={statusOptions}
            placeholder="All statuses"
          />
        </div>
        <div className="min-w-[180px]">
          <BaseSelect
            value={catFilter}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="All categories"
          />
        </div>
        <div className="min-w-[180px]">
          <BaseSelect
            value={sortField}
            onChange={handleSortFieldChange}
            options={sortOptions}
          />
        </div>
        <IconButton
          icon={
            sortDirection === 'asc' ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )
          }
          aria-label={
            sortDirection === 'asc'
              ? 'Sort ascending'
              : 'Sort descending'
          }
          variant="secondary"
          size="sm"
          onClick={toggleSortDirection}
        />
      </div>

      {error ? (
        <div className="flex flex-shrink-0 items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      <div className="min-h-[320px] min-w-0 flex-1 overflow-y-auto border-y border-gray-100 bg-gray-50/60 py-5 [scrollbar-width:thin]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--color-primary)]" />
            Loading templates...
          </div>
        ) : sortedTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-sm text-gray-400">
            <Search size={28} className="text-gray-300" />
            <span className="mt-2 font-medium text-gray-500">
              No templates found
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Try syncing or adjusting your filters.
            </span>
          </div>
        ) : (
          <div
            className="grid justify-start gap-5"
            style={{
              gridTemplateColumns:
                'repeat(auto-fill, minmax(min(100%, 360px), 392px))',
            }}
          >
            {sortedTemplates.map((template) => (
              <WhatsAppTemplateCard
                key={template.id}
                template={template}
                onPreview={setPreview}
              />
            ))}
          </div>
        )}
      </div>

      <p className="flex-shrink-0 text-xs text-gray-400">
        {templates.length} template{templates.length !== 1 ? 's' : ''} -
        Templates are created and managed in Meta Business Manager
      </p>

      {preview ? (
        <PreviewModal
          template={preview}
          channelId={String(channel.id)}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
};
