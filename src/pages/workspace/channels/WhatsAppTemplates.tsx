// src/pages/workspace/channels/WhatsAppTemplates.tsx
import { useState, useEffect } from 'react';
import { RefreshCw, Search, Eye, Loader, AlertCircle, ChevronDown, X, Check } from 'lucide-react';
import { ChannelApi, WaTemplate } from '../../../lib/channelApi';
import { ConnectedChannel } from '../../channels/ManageChannelPage';
import { useWorkspace } from '../../../context/WorkspaceContext';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    PENDING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
    PAUSED:   'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, string> = {
    MARKETING:       'bg-purple-50 text-purple-700',
    UTILITY:         'bg-blue-50 text-blue-700',
    AUTHENTICATION:  'bg-orange-50 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[category] ?? 'bg-gray-100 text-gray-500'}`}>
      {category}
    </span>
  );
};

// ─── Template preview modal ───────────────────────────────────────────────────
const PreviewModal = ({ template, channelId, onClose }: {
  template: WaTemplate; channelId: string; onClose: () => void;
}) => {
  const [vars, setVars] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load variable names
  useEffect(() => {
    if (template.variables?.length) {
      const initial: Record<string, string> = {};
      template.variables.forEach(v => { initial[v] = ''; });
      setVars(initial);
    }
  }, [template]);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    const r = await ChannelApi.previewTemplate(channelId, template.id, vars);
    setLoading(false);
    if (r.success) setPreview(r.data);
    else setError(r.error ?? 'Preview failed');
  };

  // Auto-preview when no variables
  useEffect(() => {
    if (template.variables?.length === 0) handlePreview();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">{template.name}</p>
            <p className="text-xs text-gray-400">{template.language} · {template.category}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Variables */}
          {template.variables?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Template Variables</p>
              {template.variables.map(v => (
                <div key={v}>
                  <label className="text-xs text-gray-500 mb-1 block">{`{{${v}}}`}</label>
                  <input
                    value={vars[v] ?? ''}
                    onChange={e => setVars(p => ({ ...p, [v]: e.target.value }))}
                    placeholder={`Value for {{${v}}}`}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <button onClick={handlePreview} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {loading ? <Loader size={13} className="animate-spin" /> : <Eye size={13} />}
                Preview
              </button>
            </div>
          )}

          {/* Preview bubble */}
          {preview && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Preview</p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-[280px]">
                {preview.header && (
                  <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
                    {preview.header}
                  </div>
                )}
                <div className="px-3 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {preview.body}
                </div>
                {preview.footer && (
                  <div className="px-3 pb-2 text-xs text-gray-400">{preview.footer}</div>
                )}
                {preview.buttons?.map((btn: any, i: number) => (
                  <div key={i} className="border-t border-gray-100 px-3 py-2 text-xs text-center text-indigo-600 font-medium">{btn.text}</div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} />{error}
            </div>
          )}

          {/* Raw components for devs */}
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              View raw components
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto text-gray-600">
              {JSON.stringify(template.components, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────
export const WhatsAppTemplatesSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { workspace } = useWorkspace();
  const [templates, setTemplates]   = useState<WaTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [catFilter,    setCategory] = useState('');
  const [preview, setPreview]       = useState<WaTemplate | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const r = await ChannelApi.listWhatsAppTemplates(String(channel.id), workspace?.id ?? '', {
      status:   statusFilter || undefined,
      category: catFilter    || undefined,
      search:   search       || undefined,
    });
    setLoading(false);
    setTemplates(r ?? []);
  };

  useEffect(() => { load(); }, [statusFilter, catFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    const r = await ChannelApi.syncWhatsAppTemplates(String(channel.id));
    setSyncing(false);
    setSyncMsg(`Synced ${r.data?.synced ?? 0} templates${r.data?.errors ? ` (${r.data.errors} errors)` : ''}`);
    load();
    setTimeout(() => setSyncMsg(null), 4000);
  
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Approved WhatsApp message templates for your WABA account.</p>
        </div>
        <div className="flex items-center gap-2">
          {syncMsg && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check size={12}/>{syncMsg}</span>}
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {syncing ? <Loader size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </form>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All statuses</option>
          {['APPROVED','PENDING','REJECTED','PAUSED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All categories</option>
          {['MARKETING','UTILITY','AUTHENTICATION'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={14}/>{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader size={18} className="animate-spin"/><span className="text-sm">Loading templates…</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 font-medium">No templates found</p>
            <p className="text-xs text-gray-400 mt-1">Try syncing or adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variables</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 max-w-[200px] truncate" title={t.name}>{t.name}</td>
                  <td className="px-4 py-3"><CategoryBadge category={t.category}/></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.language}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {t.variables?.length > 0 ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{t.variables.join(', ')}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status}/></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setPreview(t)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors ml-auto">
                      <Eye size={12}/>Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">{templates.length} template{templates.length !== 1 ? 's' : ''} • Templates are created and managed in Meta Business Manager</p>

      {/* Preview modal */}
      {preview && (
        <PreviewModal template={preview} channelId={String(channel.id)} onClose={() => setPreview(null)} />
      )}
    </div>
  );
};