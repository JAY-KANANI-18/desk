import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AlertCircle, Trash2, Copy, Plus, Zap } from 'lucide-react';
import { TRIGGER_META } from '../triggerTypes';
import { STEP_META } from '../stepTypes';
import { StepType, TriggerType } from '../../workflow.types';
import { NODE_W, NODE_W_PILL, NODE_W_ADD } from '../../WorkflowCanvas';

const base = 'relative group bg-white border border-gray-200 rounded-lg cursor-pointer select-none transition-all hover:border-gray-400 hover:shadow-sm';

// ─── Trigger Node ─────────────────────────────────────────────────────────────

export interface TriggerNodeData {
  triggerType: TriggerType | null;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
}

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const meta = data.triggerType ? TRIGGER_META[data.triggerType] : null;
  const Icon = meta?.Icon ?? Zap;
  return (
    <div
      onClick={data.onSelect}
      style={{ width: NODE_W }} // ← use constant, not w-52
      className={`${base} ${selected ? 'border-gray-900 shadow-sm' : data.hasError ? 'border-dashed border-gray-300' : ''}`}
    >
      <div className="px-3 py-3 flex items-center gap-3">
        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${data.isConfigured ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <Icon size={14} className={data.isConfigured ? 'text-white' : 'text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Trigger</p>
          <p className={`text-sm font-medium truncate leading-tight ${data.isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
            {data.isConfigured ? (meta?.label ?? 'Trigger') : 'Select a trigger'}
          </p>
        </div>
        {!data.isConfigured && <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: '50%', transform: 'translateX(-50%)' }} // ← always centered
        className="!w-2 !h-2 !bg-gray-300 !border-2 !border-white !bottom-[-5px]"
      />
    </div>
  );
});
TriggerNode.displayName = 'TriggerNode';

// ─── Step Node ────────────────────────────────────────────────────────────────

export interface StepNodeData {
  stepId: string;
  stepType: StepType;
  label: string;
  subtitle?: string;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const StepNode = memo(({ data, selected }: NodeProps<StepNodeData>) => {
  const meta = STEP_META[data.stepType];
  const { Icon } = meta;
  return (
    <div
      onClick={data.onSelect}
      style={{ width: NODE_W }} // ← use constant, not w-52
      className={`${base} ${selected ? 'border-gray-900 shadow-sm' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: '50%', transform: 'translateX(-50%)' }} // ← always centered
        className="!w-2 !h-2 !bg-gray-300 !border-2 !border-white !top-[-5px]"
      />
      {/* Hover actions */}
      <div className="absolute -top-3 right-1.5 hidden group-hover:flex items-center gap-1 z-10">
        <button onClick={(e) => { e.stopPropagation(); data.onDuplicate(); }}
          className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:border-gray-400" title="Duplicate">
          <Copy size={10} className="text-gray-500" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:border-red-300 hover:bg-red-50" title="Delete">
          <Trash2 size={10} className="text-gray-400 hover:text-red-500" />
        </button>
      </div>
      <div className="px-3 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{meta.label}</p>
          <p className={`text-sm font-medium truncate leading-tight ${data.isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
            {data.label}
          </p>
          {data.subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{data.subtitle}</p>}
        </div>
        {data.hasError && <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: '50%', transform: 'translateX(-50%)' }} // ← always centered
        className="!w-2 !h-2 !bg-gray-300 !border-2 !border-white !bottom-[-5px]"
      />
    </div>
  );
});
StepNode.displayName = 'StepNode';

// ─── Branch Node ──────────────────────────────────────────────────────────────

export interface BranchNodeData {
  stepId: string;
  label: string;
  conditionSummary?: string;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const BranchNode = memo(({ data, selected }: NodeProps<BranchNodeData>) => {
  const { Icon } = STEP_META['branch'];
  return (
    <div
      onClick={data.onSelect}
      style={{ width: NODE_W }} // ← use constant, not w-52
      className={`${base} ${selected ? 'border-gray-900 shadow-sm' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: '50%', transform: 'translateX(-50%)' }} // ← always centered
        className="!w-2 !h-2 !bg-gray-300 !border-2 !border-white !top-[-5px]"
      />
      <div className="absolute -top-3 right-1.5 hidden group-hover:flex items-center gap-1 z-10">
        <button onClick={(e) => { e.stopPropagation(); data.onDuplicate(); }}
          className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:border-gray-400" title="Duplicate">
          <Copy size={10} className="text-gray-500" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:border-red-300 hover:bg-red-50" title="Delete">
          <Trash2 size={10} className="text-gray-400 hover:text-red-500" />
        </button>
      </div>
      <div className="px-3 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Branch</p>
          <p className="text-sm font-medium text-gray-900 truncate leading-tight">{data.label}</p>
          {data.conditionSummary && <p className="text-xs text-gray-400 mt-0.5">{data.conditionSummary}</p>}
        </div>
      </div>
      <Handle
        type="source"
        id="branch-out"
        position={Position.Bottom}
        style={{ left: '50%', transform: 'translateX(-50%)' }} // ← always centered
        className="!w-2 !h-2 !bg-gray-300 !border-2 !border-white !bottom-[-5px]"
      />
    </div>
  );
});
BranchNode.displayName = 'BranchNode';

// ─── Branch Pill Node ─────────────────────────────────────────────────────────

export interface BranchPillData {
  label: string;
  color: string;
  isElse?: boolean;
}

export const BranchPillNode = memo(({ data }: NodeProps<BranchPillData>) => (
  <div
    className="flex flex-col items-center"
    style={{ width: NODE_W_PILL }} // ← use constant, was hardcoded 80
  >
    <Handle
      type="target"
      position={Position.Top}
      style={{ left: '50%', transform: 'translateX(-50%)', opacity: 0, pointerEvents: 'none' }}
    />
    <div
      className="px-3 py-1 rounded-full text-xs font-medium text-white select-none whitespace-nowrap"
      style={{ backgroundColor: data.color }}
    >
      {data.label}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ left: '50%', transform: 'translateX(-50%)', opacity: 0, pointerEvents: 'none' }}
    />
  </div>
));
BranchPillNode.displayName = 'BranchPillNode';

// ─── Add Step Node ────────────────────────────────────────────────────────────

export interface AddStepNodeData {
  onAdd: () => void;
  color?: string;
}

export const AddStepNode = memo(({ data }: NodeProps<AddStepNodeData>) => {
  const c = data.color ?? '#d1d5db';
  return (
    <div
      onClick={data.onAdd}
      // style={{ width: NODE_W_ADD, height: NODE_W_ADD }} // ← use constant, not w-8 h-8
      className="rounded-full bg-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 group"
      style={{ border: `1.5px dashed ${c}`, width: NODE_W_ADD, height: NODE_W_ADD }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: '50%', transform: 'translateX(-50%)', opacity: 0, width: 4, height: 4 }}
      />
      <Plus size={14} style={{ color: c }} className="group-hover:scale-110 transition-transform" />
    </div>
  );
});
AddStepNode.displayName = 'AddStepNode';

// ─── Registry ─────────────────────────────────────────────────────────────────

export const nodeTypes = {
  triggerNode:    TriggerNode,
  stepNode:       StepNode,
  branchNode:     BranchNode,
  branchPillNode: BranchPillNode,
  addStepNode:    AddStepNode,
};