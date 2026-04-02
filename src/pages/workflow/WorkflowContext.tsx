import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { Node, Edge } from "reactflow";
import {
  Workflow,
  TriggerConfig,
  StepConfig,
  StepType,
  WorkflowSettings,
  ValidationError,
} from "./workflow.types";
import { workspaceApi } from "../../lib/workspaceApi";
import { inboxApi } from "../../lib/inboxApi";

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────

interface WorkflowBuilderState {
  // Current workflow being edited
  workflow: Workflow | null;
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;

  // Canvas
  nodes: Node[];
  edges: Edge[];

  // Selection
  selectedNodeId: string | null;
  selectedPanelType: "trigger" | "step" | null;

  // Validation
  errors: ValidationError[];

  // UI
  showSettings: boolean;
}

const initialState: WorkflowBuilderState = {
  workflow: null,
  isDirty: false,
  isSaving: false,
  isPublishing: false,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedPanelType: null,
  errors: [],
  showSettings: false,
};

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────

type Action =
  | { type: "LOAD_WORKFLOW"; payload: Workflow }
  | { type: "SET_NODES"; payload: Node[] }
  | { type: "SET_EDGES"; payload: Edge[] }
  | { type: "SET_TRIGGER"; payload: TriggerConfig }
  | { type: "UPDATE_STEP"; payload: StepConfig }
  | { type: "ADD_STEP"; payload: StepConfig }
  | {
      type: "INSERT_STEP_AFTER";
      payload: { step: StepConfig; afterId: string };
    }
  | { type: "DELETE_STEP"; payload: string }
  | {
      type: "SELECT_NODE";
      payload: { nodeId: string | null; panelType: "trigger" | "step" | null };
    }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_PUBLISHING"; payload: boolean }
  | { type: "MARK_SAVED"; payload: Workflow }
  | { type: "SET_ERRORS"; payload: ValidationError[] }
  | { type: "UPDATE_NAME"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<WorkflowSettings> }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "MARK_DIRTY" };

