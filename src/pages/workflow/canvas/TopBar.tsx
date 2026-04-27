import React, { useState } from 'react';
import {
  ChevronLeft,
  Save,
  AlertTriangle,
  Settings,
  Play,
  Square,
  Check,
  Pencil,
} from 'lucide-react';
import { useWorkflow } from '../WorkflowContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { Tag } from '../../../components/ui/Tag';

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
        <Tag
          label={String(errorCount)}
          bgColor="warning"
          size="sm"
          icon={<AlertTriangle size={12} />}
        />
      )}

      <IconButton
        onClick={toggleSettings}
        aria-label="Workflow settings"
        icon={<Settings size={15} />}
        variant="ghost"
        size="xs"
      />

      <Button
        onClick={saveWorkflow}
        disabled={isSaving || !isDirty}
        variant="secondary"
        size="xs"
        loading={isSaving}
        loadingMode="inline"
        leftIcon={isDirty ? <Save size={13} /> : <Check size={13} className="text-green-500" />}
      >
        {isSaving ? 'Saving' : 'Save'}
      </Button>

      {isPublished ? (
        <Button
          onClick={stopWorkflow}
          variant="danger"
          size="xs"
          leftIcon={<Square size={12} />}
        >
          Stop
        </Button>
      ) : (
        <Button
          onClick={publishWorkflow}
          disabled={!canPublish || isPublishing}
          variant="dark"
          size="xs"
          loading={isPublishing}
          loadingMode="inline"
          leftIcon={<Play size={12} />}
        >
          {isPublishing ? 'Publishing' : 'Publish'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="z-20 flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:h-12 md:py-0">
      <div className="flex items-start gap-3 md:h-full md:items-center">
        <Button
          onClick={onBack}
          aria-label="Back to workflows"
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft size={16} />}
          className="flex-shrink-0"
        >
          <span className="hidden text-sm md:inline">Workflows</span>
        </Button>

        <div className="hidden h-4 w-px bg-gray-200 md:block" />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            {editingName ? (
              <BaseInput
                autoFocus
                type="text"
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
                appearance="inline-edit"
                size="xs"
                autoWidth
                minWidthCh={12}
                maxWidthCh={28}
                aria-label="Workflow name"
              />
            ) : (
              <Button
                onClick={() => {
                  setNameDraft(workflow.name);
                  setEditingName(true);
                }}
                variant="unstyled"
                contentAlign="start"
                preserveChildLayout
                className="group flex min-w-0 items-center gap-1.5"
              >
                <span className="truncate text-sm font-medium text-gray-900 md:max-w-[200px]">
                  {workflow.name}
                </span>
                <Pencil size={12} className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
              </Button>
            )}

            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDot}`} />
              <span className="text-xs capitalize text-gray-400">{workflow.status}</span>
              {isDirty && <span className="text-xs text-gray-400">/ unsaved</span>}
            </div>
          </div>
        </div>

        {!isMobile ? actions : null}
      </div>

      {isMobile ? <div className="mt-3">{actions}</div> : null}
    </div>
  );
}
