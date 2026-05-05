import React, { memo } from 'react';
import { EdgeProps, getStraightPath, BaseEdge, EdgeLabelRenderer,getSmoothStepPath } from 'reactflow';
import { Plus } from '@/components/ui/icons';
import { IconButton } from '../../../../components/ui/button/IconButton';

export const BRANCH_COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
];
export const ELSE_COLOR = '#9ca3af';

// ─── 1. AddButtonEdge — straight line + mid + button (main chain / arm steps) ─

export interface AddButtonEdgeData {
  onAdd: () => void;
  color?: string;
  dashed?: boolean;
}
export const AddButtonEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<AddButtonEdgeData>) => {

  const color  = data?.color ?? '#d1d5db';
  const dashed = data?.dashed ?? false;

  const [path, mx, my] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 1.5,
          strokeDasharray: dashed ? '5 4' : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${mx}px,${my}px)`,
            pointerEvents: 'all',
            zIndex: 10,
          }}
        >
          <IconButton
            aria-label="Add step"
            icon={<Plus size={10} />}
            size="2xs"
            radius="full"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              data?.onAdd?.();
            }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
AddButtonEdge.displayName = 'AddButtonEdge';

// ─── 2. PlainEdge — no button, no label (edge INTO branch node) ──────────────

export const PlainEdge = memo(({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) => {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge  id={id} path={path} style={{ stroke: '#d1d5db', strokeWidth: 1.5 }} />;
});
PlainEdge.displayName = 'PlainEdge';

// ─── 3. ArmStepEdge — colored + mid button (between arm steps) ───────────────

export interface ArmStepEdgeData { onAdd: () => void; color: string; dashed?: boolean; }

export const ArmStepEdge = memo(({
  id, sourceX, sourceY, targetX, targetY, data,
}: EdgeProps<ArmStepEdgeData>) => {
  const color  = data?.color  ?? ELSE_COLOR;
  const dashed = data?.dashed ?? false;
  const [path, mx, my] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: 1.5, strokeDasharray: dashed ? '5 4' : undefined }} />
      <EdgeLabelRenderer>
        <div className="nodrag nopan" style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${mx}px,${my}px)`, pointerEvents: 'all', zIndex: 10 }}>
          <IconButton
            aria-label="Add branch step"
            icon={<Plus size={10} style={{ color }} />}
            size="2xs"
            radius="full"
            variant="secondary"
            onClick={e => { e.stopPropagation(); data?.onAdd?.(); }}
            style={{ border: `1.5px solid ${color}` }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
ArmStepEdge.displayName = 'ArmStepEdge';

// ─── 4. BranchFanEdge — draws the entire orthogonal fan-out as ONE edge ───────
//
// This single edge is placed from the branch node to a virtual target at the
// bottom-center of the fan-out area. It draws:
//   • vertical stem down from branch box
//   • horizontal bar spanning all arm columns
//   • vertical drop + label pill for each arm
//
// All arm geometry is passed via `data`.

export interface ArmInfo {
  id: string;
  name: string;
  color: string;
  centerX: number;       // graph-space X center of this arm
}

export interface BranchFanEdgeData {
  arms: ArmInfo[];
  hBarY: number;         // graph-space Y of horizontal bar
  armDropY: number;      // graph-space Y where vertical drops end (top of arm nodes)
}

export const BranchFanEdge = memo(({
  id, sourceX, sourceY, data,
}: EdgeProps<BranchFanEdgeData>) => {
  if (!data) return null;
  const { arms, hBarY, armDropY } = data;
  if (!arms || arms.length === 0) return null;

  const leftX  = arms[0].centerX;
  const rightX = arms[arms.length - 1].centerX;

  // SVG path for the whole fan-out structure:
  // 1. Vertical stem: sourceY → hBarY at sourceX
  // 2. Horizontal bar: leftX → rightX at hBarY
  // Per-arm: vertical drop from hBarY → armDropY at arm.centerX

  const stemPath = `M ${sourceX} ${sourceY} L ${sourceX} ${hBarY}`;
  const barPath  = `M ${leftX} ${hBarY} L ${rightX} ${hBarY}`;

  return (
    <>
      {/* Stem */}
      <path d={stemPath} stroke="#d1d5db" strokeWidth={1.5} fill="none" />
      {/* Horizontal bar */}
      <path d={barPath} stroke="#d1d5db" strokeWidth={1.5} fill="none" />

      {/* Per-arm: vertical drop + label pill */}
   {arms.map((arm) => {
const dropPath = `M ${arm.centerX} ${hBarY} L ${arm.centerX} ${armDropY + 28}`;
  const labelY = hBarY + (armDropY - hBarY) * 0.42;
  const plusY = armDropY + 18;

  const pillW = Math.max(arm.name.length * 7 + 20, 48);
  const pillH = 20;

  return (
    <g key={arm.id}>
      {/* vertical branch line */}
      <path d={dropPath} stroke={arm.color} strokeWidth={1.5} fill="none" />

      {/* label */}
      <rect
        x={arm.centerX - pillW / 2}
        y={labelY - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={arm.color}
      />

      <text
        x={arm.centerX}
        y={labelY + 4}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        fontWeight={600}
        fontFamily="system-ui,sans-serif"
      >
        {arm.name}
      </text>

  
    </g>
  );
})}
    </>
  );
});
BranchFanEdge.displayName = 'BranchFanEdge';



export interface StepEdgeData {
  color?: string;
  dashed?: boolean;
}

function getRoundedStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
) {
  const isVertical = Math.abs(sourceX - targetX) < 1;
  if (isVertical) return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  const verticalGap = Math.abs(targetY - sourceY);
  const midY = sourceY + Math.max(22, Math.min(56, verticalGap / 2));
  const horizontalDirection = targetX > sourceX ? 1 : -1;
  const verticalDirection = targetY > sourceY ? 1 : -1;
  const radius = Math.min(
    12,
    Math.abs(targetX - sourceX) / 2,
    Math.abs(midY - sourceY) / 2,
    Math.abs(targetY - midY) / 2,
  );

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${midY - verticalDirection * radius}`,
    `Q ${sourceX} ${midY} ${sourceX + horizontalDirection * radius} ${midY}`,
    `L ${targetX - horizontalDirection * radius} ${midY}`,
    `Q ${targetX} ${midY} ${targetX} ${midY + verticalDirection * radius}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}

export function StepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  data,
}: EdgeProps<StepEdgeData>) {
  const color = data?.color ?? '#cbd5e1';
  const edgePath = getRoundedStepPath(sourceX, sourceY, targetX, targetY);

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: color,
        strokeWidth: 1.8,
        strokeDasharray: data?.dashed ? '5 4' : undefined,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    />
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const edgeTypes = {
  step:          StepEdge,
  addButtonEdge: AddButtonEdge,
  plainEdge:     PlainEdge,
  stepEdge:      StepEdge,
  armStepEdge:   ArmStepEdge,
  branchFanEdge: BranchFanEdge,
};
