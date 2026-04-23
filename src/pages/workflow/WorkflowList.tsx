import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Play, Square, Pencil,
  Copy, Trash2, Download, Upload, ExternalLink, Zap, X,
} from 'lucide-react';
import { Workflow, WorkflowStatus } from './workflow.types';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { ListPagination } from '../../components/ui/ListPagination';
import { DataTable, type DataTableColumn, type DataTableSortDirection } from '../../components/ui/DataTable';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';
import { useIsMobile } from '../../hooks/useIsMobile';

type FilterStatus = 'all' | WorkflowStatus;
type WorkflowSortField = 'name' | 'status' | 'lastPublishedAt';

export function WorkflowList() {
  const isMobile = useIsMobile();
  const [workflows, setWorkflows]     = useState<Workflow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterStatus>('all');
  const [search, setSearch]           = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage]               = useState(1);
  const [pagination, setPagination]   = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId]       = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sortField, setSortField] = useState<WorkflowSortField>('name');
  const [sortDirection, setSortDirection] = useState<DataTableSortDirection>('asc');
  const navigate = useNavigate();

  const load = async (nextPage = page, nextSearch = search, nextFilter = filter) => {
    const append = isMobile && nextPage > 1;
    if (append) {
      setMobileLoadingMore(true);
    } else {
      setLoading(true);
    }
    const response = await workspaceApi.listWorkflows({
      page: nextPage,
      limit: pagination.limit,
      search: nextSearch || undefined,
      status: nextFilter === 'all' ? undefined : nextFilter,
    });
    const items = Array.isArray(response?.items) ? response.items : [];
    setWorkflows((current) => {
      if (!append) return items;
      const seen = new Set(current.map((workflow) => workflow.id));
      return [...current, ...items.filter((workflow) => !seen.has(workflow.id))];
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
    if (append) {
      setMobileLoadingMore(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => { load(page, search, filter); }, [page, search, filter]);

  const counts: Record<string, number> = {
    all:       filter === 'all' ? pagination.total : workflows.length,
    published: filter === 'published' ? pagination.total : workflows.filter((w) => w.status === 'published').length,
    draft:     filter === 'draft' ? pagination.total : workflows.filter((w) => w.status === 'draft').length,
    stopped:   filter === 'stopped' ? pagination.total : workflows.filter((w) => w.status === 'stopped').length,
  };

  const doAction = async (id: string, action: () => Promise<unknown>) => {
    setActionLoading(id);
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
  const handleCreateNew = useCallback(() => {
    navigate('/workflows/templates');
  }, [navigate]);

  useMobileHeaderActions(
    isMobile
      ? {
          actions: [
            {
              id: 'workflows-search',
              label: mobileSearchOpen ? 'Close search' : 'Search workflows',
              icon: mobileSearchOpen ? <X size={17} /> : <Search size={17} />,
              active: mobileSearchOpen,
              hasIndicator: !mobileSearchOpen && Boolean(searchDraft),
              onClick: () => setMobileSearchOpen((value) => !value),
            },
            {
              id: 'workflows-new',
              label: 'New workflow',
              icon: <Plus size={18} />,
              onClick: handleCreateNew,
            },
          ],
          panel: mobileSearchOpen ? (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search workflows..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : null,
        }
      : {},
    [handleCreateNew, isMobile, mobileSearchOpen, searchDraft],
  );

  const handleOpenBuilder = (id: string) => {
    navigate(`/workflows/${id}`);
  }

  const handleSort = useCallback((field: WorkflowSortField) => {
    setPage(1);
    setSortField((current) => {
      if (current === field) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  const loadNextMobilePage = useCallback(() => {
    if (mobileLoadingMore || loading || !pagination.hasNextPage) return;
    setPage((current) => Math.min(pagination.totalPages, current + 1));
  }, [loading, mobileLoadingMore, pagination.hasNextPage, pagination.totalPages]);

  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => {
      const aValue =
        sortField === 'lastPublishedAt'
          ? a.lastPublishedAt ?? ''
          : String(a[sortField] ?? '');
      const bValue =
        sortField === 'lastPublishedAt'
          ? b.lastPublishedAt ?? ''
          : String(b[sortField] ?? '');
      const result = String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? result : -result;
    });
  }, [sortDirection, sortField, workflows]);

  const workflowColumns: Array<DataTableColumn<Workflow, WorkflowSortField>> = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortField: 'name',
      mobile: 'primary',
      cell: (wf) => (
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Zap size={12} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            {renameId === wf.id ? (
              <input
                autoFocus
                value={renameDraft}
                onClick={(event) => event.stopPropagation()}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => handleRenameSubmit(wf.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(wf.id);
                  if (e.key === 'Escape') setRenameId(null);
                }}
                className="w-full border-b border-gray-400 bg-transparent text-sm font-medium outline-none"
              />
            ) : (
              <span className="block truncate text-sm font-medium text-gray-800">
                {wf.name}
              </span>
            )}
            {wf.description && (
              <p className="mt-0.5 truncate text-xs text-gray-400">{wf.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      sortField: 'status',
      cell: (wf) => <StatusDot status={wf.status} />,
      mobile: 'detail',
    },
    {
      id: 'lastPublishedAt',
      header: 'Last published',
      sortable: true,
      sortField: 'lastPublishedAt',
      cell: (wf) => (
        <div>
          <p className="text-sm text-gray-500">{wf.lastPublishedAt ? fmt(wf.lastPublishedAt) : '-'}</p>
          {wf.lastPublishedBy && wf.lastPublishedAt && (
            <p className="mt-0.5 text-xs text-gray-300">by {wf.lastPublishedBy}</p>
          )}
        </div>
      ),
      mobile: 'detail',
    },
  ];

  const workflowActions = (wf: Workflow) => {
    const disabled = actionLoading === wf.id;
    const deleteRequested = deleteConfirmId === wf.id;

    return [
      {
        id: 'open',
        label: 'Open in Builder',
        icon: <ExternalLink size={13} />,
        disabled,
        onClick: () => navigate(`/workflows/${wf.id}`),
      },
      wf.status !== 'published'
        ? {
            id: 'publish',
            label: 'Publish',
            icon: <Play size={13} />,
            disabled,
            onClick: () => doAction(wf.id, () => workspaceApi.publishWorkflow(wf.id)),
          }
        : {
            id: 'stop',
            label: 'Stop',
            icon: <Square size={13} />,
            tone: 'danger' as const,
            disabled,
            onClick: () => doAction(wf.id, () => workspaceApi.stopWorkflow(wf.id)),
          },
      {
        id: 'rename',
        label: 'Rename',
        icon: <Pencil size={13} />,
        disabled,
        onClick: () => {
          setRenameId(wf.id);
          setRenameDraft(wf.name);
        },
      },
      {
        id: 'clone',
        label: 'Clone',
        icon: <Copy size={13} />,
        disabled,
        onClick: () => doAction(wf.id, () => workspaceApi.cloneWorkflow(wf.id)),
      },
      {
        id: 'export',
        label: 'Export',
        icon: <Download size={13} />,
        disabled,
        onClick: () => undefined,
      },
      deleteRequested
        ? {
            id: 'confirm-delete',
            label: 'Confirm delete',
            icon: <Trash2 size={13} />,
            tone: 'danger' as const,
            disabled,
            onClick: () => doAction(wf.id, () => workspaceApi.deleteWorkflow(wf.id)),
          }
        : {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 size={13} />,
            tone: 'danger' as const,
            disabled,
            onClick: () => {
              if (wf.status === 'published') {
                alert('Stop the workflow first.');
                return;
              }
              setDeleteConfirmId(wf.id);
            },
          },
      ...(deleteRequested
        ? [
            {
              id: 'cancel-delete',
              label: 'Cancel delete',
              icon: <X size={13} />,
              disabled,
              onClick: () => setDeleteConfirmId(null),
            },
          ]
        : []),
    ];
  };

  return (
    <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 md:border-b md:border-gray-100 md:px-6 md:py-4">
        <div className="mb-4 hidden items-center justify-end md:flex md:justify-between">
          <h1 className="hidden text-base font-semibold text-gray-900 md:block">Workflows</h1>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-slate-100 p-1.5 transition-colors hover:bg-slate-200 md:border md:border-gray-200 md:bg-white md:hover:bg-gray-50" title="Import">
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {(['all', 'published', 'draft', 'stopped'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`rounded-2xl px-3 py-2 text-sm capitalize transition-colors md:rounded-md md:px-2.5 md:py-1.5 ${
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

          <div className="relative hidden md:ml-auto md:block">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full rounded-md bg-slate-100 py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 md:w-48 md:border md:border-gray-200 md:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          className="h-full"
          rows={sortedWorkflows}
          columns={workflowColumns}
          getRowId={(workflow) => workflow.id}
          loading={loading}
          loadingLabel="Loading workflows..."
          emptyTitle={search || filter !== 'all' ? 'No workflows found' : 'No workflows yet'}
          emptyDescription={
            search || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Create your first workflow to automate conversations and contact management.'
          }
          sort={{
            field: sortField,
            direction: sortDirection,
            onChange: handleSort,
          }}
          rowActions={workflowActions}
          onRowClick={(workflow) => handleOpenBuilder(workflow.id)}
          minTableWidth={720}
          mobileLoadMore={{
            hasMore: pagination.hasNextPage,
            loading: mobileLoadingMore,
            onLoadMore: loadNextMobilePage,
            loadingLabel: 'Loading more workflows...',
          }}
          footer={
            <ListPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              itemLabel="workflows"
              onPageChange={setPage}
            />
          }
        />
      </div>
    </div>
  );
}
