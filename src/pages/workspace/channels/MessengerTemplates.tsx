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
import { ChannelApi, type MessengerTemplate } from '../../../lib/channelApi';
import { useSocket } from '../../../socket/socket-provider';
import { ConnectedChannel } from '../../channels/ManageChannelPage';

type MessengerTemplateSortField = 'name' | 'templateType' | 'category' | 'status';

const categoryOptions: SelectOption[] = [
  { value: '', label: 'All categories' },
  { value: 'SERVICE', label: 'SERVICE' },
  { value: 'UTILITY', label: 'UTILITY' },
  { value: 'MARKETING', label: 'MARKETING' },
];

const CategoryBadge = ({ category }: { category: string }) => {
  const colorMap: Record<string, string> = {
    MARKETING: 'tag-orange',
    UTILITY: 'tag-blue',
    SERVICE: 'tag-purple',
  };

  return (
    <Tag
      label={category}
      size="sm"
      bgColor={colorMap[category] ?? 'gray'}
    />
  );
};

const ApprovalBadge = () => <Tag label="APPROVED" size="sm" bgColor="success" />;

const TemplatePreview = ({
  template,
  channelId,
  onClose,
}: {
  template: MessengerTemplate;
  channelId: string;
  onClose: () => void;
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextVariables: Record<string, string> = {};
    template.variables?.forEach((key) => {
      nextVariables[key] = '';
    });
    setVariables(nextVariables);
    setPreview(null);
  }, [template.id, template.variables]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ChannelApi.previewMessengerTemplate(
        channelId,
        template.id,
        variables,
      );
      setPreview(result);
    } catch (err: any) {
      setError(err?.message ?? 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((template.variables?.length ?? 0) === 0) {
      void loadPreview();
    }
  }, [template.id]);

  const body =
    preview?.components?.find?.((component: any) => component.type === 'BODY')
      ?.text ??
    template.components?.find?.((component: any) => component.type === 'BODY')
      ?.text ??
    '';
  const buttons =
    preview?.preview?.quick_replies ??
    preview?.preview?.attachment?.payload?.buttons ??
    [];

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      title={template.name}
      subtitle={`${template.templateType} - Meta-provided Messenger template`}
      size="lg"
    >
      <div className="space-y-4">
        {(template.variables?.length ?? 0) > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Variables
            </p>
            {template.variables.map((key) => (
              <BaseInput
                key={key}
                label={`{{${key}}}`}
                value={variables[key] ?? ''}
                onChange={(event) =>
                  setVariables((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                placeholder={`Value for {{${key}}}`}
              />
            ))}
            <Button
              leftIcon={!loading ? <Eye size={13} /> : undefined}
              onClick={() => void loadPreview()}
              loading={loading}
              loadingMode="inline"
              loadingLabel="Previewing..."
            >
              Preview
            </Button>
          </div>
        ) : null}

        <div className="border-y border-gray-100 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Messenger Preview
          </p>
          <div className="max-w-[300px] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
            <p className="whitespace-pre-wrap">{body || template.description}</p>
            {buttons.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {buttons.map((button: any, index: number) => (
                  <Tag
                    key={`${button.title}-${index}`}
                    label={button.title}
                    size="sm"
                    bgColor="info"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 border-l border-red-300 pl-3 text-xs text-red-600">
            <AlertCircle size={13} />
            {error}
          </div>
        ) : null}
      </div>
    </CenterModal>
  );
};

export const MessengerTemplatesSection = ({
  channel,
}: {
  channel: ConnectedChannel;
}) => {
  const { socket } = useSocket();
  const [templates, setTemplates] = useState<MessengerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState<MessengerTemplate | null>(null);
  const [sortField, setSortField] =
    useState<MessengerTemplateSortField>('name');
  const [sortDirection, setSortDirection] =
    useState<DataTableSortDirection>('asc');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ChannelApi.listMessengerTemplates(String(channel.id), {
        category: category || undefined,
        search: search || undefined,
      });
      setTemplates(result ?? []);
    } catch (err: any) {
      setTemplates([]);
      setError(err?.message ?? 'Failed to load Messenger templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [channel.id, category]);

  useEffect(() => {
    if (!socket) return;

    const onSync = (event: any) => {
      if (
        String(event?.channelId) === String(channel.id) &&
        event?.feature === 'messenger_templates'
      ) {
        setSyncMsg(`Synced ${event?.synced ?? 0} templates`);
        void load();
      }
    };

    socket.on('channel:sync', onSync);
    return () => {
      socket.off('channel:sync', onSync);
    };
  }, [channel.id, socket, category, search]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await ChannelApi.syncMessengerTemplates(String(channel.id));
      setSyncMsg(`Synced ${result?.synced ?? 0} templates`);
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
      window.setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void load();
  };

  const handleSort = (field: MessengerTemplateSortField) => {
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
    return [...templates].sort((a, b) => {
      const result = String(a[sortField] ?? '').localeCompare(
        String(b[sortField] ?? ''),
        undefined,
        {
          numeric: true,
          sensitivity: 'base',
        },
      );
      return sortDirection === 'asc' ? result : -result;
    });
  }, [sortDirection, sortField, templates]);

  const columns: Array<
    DataTableColumn<MessengerTemplate, MessengerTemplateSortField>
  > = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortField: 'name',
      mobile: 'primary',
      className: 'max-w-[260px]',
      cell: (template) => (
        <div className="min-w-0">
          <TruncatedText
            as="p"
            text={template.name}
            maxLines={1}
            className="font-mono text-xs text-gray-800"
          />
          {template.description ? (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {template.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'templateType',
      header: 'Type',
      sortable: true,
      sortField: 'templateType',
      mobile: 'detail',
      cell: (template) => (
        <span className="text-xs capitalize text-gray-500">
          {template.templateType}
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
      id: 'status',
      header: 'Status',
      sortable: true,
      sortField: 'status',
      mobile: 'detail',
      cell: () => <ApprovalBadge />,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Message Templates</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Meta-provided Messenger templates that are approved and ready to use.
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
            variant="secondary"
            size="sm"
            leftIcon={!syncing ? <RefreshCw size={13} /> : undefined}
            onClick={() => void handleSync()}
            loading={syncing}
            loadingMode="inline"
            loadingLabel="Syncing..."
          >
            Sync
          </Button>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-start gap-2">
        <form className="min-w-[200px] flex-1" onSubmit={handleSearch}>
          <BaseInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            leftIcon={<Search size={14} />}
          />
        </form>
        <div className="min-w-[180px]">
          <BaseSelect
            value={category}
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
          emptyDescription="Try syncing or adjusting filters."
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
          minTableWidth={760}
        />
      </div>

      <p className="flex-shrink-0 text-xs text-gray-400">
        {templates.length} template{templates.length !== 1 ? 's' : ''} -
        Messenger templates are platform formats provided by Meta.
      </p>

      {preview ? (
        <TemplatePreview
          channelId={String(channel.id)}
          onClose={() => setPreview(null)}
          template={preview}
        />
      ) : null}
    </div>
  );
};
