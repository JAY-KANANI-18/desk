import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  type ReactFlowInstance,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes } from "./canvas/nodes";
import { edgeTypes } from "./canvas/edges";
import { useWorkflow } from "./WorkflowContext";
import { TopBar } from "./canvas/TopBar";
import { TriggerPanel } from "./panels/TriggerPanel";
import { StepPanel } from "./panels/StepPanel";
import { AddStepMenu } from "./canvas/AddStepMenu";
import { CenterModal, MobileSheet } from "../../components/ui/modal";
import { Button } from "../../components/ui/Button";
import { AlertTriangle } from "@/components/ui/icons";
import {
  StepType,
  StepConfig,
  TriggerConfig,
  InsertCtx,
  type BranchConnectorData,
} from "./workflow.types";
import { STEP_META } from "./canvas/stepTypes";
import { useLocation, useNavigate, useParams } from "react-router";
import { useDisclosure } from "../../hooks/useDisclosure";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useChannel } from "../../context/ChannelContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  getStepNodePreview,
  type WorkflowNodePreview,
  type WorkflowCanvasStep,
  type WorkflowPreviewContext,
  type WorkflowPreviewTag,
  type WorkflowPreviewUser,
} from "./canvas/nodeSummaries";
import { DEFAULT_NODE_COLOR, getWorkflowNodeColor } from "./canvas/nodeColors";
import {
  getBranchConnectorDisplayName,
  orderBranchConnectors,
} from "./canvas/branchConnectors";
import {
  getStepValidationIssue,
  getWorkflowValidationWarnings,
} from "./canvas/nodeValidation";
import { workspaceApi } from "../../lib/workspaceApi";

/* ───────────────────────────────────────────────────────────────────────────
   layout.constants.ts
   Single source of truth for node dimensions.
   Both node components (nodes.tsx) and layout engine (buildGraph) import from here.
   Never hardcode these values anywhere else.
─────────────────────────────────────────────────────────────────────────── */
/* ───────────────────────────────────────────────────────────────────────────
   layout.constants.ts
   Single source of truth for node dimensions and spacing.
   Both node components (nodes.tsx) and layout engine (buildGraph) import from here.
   Never hardcode these values anywhere else.
─────────────────────────────────────────────────────────────────────────── */

// ── Node dimensions ──────────────────────────────────────────────────────────
export const NODE_W = 192; // TriggerNode, StepNode, BranchNode
export const NODE_H = 64; // compact normal node fallback
export const NODE_H_MAX = 112; // cap for expanded context previews
export const TRIGGER_NODE_H = 68;
export const NODE_W_PILL = 112; // BranchPillNode width
export const NODE_H_PILL = 22; // BranchPillNode height
export const NODE_W_ADD = 28; // AddStepNode width
export const NODE_H_ADD = 28; // AddStepNode height

// ── Spacing ───────────────────────────────────────────────────────────────────
export const H_GAP = 132; // min horizontal gap between siblings
export const H_SPACING = NODE_W + H_GAP; // one slot width

export const V_GAP = 52; // vertical gap between normal nodes
export const V_GAP_AFTER_PILL = 28; // tighter gap after a pill (pill is small)

// ── Canvas ────────────────────────────────────────────────────────────────────
export const NODE_X_CENTER = 400;
export const TRIGGER_Y = 80;
const FIT_VIEW_PADDING = 0.5;
const FIT_VIEW_MAX_ZOOM = 0.95;

type PendingNavigation =
  | { kind: "route"; to: string; replace?: boolean }
  | { kind: "external"; href: string }
  | { kind: "history-back" };

// ── Y calculator ──────────────────────────────────────────────────────────────
// Each node type has a different height, so Y depends on what came before it.
// Use these helpers so the gap is always based on the actual rendered height
// of the PARENT node, not a fixed level multiplier.

export function yAfterNormal(parentY: number, parentHeight = NODE_H): number {
  return parentY + parentHeight + V_GAP;
}

export function yAfterPill(parentY: number): number {
  return parentY + NODE_H_PILL + V_GAP_AFTER_PILL;
}

export function yAfterAdd(parentY: number): number {
  return parentY + NODE_H_ADD + V_GAP;
}

/* ───────────────────────────────────────────── */
// BUILD WORKFLOW MAP

type WorkflowGraphConfig = {
  steps?: WorkflowCanvasStep[];
  trigger?: TriggerConfig | null;
};

interface BuildGraphCallbacks {
  onSelectTrigger: () => void;
  onSelectStep: (id: string) => void;
  onDeleteStep: (id: string) => void;
  onCopyStep: (id: string) => void;
  onNavigateToStep: (id: string) => void;
  onInsert: (ctx: InsertCtx) => void;
  onPaste: (ctx: InsertCtx) => void;
  copiedStepLabel?: string;
}

function getNodeDataHeight(data: unknown) {
  if (typeof data !== "object" || data === null || !("height" in data)) {
    return undefined;
  }

  const height = (data as { height?: unknown }).height;
  return typeof height === "number" ? height : undefined;
}

