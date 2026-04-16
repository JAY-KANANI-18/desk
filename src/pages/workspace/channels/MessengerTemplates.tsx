import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  Loader,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  ChannelApi,
  MessengerTemplate,
} from '../../../lib/channelApi';
import { ConnectedChannel } from '../../channels/ManageChannelPage';
import { useSocket } from '../../../socket/socket-provider';

const CategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, string> = {
    MARKETING: 'bg-orange-50 text-orange-700',
    UTILITY: 'bg-blue-50 text-blue-700',
    SERVICE: 'bg-violet-50 text-violet-700',
  };

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${map[category] ?? 'bg-gray-100 text-gray-500'}`}>
      {category}
    </span>
  );
};

const ApprovalBadge = () => (
  <span className="inline-flex rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
    APPROVED
  </span>
);

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
    const next: Record<string, string> = {};
    template.variables?.forEach((key) => {
      next[key] = '';
    });
    setVariables(next);
    setPreview(null);
  }, [template.id]);

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
    if (template.variables.length === 0) {
      void loadPreview();
    }
  }, [template.id]);

  const body =
    preview?.components?.find?.((component: any) => component.type === 'BODY')?.text ??
    template.components?.find?.((component: any) => component.type === 'BODY')?.text ??
    '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{template.name}</p>
            <p className="text-xs text-gray-400">
              {template.templateType} - Meta-provided Messenger template
            </p>
          </div>
          <button
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {template.variables.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Variables
              </p>
              {template.variables.map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-gray-500">{`{{${key}}}`}</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(event) =>
                      setVariables((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder={`Value for {{${key}}}`}
                    value={variables[key] ?? ''}
                  />
                </div>
              ))}
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={loading}
                onClick={loadPreview}
              >
                {loading ? <Loader className="animate-spin" size={13} /> : <Eye size={13} />}
                Preview
              </button>
            </div>
          ) : null}

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Messenger Preview
            </p>
            <div className="max-w-[300px] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
              <p className="whitespace-pre-wrap">{body || template.description}</p>
              {(preview?.preview?.quick_replies ?? preview?.preview?.attachment?.payload?.buttons ?? []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(preview?.preview?.quick_replies ?? preview?.preview?.attachment?.payload?.buttons ?? []).map((button: any, index: number) => (
                    <span
                      className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      key={`${button.title}-${index}`}
                    >
                      {button.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle size={13} />
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const MessengerTemplatesSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { socket } = useSocket();
  const [templates, setTemplates] = useState<MessengerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [preview, setPreview] = useState<MessengerTemplate | null>(null);

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
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Meta-provided Messenger templates that are approved and ready to use.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncMsg ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check size={12} />
              {syncMsg}
            </span>
          ) : null}
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={syncing}
            onClick={handleSync}
          >
            {syncing ? <Loader className="animate-spin" size={13} /> : <RefreshCw size={13} />}
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form className="relative min-w-[200px] flex-1" onSubmit={handleSearch}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates..."
            value={search}
          />
        </form>
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          <option value="">All categories</option>
          {['SERVICE', 'UTILITY', 'MARKETING'].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader className="animate-spin" size={18} />
            <span className="text-sm">Loading templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-gray-500">No templates found</p>
            <p className="mt-1 text-xs text-gray-400">Try syncing or adjusting filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((template) => (
                <tr className="transition-colors hover:bg-gray-50" key={template.id}>
                  <td className="max-w-[240px] px-4 py-3">
                    <p className="truncate font-mono text-xs text-gray-800" title={template.name}>
                      {template.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {template.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-gray-500">{template.templateType}</td>
                  <td className="px-4 py-3"><CategoryBadge category={template.category} /></td>
                  <td className="px-4 py-3"><ApprovalBadge /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                      onClick={() => setPreview(template)}
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {templates.length} template{templates.length !== 1 ? 's' : ''} - Messenger templates are platform formats provided by Meta.
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
