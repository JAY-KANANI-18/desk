// src/pages/workspace/channels/WhatsAppTemplates.tsx
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Eye, Loader, RefreshCw, Search, X } from 'lucide-react';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSortDirection,
} from '../../../components/ui/DataTable';
import { ChannelApi, type WaTemplate } from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import { ConnectedChannel } from '../../channels/ManageChannelPage';

type WhatsAppTemplateSortField = 'name' | 'category' | 'language' | 'variables' | 'status';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
    PAUSED: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${map[status] ?? 'border-gray-200 bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, string> = {
    MARKETING: 'bg-purple-50 text-purple-700',
    UTILITY: 'bg-blue-50 text-blue-700',
    AUTHENTICATION: 'bg-orange-50 text-orange-700',
  };

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[category] ?? 'bg-gray-100 text-gray-500'}`}>
      {category}
    </span>
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
      const nextPreview = await ChannelApi.previewTemplate(channelId, template.id, vars);
      setPreview(nextPreview);
    } catch (err: any) {
      setError(err?.message ?? 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (template.variables?.length === 0) {
      void handlePreview();
    }
  }, [template.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{template.name}</p>
            <p className="text-xs text-gray-400">
              {template.language} - {template.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {template.variables?.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Template Variables
              </p>
              {template.variables.map((variable) => (
                <div key={variable}>
                  <label className="mb-1 block text-xs text-gray-500">{`{{${variable}}}`}</label>
                  <input
                    value={vars[variable] ?? ''}
                    onChange={(event) =>
                      setVars((current) => ({
                        ...current,
                        [variable]: event.target.value,
                      }))
                    }
                    placeholder={`Value for {{${variable}}}`}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button
                onClick={handlePreview}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? <Loader size={13} className="animate-spin" /> : <Eye size={13} />}
                Preview
              </button>
            </div>
          ) : null}

          {preview ? (
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
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
                  <div className="px-3 pb-2 text-xs text-gray-400">{preview.footer}</div>
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
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
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
      </div>
    </div>
  );
};

export const WhatsAppTemplatesSection = ({ channel }: { channel: ConnectedChannel }) => {
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
  const [sortField, setSortField] = useState<WhatsAppTemplateSortField>('name');
  const [sortDirection, setSortDirection] = useState<DataTableSortDirection>('asc');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextTemplates = await ChannelApi.listWhatsAppTemplates(String(channel.id), {
        status: statusFilter || undefined,
        category: catFilter || undefined,
        search: search || undefined,
      });
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
        setSyncMsg(`Synced ${event?.synced ?? 0} templates${event?.errors ? ` (${event.errors} errors)` : ''}`);
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
        <span className="block truncate font-mono text-xs text-gray-800" title={template.name}>
          {template.name}
        </span>
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
      cell: (template) => <span className="text-xs text-gray-500">{template.language}</span>,
    },
    {
      id: 'variables',
      header: 'Variables',
      sortable: true,
      sortField: 'variables',
      mobile: 'detail',
      cell: (template) =>
        template.variables?.length > 0 ? (
          <span className="inline-flex max-w-[220px] truncate rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
            {template.variables.join(', ')}
          </span>
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
      setSyncMsg(`Synced ${result?.synced ?? 0} templates${result?.errors ? ` (${result.errors} errors)` : ''}`);
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
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
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {syncing ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {['APPROVED', 'PENDING', 'REJECTED', 'PAUSED'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={catFilter}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {['MARKETING', 'UTILITY', 'AUTHENTICATION'].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      <div className="min-h-[320px] min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
        {templates.length} template{templates.length !== 1 ? 's' : ''} - Templates are created and managed in Meta Business Manager
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
