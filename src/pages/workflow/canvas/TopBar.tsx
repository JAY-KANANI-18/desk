import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Save,
  AlertTriangle,
  Settings,
  Play,
  Square,
  Check,
  Pencil,
} from '@/components/ui/icons';
import { useWorkflow } from '../WorkflowContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/button/IconButton';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import type { WorkflowValidationWarning } from './nodeValidation';

interface TopBarProps {
  onBack: () => void;
  warnings?: WorkflowValidationWarning[];
  onWarningClick?: (nodeId: string) => void;
}

export function TopBar({ onBack, warnings = [], onWarningClick }: TopBarProps) {
  const isMobile = useIsMobile();
  const {
    state,
    saveWorkflow,
    publishWorkflow,
    stopWorkflow,
    updateName,
    toggleSettings,
    canPublish,
  } = useWorkflow();
  const { workflow, isDirty, isSaving, isPublishing } = state;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(workflow?.name ?? '');
  const [showWarnings, setShowWarnings] = useState(false);
  const warningMenuRef = useRef<HTMLDivElement>(null);

  const warningCount = warnings.length;

  useEffect(() => {
    if (warningCount === 0) setShowWarnings(false);
  }, [warningCount]);

  useEffect(() => {
    if (!showWarnings) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        warningMenuRef.current &&
        !warningMenuRef.current.contains(event.target as Node)
      ) {
        setShowWarnings(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showWarnings]);

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

  const settingsButton = (
    <IconButton
      onClick={toggleSettings}
      aria-label="Workflow settings"
      icon={<Settings size={15} />}
      variant="ghost"
      size="xs"
    />
  );

  const warningButton =
    warningCount > 0 ? (
      <div ref={warningMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setShowWarnings((open) => !open)}
          aria-label={`${warningCount} workflow ${warningCount === 1 ? 'warning' : 'warnings'}`}
          className="inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded px-1 text-orange-500 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          <AlertTriangle size={15} className="shrink-0" />
          <span className="min-w-[0.65rem] text-center text-[13px] font-semibold leading-none tabular-nums">
            {warningCount}
          </span>
        </button>

        {showWarnings ? (
          <div
            className={`absolute top-full z-40 mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ${
              isMobile ? 'left-0' : 'right-0'
            }`}
          >
            <div className="border-b border-gray-100 px-3 py-2">
              <p className="text-xs font-semibold text-gray-900">Workflow warnings</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Click an item to locate the step.
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {warnings.map((warning) => (
                <button
                  key={`${warning.nodeId}-${warning.message}`}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                  onClick={() => {
                    onWarningClick?.(warning.nodeId);
                    setShowWarnings(false);
                  }}
                >
                  <span
                    className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: warning.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-gray-900">
                      {warning.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                      {warning.message}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    ) : null;

  const saveButton = (
    <Button
      onClick={saveWorkflow}
      disabled={isSaving || !isDirty}
      variant="secondary"
      size="xs"
      loading={isSaving}
      loadingMode="inline"
      leftIcon={isDirty ? <Save size={13} /> : <Check size={13} className="text-green-500" />}
      style={
        isDirty
          ? {
              borderColor: "color-mix(in srgb, var(--color-primary) 24%, white)",
              color: "var(--color-primary)",
            }
          : undefined
      }
    >
      {isSaving ? 'Saving' : 'Save'}
    </Button>
  );

  const publishButton = isPublished ? (
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
      disabled={!canPublish || warningCount > 0 || isPublishing}
      variant="primary"
      size="xs"
      loading={isPublishing}
      loadingMode="inline"
      leftIcon={<Play size={12} />}
    >
      {isPublishing ? 'Publishing' : 'Publish'}
    </Button>
  );

  const actions = isMobile ? (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        {settingsButton}
        {warningButton}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {saveButton}
        {publishButton}
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap">
      {settingsButton}
      {warningButton}
      {saveButton}
      {publishButton}
    </div>
  );

  return (
    <div className="z-20 flex-shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:h-12 md:px-4 md:py-0">
      <div className="flex items-center gap-2 md:h-full md:gap-3">
        <Button
          onClick={onBack}
          aria-label="Back to workflows"
          variant="ghost"
          size={isMobile ? 'xs' : 'sm'}
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
                <span className="max-w-[10rem] truncate text-sm font-medium text-gray-900 md:max-w-[200px]">
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

      {isMobile ? <div className="mt-2">{actions}</div> : null}
    </div>
  );
}
