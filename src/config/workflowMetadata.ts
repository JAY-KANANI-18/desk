import {
  BarChart2,
  Bot,
  Calendar,
  CheckSquare,
  Clock,
  CornerDownRight,
  Edit3,
  FileText,
  GitBranch,
  Globe,
  Hand,
  HelpCircle,
  Image,
  Menu,
  MessageCircle,
  MessageSquare,
  RefreshCcw,
  StickyNote,
  Tag,
  UserCheck,
  Workflow,
  XCircle,
  Zap,
  type AppIcon,
} from "../components/ui/icons";
import type { StepType, TriggerType } from "../pages/workflow/workflow.types";

export type WorkflowNodeType = StepType | "trigger";

export type WorkflowStepCategory =
  | "messaging"
  | "assignment"
  | "logic"
  | "contact"
  | "conversation"
  | "flow"
  | "integration"
  | "ads"
  | "ai";

export type WorkflowIconKey =
  | "barChart2"
  | "bot"
  | "calendar"
  | "checkSquare"
  | "clock"
  | "cornerDownRight"
  | "edit3"
  | "fileText"
  | "gitBranch"
  | "globe"
  | "hand"
  | "helpCircle"
  | "image"
  | "menu"
  | "messageCircle"
  | "messageSquare"
  | "refreshCcw"
  | "stickyNote"
  | "tag"
  | "userCheck"
  | "workflow"
  | "xCircle"
  | "zap";

export interface WorkflowStepCategoryMetadata {
  id: WorkflowStepCategory;
  label: string;
  iconKey: WorkflowIconKey;
  Icon: AppIcon;
  color: string;
}

export interface WorkflowNodeMetadata {
  type: WorkflowNodeType;
  label: string;
  description: string;
  iconKey: WorkflowIconKey;
  Icon: AppIcon;
  color: string;
  category?: WorkflowStepCategory;
  addable?: boolean;
  upgradeRequired?: boolean;
}

export interface WorkflowStepMetadata extends WorkflowNodeMetadata {
  type: StepType;
  category: WorkflowStepCategory;
}

export interface WorkflowTriggerMetadata {
  type: TriggerType;
  label: string;
  description: string;
  iconKey: WorkflowIconKey;
  Icon: AppIcon;
  selectable?: boolean;
  upgradeRequired?: boolean;
}

export const WORKFLOW_DEFAULT_NODE_COLOR = "#94a3b8";
export const WORKFLOW_TRIGGER_NODE_COLOR = "#e11d48";

export const WORKFLOW_ICON_COMPONENTS: Record<WorkflowIconKey, AppIcon> = {
  barChart2: BarChart2,
  bot: Bot,
  calendar: Calendar,
  checkSquare: CheckSquare,
  clock: Clock,
  cornerDownRight: CornerDownRight,
  edit3: Edit3,
  fileText: FileText,
  gitBranch: GitBranch,
  globe: Globe,
  hand: Hand,
  helpCircle: HelpCircle,
  image: Image,
  menu: Menu,
  messageCircle: MessageCircle,
  messageSquare: MessageSquare,
  refreshCcw: RefreshCcw,
  stickyNote: StickyNote,
  tag: Tag,
  userCheck: UserCheck,
  workflow: Workflow,
  xCircle: XCircle,
  zap: Zap,
};

function getIcon(iconKey: WorkflowIconKey) {
  return WORKFLOW_ICON_COMPONENTS[iconKey];
}

function defineCategory(
  category: Omit<WorkflowStepCategoryMetadata, "Icon">,
): WorkflowStepCategoryMetadata {
  return {
    ...category,
    Icon: getIcon(category.iconKey),
  };
}

function defineStep(step: Omit<WorkflowStepMetadata, "Icon">): WorkflowStepMetadata {
  return {
    ...step,
    Icon: getIcon(step.iconKey),
  };
}

function defineTrigger(
  trigger: Omit<WorkflowTriggerMetadata, "Icon">,
): WorkflowTriggerMetadata {
  return {
    ...trigger,
    Icon: getIcon(trigger.iconKey),
  };
}

export const WORKFLOW_TRIGGER_NODE_METADATA: WorkflowNodeMetadata = {
  type: "trigger",
  label: "Trigger",
  description: "Start the workflow when an event happens",
  iconKey: "zap",
  Icon: getIcon("zap"),
  color: WORKFLOW_TRIGGER_NODE_COLOR,
};

