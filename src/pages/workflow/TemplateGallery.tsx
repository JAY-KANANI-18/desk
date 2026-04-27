import React, { useState } from 'react';
import { ChevronLeft, Plus, ArrowRight, Search, Loader2, Zap, X } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { WorkflowTemplate } from './workflow.types';
import * as Icons from 'lucide-react';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';
import { PageLayout } from '../../components/ui/PageLayout';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/button/IconButton';
import { BaseInput } from '../../components/ui/inputs/BaseInput';
import { Tag } from '../../components/ui/Tag';
import { ChannelHeaderBackButton } from '../../components/channels/ChannelHeaderBackButton';


export function TemplateGallery() {


  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate  = useNavigate();

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = selectedCategory === 'all' ? true : selectedCategory === 'popular' ? t.popular : t.category === selectedCategory;
    const matchSearch = !search
      || t.name.toLowerCase().includes(search.toLowerCase())
      || t.description.toLowerCase().includes(search.toLowerCase())
      || t.tags.some((tag) => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    setCreating(template.id);
    try {
      const wf = await workspaceApi.createWorkflow({ name: template.name, description: template.description });
      if (template.defaultWorkflow?.config?.trigger || (template?.defaultWorkflow?.config?.steps ?? []).length > 0) {
        await workspaceApi.saveWorkflow(wf.id, {
          config: {

          trigger: template?.defaultWorkflow?.config?.trigger ?? null,
          steps:   template?.defaultWorkflow?.config?.steps ?? [],
          }
        });
      }
      handleOpen(wf.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(null);
    }
  };

  const handleScratch = async () => {
    setCreating('scratch');
    try {
      const wf = await workspaceApi.createWorkflow({ name: 'Untitled Workflow' });
      handleOpen(wf.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(null);
    }
  };
  const handleBack = () => {
    navigate('/workflows');
    
  };

  useMobileHeaderActions(
    {
      actions: [
        {
          id: 'workflow-template-search',
          label: mobileSearchOpen ? 'Close search' : 'Search templates',
          icon: mobileSearchOpen ? <X size={17} /> : <Search size={17} />,
          active: mobileSearchOpen,
          hasIndicator: !mobileSearchOpen && Boolean(search),
          onClick: () => setMobileSearchOpen((value) => !value),
        },
        {
          id: 'workflow-template-scratch',
          label: 'Start from scratch',
          icon: creating === 'scratch' ? <Loader2 size={17} className="animate-spin" /> : <Plus size={18} />,
          disabled: creating === 'scratch',
          onClick: () => void handleScratch(),
        },
      ],
      panel: mobileSearchOpen ? (
        <BaseInput
          autoFocus={false}
          type="search"
          placeholder="Search templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          appearance="toolbar"
          leftIcon={<Search size={15} />}
        />
      ) : null,
    },
    [creating, mobileSearchOpen, search],
  );

  const handleOpen = (workflowId: string) => {
    navigate(`/workflows/${workflowId}`);
  };

  const desktopToolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* <div className="flex gap-1 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setSearch('');
            }}
      
                             variant="tab"
                selected={selectedCategory === category.id && !search}

                      radius="none"
          >
            {category.label}
          </Button>
        ))}
      </div> */}

      <div className="relative w-full lg:max-w-xs">
        <BaseInput
          type="search"
          placeholder="Search templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          appearance="toolbar"
          leftIcon={<Search size={16} />}
        />
      </div>
    </div>
  );
  

  return (
    <PageLayout
      eyebrow="Workflows"
      title="Workflow templates"
      leading={
        <ChannelHeaderBackButton
          onClick={handleBack}
          ariaLabel="Back to workflows"
         

        />
      }
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
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-6">
          {/* {!search ? (
            <Button
              onClick={handleScratch}
              disabled={creating === 'scratch'}
              variant="secondary"
              size="lg"
              radius="lg"
              fullWidth
              contentAlign="start"
              preserveChildLayout
              className="group mb-5 hidden md:flex"
            >
              <div className="flex w-full items-center gap-4 text-left">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-50 transition-colors group-hover:bg-gray-100">
                  {creating === 'scratch'
                    ? <Loader2 size={15} className="animate-spin text-gray-400" />
                    : <Plus size={15} className="text-gray-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Start from scratch</p>
                  <p className="mt-0.5 text-xs text-gray-400">Build a custom workflow with a blank canvas</p>
                </div>
                <ArrowRight size={14} className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
              </div>
            </Button>
          ) : null} */}

          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
              : TEMPLATE_CATEGORIES.find((category) => category.id === selectedCategory)?.label ?? 'Templates'}
          </p>

          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search size={24} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No templates match "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isCreating={creating === template.id}
                  onUse={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, isCreating, onUse }: {
  template: WorkflowTemplate;
  isCreating: boolean;
  onUse: () => void;
}) {
  // Resolve lucide icon by name
  const Icon = (Icons as any)[template.iconName] as React.ElementType ?? Zap;

  return (
    <Button
      onClick={onUse}
      disabled={isCreating}
      variant="secondary"
      size="lg"
      radius="lg"
      fullWidth
      contentAlign="start"
      preserveChildLayout
      className="group"
    >
      <div className="w-full text-left">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-gray-100 transition-colors group-hover:bg-gray-200">
            <Icon size={14} className="text-gray-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium leading-tight text-gray-800">{template.name}</p>
              {template.popular ? <Tag label="Popular" bgColor="gray" size="sm" /> : null}
            </div>
          </div>
        </div>

        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400">{template.description}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1">
            {template.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} label={tag} bgColor="gray" size="sm" maxWidth={120} />
            ))}
          </div>
          {isCreating
            ? <Loader2 size={12} className="shrink-0 animate-spin text-gray-400" />
            : <ArrowRight size={12} className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-600" />
          }
        </div>
      </div>
    </Button>
  );
}