function reducer(
  state: WorkflowBuilderState,
  action: Action,
): WorkflowBuilderState {
        console.log({action});

  switch (action.type) {
    case "LOAD_WORKFLOW":
      
      return {
        ...state,
        workflow: action.payload,
        isDirty: false,
        errors: [],
        selectedNodeId: null,
        selectedPanelType: null,
      };

    case "SET_NODES":
      return { ...state, nodes: action.payload };

    case "SET_EDGES":
      return { ...state, edges: action.payload };

    case "SET_TRIGGER":
      if (!state.workflow) return state;
      return {
        ...state,
        isDirty: true,
        workflow: { ...state.workflow, config: { ...state.workflow?.config, trigger: action.payload } },
      };

    case "UPDATE_STEP": {
      if (!state.workflow) return state;
      const steps = state.workflow?.config?.steps?.map((s) =>
  s.id === action.payload.id
    ? { ...action.payload, data: { ...action.payload.data } }
    : s
);
      return {
        ...state,
        isDirty: true,
        workflow: { ...state.workflow, config: { ...state.workflow?.config, steps } },
      };
    }

    case "ADD_STEP": {
      if (!state.workflow) return state;

      
      return {
        ...state,
        isDirty: true,
        workflow: {
          ...state.workflow,
          config: {
            ...state.workflow?.config,
            steps: [...state.workflow?.config?.steps, action.payload],
          },
        },
      };
    }

   case 'INSERT_STEP_AFTER': {
  if (!state.workflow) return state;

  const { step, afterId } = action.payload;

  const steps = state.workflow?.config?.steps?.map((s) => {
    // 🔥 If inserting after a node
    if (s.id === afterId) {
      return s;
    }

    return s || [];
  });

  // ✅ Set parentId properly
  step.parentId = afterId;

  return {
    ...state,
    isDirty: true,
    workflow: {
      ...state.workflow,
      config: {
        ...state.workflow?.config,
        steps:  [...( steps || []), step],
      },
        },
  };
}
case 'DELETE_STEP': {
  if (!state.workflow) return state;

  const stepId = action.payload;

  return {
    ...state,
    isDirty: true,
    workflow: {
      ...state.workflow,
      config: {
        ...state.workflow?.config,
        steps: state.workflow?.config?.steps?.filter((s) => s.id !== stepId),
      },
    },
  };
}

    case "SELECT_NODE":
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
        selectedPanelType: action.payload.panelType,
      };

    case "SET_SAVING":
      return { ...state, isSaving: action.payload };

    case "SET_PUBLISHING":
      return { ...state, isPublishing: action.payload };

    case "MARK_SAVED":
      return { ...state, isDirty: false, workflow: action.payload };

    case "SET_ERRORS":
      return { ...state, errors: action.payload };

    case "UPDATE_NAME":
      if (!state.workflow) return state;
      return {
        ...state,
        isDirty: true,
        workflow: { ...state.workflow, name: action.payload },
      };

    case "UPDATE_SETTINGS":
      if (!state.workflow) return state;
      return {
        ...state,
        isDirty: true,
        workflow: {
          ...state.workflow,
          settings: { ...state.workflow.settings, ...action.payload },
        },
      };

    case "TOGGLE_SETTINGS":
      return { ...state, showSettings: !state.showSettings };

    case "MARK_DIRTY":
      return { ...state, isDirty: true };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

interface WorkflowContextValue {
  state: WorkflowBuilderState;

  // Workflow actions
  loadWorkflow: (workflowId: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  publishWorkflow: () => Promise<void>;
  stopWorkflow: () => Promise<void>;
  updateName: (name: string) => void;
  updateSettings: (settings: Partial<WorkflowSettings>) => void;
  toggleSettings: () => void;

  // Trigger
  setTrigger: (trigger: TriggerConfig) => void;

  // Steps
  addStep: (step: StepConfig) => void;
  insertStepAfter: (step: StepConfig, afterId: string) => void;
  updateStep: (step: StepConfig) => void;
  deleteStep: (stepId: string) => void;

  // Canvas
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  uploadFile: (file: File, entityId: string) => Promise<string>;

  // Selection
  selectNode: (
    nodeId: string | null,
    panelType: "trigger" | "step" | null,
  ) => void;

  // Computed
  selectedStep: StepConfig | null;
  canPublish: boolean;
  errorCount: number;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadWorkflow = useCallback(async (workflowId: string) => {
    const wf = await workspaceApi.getWorkflow(workflowId);
    console.log({wf});
    
    dispatch({ type: "LOAD_WORKFLOW", payload: wf });
    // Build initial nodes/edges from wf.steps
    // (Canvas will call buildNodesFromWorkflow separately)
  }, []);

  const saveWorkflow = useCallback(async () => {
    if (!state.workflow) return;
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const saved = await workspaceApi.saveWorkflow(state.workflow.id, {
        name: state.workflow.name,
        description: state.workflow.description,
        config: {
          trigger: state.workflow?.config?.trigger,
          steps: state.workflow?.config?.steps,
          settings: state.workflow?.config?.settings,
        }
      });
      dispatch({ type: "MARK_SAVED", payload: saved });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state.workflow]);

  const publishWorkflow = useCallback(async () => {
    if (!state.workflow) return;
    dispatch({ type: "SET_PUBLISHING", payload: true });
    try {
      // Save first
      await workspaceApi.saveWorkflow(state.workflow.id, {
        name: state.workflow.name,
        trigger: state.workflow?.config?.trigger,
        steps: state.workflow?.config?.steps,
        settings: state.workflow?.config?.settings,
      });
      const published = await workspaceApi.publishWorkflow(state.workflow.id);
      dispatch({ type: "MARK_SAVED", payload: published });
    } finally {
      dispatch({ type: "SET_PUBLISHING", payload: false });
    }
  }, [state.workflow]);

  const stopWorkflow = useCallback(async () => {
    if (!state.workflow) return;
    const stopped = await workspaceApi.stopWorkflow(state.workflow.id);
    dispatch({ type: "MARK_SAVED", payload: stopped });
  }, [state.workflow]);

  const updateName = useCallback((name: string) => {
    dispatch({ type: "UPDATE_NAME", payload: name });
  }, []);

  const updateSettings = useCallback((settings: Partial<WorkflowSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  }, []);

  const toggleSettings = useCallback(() => {
    dispatch({ type: "TOGGLE_SETTINGS" });
  }, []);

  const setTrigger = useCallback((trigger: TriggerConfig) => {
    dispatch({ type: "SET_TRIGGER", payload: trigger });
  }, []);

  const addStep = useCallback((step: StepConfig) => {
    dispatch({ type: "ADD_STEP", payload: step });
  }, []);

  const insertStepAfter = useCallback((step: StepConfig, afterId: string) => {
    dispatch({ type: "INSERT_STEP_AFTER", payload: { step, afterId } });
  }, []);

  const updateStep = useCallback((step: StepConfig) => {
    console.log("step",step);
    
    dispatch({ type: "UPDATE_STEP", payload: step });
  }, []);

  const deleteStep = useCallback((stepId: string) => {
    dispatch({ type: "DELETE_STEP", payload: stepId });
  }, []);

  const setNodes = useCallback((nodes: Node[]) => {
    dispatch({ type: "SET_NODES", payload: nodes });
  }, []);

  const setEdges = useCallback((edges: Edge[]) => {
    dispatch({ type: "SET_EDGES", payload: edges });
  }, []);

  const selectNode = useCallback(
    (nodeId: string | null, panelType: "trigger" | "step" | null) => {
      dispatch({ type: "SELECT_NODE", payload: { nodeId, panelType } });
    },
    [],
  );

  function findStepAnywhere(
    steps: StepConfig[],
    id: string,
  ): StepConfig | null {
    for (const step of steps) {
      if (step.id === id) return step;

      if (step.type === "branch") {
        const bd: any = step.data;

        for (const b of bd.branches || []) {
          const found = findStepAnywhere(b.steps || [], id);
          if (found) return found;
        }

        const found = findStepAnywhere(bd.elseSteps || [], id);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedStep = state.selectedNodeId
    ? findStepAnywhere(state.workflow?.config?.steps ?? [], state.selectedNodeId)
    : null;
  const canPublish =
    !!state.workflow?.config?.trigger &&
    state.workflow?.config?.steps?.length > 0 &&
    state.errors.length === 0;

  const errorCount = state.errors.length;


  
    /* ══════════════════════════════════════════════════════════════
       FILE UPLOAD  (presign → PUT directly to R2)
    ══════════════════════════════════════════════════════════════ */
  
    const uploadFile = useCallback(
      async (file: File, entityId: string): Promise<string> => {
        const { uploadUrl, fileUrl } = await inboxApi.getPresignedUploadUrl( {
          type: "message-attachment",
          fileName: file.name,
          contentType: file.type,
          entityId,
        });
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        return fileUrl;
      },
      []
    );

  return (
    <WorkflowContext.Provider
      value={{
        state,
        loadWorkflow,
        saveWorkflow,
        publishWorkflow,
        stopWorkflow,
        updateName,
        updateSettings,
        toggleSettings,
        setTrigger,
        addStep,
        insertStepAfter,
        updateStep,
        deleteStep,
        setNodes,
        setEdges,
        selectNode,
        uploadFile,
        selectedStep,
        canPublish,
        errorCount,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}
