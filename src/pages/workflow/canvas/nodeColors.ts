import type { StepType } from "../workflow.types";

export const TRIGGER_NODE_COLOR = "#e11d48";
export const DEFAULT_NODE_COLOR = "#94a3b8";

export const STEP_NODE_COLORS: Partial<Record<StepType, string>> = {
  send_message: "#0f9f9a",
  ask_question: "#0284c7",
  assign_to: "#22c55e",
  branch: "#f59e0b",
  branch_connector: "#f59e0b",
  update_contact_tag: "#8b5cf6",
  update_contact_field: "#d946ef",
  open_conversation: "#0ea5e9",
  close_conversation: "#0ea5e9",
  add_comment: "#6366f1",
  jump_to: "#64748b",
  wait: "#06b6d4",
  trigger_another_workflow: "#64748b",
  date_time: "#f97316",
  http_request: "#64748b",
};

export function getWorkflowNodeColor(type: StepType | "trigger" | null | undefined) {
  if (type === "trigger") return TRIGGER_NODE_COLOR;
  return type ? STEP_NODE_COLORS[type] ?? DEFAULT_NODE_COLOR : DEFAULT_NODE_COLOR;
}
