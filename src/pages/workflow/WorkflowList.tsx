import React, { useState, useEffect } from 'react';
import {
  Plus, Search, MoreHorizontal, Play, Square, Pencil,
  Copy, Trash2, Download, Upload, ExternalLink, Loader2, Zap,
} from 'lucide-react';
import { Workflow, WorkflowStatus } from './workflow.types';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | WorkflowStatus;

interface WorkflowListProps {
  onOpenBuilder: (workflowId: string) => void;
  onCreateNew: () => void;
}

export function WorkflowList() {
  const [workflows, setWorkflows]     = useState<Workflow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterStatus>('all');
  const [search, setSearch]           = useState('');
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId]       = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setWorkflows(await workspaceApi.getWorkflows());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = workflows.filter((wf) => {
    const matchStatus = filter === 'all' || wf.status === filter;
    const matchSearch = !search
    || wf.name.toLowerCase().includes(search.toLowerCase())
      || (wf.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = {
    all:       workflows.length,
    published: workflows.filter((w) => w.status === 'published').length,
    draft:     workflows.filter((w) => w.status === 'draft').length,
    stopped:   workflows.filter((w) => w.status === 'stopped').length,
  };

  const doAction = async (id: string, action: () => Promise<unknown>) => {
    setActionLoading(id);
    setOpenMenuId(null);
    try { await action(); await load(); }
    catch (e: any) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRenameSubmit = async (id: string) => {
    if (renameDraft.trim()) await doAction(id, () => workspaceApi.renameWorkflow(id, renameDraft.trim()));
    setRenameId(null);
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const StatusDot = ({ status }: { status: WorkflowStatus }) => {
    const color = { draft: 'bg-gray-300', published: 'bg-green-500', stopped: 'bg-red-400' }[status];
    const label = { draft: 'Draft', published: 'Published', stopped: 'Stopped' }[status];
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
        {label}
      </span>
    );
  };
  const handleCreateNew = () => {
    navigate('/workflows/templates');
  }
  const handleOpenBuilder = (id: string) => {
    navigate(`/workflows/${id}`);
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold text-gray-900">Workflows</h1>
          <div className="flex items-center gap-2">
            <button className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors" title="Import">
              <Upload size={14} className="text-gray-400" />
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <Plus size={14} />
              New Workflow
            </button>
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0.5">
            {(['all', 'published', 'draft', 'stopped'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  filter === f ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
                <span className={`ml-1.5 text-xs tabular-nums ${filter === f ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 w-48 placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search || filter !== 'all'} onCreateNew={handleCreateNew} />
        ) : (
          <>
            {/* Table head */}
            <div className="grid grid-cols-[1fr_120px_160px_52px] px-6 py-2 border-b border-gray-100">
              {['Name', 'Status', 'Last published', ''].map((h) => (
                <span key={h} className="text-xs text-gray-400 font-medium">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((wf) => (
              <div
                key={wf.id}
                className="grid grid-cols-[1fr_120px_160px_52px] items-center px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group"
              >
                {/* Name */}
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Zap size={11} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    {renameId === wf.id ? (
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={() => handleRenameSubmit(wf.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(wf.id);
                          if (e.key === 'Escape') setRenameId(null);
                        }}
                        className="text-sm font-medium border-b border-gray-400 outline-none bg-transparent w-full"
                      />
                    ) : (
                      <button
                        onClick={() => handleOpenBuilder(wf.id)}
                        className="text-sm font-medium text-gray-800 hover:text-gray-900 truncate block max-w-full text-left"
                      >
                        {wf.name}
                      </button>
                    )}
                    {wf.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{wf.description}</p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <StatusDot status={wf.status} />

                {/* Last published */}
                <div>
                  <p className="text-sm text-gray-500">{fmt(wf.lastPublishedAt)}</p>
                  {wf.lastPublishedBy && wf.lastPublishedAt && (
                    <p className="text-xs text-gray-300 mt-0.5">by {wf.lastPublishedBy}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="relative flex items-center justify-end">
                  {actionLoading === wf.id ? (
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === wf.id ? null : wf.id); }}
                      className="p-1.5 rounded-md hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} className="text-gray-500" />
                    </button>
                  )}

                  {openMenuId === wf.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-7 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                        <MenuItem icon={ExternalLink} label="Open in Builder" onClick={() => { setOpenMenuId(null); navigate(`/workflows/${wf.id}`); }} />
                        {wf.status !== 'published' && (
                          <MenuItem icon={Play} label="Publish" onClick={() => doAction(wf.id, () => workspaceApi.publishWorkflow(wf.id))} />
                        )}
                        {wf.status === 'published' && (
                          <MenuItem icon={Square} label="Stop" onClick={() => doAction(wf.id, () => workspaceApi.stopWorkflow(wf.id))} danger />
                        )}
                        <MenuItem icon={Pencil} label="Rename" onClick={() => { setRenameId(wf.id); setRenameDraft(wf.name); setOpenMenuId(null); }} />
                        <MenuItem icon={Copy} label="Clone" onClick={() => doAction(wf.id, () => workspaceApi.cloneWorkflow(wf.id))} />
                        <MenuItem icon={Download} label="Export" onClick={() => setOpenMenuId(null)} />
                        <div className="border-t border-gray-100 my-1" />
                        {deleteConfirmId === wf.id ? (
                          <div className="px-3 py-2">
                            <p className="text-xs text-gray-600 mb-2">Delete permanently?</p>
                            <div className="flex gap-1">
                              <button onClick={() => doAction(wf.id, () => workspaceApi.deleteWorkflow(wf.id))}
                                className="flex-1 py-1.5 bg-gray-900 text-white text-xs rounded-md font-medium hover:bg-gray-700">
                                Delete
                              </button>
                              <button onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium hover:bg-gray-200">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <MenuItem icon={Trash2} label="Delete" danger onClick={() => {
                            if (wf.status === 'published') { alert('Stop the workflow first.'); setOpenMenuId(null); return; }
                            setDeleteConfirmId(wf.id);
                          }} />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger = false }: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function EmptyState({ hasSearch, onCreateNew }: { hasSearch: boolean; onCreateNew: () => void }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Search size={28} className="text-gray-200 mb-3" />
        <p className="text-sm text-gray-500">No workflows found</p>
        <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Zap size={18} className="text-gray-400" />
      </div>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">No workflows yet</h2>
      <p className="text-xs text-gray-400 mb-5 max-w-xs">
        Create your first workflow to automate conversations and contact management.
      </p>
      <button
        onClick={onCreateNew}
        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
      >
        <Plus size={14} /> New Workflow
      </button>
    </div>
  );
}