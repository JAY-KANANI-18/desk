import React, { useState } from 'react';
import { ChevronLeft, Plus, ArrowRight, Search, Loader2, Zap } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { workflowApi } from './workflowApi';
import { WorkflowTemplate } from './workflow.types';
import * as Icons from 'lucide-react';
import { workspaceApi } from '../../lib/workspaceApi';
import { useNavigate } from 'react-router-dom';
import { useMobileHeaderActions } from '../../components/mobileHeaderActions';



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
          label: 'Search templates',
          icon: <Search size={17} />,
          active: mobileSearchOpen || Boolean(search),
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
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus={false}
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ) : null,
    },
    [creating, mobileSearchOpen, search],
  );

  const handleOpen = (workflowId: string) => {
    navigate(`/workflows/${workflowId}`);
  };
  

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="hidden border-b border-gray-100 px-6 py-4 md:block">
        <div className="flex items-center gap-2 mb-0.5">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={16} />
            Back
          </button>
          <span className="text-gray-200">/</span>
          <h1 className="text-sm font-semibold text-gray-900">New Workflow</h1>
        </div>
        <p className="text-xs text-gray-400 ml-10">Choose a template or start from scratch.</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {/* <div className="w-48 border-r border-gray-100 flex-shrink-0 overflow-y-auto">
          <div className="p-3">
            <div className="relative mb-3">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-0.5">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setSearch(''); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    selectedCategory === cat.id && !search
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-gray-300 tabular-nums">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div> */}

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Start from scratch */}
          {!search && (
            <button
              onClick={handleScratch}
              disabled={creating === 'scratch'}
              className="group mb-5 hidden w-full items-center gap-4 rounded-lg bg-slate-50 p-4 text-left transition-all hover:bg-gray-50 disabled:opacity-60 md:flex md:border md:border-dashed md:border-gray-200 md:hover:border-gray-400"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white transition-colors group-hover:bg-gray-100 md:border md:border-dashed md:border-gray-300 md:group-hover:border-gray-400">
                {creating === 'scratch'
                  ? <Loader2 size={15} className="animate-spin text-gray-400" />
                  : <Plus size={15} className="text-gray-400" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Start from scratch</p>
                <p className="text-xs text-gray-400 mt-0.5">Build a custom workflow with a blank canvas</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </button>
          )}

          {/* Section label */}
          <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
              : TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? 'Templates'}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search size={24} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No templates match "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isCreating={creating === t.id}
                  onUse={() => handleUseTemplate(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
    <button
      onClick={onUse}
      disabled={isCreating}
      className="group w-full rounded-lg bg-white p-4 text-left transition-all hover:bg-slate-50 disabled:opacity-60 md:border md:border-gray-200 md:hover:border-gray-400 md:hover:shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
          <Icon size={14} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-gray-800 leading-tight">{template.name}</p>
            {template.popular && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 md:border md:border-gray-200 md:bg-white">
                Popular
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{template.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        {isCreating
          ? <Loader2 size={12} className="animate-spin text-gray-400" />
          : <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
        }
      </div>
    </button>
  );
}
