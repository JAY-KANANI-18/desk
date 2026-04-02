import React, { useState } from 'react';
import {
  ChevronLeft, Save, AlertTriangle, Settings,
  Play, Square, Loader2, Check, Pencil,
} from 'lucide-react';
import { useWorkflow } from '../WorkflowContext';

interface TopBarProps { onBack: () => void; }

export function TopBar({ onBack }: TopBarProps) {
  const { state, saveWorkflow, publishWorkflow, stopWorkflow, updateName, toggleSettings, errorCount, canPublish } = useWorkflow();
  const { workflow, isDirty, isSaving, isPublishing } = state;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(workflow?.name ?? '');

  if (!workflow) return null;

  const isPublished = workflow.status === 'published';

  const statusDot = {
    draft:     'bg-gray-300',
    published: 'bg-green-500',
    stopped:   'bg-red-400',
  }[workflow.status];

  const handleNameSubmit = () => {
    if (nameDraft.trim()) updateName(nameDraft.trim());
    setEditingName(false);
  };

  return (
    <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-3 flex-shrink-0 z-20">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline text-sm">Workflows</span>
      </button>

      <div className="w-px h-4 bg-gray-200" />

      {/* Name + status */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') { setEditingName(false); setNameDraft(workflow.name); }
            }}
            className="text-sm font-medium border-b border-gray-400 outline-none bg-transparent min-w-[120px] max-w-[240px]"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(workflow.name); setEditingName(true); }}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{workflow.name}</span>
            <Pencil size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
          <span className="text-xs text-gray-400 capitalize">{workflow.status}</span>
        </div>

        {isDirty && <span className="text-xs text-gray-400 hidden sm:inline">· unsaved</span>}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
            <AlertTriangle size={12} />
            <span>{errorCount}</span>
          </div>
        )}

        <button
          onClick={toggleSettings}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings size={15} />
        </button>

        <button
          onClick={saveWorkflow}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            <Square size={12} />
            Stop
          </button>
        ) : (
          <button
            onClick={publishWorkflow}
            disabled={!canPublish || isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} />}
            {isPublishing ? 'Publishing' : 'Publish'}
          </button>
        )}
      </div>
    </div>
  );
}