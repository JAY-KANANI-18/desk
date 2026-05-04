import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Play, Square, Pencil,
  Copy, Trash2, Download, Upload, ExternalLink, Zap, ChevronRight,
} from '@/components/ui/icons';
import { Workflow, WorkflowStatus } from './workflow.types';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { ListPagination } from '../../components/ui/ListPagination';
import { DataTable, type DataTableColumn, type DataTableSortDirection } from '../../components/ui/DataTable';
import { PageLayout } from '../../components/ui/PageLayout';
import { Button } from '../../components/ui/Button';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { IconButton } from '../../components/ui/button/IconButton';
import { BaseInput } from '../../components/ui/inputs/BaseInput';
import { Tooltip } from '../../components/ui/Tooltip';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ConfirmDeleteModal } from '../../components/ui/modal';

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
  const [deleteWorkflow, setDeleteWorkflow] = useState<Workflow | null>(null);
  const [renameId, setRenameId]       = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
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

  const doAction = async (id: string, action: () => Promise<unknown>): Promise<boolean> => {
    setActionLoading(id);
    try {
      await action();
      await load();
      return true;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Something went wrong');
      return false;
    } finally {
      setActionLoading(null);
    }
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
          panel: (
            <BaseInput
              type="search"
              placeholder="Search workflows..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              appearance="toolbar"
              leftIcon={<Search size={15} />}
              aria-label="Search workflows"
            />
          ),
        }
      : {},
    [isMobile, searchDraft],
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

  const closeDeleteWorkflow = () => {
    if (deleteWorkflow && actionLoading === deleteWorkflow.id) return;
    setDeleteWorkflow(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteWorkflow) return;

    const deleted = await doAction(
      deleteWorkflow.id,
      () => workspaceApi.deleteWorkflow(deleteWorkflow.id),
    );

    if (deleted) {
      setDeleteWorkflow(null);
    }
  };

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
              <BaseInput
                autoFocus
                type="text"
                value={renameDraft}
                onClick={(event) => event.stopPropagation()}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => handleRenameSubmit(wf.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(wf.id);
                  if (e.key === 'Escape') setRenameId(null);
                }}
                appearance="inline-edit"
                size="sm"
                aria-label={`Rename ${wf.name}`}
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
            onClick: () => {
              void doAction(wf.id, () => workspaceApi.publishWorkflow(wf.id));
            },
          }
        : {
            id: 'stop',
            label: 'Stop',
            icon: <Square size={13} />,
            tone: 'danger' as const,
            disabled,
            onClick: () => {
              void doAction(wf.id, () => workspaceApi.stopWorkflow(wf.id));
            },
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
        onClick: () => {
          void doAction(wf.id, () => workspaceApi.cloneWorkflow(wf.id));
        },
      },
      {
        id: 'export',
        label: 'Export',
        icon: <Download size={13} />,
        disabled,
        onClick: () => undefined,
      },
      {
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
          setDeleteWorkflow(wf);
        },
      },
    ];
  };

  const desktopActions = isMobile ? undefined : (
    <div className="flex items-center gap-2">
      <Tooltip content="Import workflows">
        <span className="inline-flex">
          <IconButton
            aria-label="Import workflows"
            icon={<Upload size={14} />}
            variant="secondary"
          />
        </span>
      </Tooltip>
      <Button
        onClick={handleCreateNew}
        leftIcon={<Plus size={14} />}
      >
        New Workflow
      </Button>
    </div>
  );

  const desktopToolbar = isMobile ? undefined : (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {(['all', 'published', 'draft', 'stopped'] as FilterStatus[]).map((f) => (
          <Button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}

                              variant="tab"
                selected={filter === f}

                      radius="none"
          
            rightIcon={<span className="text-xs tabular-nums opacity-75">{counts[f]}</span>}
          >
            <span className="capitalize">{f}</span>
          </Button>
        ))}
      </div>

      <div className="hidden md:ml-auto md:block md:w-48">
        <BaseInput
          type="search"
          placeholder="Search..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          appearance="toolbar"
   
          leftIcon={<Search size={13} />}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Workflows"
      actions={desktopActions}
      toolbar={desktopToolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white">
        {isMobile ? (
          <div className="flex-shrink-0 px-4 py-3">
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {(['all', 'published', 'draft', 'stopped'] as FilterStatus[]).map((f) => (
                 <Button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}

                              variant="tab"
                selected={filter === f}

                      radius="none"
          
            rightIcon={<span className="text-xs tabular-nums opacity-75">{counts[f]}</span>}
          >
            <span className="capitalize">{f}</span>
          </Button>
              ))}
            </div>
          </div>
        ) : null}

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
            renderMobileCard={(workflow, helpers) => {
              const lastPublishedLabel = workflow.lastPublishedAt
                ? fmt(workflow.lastPublishedAt)
                : 'Never published';

              return (
                <article
                  key={workflow.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenBuilder(workflow.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleOpenBuilder(workflow.id);
                    }
                  }}
                  className="relative min-w-0 max-w-full flex-shrink-0 cursor-pointer overflow-visible rounded-2xl bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-colors hover:bg-slate-50"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-300"
                  >
                    <ChevronRight size={15} />
                  </span>

                  <div className="min-w-0 pr-6">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary-light)]">
                          <Zap size={17} className="text-[var(--color-primary)]" />
                        </span>

                        <div className="min-w-0">
                          {renameId === workflow.id ? (
                            <BaseInput
                              autoFocus
                              type="text"
                              value={renameDraft}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onBlur={() => handleRenameSubmit(workflow.id)}
                              onKeyDown={(event) => {
                                event.stopPropagation();
                                if (event.key === 'Enter') handleRenameSubmit(workflow.id);
                                if (event.key === 'Escape') setRenameId(null);
                              }}
                              appearance="inline-edit"
                              size="sm"
                              aria-label={`Rename ${workflow.name}`}
                            />
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {workflow.name}
                            </p>
                          )}
                          <div className="mt-1">
                            <StatusDot status={workflow.status} />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                        {helpers.actions}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Last published
                      </span>
                      <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-800">
                        {lastPublishedLabel}
                      </span>
                    </div>
                  </div>
                </article>
              );
            }}
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

        <FloatingActionButton
          label="New workflow"
          icon={<Plus size={24} />}
          onClick={handleCreateNew}
        />
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteWorkflow)}
        entityName={deleteWorkflow?.name ?? 'this workflow'}
        entityType="workflow"
        title="Delete workflow"
        body="This workflow will be permanently removed. Published workflows must be stopped before deletion."
        confirmLabel="Delete workflow"
        isDeleting={Boolean(deleteWorkflow && actionLoading === deleteWorkflow.id)}
        onCancel={closeDeleteWorkflow}
        onConfirm={handleConfirmDelete}
      />
    </PageLayout>
  );
}