function isPreviewChannel(
  value: unknown,
): value is WorkflowPreviewContext["channels"][number] {
  return typeof value === "object" && value !== null;
}

function getStepNumber(stepId: string, steps: WorkflowCanvasStep[]) {
  const visibleSteps = steps.filter((step) => step.type !== "branch_connector");
  const index = visibleSteps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index + 1 : undefined;
}

function getGraphStructureSignature(config: WorkflowGraphConfig) {
  const triggerType = config.trigger?.type ?? "none";
  const steps = config.steps ?? [];

  return [
    triggerType,
    steps
      .map((step) =>
        [
          step.id,
          step.type,
          step.parentId ?? "trigger",
          step.name,
        ].join(":"),
      )
      .join("|"),
  ].join("::");
}

function estimateNodeHeight(preview?: WorkflowNodePreview) {
  if (!preview) return NODE_H;

  const hasTokens = preview.tokens.length > 0;
  const textLength = preview.text?.length ?? 0;
  const needsTextLine = textLength > 0;
  const needsSecondTextLine = textLength > 50;

  if (preview.variant === "message") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 50 + textRows);
  }

  if (preview.variant === "question") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 48 + textRows);
  }

  if (preview.variant === "assignment") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 48 + textRows);
  }

  if (preview.variant === "branch") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 48 + textRows);
  }

  if (preview.variant === "plain") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 48 + textRows);
  }

  if (preview.variant === "jump") {
    return Math.min(NODE_H_MAX, 64);
  }

  if (preview.variant === "field") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    return Math.min(NODE_H_MAX, 62 + textRows);
  }

  if (preview.variant === "conversation") {
    const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
    const statusRow = preview.tokens.length > 0 ? 14 : 0;
    return Math.min(NODE_H_MAX, 48 + statusRow + textRows);
  }

  if (preview.variant === "tags") {
    const visibleRows = preview.tokens.length > 3
      ? 3
      : Math.min(3, Math.max(1, preview.tokens.length));
    return Math.min(136, 64 + visibleRows * 20);
  }

  const needsWrappedTokens = preview.tokens.length > 2;

  const base = 32;
  const label = 9;
  const tokenRows = hasTokens ? (needsWrappedTokens ? 34 : 18) : 0;
  const textRows = needsTextLine ? (needsSecondTextLine ? 28 : 14) : 0;
  const divider = hasTokens || needsTextLine ? 5 : 0;

  return Math.min(NODE_H_MAX, base + label + tokenRows + textRows + divider);
}

function buildWorkflow(raw: WorkflowGraphConfig) {
  const childrenMap = new Map<string, WorkflowCanvasStep[]>();

  raw?.steps?.forEach((s) => {
    const parent = s.parentId || "trigger";
    if (!childrenMap.has(parent)) childrenMap.set(parent, []);
    childrenMap.get(parent)!.push(s);
  });

  return { childrenMap };
}

type ConnectorOwnerStepType = Extract<
  StepType,
  "ask_question" | "branch" | "date_time"
>;

function isConnectorOwnerStepType(type: StepType): type is ConnectorOwnerStepType {
  return type === "ask_question" || type === "branch" || type === "date_time";
}

function cloneStepData(data: StepConfig["data"]): StepConfig["data"] {
  return JSON.parse(JSON.stringify(data)) as StepConfig["data"];
}

function getDefaultConnectorNames(type: ConnectorOwnerStepType) {
  const connectorNames: Record<ConnectorOwnerStepType, string[]> = {
    branch: ["Branch 1", "Else"],
    ask_question: ["Success", "Failure"],
    date_time: ["In Range", "Out of Range"],
  };

  return connectorNames[type];
}

