import { useCallback, useMemo, useState, useEffect, useRef, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import {
  Blocks, Plus, Play, Square, Pencil,
  Copy, Trash2, Download, Upload, ExternalLink, Zap, ChevronDown, ChevronRight, Calendar, User,
  X,
} from '@/components/ui/icons';
import type { Workflow, WorkflowStatus } from './workflow.types';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { ListPagination } from '../../components/ui/ListPagination';
import { DataTable, type DataTableColumn, type DataTableSortDirection } from '../../components/ui/DataTable';
import { PageLayout } from '../../components/ui/PageLayout';
import { Button } from '../../components/ui/Button';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { IconButton } from '../../components/ui/button/IconButton';
import { BaseInput } from '../../components/ui/inputs/BaseInput';
import { SearchInput } from '../../components/ui/inputs';
import { Tooltip } from '../../components/ui/Tooltip';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ConfirmDeleteModal, ResponsiveModal } from '../../components/ui/modal';
import { useWorkspace } from '../../context/WorkspaceContext';

type FilterStatus = 'all' | WorkflowStatus;
type WorkflowSortField = 'name' | 'status' | 'createdAt' | 'publishedAt';
type WorkflowUserLookup = Map<string, string>;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const statusCopy: Record<WorkflowStatus, { label: string; dot: string; text: string }> = {
  draft: { label: 'Draft', dot: 'bg-slate-300', text: 'text-slate-600' },
  published: { label: 'Published', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  stopped: { label: 'Stopped', dot: 'bg-rose-400', text: 'text-rose-700' },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
};

const MAX_WORKFLOW_IMPORT_BYTES = 2 * 1024 * 1024;

function sanitizeDownloadFileName(value: string) {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  return sanitized || 'workflow';
}

function downloadJsonFile(fileName: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const getWorkflowAuthor = (
  workflow: Workflow,
  kind: 'created' | 'published',
  usersById: WorkflowUserLookup,
) => {
  const userId =
    kind === 'created'
      ? workflow.createBy ?? workflow.createdById
      : workflow.publishedBy ?? workflow.publishedById;
  const mappedName = userId ? usersById.get(String(userId)) : undefined;
  const fallback =
    kind === 'created'
      ? workflow.createdByName ?? workflow.createdBy
      : workflow.publishedByName ?? workflow.lastPublishedBy;

  const fallbackName = fallback?.trim();
  return mappedName ?? (fallbackName || 'Unknown user');
};

const getWorkflowPublishedMeta = (
  workflow: Workflow,
  usersById: WorkflowUserLookup,
) => {
  const trackedPublishedAt = workflow.publishedAt ?? workflow.lastPublishedAt;

  if (trackedPublishedAt) {
    return {
      label: formatDate(trackedPublishedAt) ?? 'Unknown date',
      by: getWorkflowAuthor(workflow, 'published', usersById),
      muted: false,
    };
  }

  if (workflow.status === 'published') {
    return {
      label: formatDate(workflow.createdAt) ?? 'Published',
      by: getWorkflowAuthor(workflow, 'created', usersById),
      muted: false,
    };
  }

  return {
    label: 'Not published',
    by: undefined,
    muted: true,
  };
};

function StatusDot({ status }: { status: WorkflowStatus }) {
  const meta = statusCopy[status] ?? statusCopy.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function WorkflowMetaCell({
  icon,
  label,
  by,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  by?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${muted ? 'text-slate-300' : 'text-slate-400'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`truncate text-sm ${muted ? 'text-slate-400' : 'text-slate-700'}`}>{label}</p>
        {by ? <p className="mt-0.5 truncate text-xs text-slate-400">by {by}</p> : null}
      </div>
    </div>
  );
}

export function WorkflowList() {
  const isMobile = useIsMobile();
  const { workspaceUsers } = useWorkspace();
  const importInputRef = useRef<HTMLInputElement>(null);
  const importDragDepthRef = useRef(0);
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
  const [importing, setImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importDragActive, setImportDragActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const [mobileCreateMenuOpen, setMobileCreateMenuOpen] = useState(false);
  const [desktopCreateMenuOpen, setDesktopCreateMenuOpen] = useState(false);
  const [creatingScratchWorkflow, setCreatingScratchWorkflow] = useState(false);
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

  const handleCreateNew = useCallback(() => {
    setMobileCreateMenuOpen(false);
    setDesktopCreateMenuOpen(false);
    navigate('/workflows/templates');
  }, [navigate]);

  const handleCreateFromScratch = useCallback(async () => {
    setMobileCreateMenuOpen(false);
    setDesktopCreateMenuOpen(false);
    setCreatingScratchWorkflow(true);
    try {
      const workflow = await workspaceApi.createWorkflow({ name: 'Untitled Workflow' });
      navigate(`/workflows/${workflow.id}`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to create workflow');
    } finally {
      setCreatingScratchWorkflow(false);
    }
  }, [navigate]);

  const handleExportWorkflow = async (workflow: Workflow) => {
    setActionLoading(workflow.id);
    try {
      const latestWorkflow = await workspaceApi.getWorkflow(workflow.id);
      downloadJsonFile(`${sanitizeDownloadFileName(latestWorkflow.name)}.json`, latestWorkflow);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to export workflow');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportClick = () => {
    setDesktopCreateMenuOpen(false);
    setImportError(null);
    setSelectedImportFile(null);
    setImportModalOpen(true);
  };

  const handleImportModalClose = () => {
    if (importing) return;
    setImportModalOpen(false);
    setImportDragActive(false);
    setImportError(null);
    setSelectedImportFile(null);
  };

  const handleBrowseImportFile = () => {
    importInputRef.current?.click();
  };

  const selectImportFile = (file: File | undefined) => {
    if (!file) return;

    const isJsonFile =
      file.name.toLowerCase().endsWith('.json') ||
      file.type === 'application/json' ||
      file.type === 'application/ld+json';

    if (!isJsonFile) {
      setImportError('Choose a workflow JSON file.');
      setSelectedImportFile(null);
      return;
    }

    if (file.size > MAX_WORKFLOW_IMPORT_BYTES) {
      setImportError('Workflow import files must be 2 MB or smaller.');
      setSelectedImportFile(null);
      return;
    }

    setImportError(null);
    setSelectedImportFile(file);
  };

  const handleCreateImportedWorkflow = async () => {
    if (!selectedImportFile) {
      setImportError('Choose a workflow JSON file first.');
      return;
    }

    setImporting(true);
    try {
      const payload = JSON.parse(await selectedImportFile.text()) as Partial<Workflow>;

      if (!payload || typeof payload.name !== 'string' || !payload.name.trim()) {
        throw new Error('Import file must be a workflow JSON response with a name.');
      }

      const created = await workspaceApi.createWorkflow({
        name: payload.name.trim(),
        description: payload.description,
        config: payload.config,
      });

      setImportModalOpen(false);
      setSelectedImportFile(null);
      navigate(`/workflows/${created.id}`);
    } catch (error: unknown) {
      setImportError(error instanceof Error ? error.message : 'Failed to import workflow');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    selectImportFile(file);
  };

  const handleImportDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (importing) return;
    importDragDepthRef.current += 1;
    setImportDragActive(true);
  };

  const handleImportDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (importing) return;
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleImportDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    importDragDepthRef.current = Math.max(0, importDragDepthRef.current - 1);
    if (importDragDepthRef.current === 0) {
      setImportDragActive(false);
    }
  };

  const handleImportDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    importDragDepthRef.current = 0;
    setImportDragActive(false);
    if (importing) return;
    selectImportFile(event.dataTransfer.files[0]);
  };

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <SearchInput
              placeholder="Search workflows..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              appearance="toolbar"
              onClear={() => setSearchDraft('')}
              clearAriaLabel="Clear workflow search"
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

  const usersById = useMemo(() => {
    return new Map(
      (workspaceUsers ?? []).map((user) => {
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.email ||
          'Unknown user';
        return [String(user.id), name] as const;
      }),
    );
  }, [workspaceUsers]);

  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => {
      const aValue =
        sortField === 'publishedAt'
          ? a.publishedAt ?? a.lastPublishedAt ?? ''
          : sortField === 'createdAt'
            ? a.createdAt ?? ''
            : String(a[sortField] ?? '');
      const bValue =
        sortField === 'publishedAt'
          ? b.publishedAt ?? b.lastPublishedAt ?? ''
          : sortField === 'createdAt'
            ? b.createdAt ?? ''
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
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
            <Zap size={14} className="text-[var(--color-primary)]" />
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
      id: 'createdAt',
      header: 'Created',
      sortable: true,
      sortField: 'createdAt',
      className: 'min-w-[180px]',
      cell: (wf) => (
        <WorkflowMetaCell
          icon={<Calendar size={14} />}
          label={formatDate(wf.createdAt) ?? 'Unknown date'}
          by={getWorkflowAuthor(wf, 'created', usersById)}
        />
      ),
      mobile: 'detail',
    },
    {
      id: 'publishedAt',
      header: 'Published',
      sortable: true,
      sortField: 'publishedAt',
      className: 'min-w-[180px]',
      cell: (wf) => {
        const publishedMeta = getWorkflowPublishedMeta(wf, usersById);

        return (
          <WorkflowMetaCell
            icon={<User size={14} />}
            label={publishedMeta.label}
            by={publishedMeta.by}
            muted={publishedMeta.muted}
          />
        );
      },
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
        onClick: () => {
          void handleExportWorkflow(wf);
        },
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
      <Tooltip content={importing ? 'Importing workflow JSON...' : 'Import workflow JSON'}>
        <span className="inline-flex">
          <IconButton
            aria-label="Import workflow JSON"
            icon={<Upload size={14} />}
            variant="secondary"
            loading={importing}
            disabled={importing}
            onClick={handleImportClick}
          />
        </span>
      </Tooltip>
      <div className="relative z-[62]">
        {desktopCreateMenuOpen ? (
          <button
            type="button"
            aria-label="Close workflow create options"
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
            onClick={() => setDesktopCreateMenuOpen(false)}
          />
        ) : null}
        <Button
          onClick={() => setDesktopCreateMenuOpen((open) => !open)}
          leftIcon={<Plus size={14} />}
          rightIcon={
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${
                desktopCreateMenuOpen ? 'rotate-180' : ''
              }`}
            />
          }
          aria-haspopup="menu"
          aria-expanded={desktopCreateMenuOpen}
        >
          New Workflow
        </Button>
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-[61] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_46px_rgba(15,23,42,0.14)] transition-all duration-150 ${
            desktopCreateMenuOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCreateNew}
            className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
          >
            <Blocks size={17} className="mt-0.5 shrink-0 text-emerald-600" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">
                Use template
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                Pick a ready workflow and customize it.
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={creatingScratchWorkflow}
            onClick={() => void handleCreateFromScratch()}
            className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] disabled:cursor-wait disabled:opacity-70"
          >
            <Pencil size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">
               Create from scratch
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                Start with a blank workflow.
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  const importModalFooter = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      <Button
        variant="secondary"
        onClick={handleImportModalClose}
        disabled={importing}
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreateImportedWorkflow}
        loading={importing}
        loadingMode="inline"
        disabled={!selectedImportFile || importing}
      >
        Create workflow
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
        <SearchInput
          placeholder="Search..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          appearance="toolbar"
          searchIconSize={13}
          onClear={() => setSearchDraft('')}
          clearAriaLabel="Clear workflow search"
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
              const createdLabel = formatDate(workflow.createdAt) ?? 'Unknown date';
              const creatorLabel = getWorkflowAuthor(workflow, 'created', usersById);
              const publishedMeta = getWorkflowPublishedMeta(workflow, usersById);

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

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Created
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-700">{createdLabel}</p>
                        <p className="truncate text-[11px] text-slate-400">by {creatorLabel}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Published
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-slate-700">{publishedMeta.label}</p>
                        {publishedMeta.by ? (
                          <p className="truncate text-[11px] text-slate-400">by {publishedMeta.by}</p>
                        ) : (
                          <p className="truncate text-[11px] text-slate-300">Draft only</p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            }}
            minTableWidth={920}
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

        {isMobile ? (
          <>
            <div
              className={`fixed inset-0 z-[68] bg-slate-950/0 opacity-0 backdrop-blur-0 transition-all duration-200 md:hidden ${
                mobileCreateMenuOpen
                  ? 'pointer-events-auto bg-slate-950/10 opacity-100 backdrop-blur-[1px]'
                  : 'pointer-events-none'
              }`}
              onClick={() => setMobileCreateMenuOpen(false)}
            />
            <div
              className={`fixed right-6 z-[71] flex flex-col items-end gap-2 md:hidden ${
                mobileCreateMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              style={{ bottom: 'calc(9.75rem + env(safe-area-inset-bottom))' }}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute -inset-x-5 -inset-y-3 rounded-[2rem] bg-[var(--color-primary-light)] blur-2xl transition-opacity duration-300 ${
                  mobileCreateMenuOpen ? 'opacity-90' : 'opacity-0'
                }`}
              />
              <button
                type="button"
                onClick={handleCreateNew}
                className={`relative flex min-h-12 min-w-[11rem] items-center gap-3 rounded-full border border-white/80 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_42px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 transition-all duration-200 ease-out active:scale-[0.98] ${
                  mobileCreateMenuOpen
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-6 scale-95 opacity-0'
                }`}
                style={{ transitionDelay: mobileCreateMenuOpen ? '70ms' : '0ms' }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-emerald-600">
                  <Blocks size={16} />
                </span>
                Use template
              </button>
              <button
                type="button"
                onClick={() => void handleCreateFromScratch()}
                disabled={creatingScratchWorkflow}
                className={`relative flex min-h-12 min-w-[11rem] items-center gap-3 rounded-full border border-white/80 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_42px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
                  mobileCreateMenuOpen
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-4 scale-95 opacity-0'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--color-primary)]">
                  <Pencil size={15} />
                </span>
                {creatingScratchWorkflow ? 'Creating...' : 'Create from scratch'}
              </button>
            </div>
          </>
        ) : null}

        <FloatingActionButton
          label={mobileCreateMenuOpen ? 'Close workflow options' : 'New workflow'}
          icon={
            <span className="relative block h-6 w-6">
              <Plus
                size={24}
                className={`absolute left-1/2 top-1/2 transition-all duration-200 ease-out ${
                  mobileCreateMenuOpen
                    ? '-translate-x-1/2 -translate-y-1/2 rotate-90 scale-50 opacity-0'
                    : '-translate-x-1/2 -translate-y-1/2 rotate-0 scale-100 opacity-100'
                }`}
              />
              <X
                size={22}
                className={`absolute left-1/2 top-1/2 transition-all duration-200 ease-out ${
                  mobileCreateMenuOpen
                    ? '-translate-x-1/2 -translate-y-1/2 rotate-0 scale-100 opacity-100'
                    : '-translate-x-1/2 -translate-y-1/2 -rotate-90 scale-50 opacity-0'
                }`}
              />
            </span>
          }
          className="z-[72] transition-transform duration-200 active:scale-95"
          style={{
            backgroundColor: 'var(--color-primary)',
            backgroundImage: 'none',
            borderColor: 'transparent',
            boxShadow: '0 16px 36px rgba(79,70,229,0.28)',
          }}
          aria-expanded={mobileCreateMenuOpen}
          onClick={() => setMobileCreateMenuOpen((open) => !open)}
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

      <ResponsiveModal
        isOpen={importModalOpen}
        onClose={handleImportModalClose}
        title="Import workflow"
        size="md"
        footer={importModalFooter}
        closeOnOverlayClick={!importing}
      >
        <div className="space-y-3">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImportFile}
          />
          <div
            aria-disabled={importing}
            onDragEnter={handleImportDragEnter}
            onDragOver={handleImportDragOver}
            onDragLeave={handleImportDragLeave}
            onDrop={handleImportDrop}
            className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 py-7 text-center transition-colors ${
              importDragActive
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
            } ${importing ? 'cursor-wait opacity-70' : ''}`}
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm">
              <Upload size={18} />
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Drop JSON file here or{' '}
              <button
                type="button"
                onClick={handleBrowseImportFile}
                disabled={importing}
                className="font-semibold text-[var(--color-primary)] underline underline-offset-2 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-wait disabled:opacity-60"
              >
                click here
              </button>
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Max 2 MB
            </span>

            {selectedImportFile ? (
              <div className="mt-5 flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {selectedImportFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedImportFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImportFile(null);
                    setImportError(null);
                  }}
                  disabled={importing}
                  leftIcon={<Trash2 size={13} />}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </div>

          {importError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {importError}
            </p>
          ) : null}
        </div>
      </ResponsiveModal>
    </PageLayout>
  );
}
