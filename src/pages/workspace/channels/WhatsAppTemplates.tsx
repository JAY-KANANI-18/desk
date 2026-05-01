import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Eye, RefreshCw, Search } from 'lucide-react';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSortDirection,
} from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { CenterModal } from '../../../components/ui/modal/CenterModal';
import { BaseSelect } from '../../../components/ui/select/BaseSelect';
import type { SelectOption } from '../../../components/ui/select/shared';
import { Tag } from '../../../components/ui/tag/Tag';
import { TruncatedText } from '../../../components/ui/truncated-text';
import { ChannelApi, type WaTemplate } from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import { ConnectedChannel } from '../../channels/ManageChannelPage';

type WhatsAppTemplateSortField =
  | 'name'
  | 'category'
  | 'language'
  | 'variables'
  | 'status';

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

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
    PAUSED: 'gray',
  };

  return <Tag label={status} size="sm" bgColor={colorMap[status] ?? 'gray'} />;
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorMap: Record<string, string> = {
    MARKETING: 'tag-purple',
    UTILITY: 'tag-blue',
    AUTHENTICATION: 'tag-orange',
  };

  return (
    <Tag
      label={category}
      size="sm"
      bgColor={colorMap[category] ?? 'gray'}
    />
  );
};

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
  const [preview, setPreview] = useState<any>(null);
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
    } catch (err: any) {
      setError(err?.message ?? 'Preview failed');
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
            <div className="max-w-[280px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              {preview.header ? (
                <div className="border-b border-gray-100 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                  {preview.header}
                </div>
              ) : null}
              <div className="whitespace-pre-wrap px-3 py-3 text-sm leading-relaxed text-gray-800">
                {preview.body}
              </div>
              {preview.footer ? (
                <div className="px-3 pb-2 text-xs text-gray-400">
                  {preview.footer}
                </div>
              ) : null}
              {preview.buttons?.map((button: any, index: number) => (
                <div
                  key={`${button.text}-${index}`}
                  className="border-t border-gray-100 px-3 py-2 text-center text-xs font-medium text-indigo-600"
                >
                  {button.text}
                </div>
              ))}
            </div>
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
    useState<DataTableSortDirection>('asc');

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
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load templates');
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

    const onSync = (event: any) => {
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

  const handleSort = (field: WhatsAppTemplateSortField) => {
    setSortField((current) => {
      if (current === field) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setSortDirection('asc');
      return field;
    });
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

  const columns: Array<DataTableColumn<WaTemplate, WhatsAppTemplateSortField>> = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortField: 'name',
      mobile: 'primary',
      className: 'max-w-[220px]',
      cell: (template) => (
        <TruncatedText
          text={template.name}
          maxLines={1}
          className="block font-mono text-xs text-gray-800"
        />
      ),
    },
    {
      id: 'category',
      header: 'Category',
      sortable: true,
      sortField: 'category',
      mobile: 'secondary',
      cell: (template) => <CategoryBadge category={template.category} />,
    },
    {
      id: 'language',
      header: 'Language',
      sortable: true,
      sortField: 'language',
      mobile: 'detail',
      cell: (template) => (
        <span className="text-xs text-gray-500">{template.language}</span>
      ),
    },
    {
      id: 'variables',
      header: 'Variables',
      sortable: true,
      sortField: 'variables',
      mobile: 'detail',
      cell: (template) =>
        template.variables?.length ? (
          <Tag
            label={template.variables.join(', ')}
            size="sm"
            bgColor="gray"
            maxWidth={220}
          />
        ) : (
          <span className="text-xs text-gray-300">-</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      sortField: 'status',
      mobile: 'detail',
      cell: (template) => <StatusBadge status={template.status} />,
    },
  ];

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await ChannelApi.syncWhatsAppTemplates(String(channel.id));
      setSyncMsg(
        `Synced ${result?.synced ?? 0} templates${result?.errors ? ` (${result.errors} errors)` : ''}`,
      );
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Sync failed');
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
          <BaseInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            leftIcon={<Search size={14} />}
          />
        </form>
        <div className="min-w-[180px]">
          <BaseSelect
            value={statusFilter}
            onChange={setStatus}
            options={statusOptions}
          />
        </div>
        <div className="min-w-[180px]">
          <BaseSelect
            value={catFilter}
            onChange={setCategory}
            options={categoryOptions}
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-shrink-0 items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      <div className="min-h-[320px] min-w-0 flex-1 overflow-hidden border-y border-gray-100">
        <DataTable
          className="h-full"
          rows={sortedTemplates}
          columns={columns}
          getRowId={(template) => template.id}
          loading={loading}
          loadingLabel="Loading templates..."
          emptyTitle="No templates found"
          emptyDescription="Try syncing or adjusting your filters."
          sort={{
            field: sortField,
            direction: sortDirection,
            onChange: handleSort,
          }}
          rowActions={(template) => [
            {
              id: 'preview',
              label: 'Preview',
              icon: <Eye size={13} />,
              onClick: () => setPreview(template),
            },
          ]}
          onRowClick={(template) => setPreview(template)}
          minTableWidth={820}
        />
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
