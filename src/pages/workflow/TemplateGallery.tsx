import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from '@/components/ui/icons';
import {
  WORKFLOW_STEP_METADATA,
} from '../../config/workflowMetadata';
import { TEMPLATES } from './templates';
import type { WorkflowTemplate } from './workflow.types';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';
import { PageLayout } from '../../components/ui/PageLayout';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/inputs';
import { BackButton } from '../../components/channels/BackButton';
import { ResponsiveModal } from '../../components/ui/modal';
import { WorkflowCanvasPreview } from './WorkflowCanvas';

function cloneTemplateValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getTemplateSteps(template: WorkflowTemplate) {
  return template.defaultWorkflow?.config?.steps ?? [];
}

function getConfiguredSteps(template: WorkflowTemplate) {
  return getTemplateSteps(template).filter((step) => step.type !== 'branch_connector');
}

function getBranchPathCount(template: WorkflowTemplate) {
  return getTemplateSteps(template).filter((step) => step.type === 'branch_connector').length;
}

export function TemplateGallery() {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return TEMPLATES.filter((template) => {
      return (
        !normalizedSearch ||
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch) ||
        template.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [search]);

  const handleOpen = (workflowId: string) => {
    navigate(`/workflows/${workflowId}`);
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    setCreating(template.id);
    try {
      const workflow = await workspaceApi.createWorkflow({
        name: template.name,
        description: template.description,
      });
      const templateConfig = template.defaultWorkflow?.config;

      if (templateConfig?.trigger || (templateConfig?.steps ?? []).length > 0) {
        await workspaceApi.saveWorkflow(workflow.id, {
          config: {
            trigger: cloneTemplateValue(templateConfig?.trigger ?? null),
            steps: cloneTemplateValue(templateConfig?.steps ?? []),
            settings: templateConfig?.settings,
          },
        });
      }

      handleOpen(workflow.id);
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(null);
    }
  };

  const handleScratch = async () => {
    setCreating('scratch');
    try {
      const workflow = await workspaceApi.createWorkflow({ name: 'Untitled Workflow' });
      handleOpen(workflow.id);
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(null);
    }
  };

  const handleBack = () => {
    navigate('/workflows');
  };

  useMobileHeaderActions(
    {
      panel: (
        <SearchInput
          placeholder="Search templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          appearance="toolbar"
          onClear={() => setSearch('')}
          clearAriaLabel="Clear template search"
          aria-label="Search templates"
        />
      ),
    },
    [search],
  );

  const desktopToolbar = (
    <div className="flex justify-end">
      <div className="w-full lg:max-w-xs">
        <SearchInput
          placeholder="Search templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          appearance="toolbar"
          searchIconSize={16}
          onClear={() => setSearch('')}
          clearAriaLabel="Clear template search"
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Workflows"
      title="Workflow Templates"
      subtitle="Preview a starter flow, then create it as a draft workflow."
      leading={<BackButton onClick={handleBack} ariaLabel="Back to workflows" />}
      actions={
        <Button
          onClick={() => void handleScratch()}
          disabled={creating === 'scratch'}
          loading={creating === 'scratch'}
          loadingMode="inline"
          leftIcon={<Plus size={16} />}
          className="hidden md:inline-flex"
        >
          Start from scratch
        </Button>
      }
      toolbar={desktopToolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4 pb-8 md:p-6">
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {search
                  ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
                  : 'Templates'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Preview a starter flow first, or start with an empty workflow.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {TEMPLATES.length} templates available
            </span>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:hidden">
            <p className="text-sm font-semibold text-slate-950">Start from scratch</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Open a blank draft and add your own trigger, steps, and paths.
            </p>
            <Button
              fullWidth
              className="mt-3"
              onClick={() => void handleScratch()}
              disabled={creating === 'scratch'}
              loading={creating === 'scratch'}
              loadingMode="inline"
              leftIcon={<Plus size={16} />}
            >
              Create blank workflow
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
              <Search size={24} className="mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No templates found</p>
              <p className="mt-1 text-xs text-slate-400">Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isCreating={creating === template.id}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TemplatePreviewModal
        template={previewTemplate}
        creating={previewTemplate ? creating === previewTemplate.id : false}
        onClose={() => setPreviewTemplate(null)}
        onUse={(template) => void handleUseTemplate(template)}
      />
    </PageLayout>
  );
}

function TemplateCard({
  template,
  isCreating,
  onPreview,
}: {
  template: WorkflowTemplate;
  isCreating: boolean;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      disabled={isCreating}
      className="group flex min-h-[158px] w-full min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
    >
      <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
        {template.name}
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{template.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-xs text-slate-400">Preview, then use</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
          {isCreating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              Preview template
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </div>
    </button>
  );
}

function TemplatePreviewModal({
  template,
  creating,
  onClose,
  onUse,
}: {
  template: WorkflowTemplate | null;
  creating: boolean;
  onClose: () => void;
  onUse: (template: WorkflowTemplate) => void;
}) {
  const benefits = template ? getTemplateBenefits(template) : [];
  const includedItems = template ? getTemplateIncludedItems(template) : [];
  const workflowConfig = template?.defaultWorkflow?.config;
  const [mobilePreviewMode, setMobilePreviewMode] = useState<'overview' | 'flow'>('overview');

  useEffect(() => {
    setMobilePreviewMode('overview');
  }, [template?.id]);

  const renderUseTemplateAction = (label: string, fullWidth = false) =>
    template ? (
      <Button
        onClick={() => onUse(template)}
        loading={creating}
        loadingMode="inline"
        leftIcon={<Sparkles size={15} />}
        fullWidth={fullWidth}
      >
        {label}
      </Button>
    ) : null;

  return (
    <ResponsiveModal
      isOpen={Boolean(template)}
      onClose={onClose}
      title={template?.name ?? 'Template preview'}
      size="fullscreen"
      bodyPadding="none"
      mobileFullScreen
      mobileBorderless
      headerActions={renderUseTemplateAction('Use Template')}
      mobileFooter={renderUseTemplateAction('Use template', true)}
      mobileBodyClassName="h-full min-h-0"
      closeOnOverlayClick={!creating}
    >
      {template ? (
        <div className="h-full min-h-0 bg-white">
          <div className="flex h-full min-h-0 flex-col md:hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMobilePreviewMode('overview')}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    mobilePreviewMode === 'overview'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreviewMode('flow')}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    mobilePreviewMode === 'flow'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Flow
                </button>
              </div>
            </div>

            {mobilePreviewMode === 'overview' ? (
              <section className="min-h-0 flex-1 overflow-y-auto p-5">
                <p className="text-sm leading-6 text-slate-700">
                  {template.description}
                </p>

                <TemplateInfoBlock title="Benefits" items={benefits} />
                <TemplateInfoBlock title="What it has" items={includedItems} />

                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-8"
                  rightIcon={<ArrowRight size={15} />}
                  onClick={() => setMobilePreviewMode('flow')}
                >
                  View flow preview
                </Button>
              </section>
            ) : (
              <div
                className="min-h-0 flex-1"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <WorkflowCanvasPreview
                  trigger={workflowConfig?.trigger ?? null}
                  steps={workflowConfig?.steps ?? []}
                  className="h-full"
                  minHeightClassName="min-h-0"
                />
              </div>
            )}
          </div>

          <div className="hidden h-full min-h-0 grid-cols-[minmax(360px,0.82fr)_minmax(560px,1.18fr)] bg-white md:grid">
            <section className="min-h-0 overflow-y-auto border-r border-slate-200 p-8">
              <p className="max-w-2xl text-sm leading-6 text-slate-700">
                {template.description}
              </p>

              <TemplateInfoBlock title="Benefits" items={benefits} />
              <TemplateInfoBlock title="What it has" items={includedItems} />
            </section>

            <WorkflowCanvasPreview
              trigger={workflowConfig?.trigger ?? null}
              steps={workflowConfig?.steps ?? []}
            />
          </div>
        </div>
      ) : null}
    </ResponsiveModal>
  );
}

function TemplateInfoBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getTemplateBenefits(template: WorkflowTemplate) {
  const stepTypes = new Set(getConfiguredSteps(template).map((step) => step.type));
  const benefits: string[] = [];

  if (stepTypes.has('assign_to')) {
    benefits.push('Assign conversations automatically so contacts reach the right person faster.');
  }
  if (stepTypes.has('send_message')) {
    benefits.push('Send consistent replies without typing the same message manually.');
  }
  if (stepTypes.has('ask_question')) {
    benefits.push('Collect contact details directly inside the conversation.');
  }
  if (stepTypes.has('branch') || stepTypes.has('date_time')) {
    benefits.push('Guide contacts down the right path based on conditions or timing.');
  }
  if (stepTypes.has('close_conversation') || stepTypes.has('open_conversation')) {
    benefits.push('Keep conversation status aligned with the automation outcome.');
  }

  if (benefits.length === 0) {
    benefits.push('Start from a ready workflow instead of a blank canvas.');
  }

  return benefits.slice(0, 4);
}

function getTemplateIncludedItems(template: WorkflowTemplate) {
  const configuredSteps = getConfiguredSteps(template);
  const uniqueStepLabels = Array.from(
    new Set(
      configuredSteps.map((step) => WORKFLOW_STEP_METADATA[step.type]?.label ?? step.name),
    ),
  );
  const branchPathCount = getBranchPathCount(template);

  return [
    'A new draft workflow',
    ...uniqueStepLabels,
    ...(branchPathCount > 0 ? ['Branch paths already connected'] : []),
  ].slice(0, 7);
}
