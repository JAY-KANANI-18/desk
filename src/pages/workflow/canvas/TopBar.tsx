import React, { useState } from 'react';
import {
  ChevronLeft,
  Save,
  AlertTriangle,
  Settings,
  Play,
  Square,
  Loader2,
  Check,
  Pencil,
} from 'lucide-react';
import { useWorkflow } from '../WorkflowContext';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface TopBarProps {
  onBack: () => void;
}

export function TopBar({ onBack }: TopBarProps) {
  const isMobile = useIsMobile();
  const {
    state,
    saveWorkflow,
    publishWorkflow,
    stopWorkflow,
    updateName,
    toggleSettings,
    errorCount,
    canPublish,
  } = useWorkflow();
  const { workflow, isDirty, isSaving, isPublishing } = state;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(workflow?.name ?? '');

  if (!workflow) return null;

  const isPublished = workflow.status === 'published';

  const statusDot = {
    draft: 'bg-gray-300',
    published: 'bg-green-500',
    stopped: 'bg-red-400',
  }[workflow.status];

  const handleNameSubmit = () => {
    if (nameDraft.trim()) updateName(nameDraft.trim());
    setEditingName(false);
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap">
      {errorCount > 0 && (
        <div className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600">
          <AlertTriangle size={12} />
          <span>{errorCount}</span>
        </div>
      )}

      <button
        onClick={toggleSettings}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Workflow settings"
      >
        <Settings size={15} />
      </button>

      <button
        onClick={saveWorkflow}
        disabled={isSaving || !isDirty}
        className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSaving ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isDirty ? (
          <Save size={13} />
        ) : (
          <Check size={13} className="text-green-500" />
        )}
        <span>{isSaving ? 'Saving' : 'Save'}</span>
      </button>

      {isPublished ? (
        <button
          onClick={stopWorkflow}
          className="flex items-center gap-1.5 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
        >
          <Square size={12} />
          Stop
        </button>
      ) : (
        <button
          onClick={publishWorkflow}
          disabled={!canPublish || isPublishing}
          className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} />}
          {isPublishing ? 'Publishing' : 'Publish'}
        </button>
      )}
    </div>
  );

  return (
    <div className="z-20 flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:h-12 md:py-0">
      <div className="flex items-start gap-3 md:h-full md:items-center">
        <button
          onClick={onBack}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:h-auto md:w-auto md:gap-1 md:rounded-none md:hover:bg-transparent"
          aria-label="Back to workflows"
        >
          <ChevronLeft size={16} />
          <span className="hidden text-sm md:inline">Workflows</span>
        </button>

        <div className="hidden h-4 w-px bg-gray-200 md:block" />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') {
                    setEditingName(false);
                    setNameDraft(workflow.name);
                  }
                }}
                className="min-w-[120px] max-w-full border-b border-gray-400 bg-transparent text-sm font-medium outline-none md:max-w-[240px]"
              />
            ) : (
              <button
                onClick={() => {
                  setNameDraft(workflow.name);
                  setEditingName(true);
                }}
                className="group flex min-w-0 items-center gap-1.5"
              >
                <span className="truncate text-sm font-medium text-gray-900 md:max-w-[200px]">
                  {workflow.name}
                </span>
                <Pencil size={12} className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
              </button>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 md:mt-0">
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDot}`} />
            <span className="text-xs capitalize text-gray-400">{workflow.status}</span>
            {isDirty && <span className="text-xs text-gray-400">/ unsaved</span>}
          </div>
        </div>

        {!isMobile ? actions : null}
      </div>

      {isMobile ? <div className="mt-3">{actions}</div> : null}
    </div>
  );
}