export const WORKFLOW_STEP_CATEGORIES: WorkflowStepCategoryMetadata[] = [
  defineCategory({ id: "messaging", label: "Messaging", iconKey: "messageSquare", color: "#0f9f9a" }),
  defineCategory({ id: "assignment", label: "Assignment", iconKey: "userCheck", color: "#22c55e" }),
  defineCategory({ id: "logic", label: "Logic", iconKey: "gitBranch", color: "#f59e0b" }),
  defineCategory({ id: "contact", label: "Contact Data", iconKey: "edit3", color: "#d946ef" }),
  defineCategory({ id: "conversation", label: "Conversation", iconKey: "messageCircle", color: "#0ea5e9" }),
  defineCategory({ id: "flow", label: "Flow Control", iconKey: "cornerDownRight", color: "#64748b" }),
  defineCategory({ id: "integration", label: "Integrations", iconKey: "globe", color: "#64748b" }),
  defineCategory({ id: "ads", label: "Ads & Tracking", iconKey: "barChart2", color: "#64748b" }),
  defineCategory({ id: "ai", label: "AI", iconKey: "bot", color: "#64748b" }),
];

export const WORKFLOW_STEP_METADATA: Record<StepType, WorkflowStepMetadata> = {
  send_message: defineStep({
    type: "send_message",
    label: "Send a Message",
    description: "Send a message to the contact on a chosen channel",
    iconKey: "messageSquare",
    category: "messaging",
    color: "#0f9f9a",
  }),
  ask_question: defineStep({
    type: "ask_question",
    label: "Ask a Question",
    description: "Send a question and collect a validated response",
    iconKey: "helpCircle",
    category: "messaging",
    color: "#0284c7",
  }),
  assign_to: defineStep({
    type: "assign_to",
    label: "Assign To",
    description: "Assign the contact to a user, team, or unassign",
    iconKey: "userCheck",
    category: "assignment",
    color: "#22c55e",
  }),
  branch: defineStep({
    type: "branch",
    label: "Branch",
    description: "Split the flow into conditional paths",
    iconKey: "gitBranch",
    category: "logic",
    color: "#f59e0b",
  }),
  branch_connector: defineStep({
    type: "branch_connector",
    label: "Branch Path",
    description: "Continue from a conditional branch path",
    iconKey: "gitBranch",
    category: "logic",
    color: "#f59e0b",
    addable: false,
  }),
  update_contact_tag: defineStep({
    type: "update_contact_tag",
    label: "Update Contact Tag",
    description: "Add or remove tags from the contact",
    iconKey: "tag",
    category: "contact",
    color: "#8b5cf6",
  }),
  update_contact_field: defineStep({
    type: "update_contact_field",
    label: "Update Contact Field",
    description: "Modify a contact field value",
    iconKey: "edit3",
    category: "contact",
    color: "#d946ef",
  }),
  open_conversation: defineStep({
    type: "open_conversation",
    label: "Open Conversation",
    description: "Open a conversation with the contact",
    iconKey: "messageCircle",
    category: "conversation",
    color: "#0ea5e9",
  }),
  close_conversation: defineStep({
    type: "close_conversation",
    label: "Close Conversation",
    description: "Close the active conversation",
    iconKey: "xCircle",
    category: "conversation",
    color: "#0ea5e9",
  }),
  add_comment: defineStep({
    type: "add_comment",
    label: "Add Comment",
    description: "Add an internal note on the conversation",
    iconKey: "stickyNote",
    category: "conversation",
    color: "#6366f1",
  }),
  jump_to: defineStep({
    type: "jump_to",
    label: "Jump To",
    description: "Redirect to another step in the workflow",
    iconKey: "cornerDownRight",
    category: "flow",
    color: "#64748b",
  }),
  wait: defineStep({
    type: "wait",
    label: "Wait",
    description: "Pause the workflow for a set duration",
    iconKey: "clock",
    category: "flow",
    color: "#06b6d4",
  }),
  trigger_another_workflow: defineStep({
    type: "trigger_another_workflow",
    label: "Trigger Another Workflow",
    description: "Continue contact in a different workflow",
    iconKey: "workflow",
    category: "flow",
    color: "#64748b",
  }),
  date_time: defineStep({
    type: "date_time",
    label: "Date & Time",
    description: "Branch based on current date or time",
    iconKey: "calendar",
    category: "logic",
    color: "#f97316",
  }),
  http_request: defineStep({
    type: "http_request",
    label: "HTTP Request",
    description: "Send a request to an external API",
    iconKey: "globe",
    category: "integration",
    color: "#64748b",
    upgradeRequired: true,
  }),
};

