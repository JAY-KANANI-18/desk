import React, { useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
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
import { StepType, StepConfig, TriggerConfig, InsertCtx, Step } from "./workflow.types";
import { useNavigate, useParams } from "react-router";
import { useDisclosure } from "../../hooks/useDisclosure";
import { useIsMobile } from "../../hooks/useIsMobile";

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
export const NODE_W = 208; // w-52 = 208px  (TriggerNode, StepNode, BranchNode)
export const NODE_H = 72; // normal node height
export const NODE_W_PILL = 140; // BranchPillNode width
export const NODE_H_PILL = 28; // BranchPillNode height
export const NODE_W_ADD = 32; // w-8 = 32px (AddStepNode)
export const NODE_H_ADD = 32; // h-8

// ── Spacing ───────────────────────────────────────────────────────────────────
export const H_GAP = 40; // min horizontal gap between siblings
export const H_SPACING = NODE_W + H_GAP; // 248px — one slot width

export const V_GAP = 24; // vertical gap between normal nodes
export const V_GAP_AFTER_PILL = 12; // tighter gap after a pill (pill is small)

// ── Canvas ────────────────────────────────────────────────────────────────────
export const NODE_X_CENTER = 400;
export const TRIGGER_Y = 80;

// ── Y calculator ──────────────────────────────────────────────────────────────
// Each node type has a different height, so Y depends on what came before it.
// Use these helpers so the gap is always based on the actual rendered height
// of the PARENT node, not a fixed level multiplier.

export function yAfterNormal(parentY: number): number {
  return parentY + NODE_H + V_GAP;
}

export function yAfterPill(parentY: number): number {
  return parentY + NODE_H_PILL + V_GAP_AFTER_PILL;
}

export function yAfterAdd(parentY: number): number {
  return parentY + NODE_H_ADD + V_GAP;
}

/* ───────────────────────────────────────────── */
// BUILD WORKFLOW MAP

function buildWorkflow(raw: { steps: Step[] }) {
  const childrenMap = new Map<string, Step[]>();

  raw?.steps?.forEach((s) => {
    const parent = s.parentId || "trigger";
    if (!childrenMap.has(parent)) childrenMap.set(parent, []);
    childrenMap.get(parent)!.push(s);
  });

  return { childrenMap };
}

/* ───────────────────────────────────────────── */
// BUILD GRAPH

function buildGraph(raw: { steps: Step[]; trigger: TriggerConfig }, cb: any) {
  const { childrenMap } = buildWorkflow(raw);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

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
      triggerType: raw?.trigger?.type || "conversationOpened",
      isConfigured: true,
      hasError: false,
      onSelect: cb.onSelectTrigger,
    },
  });

  const rootChildren = childrenMap.get("trigger") || [];
  console.log({ rootChildren });

  // ── Empty state ──
  if (rootChildren.length === 0) {
    const addId = "add-trigger";
    const addY = yAfterNormal(TRIGGER_Y);

    nodes.push({
      id: addId,
      type: "addStepNode",
      position: { x: toLeftEdge(NODE_X_CENTER, "add"), y: addY },
      width: NODE_W_ADD,
      data: { onAdd: () => cb.onInsert({ afterNodeId: "trigger" }) },
    });

    edges.push({
      id: "e-trigger-add",
      source: "trigger",
      target: addId,
      type: "step",
    });

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
  ) {
    const children = childrenMap.get(parentId) || [];
    const totalWidth = children.reduce(
      (sum, c) => sum + getSubtreeWidth(c.id),
      0,
    );
    let currentX = centerX - (totalWidth * H_SPACING) / 2;

    // Y of children depends on parent's actual height
    const nodeY =
      parentType === "pill" ? yAfterPill(parentY) : yAfterNormal(parentY);

    children.forEach((step) => {
      const subtreeWidth = getSubtreeWidth(step.id);
      const nodeX = currentX + (subtreeWidth * H_SPACING) / 2;

      // ── BRANCH CONNECTOR (child of normal parent) ──
      if (step.type === "branch_connector") {
        nodes.push({
          id: step.id,
          type: "branchPillNode",
          position: { x: toLeftEdge(nodeX, "pill"), y: nodeY },
          width: NODE_W_PILL,
          data: {
            label: step.name,
            onSelect: () => cb.onSelectStep(step.id),
          },
        });

        edges.push({
          id: `e-${parentId}-${step.id}`,
          source: parentId,
          target: step.id,
          type: "step",
        });

        render(step.id, nodeX, nodeY, "pill");
        currentX += subtreeWidth * H_SPACING;
        return;
      }

      // ── NORMAL / BRANCH NODE ──
      nodes.push({
        id: step.id,
        type: step.type === "branch" ? "branchNode" : "stepNode",
        position: { x: toLeftEdge(nodeX, "normal"), y: nodeY },
        width: NODE_W,
        data: {
          stepId: step.id,
          stepType: step.type,
          label: step.name,
          isConfigured: true,
          hasError: false,
          onSelect: () => cb.onSelectStep(step.id),
          onDelete: () => cb.onDeleteStep(step.id),
          onDuplicate: () => cb.onDuplicateStep(step.id),
        },
      });

      edges.push({
        id: `e-${parentId}-${step.id}`,
        source: parentId,
        target: step.id,
        type: "step",
      });

      // ── BRANCH HANDLING ──
     // ── In buildGraph render(), update the NORMAL NODE section ─────────────────
// Replace the existing "BRANCH HANDLING" block with this expanded version:

// ── BRANCH / ASK_QUESTION / DATE_TIME: render named connectors ──
if (step.type === "branch" || step.type === "ask_question" || step.type === "date_time") {
  const connectors = childrenMap.get(step.id) || [];
  const branchWidth = connectors.reduce(
    (sum, c) => sum + getSubtreeWidth(c.id),
    0,
  );
  let branchX = nodeX - (branchWidth * H_SPACING) / 2;

  // pill colors per step type
  const pillColor: Record<string, Record<string, string>> = {
    ask_question: { Success: "#22c55e", Failure: "#ef4444" },
    date_time:    { "In Range": "#3b82f6", "Out of Range": "#f97316" },
  };

  connectors.forEach((conn) => {
    const connWidth = getSubtreeWidth(conn.id);
    const cx = branchX + (connWidth * H_SPACING) / 2;
    const connectorY = yAfterNormal(nodeY);

    const color =
      pillColor[step.type]?.[conn.name] ?? "#3b82f6";

    nodes.push({
      id: conn.id,
      type: "branchPillNode",
      position: { x: toLeftEdge(cx, "pill"), y: connectorY },
      width: NODE_W_PILL,
      data: {
        label: conn.name,
        color,
        onSelect: () => cb.onSelectStep(conn.id),
      },
    });

    edges.push({
      id: `e-${step.id}-${conn.id}`,
      source: step.id,
      target: conn.id,
      type: "step",
    });

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
        data: { onAdd: () => cb.onInsert({ afterNodeId: conn.id }) },
      });

      edges.push({
        id: `e-${conn.id}-${addId}`,
        source: conn.id,
        target: addId,
        type: "step",
      });
    }

    render(conn.id, cx, connectorY, "pill");
    branchX += connWidth * H_SPACING;
  });

} else {
  // ── NORMAL NODE: recurse + add button if leaf ──
  render(step.id, nodeX, nodeY, "normal");

  const hasChildren = (childrenMap.get(step.id) || []).length > 0;
  if (!hasChildren) {
    const addId = `add-${step.id}`;
    const addY = yAfterNormal(nodeY);

    nodes.push({
      id: addId,
      type: "addStepNode",
      position: { x: toLeftEdge(nodeX, "add"), y: addY },
      width: NODE_W_ADD,
      data: { onAdd: () => cb.onInsert({ afterNodeId: step.id }) },
    });

    edges.push({
      id: `e-${step.id}-${addId}`,
      source: step.id,
      target: addId,
      type: "step",
    });
  }
}

      currentX += subtreeWidth * H_SPACING;
    });
  }

  // start: trigger is a normal node at TRIGGER_Y
  render("trigger", NODE_X_CENTER, TRIGGER_Y, "normal");

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
        connectors: [`conn-${id}-1`, `conn-${id}-2`],
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
  const stepCounter = useRef(1);
  const { workflowId } = useParams(); // from URL :id
  const navigate = useNavigate();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const {
    state,
    loadWorkflow,
    selectNode,
    addStep,
    insertStepAfter,
    deleteStep,
    setNodes,
    setEdges,
  } = useWorkflow();

  const { workflow, selectedNodeId, selectedPanelType } = state;

  useEffect(() => {
    if (!workflowId) return;
    console.log("Loading workflow with ID:", workflowId);

    loadWorkflow(workflowId);
  }, [workflowId, loadWorkflow]);

  // build graph
  useEffect(() => {
    console.log("Building graph with steps:", workflow?.config?.steps);
    console.log({ workflow });

    if (!workflow) return;

    const { nodes, edges } = buildGraph(workflow?.config, {
      onSelectTrigger: () => selectNode("trigger", "trigger"),
      onSelectStep: (id: string) => selectNode(id, "step"),
      onDeleteStep: (id: string) => deleteStep(id),
      onDuplicateStep: (id: string) => {
        const orig = workflow?.config?.steps?.find((s) => s.id === id);
        if (!orig) return;

        insertStepAfter(
          {
            ...orig,
            id: `step-${Date.now()}`,
            name: orig.name + " copy",
            parentId: orig.parentId,
          },
          orig.parentId,
        );
      },
      onInsert: (ctx: InsertCtx) => {
        insertCtxRef.current = ctx;
        addMenu.open();
      },
    });

    setRfNodes([...nodes]);
    setRfEdges([...edges]);

    setNodes([...nodes]);
    setEdges([...edges]);
    console.log({ nodes, edges });
  }, [workflow]);

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
      const connectors = newStep.data.connectors;

      const connectorNames: Record<string, string[]> = {
        branch: ["Branch Path", "Branch Path"],
        ask_question: ["Success", "Failure"],
        date_time: ["In Range", "Out of Range"],
      };

      const names =
        connectorNames[type] ??
        connectors.map((_: any, i: number) => `Branch ${i + 1}`);

      const connectorSteps = connectors.map((connId: string, i: number) => ({
        id: connId,
        type: "branch_connector",
        name: names[i] ?? `Path ${i + 1}`,
        parentId: newStep.id,
        data: { conditions: [] },
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
    navigate("/workflows");
  };

  const selectedStep =
    workflow?.config?.steps?.find((s) => s.id === selectedNodeId) ?? null;

  const selectedPanelContent =
    selectedPanelType === "trigger" ? (
      <TriggerPanel />
    ) : selectedPanelType === "step" && selectedStep ? (
      <StepPanel step={selectedStep} />
    ) : null;

  return (
    <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
      <TopBar onBack={handleBack} />

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
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

      {isMobile && selectedPanelContent ? (
        <div className="fixed inset-0 z-[100] bg-white md:hidden">
          {selectedPanelContent}
        </div>
      ) : null}

      {addMenu.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/10"
            onClick={addMenu.close}
          />
          <AddStepMenu
            onSelect={handleAddStep}
            onClose={() => {
              addMenu.close();
              insertCtxRef.current = null;
            }}
          />
        </>
      )}
    </div>
  );
}