function createConnectorId(prefix: string, index: number) {
  return `conn-${prefix}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

function withConnectorIds(
  data: StepConfig["data"],
  connectorIds: string[],
): StepConfig["data"] {
  return {
    ...(cloneStepData(data) as Record<string, unknown>),
    connectors: connectorIds,
  } as StepConfig["data"];
}

function cloneConnectorStep(
  connector: StepConfig,
  parentId: string,
  id: string,
): StepConfig {
  const data = cloneStepData(connector.data) as BranchConnectorData;

  return {
    ...connector,
    id,
    parentId,
    data: {
      ...data,
      conditions: (data.conditions ?? []).map((condition, index) => ({
        ...condition,
        id: `cond-${id}-${index}`,
      })),
    },
    position: { x: 0, y: 0 },
  };
}

function createDefaultConnectorStep(
  type: ConnectorOwnerStepType,
  parentId: string,
  id: string,
  name: string,
): StepConfig {
  return {
    id,
    type: "branch_connector",
    name,
    parentId,
    data:
      type === "branch" && name === "Else"
        ? { conditions: [], isElse: true }
        : { conditions: [] },
    position: { x: 0, y: 0 },
  };
}

function getConnectorTemplatesForStep(
  step: StepConfig,
  steps: StepConfig[],
): StepConfig[] {
  if (!isConnectorOwnerStepType(step.type)) {
    return [];
  }

  const connectors = steps.filter(
    (candidate) =>
      candidate.parentId === step.id && candidate.type === "branch_connector",
  );

  if (connectors.length > 0) {
    return step.type === "branch" ? orderBranchConnectors(connectors) : connectors;
  }

  return getDefaultConnectorNames(step.type).map((name, index) =>
    createDefaultConnectorStep(
      step.type,
      step.id,
      createConnectorId(`${step.id}-default`, index),
      name,
    ),
  );
}

function createPastedStep(
  template: StepConfig,
  parentId: string,
  steps: StepConfig[],
): { step: StepConfig; connectors: StepConfig[] } {
  const pastedStepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const connectorTemplates = getConnectorTemplatesForStep(template, steps);
  const connectors = isConnectorOwnerStepType(template.type)
    ? connectorTemplates.map((connector, index) =>
        cloneConnectorStep(
          connector,
          pastedStepId,
          createConnectorId(`${pastedStepId}-${connector.id}`, index),
        ),
      )
    : [];

  return {
    step: {
      ...template,
      id: pastedStepId,
      name: `${template.name} copy`,
      parentId,
      data: isConnectorOwnerStepType(template.type)
        ? withConnectorIds(
            template.data,
            connectors.map((connector) => connector.id),
          )
        : cloneStepData(template.data),
      position: { x: 0, y: 0 },
    },
    connectors,
  };
}

interface UnsavedChangesModalProps {
  open: boolean;
  isMobile: boolean;
  isSaving: boolean;
  onSaveAndLeave: () => void;
  onDiscard: () => void;
  onStay: () => void;
}

function UnsavedChangesModal({
  open,
  isMobile,
  isSaving,
  onSaveAndLeave,
  onDiscard,
  onStay,
}: UnsavedChangesModalProps) {
  const title = "Unsaved changes";
  const body = (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl  p-4">
       
        <div>
          <p className="text-sm font-semibold text-amber-950">
            Save workflow changes before leaving?
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-800">
            Your latest edits have not been saved yet.
          </p>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onStay}
        borderless
        title={<h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <Button onClick={onStay} disabled={isSaving} variant="secondary" fullWidth>
              Stay
            </Button>
            <Button onClick={onDiscard} disabled={isSaving} variant="danger-ghost" fullWidth>
              Discard changes
            </Button>
            <Button
              onClick={onSaveAndLeave}
              loading={isSaving}
              loadingMode="inline"
              variant="primary"
              fullWidth
            >
              Save and leave
            </Button>
          </div>
        }
      >
        <div className="p-4">{body}</div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onStay}
      title={title}
      headerIcon={
        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
          <AlertTriangle size={18} />
        </div>
      }
      size="sm"
      width={460}
      closeOnOverlayClick={false}
      showCloseButton={!isSaving}
      bodyPadding="lg"
      secondaryAction={
        <Button onClick={onStay} disabled={isSaving} variant="secondary">
          Stay
        </Button>
      }
      footerMeta={
        <Button onClick={onDiscard} disabled={isSaving} variant="danger-ghost">
          Discard changes
        </Button>
      }
      primaryAction={
        <Button
          onClick={onSaveAndLeave}
          loading={isSaving}
          loadingMode="inline"
          variant="primary"
        >
          Save and leave
        </Button>
      }
    >
      {body}
    </CenterModal>
  );
}

/* ───────────────────────────────────────────── */
// BUILD GRAPH

function buildGraph(
  raw: WorkflowGraphConfig,
  cb: BuildGraphCallbacks,
  previewContext: WorkflowPreviewContext,
) {
  const { childrenMap } = buildWorkflow(raw);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepById = new Map((raw.steps ?? []).map((step) => [step.id, step]));
  const connectorColorById = new Map<string, string>();

  function getAddStepNodeData(parentId: string, color: string) {
    return {
      color,
      copiedStepLabel: cb.copiedStepLabel,
      onAdd: () => cb.onInsert({ afterNodeId: parentId }),
      onPaste: cb.copiedStepLabel
        ? () => cb.onPaste({ afterNodeId: parentId })
        : undefined,
    };
  }

  function getEdgeColor(sourceId: string) {
    if (sourceId === "trigger") return getWorkflowNodeColor("trigger");

    const connectorColor = connectorColorById.get(sourceId);
    if (connectorColor) return connectorColor;

    const sourceStep = stepById.get(sourceId);
    return sourceStep ? getWorkflowNodeColor(sourceStep.type) : DEFAULT_NODE_COLOR;
  }

  function pushStepEdge(source: string, target: string, color = getEdgeColor(source)) {
    edges.push({
      id: `e-${source}-${target}`,
      source,
      target,
      type: "step",
      data: { color },
    });
  }

  // center X → React Flow top-left X
  function toLeftEdge(centerX: number, nodeType: "normal" | "pill" | "add") {
    if (nodeType === "pill") return centerX - NODE_W_PILL / 2;
    if (nodeType === "add") return centerX - NODE_W_ADD / 2;
    return centerX - NODE_W / 2;
  }

  console.log({ raw });

  // ── Trigger ──
  nodes.push({
    id: "trigger",
    type: "triggerNode",
    position: { x: toLeftEdge(NODE_X_CENTER, "normal"), y: TRIGGER_Y },
    width: NODE_W,
    data: {
      triggerType: raw?.trigger?.type ?? null,
      isConfigured: Boolean(raw?.trigger?.type),
      hasError: false,
      highlightPulse: previewContext.highlightStepId === "trigger",
      onSelect: cb.onSelectTrigger,
    },
  });

  const rootChildren = childrenMap.get("trigger") || [];
  console.log({ rootChildren });

  // ── Empty state ──
  if (rootChildren.length === 0) {
    const addId = "add-trigger";
    const addY = yAfterNormal(TRIGGER_Y, TRIGGER_NODE_H);

    nodes.push({
      id: addId,
      type: "addStepNode",
      position: { x: toLeftEdge(NODE_X_CENTER, "add"), y: addY },
      width: NODE_W_ADD,
      data: getAddStepNodeData("trigger", getEdgeColor("trigger")),
    });

    pushStepEdge("trigger", addId);

    return { nodes, edges };
  }

  // ── Subtree width in slots ──
  function getSubtreeWidth(nodeId: string): number {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 1;
    return children.reduce((sum, child) => sum + getSubtreeWidth(child.id), 0);
  }

  // ── Recursive renderer ──
  // parentY = actual top-left Y of parent node
  // parentType = type of parent so we know which Y gap to use
  function render(
    parentId: string,
    centerX: number,
    parentY: number,
    parentType: "normal" | "pill" | "add",
    parentHeight: number,
  ) {
    const children = childrenMap.get(parentId) || [];
    const totalWidth = children.reduce(
      (sum, c) => sum + getSubtreeWidth(c.id),
      0,
    );
    let currentX = centerX - (totalWidth * H_SPACING) / 2;

    // Y of children depends on parent's actual height
    const nodeY =
      parentType === "pill" ? yAfterPill(parentY) : yAfterNormal(parentY, parentHeight);

    children.forEach((step) => {
      const subtreeWidth = getSubtreeWidth(step.id);
      const nodeX = currentX + (subtreeWidth * H_SPACING) / 2;

      // ── BRANCH CONNECTOR (child of normal parent) ──
      if (step.type === "branch_connector") {
        const siblingConnectors = children.filter(
          (candidate) => candidate.type === "branch_connector",
        );
        const connectorIndex = siblingConnectors.findIndex(
          (candidate) => candidate.id === step.id,
        );

        nodes.push({
          id: step.id,
          type: "branchPillNode",
          position: { x: toLeftEdge(nodeX, "pill"), y: nodeY },
          width: NODE_W_PILL,
          data: {
            label: getBranchConnectorDisplayName(
              step,
              connectorIndex,
              siblingConnectors,
            ),
            onSelect: () => cb.onSelectStep(step.id),
          },
        });

        pushStepEdge(parentId, step.id);

        render(step.id, nodeX, nodeY, "pill", NODE_H_PILL);
        currentX += subtreeWidth * H_SPACING;
        return;
      }

      // ── NORMAL / BRANCH NODE ──
      const nodePreview = getStepNodePreview(step, previewContext);
      const validationIssue = getStepValidationIssue(step, previewContext.steps);
      const stepNumber = getStepNumber(step.id, previewContext.steps);
      const nodeHeight = estimateNodeHeight(nodePreview);

      nodes.push({
        id: step.id,
        type: step.type === "branch" ? "branchNode" : "stepNode",
        position: { x: toLeftEdge(nodeX, "normal"), y: nodeY },
        height: nodeHeight,
        width: NODE_W,
        data: {
          stepId: step.id,
          stepType: step.type,
          label: step.name,
          stepNumber,
          preview: nodePreview,
          height: nodeHeight,
          isConfigured: !validationIssue,
          hasError: Boolean(validationIssue),
          validationIssue,
          highlightPulse: previewContext.highlightStepId === step.id,
          onSelect: () => cb.onSelectStep(step.id),
          onDelete: () => cb.onDeleteStep(step.id),
          onCopy: () => cb.onCopyStep(step.id),
          onNavigateToStep: cb.onNavigateToStep,
        },
      });

      pushStepEdge(parentId, step.id);

      // ── BRANCH HANDLING ──
     // ── In buildGraph render(), update the NORMAL NODE section ─────────────────
// Replace the existing "BRANCH HANDLING" block with this expanded version:

// ── BRANCH / ASK_QUESTION / DATE_TIME: render named connectors ──
if (step.type === "branch" || step.type === "ask_question" || step.type === "date_time") {
  const rawConnectors = childrenMap.get(step.id) || [];
  const connectors =
    step.type === "branch"
      ? orderBranchConnectors(rawConnectors)
      : rawConnectors;
  const branchWidth = connectors.reduce(
    (sum, c) => sum + getSubtreeWidth(c.id),
    0,
  );
  let branchX = nodeX - (branchWidth * H_SPACING) / 2;

  connectors.forEach((conn, i) => {
    const connWidth = getSubtreeWidth(conn.id);
    const cx = branchX + (connWidth * H_SPACING) / 2;
    const connectorY = yAfterNormal(nodeY, nodeHeight);

    const color = getWorkflowNodeColor(step.type);
    connectorColorById.set(conn.id, color);

    nodes.push({
      id: conn.id,
      type: "branchPillNode",
      position: { x: toLeftEdge(cx, "pill"), y: connectorY },
      width: NODE_W_PILL,
      data: {
        label:
          step.type === "branch"
            ? getBranchConnectorDisplayName(conn, i, connectors)
            : conn.name,
        color,
        onSelect: () => cb.onSelectStep(conn.id),
      },
    });

    pushStepEdge(step.id, conn.id);

    const childSteps = childrenMap.get(conn.id) || [];

    // empty connector → add button
    if (childSteps.length === 0) {
      const addId = `add-${conn.id}`;
      const addY = yAfterPill(connectorY);

      nodes.push({
        id: addId,
        type: "addStepNode",
        position: { x: toLeftEdge(cx, "add"), y: addY },
        width: NODE_W_ADD,
        data: getAddStepNodeData(conn.id, color),
      });

      pushStepEdge(conn.id, addId, color);
    }

    render(conn.id, cx, connectorY, "pill", NODE_H_PILL);
    branchX += connWidth * H_SPACING;
  });

} else {
  // ── NORMAL NODE: recurse + add button if leaf ──
  render(step.id, nodeX, nodeY, "normal", nodeHeight);

  const hasChildren = (childrenMap.get(step.id) || []).length > 0;
  if (!hasChildren) {
    const addId = `add-${step.id}`;
    const addY = yAfterNormal(nodeY, nodeHeight);

    nodes.push({
      id: addId,
      type: "addStepNode",
      position: { x: toLeftEdge(nodeX, "add"), y: addY },
      width: NODE_W_ADD,
      data: getAddStepNodeData(step.id, getEdgeColor(step.id)),
    });

    pushStepEdge(step.id, addId);
  }
}

      currentX += subtreeWidth * H_SPACING;
    });
  }

  // start: trigger is a normal node at TRIGGER_Y
  render("trigger", NODE_X_CENTER, TRIGGER_Y, "normal", TRIGGER_NODE_H);

  return { nodes, edges };
}
/* ───────────────────────────────────────────── */
// DEFAULT DATA

function getDefaultStepData(type: StepType): StepConfig["data"] {
  switch (type) {
    case "send_message":
      return {
        channel: "last_interacted",
        defaultMessage: { type: "text", text: "" },
        channelResponses: [],
        addMessageFailureBranch: false,
      };
    case "ask_question":
      return {
        questionText: "",
        questionType: "text",
        multipleChoiceOptions: [],
        saveAsContactField: false,
        saveAsVariable: false,
        saveAsTag: false,
        addTimeoutBranch: false,
        timeoutValue: 7,
        timeoutUnit: "days",
        addMessageFailureBranch: false,
        connectors: [
          `conn-success-${Date.now()}`,
          `conn-failure-${Date.now()}`,
        ],
      };
    case "assign_to":
      return {
        action: "user_in_team",
        assignmentLogic: "round_robin",
        onlyOnlineUsers: false,
        addTimeoutBranch: false,
        timeoutValue: 7,
        timeoutUnit: "days",
      };
    case "branch":
      const id = Date.now();

      return {
        connectors: [`conn-${id}-branch-1`, `conn-${id}-else`],
      };
    case "update_contact_tag":
      return { action: "add", tags: [] };
    case "update_contact_field":
      return { fieldId: "", fieldName: "", value: "" };
    case "open_conversation":
      return {};
    case "close_conversation":
      return { addClosingNotes: false };
    case "add_comment":
      return { comment: "" };
    case "jump_to":
      return { targetStepId: "", maxJumps: 3 };
    case "wait":
      return { value: 1, unit: "hours" };
    case "trigger_another_workflow":
      return { targetWorkflowId: "", startFrom: "beginning" };
    case "date_time":
      return {
        timezone: "UTC",
        mode: "business_hours",
        businessHours: {},
        connectors: [
          `conn-inrange-${Date.now()}`,
          `conn-outofrange-${Date.now()}`,
        ],
      };
    case "http_request":
      return {
        method: "GET",
        url: "",
        headers: [],
        responseMappings: [],
        saveResponseStatus: false,
      };
    // case "add_google_sheets_row":
    //   return { columns: [] };
    // case "send_conversions_api_event":
    //   return { eventName: "" };
    // case "send_tiktok_lower_funnel_event":
    //   return { eventType: "" };
    default:
      return {};
  }
}

/* ───────────────────────────────────────────── */
// MAIN COMPONENT

export function WorkflowCanvas() {
  const isMobile = useIsMobile();
  const addMenu = useDisclosure();
  const insertCtxRef = useRef<InsertCtx | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const structureSignatureRef = useRef<string | null>(null);
  const stepCounter = useRef(1);
  const jumpHighlightTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const autoFitTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const currentUrlRef = useRef<string>("");
  const bypassUnsavedPromptRef = useRef(false);
  const browserBackGuardArmedRef = useRef(false);
  const { workflowId } = useParams(); // from URL :id
  const navigate = useNavigate();
  const location = useLocation();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const {
    state,
    loadWorkflow,
    selectNode,
    addStep,
    insertStepAfter,
    deleteStep,
    saveWorkflow,
    setNodes,
    setEdges,
  } = useWorkflow();
  const { channels: rawChannels } = useChannel() as { channels: unknown };
  const { workspaceUsers } = useWorkspace();
  const [workspaceTags, setWorkspaceTags] = useState<WorkflowPreviewTag[]>([]);
  const [jumpHighlightId, setJumpHighlightId] = useState<string | null>(null);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);

  const { workflow, selectedNodeId, selectedPanelType, isDirty } = state;
  const previewChannels = Array.isArray(rawChannels)
    ? rawChannels.filter(isPreviewChannel)
    : [];
  const previewUsers: WorkflowPreviewUser[] = workspaceUsers ?? [];
  const copiedStep =
    workflow?.config?.steps?.find(
      (step) => step.id === copiedStepId && step.type !== "branch_connector",
    ) ?? null;
  const copiedStepLabel = copiedStep
    ? STEP_META[copiedStep.type]?.label ?? copiedStep.name
    : undefined;
  const currentUrl = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search],
  );

  const loadWorkspaceTags = useCallback(async () => {
    try {
      const response = await workspaceApi.getTags();
      setWorkspaceTags(Array.isArray(response) ? response : []);
    } catch {
      setWorkspaceTags([]);
    }
  }, []);

  const handleCopyStep = useCallback(
    (stepId: string) => {
      const step = workflow?.config?.steps?.find((candidate) => candidate.id === stepId);
      if (!step || step.type === "branch_connector") {
        return;
      }

      setCopiedStepId(stepId);
    },
    [workflow?.config?.steps],
  );

  const handlePasteStep = useCallback(
    (ctx: InsertCtx) => {
      if (!workflow || !copiedStep) {
        return;
      }

      const { step, connectors } = createPastedStep(
        copiedStep,
        ctx.afterNodeId,
        workflow.config?.steps ?? [],
      );

      insertStepAfter(step, ctx.afterNodeId);
      connectors.forEach((connector) => addStep(connector));
      selectNode(step.id, "step");
      setCopiedStepId(null);
    },
    [addStep, copiedStep, insertStepAfter, selectNode, workflow],
  );

  const armBrowserBackGuard = useCallback(() => {
    if (
      typeof window === "undefined" ||
      browserBackGuardArmedRef.current ||
      !currentUrlRef.current
    ) {
      return;
    }

    window.history.pushState(
      { workflowUnsavedGuard: true },
      "",
      currentUrlRef.current,
    );
    browserBackGuardArmedRef.current = true;
  }, []);

  const proceedWithPendingNavigation = useCallback(
    (navigation: PendingNavigation) => {
      bypassUnsavedPromptRef.current = true;
      setPendingNavigation(null);

      if (navigation.kind === "route") {
        navigate(navigation.to, { replace: navigation.replace });
      } else if (navigation.kind === "external") {
        window.location.assign(navigation.href);
        return;
      } else {
        window.history.back();
      }

      window.setTimeout(() => {
        bypassUnsavedPromptRef.current = false;
      }, 500);
    },
    [navigate],
  );

  const requestNavigation = useCallback(
    (to: string, replace = false) => {
      if (!isDirty || bypassUnsavedPromptRef.current) {
        navigate(to, { replace });
        return;
      }

      setPendingNavigation({ kind: "route", to, replace });
    },
    [isDirty, navigate],
  );

  const handleStayOnWorkflow = useCallback(() => {
    setPendingNavigation(null);
    if (isDirty) {
      armBrowserBackGuard();
    }
  }, [armBrowserBackGuard, isDirty]);

  const handleDiscardAndLeave = useCallback(() => {
    if (!pendingNavigation) return;
    proceedWithPendingNavigation(pendingNavigation);
  }, [pendingNavigation, proceedWithPendingNavigation]);

  const handleSaveAndLeave = useCallback(async () => {
    if (!pendingNavigation) return;

    setIsSavingBeforeLeave(true);
    try {
      await saveWorkflow();
      proceedWithPendingNavigation(pendingNavigation);
    } catch (error) {
      console.error("Failed to save workflow before leaving", error);
    } finally {
      setIsSavingBeforeLeave(false);
    }
  }, [pendingNavigation, proceedWithPendingNavigation, saveWorkflow]);

  const setRenderedNodeHighlight = useCallback(
    (stepId: string, highlighted: boolean) => {
      setRfNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === stepId
            ? {
                ...node,
                data: {
                  ...node.data,
                  highlightPulse: highlighted,
                },
              }
            : node,
        ),
      );
    },
    [setRfNodes],
  );

  const centerStepOnCanvas = useCallback((stepId: string) => {
    const instance = reactFlowRef.current;
    const node = instance?.getNode(stepId);

    if (!instance || !node) {
      return;
    }

    const width = node.width ?? NODE_W;
    const height = node.height ?? getNodeDataHeight(node.data) ?? NODE_H;

    instance.setCenter(
      node.position.x + width / 2,
      node.position.y + height / 2,
      { zoom: 1, duration: 520 },
    );

    setJumpHighlightId(stepId);
    setRenderedNodeHighlight(stepId, true);

    if (jumpHighlightTimerRef.current) {
      window.clearTimeout(jumpHighlightTimerRef.current);
    }

    jumpHighlightTimerRef.current = window.setTimeout(() => {
      setJumpHighlightId((current) => (current === stepId ? null : current));
      setRenderedNodeHighlight(stepId, false);
      jumpHighlightTimerRef.current = null;
    }, 1800);
  }, [setRenderedNodeHighlight]);

  const scheduleFitView = useCallback((duration = 260) => {
    if (typeof window === "undefined") return;

    const fit = () => {
      reactFlowRef.current?.fitView({
        padding: FIT_VIEW_PADDING,
        duration,
        maxZoom: FIT_VIEW_MAX_ZOOM,
      });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        fit();

        if (autoFitTimerRef.current) {
          window.clearTimeout(autoFitTimerRef.current);
        }

        autoFitTimerRef.current = window.setTimeout(() => {
          fit();
          autoFitTimerRef.current = null;
        }, 180);
      });
    });
  }, []);

  useEffect(() => {
    currentUrlRef.current = currentUrl;
  }, [currentUrl]);

  useEffect(() => {
    if (!isDirty) return;
    armBrowserBackGuard();
  }, [armBrowserBackGuard, isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        bypassUnsavedPromptRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (
        !anchor ||
        anchor.target && anchor.target !== "_self" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);

      event.preventDefault();

      if (nextUrl.origin === window.location.origin) {
        const to = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        if (to !== currentUrlRef.current) {
          setPendingNavigation({ kind: "route", to });
        }
        return;
      }

      setPendingNavigation({ kind: "external", href: nextUrl.href });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;

    const handlePopState = () => {
      if (bypassUnsavedPromptRef.current) {
        return;
      }

      browserBackGuardArmedRef.current = false;
      setPendingNavigation({ kind: "history-back" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  useEffect(() => {
    if (!workflowId) return;
    console.log("Loading workflow with ID:", workflowId);

    loadWorkflow(workflowId);
  }, [workflowId, loadWorkflow]);

  useEffect(() => {
    if (copiedStepId && !copiedStep) {
      setCopiedStepId(null);
    }
  }, [copiedStep, copiedStepId]);

  useEffect(() => {
    void loadWorkspaceTags();
  }, [loadWorkspaceTags]);

  useEffect(() => () => {
    if (jumpHighlightTimerRef.current) {
      window.clearTimeout(jumpHighlightTimerRef.current);
    }
    if (autoFitTimerRef.current) {
      window.clearTimeout(autoFitTimerRef.current);
    }
  }, []);

  // build graph
  useEffect(() => {
    console.log("Building graph with steps:", workflow?.config?.steps);
    console.log({ workflow });

    if (!workflow) return;

    const graphConfig: WorkflowGraphConfig = {
      trigger: workflow.config?.trigger ?? null,
      steps: Array.isArray(workflow.config?.steps)
        ? (workflow.config.steps as WorkflowCanvasStep[])
        : [],
    };
    const structureSignature = getGraphStructureSignature(graphConfig);
    const isInitialStructure = structureSignatureRef.current === null;
    const shouldFitView =
      isInitialStructure || structureSignatureRef.current !== structureSignature;

    const { nodes, edges } = buildGraph(
      graphConfig,
      {
        onSelectTrigger: () => selectNode("trigger", "trigger"),
        onSelectStep: (id: string) => selectNode(id, "step"),
        onDeleteStep: (id: string) => deleteStep(id),
        onCopyStep: handleCopyStep,
        onNavigateToStep: centerStepOnCanvas,
        onInsert: (ctx: InsertCtx) => {
          insertCtxRef.current = ctx;
          addMenu.open();
        },
        onPaste: handlePasteStep,
        copiedStepLabel,
      },
      {
        channels: previewChannels,
        steps: graphConfig.steps ?? [],
        workspaceUsers: previewUsers,
        workspaceTags,
        highlightStepId: jumpHighlightId,
      },
    );

    setRfNodes([...nodes]);
    setRfEdges([...edges]);

    setNodes([...nodes]);
    setEdges([...edges]);
    structureSignatureRef.current = structureSignature;
    if (shouldFitView) {
      scheduleFitView(isInitialStructure ? 0 : 260);
    }
    console.log({ nodes, edges });
  }, [
    workflow,
    rawChannels,
    workspaceUsers,
    workspaceTags,
    jumpHighlightId,
    centerStepOnCanvas,
    scheduleFitView,
    handleCopyStep,
    handlePasteStep,
    copiedStepLabel,
  ]);

  // add step
  const handleAddStep = (type: StepType) => {
    const ctx = insertCtxRef.current;
    const baseId = Date.now();

    const newStep: StepConfig = {
      id: `step-${baseId}`,
      type,
      name: `${type} ${stepCounter.current++}`,
      data: getDefaultStepData(type),
      parentId: ctx?.afterNodeId || "trigger",
      position: { x: 0, y: 0 },
    };
    console.log({ ctx });

    // 🔥 HANDLE BRANCH SPECIAL CASE
    if (type === "branch" || type === "ask_question" || type === "date_time") {
      const connectors =
        "connectors" in newStep.data && Array.isArray(newStep.data.connectors)
          ? newStep.data.connectors
          : [];

      const connectorNames: Record<string, string[]> = {
        branch: ["Branch 1", "Else"],
        ask_question: ["Success", "Failure"],
        date_time: ["In Range", "Out of Range"],
      };

      const names =
        connectorNames[type] ??
        connectors.map((_, i) => `Branch ${i + 1}`);

      const connectorSteps: StepConfig[] = connectors.map((connId, i) => ({
        id: connId,
        type: "branch_connector",
        name: names[i] ?? `Path ${i + 1}`,
        parentId: newStep.id,
        data:
          type === "branch" && names[i] === "Else"
            ? { conditions: [], isElse: true }
            : { conditions: [] },
        position: { x: 0, y: 0 },
      }));

      // insert branch
      insertStepAfter(newStep, newStep.parentId);

      // insert connectors
      connectorSteps.forEach((c) => addStep(c));
    } else {
      if (ctx) insertStepAfter(newStep, ctx.afterNodeId);
      else addStep(newStep);
    }

    selectNode(newStep.id, "step");
    addMenu.close();
    insertCtxRef.current = null;
    return;
  };
  const handleBack = () => {
    requestNavigation("/workflows");
  };

  const selectedStep =
    workflow?.config?.steps?.find((s) => s.id === selectedNodeId) ?? null;

  const validationWarnings = useMemo(
    () =>
      getWorkflowValidationWarnings({
        trigger: workflow?.config?.trigger ?? null,
        steps: workflow?.config?.steps ?? [],
      }),
    [workflow?.config?.trigger, workflow?.config?.steps],
  );

  const closeSelectedPanel = useCallback(() => {
    selectNode(null, null);
  }, [selectNode]);

  const selectedPanelTitle =
    selectedPanelType === "trigger"
      ? {
          eyebrow: "Workflow",
          title: "Trigger",
          subtitle: "Choose the event that starts this workflow",
        }
      : selectedPanelType === "step" && selectedStep
        ? {
            eyebrow: "Step configuration",
            title: STEP_META[selectedStep.type]?.label ?? selectedStep.name,
            subtitle: STEP_META[selectedStep.type]?.description,
          }
        : null;

  const selectedPanelContent =
    selectedPanelType === "trigger" ? (
      <TriggerPanel hideHeader={isMobile} />
    ) : selectedPanelType === "step" && selectedStep ? (
      <StepPanel step={selectedStep} hideHeader={isMobile} />
    ) : null;

  return (
    <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
      <TopBar
        onBack={handleBack}
        warnings={validationWarnings}
        onWarningClick={centerStepOnCanvas}
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => {
              reactFlowRef.current = instance;
            }}
            fitView
            fitViewOptions={{ padding: FIT_VIEW_PADDING, maxZoom: FIT_VIEW_MAX_ZOOM }}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            edgesUpdatable={false}
            selectNodesOnDrag={false}
            deleteKeyCode={null}
            multiSelectionKeyCode={null}
          >
            <Background variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>
        </div>

        {!isMobile && selectedPanelContent && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200">
            {selectedPanelContent}
          </div>
        )}
      </div>

      {isMobile && selectedPanelContent && selectedPanelTitle ? (
        <MobileSheet
          isOpen
          onClose={closeSelectedPanel}
          fullScreen
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {selectedPanelTitle.eyebrow}
              </p>
              <h2 className="mt-1 truncate text-base font-semibold text-slate-900">
                {selectedPanelTitle.title}
              </h2>
              {selectedPanelTitle.subtitle ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                  {selectedPanelTitle.subtitle}
                </p>
              ) : null}
            </div>
          }
        >
          {selectedPanelContent}
        </MobileSheet>
      ) : null}

      {addMenu.isOpen && (
        <AddStepMenu
          onSelect={handleAddStep}
          onClose={() => {
            addMenu.close();
            insertCtxRef.current = null;
          }}
        />
      )}

      <UnsavedChangesModal
        open={Boolean(pendingNavigation)}
        isMobile={isMobile}
        isSaving={isSavingBeforeLeave || state.isSaving}
        onSaveAndLeave={() => {
          void handleSaveAndLeave();
        }}
        onDiscard={handleDiscardAndLeave}
        onStay={handleStayOnWorkflow}
      />
    </div>
  );
}