export const WORKFLOW_STEP_LIST = Object.values(WORKFLOW_STEP_METADATA).filter(
  (step) => step.addable !== false,
);

export const WORKFLOW_STEPS_BY_CATEGORY = WORKFLOW_STEP_CATEGORIES.map((category) => ({
  ...category,
  steps: WORKFLOW_STEP_LIST.filter((step) => step.category === category.id),
}));

export const WORKFLOW_TRIGGER_METADATA: Record<TriggerType, WorkflowTriggerMetadata> = {
  conversation_opened: defineTrigger({
    type: "conversation_opened",
    label: "Conversation Opened",
    description: "When a conversation is opened with a contact",
    iconKey: "messageSquare",
  }),
  conversation_closed: defineTrigger({
    type: "conversation_closed",
    label: "Conversation Closed",
    description: "When a conversation is closed",
    iconKey: "checkSquare",
  }),
  contact_tag_updated: defineTrigger({
    type: "contact_tag_updated",
    label: "Contact Tag Updated",
    description: "When a tag is added to or removed from a contact",
    iconKey: "tag",
  }),
  contact_field_updated: defineTrigger({
    type: "contact_field_updated",
    label: "Contact Field Updated",
    description: "When a specified contact field is updated",
    iconKey: "edit3",
  }),
  menu_click: defineTrigger({
    type: "menu_click",
    label: "Menu Click",
    description: "When a Messenger persistent menu action is tapped",
    iconKey: "menu",
  }),
  story_reply: defineTrigger({
    type: "story_reply",
    label: "Story Reply",
    description: "When an Instagram story reply automation runs",
    iconKey: "image",
  }),
  template_send: defineTrigger({
    type: "template_send",
    label: "Template Send",
    description: "When a template message is sent through a connected channel",
    iconKey: "fileText",
  }),
  shortcut: defineTrigger({
    type: "shortcut",
    label: "Shortcut",
    description: "Manually triggered from the Inbox module by an agent",
    iconKey: "zap",
    selectable: false,
  }),
  manual_trigger: defineTrigger({
    type: "manual_trigger",
    label: "Manual Trigger",
    description: "Triggered by the Trigger Another Workflow step",
    iconKey: "hand",
  }),
  lifecycle_updated: defineTrigger({
    type: "lifecycle_updated",
    label: "Lifecycle Updated",
    description: "When a contact's lifecycle stage changes",
    iconKey: "refreshCcw",
  }),
};

export const WORKFLOW_TRIGGER_LIST = Object.values(WORKFLOW_TRIGGER_METADATA).filter(
  (trigger) => trigger.selectable !== false,
);

export const WORKFLOW_STEP_NODE_COLORS: Record<StepType, string> = Object.fromEntries(
  Object.values(WORKFLOW_STEP_METADATA).map((step) => [step.type, step.color]),
) as Record<StepType, string>;

export const WORKFLOW_NODE_METADATA = {
  trigger: WORKFLOW_TRIGGER_NODE_METADATA,
  ...WORKFLOW_STEP_METADATA,
} satisfies Record<WorkflowNodeType, WorkflowNodeMetadata>;

export function getWorkflowNodeMetadata(
  type: WorkflowNodeType | null | undefined,
): WorkflowNodeMetadata {
  return type ? WORKFLOW_NODE_METADATA[type] ?? WORKFLOW_NODE_METADATA.trigger : WORKFLOW_NODE_METADATA.trigger;
}

export function getWorkflowNodeColor(type: WorkflowNodeType | null | undefined) {
  if (!type) return WORKFLOW_DEFAULT_NODE_COLOR;
  return getWorkflowNodeMetadata(type).color ?? WORKFLOW_DEFAULT_NODE_COLOR;
}
