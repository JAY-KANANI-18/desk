import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AlertCircle, Trash2, Copy, Plus, Zap } from '@/components/ui/icons';
import { TRIGGER_META } from '../triggerTypes';
import { STEP_META } from '../stepTypes';
import { StepType, TriggerType } from '../../workflow.types';
import { NODE_W, NODE_W_PILL, NODE_W_ADD } from '../../WorkflowCanvas';
import { IconButton } from '../../../../components/ui/button/IconButton';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { Tag as UiTag } from '../../../../components/ui/Tag';
import type { WorkflowNodePreview, WorkflowNodePreviewToken } from '../nodeSummaries';
import { getWorkflowNodeColor } from '../nodeColors';
import { getQuestionTypeVisual } from '../../questionTypeVisuals';

const base = 'relative group bg-white border rounded-md cursor-pointer select-none transition-all duration-150 hover:shadow-md';

function withAlpha(color: string, alpha: string) {
  return color.startsWith('#') && color.length === 7 ? `${color}${alpha}` : color;
}

function getCardStyle(color: string, selected: boolean, highlighted = false): React.CSSProperties {
  if (highlighted) {
    return {
      width: NODE_W,
      borderColor: '#facc15',
      boxShadow: '0 0 0 3px rgba(250, 204, 21, 0.36), 0 10px 24px rgba(202, 138, 4, 0.18)',
    };
  }

  return {
    width: NODE_W,
    borderColor: selected ? color : '#e5e7eb',
    boxShadow: selected
      ? `0 0 0 1px ${color}, 0 8px 20px ${withAlpha(color, '18')}`
      : undefined,
  };
}

function getHandleStyle(color: string): React.CSSProperties {
  return {
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: color,
    borderColor: '#ffffff',
    opacity: 0,
    pointerEvents: 'none',
  };
}

function NodeActionButton({
  label,
  icon,
  tone = 'default',
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone?: 'default' | 'danger';
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip content={label}>
      <span className="inline-flex">
        <IconButton
          aria-label={label}
          icon={icon}
          size="2xs"
          variant="secondary"
          style={{
            backgroundColor: '#ffffff',
            borderColor: tone === 'danger' ? '#fecaca' : '#d1d5db',
            color: tone === 'danger' ? '#dc2626' : '#334155',
            boxShadow: '0 3px 10px rgba(15, 23, 42, 0.12)',
          }}
          onClick={onClick}
        />
      </span>
    </Tooltip>
  );
}

function getPreviewTitle(preview?: WorkflowNodePreview) {
  if (!preview) return undefined;
  return [
    preview.label,
    preview.tokens.map((token) => token.label).join(' '),
    preview.text,
  ].filter(Boolean).join(': ');
}

function getStepHeading(label: string, fallbackLabel: string, stepNumber?: number) {
  if (stepNumber) return `${fallbackLabel} #${stepNumber}`;
  return label || fallbackLabel;
}

function PreviewToken({ token }: { token: WorkflowNodePreviewToken }) {
  if (token.kind === 'tag') {
    return (
      <UiTag
        label={token.label}
        size="sm"
        bgColor={token.bgColor ?? 'tag-indigo'}
        textColor={token.textColor}
        emoji={token.emoji}
        maxWidth={74}
        className="h-4 !gap-1 !rounded !px-1.5 !py-0 !text-[9px]"
      />
    );
  }

  return (
    <span
      className="inline-flex h-4 max-w-[96px] shrink-0 items-center gap-1 rounded border border-gray-200 bg-white px-1.5 text-[9px] font-medium leading-none text-gray-700"
      title={token.label}
    >
      {token.iconUrl ? (
        <img
          src={token.iconUrl}
          alt=""
          className="h-3 w-3 shrink-0 rounded-sm object-contain"
        />
      ) : null}
      <span className="min-w-0 truncate">{token.label}</span>
    </span>
  );
}

function NodePreview({
  preview,
  onNavigateToStep,
}: {
  preview?: WorkflowNodePreview;
  onNavigateToStep?: (stepId: string) => void;
}) {
  if (!preview || (preview.tokens.length === 0 && !preview.text)) return null;

  if (preview.variant === 'message') {
    const channelToken = preview.tokens.find((token) => token.kind === 'channel');

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <div className="flex min-w-0 items-start gap-2">
          {channelToken?.iconUrl ? (
            <img
              src={channelToken.iconUrl}
              alt=""
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-sm object-contain"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] leading-[14px] text-gray-600">Message:</p>
            {preview.text ? (
              <p
                className="min-w-0 text-[10px] italic leading-[14px] text-gray-700"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                {preview.text}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (preview.variant === 'question') {
    const answerTypeToken = preview.tokens[0];
    const questionTypeVisual = getQuestionTypeVisual(answerTypeToken?.value);
    const QuestionTypeIcon = questionTypeVisual.Icon;

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <div className="flex min-w-0 items-center gap-2">
          <QuestionTypeIcon
            size={16}
            className="flex-shrink-0"
            style={{ color: questionTypeVisual.color }}
            title={answerTypeToken?.label}
          />
          {preview.text ? (
            <p
              className="min-w-0 text-[10px] italic leading-[14px] text-gray-700"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
              }}
            >
              {preview.text}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (preview.variant === 'assignment' || preview.variant === 'branch' || preview.variant === 'plain') {
    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <p
          className="min-w-0 text-[10px] leading-[14px] text-gray-700"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {preview.text}
        </p>
      </div>
    );
  }

  if (preview.variant === 'field') {
    const fieldToken = preview.tokens[0];

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <p className="min-w-0 truncate text-[10px] leading-[14px] text-gray-700">
          Field: {fieldToken?.label ?? 'Select field'}
        </p>
        <p
          className="mt-1 min-w-0 text-[10px] leading-[14px] text-gray-700"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {preview.text}
        </p>
      </div>
    );
  }

  if (preview.variant === 'conversation') {
    const statusToken = preview.tokens[0];

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        {statusToken ? (
          <p className="mb-1 min-w-0 truncate text-[10px] leading-[14px] text-gray-700">
            Category: {statusToken.label}
          </p>
        ) : null}
        <p
          className="min-w-0 text-[10px] leading-[14px] text-gray-700"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {preview.text}
        </p>
      </div>
    );
  }

  if (preview.variant === 'tags') {
    const visibleTokens =
      preview.tokens.length > 3
        ? preview.tokens.slice(0, 2)
        : preview.tokens.slice(0, 3);
    const hiddenCount = preview.tokens.length - visibleTokens.length;

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <p className="min-w-0 truncate text-[10px] leading-[14px] text-gray-700">
          Action: {preview.text}
        </p>
        <div className="mt-1.5 flex max-h-[68px] min-w-0 flex-wrap items-center gap-1 overflow-hidden">
          {visibleTokens.map((token, index) => (
            <UiTag
              key={`${token.label}-${index}`}
              label={token.label}
              emoji={token.emoji}
              bgColor={token.bgColor ?? 'tag-grey'}
              textColor={token.textColor}
              size="sm"
              maxWidth={132}
              className="h-[18px] !rounded !px-2 !py-0 !text-[10px]"
            />
          ))}
          {hiddenCount > 0 ? (
            <span className="inline-flex h-[18px] items-center rounded border border-gray-200 bg-white px-2 text-[10px] font-medium leading-none text-gray-600">
              +{hiddenCount}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (preview.variant === 'jump') {
    const targetToken = preview.tokens[0];
    const targetStepId = targetToken?.value;

    return (
      <div className="mt-1.5 border-t border-gray-200 pt-2" title={getPreviewTitle(preview)}>
        <p className="text-[10px] leading-[14px] text-gray-600">Jump to</p>
        {targetStepId ? (
          <button
            type="button"
            className="block max-w-full truncate text-left text-[10px] font-semibold leading-[14px] text-blue-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            onClick={(event) => {
              event.stopPropagation();
              onNavigateToStep?.(targetStepId);
            }}
            title={targetToken.label}
          >
            {targetToken.label}
          </button>
        ) : (
          <p className="min-w-0 truncate text-[10px] leading-[14px] text-gray-400">
            {preview.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1.5 border-t border-gray-200 pt-1.5" title={getPreviewTitle(preview)}>
      <p className="mb-1 text-[8px] font-bold uppercase leading-none tracking-wider text-gray-500">
        {preview.label}:
      </p>
      <div className="flex max-h-[54px] min-w-0 flex-wrap items-center gap-1 overflow-hidden">
        {preview.tokens.slice(0, 3).map((token, index) => (
          <PreviewToken key={`${token.label}-${index}`} token={token} />
        ))}
        {preview.text ? (
          <p
            className="min-w-0 basis-full text-[10px] leading-[14px] text-gray-700"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {preview.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Trigger Node ─────────────────────────────────────────────────────────────

export interface TriggerNodeData {
  triggerType: TriggerType | null;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
}

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const meta = data.triggerType ? TRIGGER_META[data.triggerType] : null;
  const HeaderIcon = Zap;
  const EventIcon = meta?.Icon;
  const color = getWorkflowNodeColor('trigger');
  return (
    <div
      onClick={data.onSelect}
      style={{ ...getCardStyle(color, selected), borderStyle: data.hasError ? 'dashed' : 'solid' }}
      className={base}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
          <HeaderIcon
            size={16}
            style={{ color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`truncate text-xs font-semibold leading-tight ${data.isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
            Trigger
          </p>
        </div>
        {!data.isConfigured && <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />}
      </div>
      <div className="border-t border-gray-200 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {EventIcon ? (
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
              <EventIcon size={13} className="text-gray-500" />
            </div>
          ) : null}
          <p className={`min-w-0 truncate text-[10px] leading-[14px] ${data.isConfigured ? 'text-gray-700' : 'text-gray-400'}`}>
            {meta?.label ?? 'No trigger selected'}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={getHandleStyle(color)}
        className="!bottom-[-5px] !h-2 !w-2 !border-2"
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
  stepNumber?: number;
  preview?: WorkflowNodePreview;
  height?: number;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onNavigateToStep?: (stepId: string) => void;
  highlightPulse?: boolean;
}

export const StepNode = memo(({ data, selected }: NodeProps<StepNodeData>) => {
  const meta = STEP_META[data.stepType];
  const { Icon } = meta;
  const color = getWorkflowNodeColor(data.stepType);
  return (
    <div
      onClick={data.onSelect}
      style={getCardStyle(color, selected, data.highlightPulse)}
      className={`${base} ${data.highlightPulse ? 'animate-pulse' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={getHandleStyle(color)}
        className="!top-[-5px] !h-2 !w-2 !border-2"
      />
      {/* Hover actions */}
      <div className="absolute -top-3 right-1.5 hidden group-hover:flex items-center gap-1 z-10">
        <NodeActionButton
          label="Duplicate"
          icon={<Copy size={10} />}
          onClick={(e) => { e.stopPropagation(); data.onDuplicate(); }}
        />
        <NodeActionButton
          label="Delete"
          icon={<Trash2 size={10} />}
          tone="danger"
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
        />
      </div>
      <div className="px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <Icon size={15} style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-xs font-semibold leading-tight ${data.isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
              {getStepHeading(data.label, meta.label, data.stepNumber)}
            </p>
          </div>
          {data.hasError && <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />}
        </div>
        <NodePreview preview={data.preview} onNavigateToStep={data.onNavigateToStep} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={getHandleStyle(color)}
        className="!bottom-[-5px] !h-2 !w-2 !border-2"
      />
    </div>
  );
});
StepNode.displayName = 'StepNode';

// ─── Branch Node ──────────────────────────────────────────────────────────────

export interface BranchNodeData {
  stepId: string;
  label: string;
  stepNumber?: number;
  preview?: WorkflowNodePreview;
  height?: number;
  isConfigured: boolean;
  hasError: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onNavigateToStep?: (stepId: string) => void;
  highlightPulse?: boolean;
}

export const BranchNode = memo(({ data, selected }: NodeProps<BranchNodeData>) => {
  const { Icon } = STEP_META['branch'];
  const color = getWorkflowNodeColor('branch');
  return (
    <div
      onClick={data.onSelect}
      style={getCardStyle(color, selected, data.highlightPulse)}
      className={`${base} ${data.highlightPulse ? 'animate-pulse' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={getHandleStyle(color)}
        className="!top-[-5px] !h-2 !w-2 !border-2"
      />
      <div className="absolute -top-3 right-1.5 hidden group-hover:flex items-center gap-1 z-10">
        <NodeActionButton
          label="Duplicate"
          icon={<Copy size={10} />}
          onClick={(e) => { e.stopPropagation(); data.onDuplicate(); }}
        />
        <NodeActionButton
          label="Delete"
          icon={<Trash2 size={10} />}
          tone="danger"
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
        />
      </div>
      <div className="px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <Icon size={15} style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight text-gray-900">
              {getStepHeading(data.label, 'Branch', data.stepNumber)}
            </p>
          </div>
        </div>
        <NodePreview preview={data.preview} onNavigateToStep={data.onNavigateToStep} />
      </div>
      <Handle
        type="source"
        id="branch-out"
        position={Position.Bottom}
        style={getHandleStyle(color)}
        className="!bottom-[-5px] !h-2 !w-2 !border-2"
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
      className="inline-flex h-5 max-w-full items-center rounded-md border px-2.5 text-[10px] font-semibold leading-none select-none whitespace-nowrap"
      style={{
        backgroundColor: '#ffffff',
        borderColor: withAlpha(data.color, '55'),
        color: data.color,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
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
      className="rounded-full bg-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 group shadow-sm"
      style={{ border: `1.5px dashed ${c}`, width: NODE_W_ADD, height: NODE_W_ADD, boxShadow: `0 4px 12px ${withAlpha(c, '18')}` }}
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
