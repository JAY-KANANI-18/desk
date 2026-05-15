import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { TextareaInput } from "../../components/ui/inputs/TextareaInput";
import { MobileSheet, SideModal } from "../../components/ui/modal";
import {
  workspaceApi,
  type WorkflowAiBuilderChatMessage,
  type WorkflowAiBuilderChatResponse,
  type WorkflowAiBuilderPatchOperation,
} from "../../lib/workspaceApi";
import { featureFlags } from "../../config/featureFlags";
import { useWorkflow } from "./WorkflowContext";
import type {
  BranchCategory,
  BranchCondition,
  ConditionOperator,
  AssignAction,
  AssignmentLogic,
  HttpMethod,
  QuestionType,
  StepConfig,
  StepType,
  TriggerCondition,
  Workflow,
  WorkflowBuilderUpdate,
  WorkflowSettings,
  TriggerConfig,
  TriggerType,
} from "./workflow.types";

type BuilderMessage = WorkflowAiBuilderChatMessage & {
  id: string;
  result?: WorkflowAiBuilderChatResponse;
};

interface WorkflowAiBuilderPanelProps {
  isOpen: boolean;
  isMobile: boolean;
  workflow: Workflow | null;
  selectedStep: StepConfig | null;
  workspaceFacts: Record<string, unknown>;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Improve this workflow and keep the same goal",
  "Add failure and timeout handling where needed",
  "Create a lead qualification flow",
  "Explain the selected step",
];

const DEFAULT_SETTINGS: WorkflowSettings = {
  allowStopForContact: false,
  exitOnOutgoingMessage: false,
  exitOnIncomingMessage: false,
  exitOnManualAssignment: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function decodeJsonPointerSegment(segment: string) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolvePatchParent(
  root: Record<string, unknown>,
  path: string,
): { parent: Record<string, unknown> | unknown[]; key: string } | null {
  if (!path.startsWith("/")) return null;
  const parts = path.split("/").slice(1).map(decodeJsonPointerSegment);
  if (parts.length === 0) return null;

  let current: unknown = root;
  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return null;
      }
      current = current[index];
      continue;
    }

    if (!isRecord(current)) return null;
    current = current[part];
  }

  if (!isRecord(current) && !Array.isArray(current)) return null;
  return { parent: current, key: parts[parts.length - 1] ?? "" };
}

function applyPatchOperation(
  root: Record<string, unknown>,
  operation: WorkflowAiBuilderPatchOperation,
) {
  if (operation.path === "") {
    if (operation.op !== "replace" || !isRecord(operation.value)) return false;
    Object.keys(root).forEach((key) => delete root[key]);
    Object.assign(root, operation.value);
    return true;
  }

  const target = resolvePatchParent(root, operation.path);
  if (!target) return false;
  const { parent, key } = target;

  if (Array.isArray(parent)) {
    const index = key === "-" ? parent.length : Number(key);
    if (!Number.isInteger(index) || index < 0 || index > parent.length) {
      return false;
    }

    if (operation.op === "add") {
      parent.splice(index, 0, operation.value);
      return true;
    }

    if (index >= parent.length) return false;
    if (operation.op === "replace") {
      parent[index] = operation.value;
      return true;
    }
    if (operation.op === "remove") {
      parent.splice(index, 1);
      return true;
    }
    return false;
  }

  if (operation.op === "remove") {
    delete parent[key];
    return true;
  }

  parent[key] = operation.value;
  return true;
}

const STEP_LABELS: Record<StepType, string> = {
  send_message: "Send a Message",
  ask_question: "Ask a Question",
  assign_to: "Assign To",
  branch: "Branch",
  branch_connector: "Branch Path",
  update_contact_tag: "Update Contact Tag",
  update_contact_field: "Update Contact Field",
  open_conversation: "Open Conversation",
  close_conversation: "Close Conversation",
  add_comment: "Add Comment",
  jump_to: "Jump To",
  wait: "Wait",
  trigger_another_workflow: "Trigger Another Workflow",
  date_time: "Date/Time",
  http_request: "HTTP Request",
};

const TRIGGER_TYPES: Record<TriggerType, true> = {
  conversation_opened: true,
  conversation_closed: true,
  contact_tag_updated: true,
  contact_field_updated: true,
  contact_assigned: true,
  meta_ad_click: true,
  menu_click: true,
  story_reply: true,
  template_send: true,
  "commerce.customer_created": true,
  "commerce.customer_updated": true,
  "commerce.cart_created": true,
  "commerce.cart_updated": true,
  "commerce.cart_abandoned": true,
  "commerce.order_created": true,
  "commerce.order_paid": true,
  "commerce.order_fulfilled": true,
  "commerce.order_cancelled": true,
  "commerce.refund_created": true,
  shortcut: true,
  manual_trigger: true,
  lifecycle_updated: true,
};

function isTriggerFeatureEnabled(type: TriggerType) {
  if (type === "meta_ad_click") return featureFlags.metaAdsIntegration;
  if (type.startsWith("commerce.")) return featureFlags.shopifyIntegration;
  return true;
}

const QUESTION_TYPES: Record<QuestionType, true> = {
  text: true,
  multiple_choice: true,
  number: true,
  date: true,
  phone: true,
  email: true,
  url: true,
  rating: true,
  location: true,
};

const BRANCH_CATEGORIES: Record<BranchCategory, true> = {
  contact_field: true,
  contact_tags: true,
  variable: true,
  assignee_status: true,
  last_interacted_channel: true,
  last_incoming_message: true,
  last_outgoing_message: true,
  last_outgoing_message_source: true,
  time_since_last_incoming: true,
  time_since_last_outgoing: true,
};

const CONDITION_OPERATORS: Record<ConditionOperator, true> = {
  is_equal_to: true,
  is_not_equal_to: true,
  is_greater_than: true,
  is_less_than: true,
  is_between: true,
  exists: true,
  does_not_exist: true,
  contains: true,
  does_not_contain: true,
  has_none_of: true,
  has_all_of: true,
  has_any_of: true,
  is_timestamp_after: true,
  is_timestamp_before: true,
  is_timestamp_between: true,
  is_greater_than_time: true,
  is_less_than_time: true,
  is_between_time: true,
};

const ASSIGN_ACTIONS: Record<AssignAction, true> = {
  "": true,
  specific_user: true,
  user_in_team: true,
  user_in_workspace: true,
  unassign: true,
};

const ASSIGNMENT_LOGICS: Record<AssignmentLogic, true> = {
  round_robin: true,
  least_open_contacts: true,
};

const HTTP_METHODS: Record<HttpMethod, true> = {
  GET: true,
  POST: true,
  PUT: true,
  PATCH: true,
  DELETE: true,
};

const DURATION_UNITS = {
  seconds: true,
  minutes: true,
  hours: true,
  days: true,
} as const;

type DurationUnit = keyof typeof DURATION_UNITS;

function isKeyOf<T extends string>(
  value: unknown,
  options: Record<T, unknown>,
): value is T {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(options, value)
  );
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown) {
  const text = readString(value).trim();
  return text ? text : undefined;
}

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }
  return fallback;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }
      if (!isRecord(item)) return "";
      return readString(
        item.id ?? item.value ?? item.label ?? item.name,
      );
    })
    .map((item) => item.trim())
    .filter(Boolean);
}

function readDataRecord(value: Record<string, unknown>) {
  if (isRecord(value.data)) return value.data;
  if (isRecord(value.dataFields)) return value.dataFields;
  return {};
}

function normalizeDurationUnit(
  value: unknown,
  fallback: DurationUnit,
): DurationUnit {
  return isKeyOf(value, DURATION_UNITS) ? value : fallback;
}

function normalizePosition(value: unknown) {
  const position = isRecord(value) ? value : {};
  return {
    x: readNumber(position.x, 0),
    y: readNumber(position.y, 0),
  };
}

function normalizeMessageContent(value: unknown, fallbackText = "") {
  if (typeof value === "string") {
    return { type: "text" as const, text: value };
  }

  const record = isRecord(value) ? value : {};
  const type = record.type === "media" ? "media" : "text";
  const text = readString(record.text, fallbackText);
  const mediaUrl = readOptionalString(record.mediaUrl ?? record.url);
  const mediaType =
    record.mediaType === "image" || record.mediaType === "file"
      ? record.mediaType
      : undefined;

  return {
    type,
    ...(type === "text" || text ? { text } : {}),
    ...(mediaUrl ? { mediaUrl } : {}),
    ...(mediaType ? { mediaType } : {}),
  };
}

function normalizeChannelResponses(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((response, index) => ({
    channelId: readString(response.channelId, ""),
    messageType: readString(response.messageType, "text"),
    content: normalizeMessageContent(response.content, `Response ${index + 1}`),
  }));
}

function normalizeMultipleChoiceOptions(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 10)
    .map((option, index) => {
      if (typeof option === "string" || typeof option === "number") {
        const label = String(option).slice(0, 20);
        return { id: `option-${index + 1}`, label };
      }

      if (!isRecord(option)) {
        return { id: `option-${index + 1}`, label: "" };
      }

      const label = readString(
        option.label ?? option.name ?? option.value ?? option.text,
        "",
      ).slice(0, 20);
      const id = readString(option.id ?? option.value, `option-${index + 1}`);

      return { id, label };
    });
}

function normalizeConditionValue(
  value: unknown,
  category?: BranchCategory,
): string | string[] | number {
  if (Array.isArray(value)) return readStringArray(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  return category === "contact_tags" ? [] : "";
}

function normalizeBranchConditions(value: unknown): BranchCondition[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((condition, index) => {
    const category = isKeyOf(condition.category, BRANCH_CATEGORIES)
      ? condition.category
      : "variable";
    const operator = isKeyOf(condition.operator, CONDITION_OPERATORS)
      ? condition.operator
      : "is_equal_to";
    const logicalOperator =
      condition.logicalOperator === "OR" ? "OR" : condition.logicalOperator === "AND" ? "AND" : undefined;
    const field = readOptionalString(condition.field);

    return {
      id: readString(condition.id, `cond-${index + 1}`),
      category,
      ...(field ? { field } : {}),
      operator,
      value: normalizeConditionValue(condition.value, category),
      ...(logicalOperator ? { logicalOperator } : {}),
    };
  });
}

function normalizeTriggerConditions(value: unknown): TriggerCondition[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((condition, index) => {
    const operator = isKeyOf(condition.operator, CONDITION_OPERATORS)
      ? condition.operator
      : "is_equal_to";
    const logicalOperator =
      condition.logicalOperator === "OR" ? "OR" : condition.logicalOperator === "AND" ? "AND" : undefined;

    return {
      id: readString(condition.id, `trigger-cond-${index + 1}`),
      field: readString(condition.field, ""),
      operator,
      value: normalizeConditionValue(condition.value),
      ...(logicalOperator ? { logicalOperator } : {}),
    };
  });
}

function normalizeTriggerData(
  type: TriggerType,
  data: Record<string, unknown>,
): TriggerConfig["data"] {
  switch (type) {
    case "conversation_opened":
      return { sources: readStringArray(data.sources) };
    case "conversation_closed":
      return {
        sources: readStringArray(data.sources),
        categories: readStringArray(data.categories),
      };
    case "contact_tag_updated":
      return {
        action:
          data.action === "removed" || data.action === "added"
            ? data.action
            : "added",
        tags: readStringArray(data.tags),
      };
    case "contact_field_updated":
      return {
        fieldId: readString(data.fieldId, ""),
        fieldName: readString(data.fieldName, ""),
      };
    case "shortcut":
      return {
        icon: readString(data.icon, "Zap"),
        name: readString(data.name, "Manual shortcut"),
        description: readString(data.description, ""),
        formFields: Array.isArray(data.formFields) ? data.formFields : [],
      };
    case "lifecycle_updated": {
      const stageSelection =
        data.stageSelection === "specific" ? "specific" : "all";
      return {
        stageSelection,
        stages: readStringArray(data.stages),
        triggerWhenCleared: readBoolean(data.triggerWhenCleared),
      };
    }
    default:
      return data as TriggerConfig["data"];
  }
}

function normalizeAiTrigger(
  value: unknown,
  fallback: TriggerConfig | null,
): TriggerConfig | null {
  if (value === null) return null;
  if (!isRecord(value)) return fallback;

  const type = isKeyOf(value.type, TRIGGER_TYPES)
    ? value.type
    : fallback?.type;
  if (!type) return fallback;
  if (!isTriggerFeatureEnabled(type)) return fallback;

  const fallbackData =
    fallback?.type === type && isRecord(fallback.data) ? fallback.data : {};
  const dataSource = Object.keys(readDataRecord(value)).length
    ? readDataRecord(value)
    : fallbackData;
  const advancedSettings = isRecord(value.advancedSettings)
    ? value.advancedSettings
    : fallback?.advancedSettings;

  return {
    type,
    conditions: Array.isArray(value.conditions)
      ? normalizeTriggerConditions(value.conditions)
      : fallback?.type === type
        ? fallback.conditions
        : [],
    advancedSettings: {
      triggerOncePerContact: readBoolean(
        advancedSettings?.triggerOncePerContact,
        fallback?.advancedSettings.triggerOncePerContact ?? false,
      ),
    },
    data: normalizeTriggerData(type, dataSource),
  };
}

function defaultStepData(type: StepType, stepId: string): StepConfig["data"] {
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
        connectors: [`conn-${stepId}-success`, `conn-${stepId}-failure`],
      };
    case "assign_to":
      return {
        action: "",
        assignmentLogic: "round_robin",
        onlyOnlineUsers: false,
        addTimeoutBranch: false,
        timeoutValue: 7,
        timeoutUnit: "days",
      };
    case "branch":
      return {
        connectors: [`conn-${stepId}-branch-1`, `conn-${stepId}-else`],
      };
    case "branch_connector":
      return { conditions: [] };
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
        connectors: [`conn-${stepId}-in-range`, `conn-${stepId}-out-of-range`],
      };
    case "http_request":
      return {
        method: "GET",
        url: "",
        headers: [],
        responseMappings: [],
        saveResponseStatus: false,
      };
    default:
      return {};
  }
}

function normalizeHeaders(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((header, index) => ({
    id: readString(header.id, `header-${index + 1}`),
    key: readString(header.key, ""),
    value: readString(header.value, ""),
  }));
}

function normalizeResponseMappings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((mapping, index) => ({
    id: readString(mapping.id, `mapping-${index + 1}`),
    jsonKey: readString(mapping.jsonKey, ""),
    variableName: readString(mapping.variableName, ""),
  }));
}

function normalizeStepData(
  type: StepType,
  data: Record<string, unknown>,
  stepId: string,
  stepName: string,
): StepConfig["data"] {
  const defaults = defaultStepData(type, stepId) as Record<string, unknown>;

  switch (type) {
    case "send_message": {
      const fallbackText = readString(
        data.text ?? data.message ?? data.content,
        "",
      );
      return {
        ...defaults,
        ...data,
        channel: readString(data.channel, "last_interacted") || "last_interacted",
        defaultMessage: normalizeMessageContent(
          data.defaultMessage ?? data.messageContent,
          fallbackText,
        ),
        channelResponses: normalizeChannelResponses(data.channelResponses),
        addMessageFailureBranch: readBoolean(data.addMessageFailureBranch),
        attachments: Array.isArray(data.attachments)
          ? data.attachments.filter(isRecord)
          : undefined,
      } as StepConfig["data"];
    }
    case "ask_question": {
      const questionType = isKeyOf(data.questionType, QUESTION_TYPES)
        ? data.questionType
        : "text";
      const variableName = readOptionalString(data.variableName);
      return {
        ...defaults,
        ...data,
        questionText: readString(
          data.questionText ?? data.question ?? data.text,
          "",
        ),
        questionType,
        multipleChoiceOptions: normalizeMultipleChoiceOptions(
          data.multipleChoiceOptions ?? data.options,
        ),
        saveAsContactField: readBoolean(data.saveAsContactField),
        contactFieldId: readOptionalString(data.contactFieldId),
        saveAsVariable: readBoolean(data.saveAsVariable, Boolean(variableName)),
        variableName,
        saveAsTag: readBoolean(data.saveAsTag),
        addTimeoutBranch: readBoolean(data.addTimeoutBranch),
        timeoutValue: Math.max(1, readNumber(data.timeoutValue, 7)),
        timeoutUnit: normalizeDurationUnit(data.timeoutUnit, "days"),
        addMessageFailureBranch: readBoolean(data.addMessageFailureBranch),
        connectors: readStringArray(data.connectors),
      } as StepConfig["data"];
    }
    case "assign_to": {
      const inferredAction =
        data.userId !== undefined
          ? "specific_user"
          : data.teamId !== undefined
            ? "user_in_team"
            : "";
      const action = isKeyOf(data.action, ASSIGN_ACTIONS)
        ? data.action
        : inferredAction;
      return {
        ...defaults,
        ...data,
        action,
        userId: readOptionalString(data.userId),
        teamId: readOptionalString(data.teamId),
        assignmentLogic: isKeyOf(data.assignmentLogic, ASSIGNMENT_LOGICS)
          ? data.assignmentLogic
          : "round_robin",
        onlyOnlineUsers: readBoolean(data.onlyOnlineUsers),
        maxOpenContacts:
          data.maxOpenContacts === undefined
            ? undefined
            : Math.max(1, readNumber(data.maxOpenContacts, 1)),
        addTimeoutBranch: readBoolean(data.addTimeoutBranch),
        timeoutValue: Math.max(1, readNumber(data.timeoutValue, 7)),
        timeoutUnit: normalizeDurationUnit(data.timeoutUnit, "days"),
      } as StepConfig["data"];
    }
    case "branch":
      return {
        ...defaults,
        ...data,
        connectors:
          readStringArray(data.connectors).length > 0
            ? readStringArray(data.connectors)
            : defaults.connectors,
      } as StepConfig["data"];
    case "branch_connector":
      return {
        conditions: normalizeBranchConditions(data.conditions),
        ...(readBoolean(data.isElse, stepName.toLowerCase() === "else")
          ? { isElse: true }
          : {}),
      } as StepConfig["data"];
    case "update_contact_tag":
      return {
        ...defaults,
        ...data,
        action: data.action === "remove" ? "remove" : "add",
        tags: readStringArray(data.tags ?? data.tagIds),
      } as StepConfig["data"];
    case "update_contact_field":
      return {
        ...defaults,
        ...data,
        fieldId: readString(data.fieldId, ""),
        fieldName: readString(data.fieldName, ""),
        value: readString(data.value, ""),
      } as StepConfig["data"];
    case "close_conversation":
      return {
        ...defaults,
        ...data,
        addClosingNotes: readBoolean(data.addClosingNotes),
        category: readOptionalString(data.category),
        notes: readOptionalString(data.notes),
      } as StepConfig["data"];
    case "add_comment":
      return {
        ...defaults,
        ...data,
        comment: readString(data.comment ?? data.text, ""),
        mentionedUserIds: readStringArray(data.mentionedUserIds),
      } as StepConfig["data"];
    case "jump_to":
      return {
        ...defaults,
        ...data,
        targetStepId: readString(data.targetStepId, ""),
        maxJumps: Math.max(1, readNumber(data.maxJumps, 3)),
      } as StepConfig["data"];
    case "wait":
      return {
        ...defaults,
        ...data,
        value: Math.max(1, readNumber(data.value, 1)),
        unit: normalizeDurationUnit(data.unit, "hours"),
      } as StepConfig["data"];
    case "trigger_another_workflow":
      return {
        ...defaults,
        ...data,
        targetWorkflowId: readString(data.targetWorkflowId, ""),
        startFrom:
          data.startFrom === "specific_step" ? "specific_step" : "beginning",
        targetStepId: readOptionalString(data.targetStepId),
      } as StepConfig["data"];
    case "date_time":
      return {
        ...defaults,
        ...data,
        timezone: readString(data.timezone, "UTC"),
        mode: data.mode === "date_range" ? "date_range" : "business_hours",
        businessHours: isRecord(data.businessHours) ? data.businessHours : {},
        dateRangeStart: readOptionalString(data.dateRangeStart),
        dateRangeEnd: readOptionalString(data.dateRangeEnd),
        connectors:
          readStringArray(data.connectors).length > 0
            ? readStringArray(data.connectors)
            : defaults.connectors,
      } as StepConfig["data"];
    case "http_request":
      return {
        ...defaults,
        ...data,
        method: isKeyOf(data.method, HTTP_METHODS) ? data.method : "GET",
        url: readString(data.url, ""),
        body:
          typeof data.body === "string"
            ? data.body
            : isRecord(data.body)
              ? JSON.stringify(data.body, null, 2)
              : undefined,
        contentType: readOptionalString(data.contentType),
        headers: normalizeHeaders(data.headers),
        responseMappings: normalizeResponseMappings(data.responseMappings),
        saveResponseStatus: readBoolean(
          data.saveResponseStatus,
          Boolean(data.responseStatusVariableName),
        ),
        responseStatusVariableName: readOptionalString(
          data.responseStatusVariableName,
        ),
      } as StepConfig["data"];
    default:
      return { ...defaults, ...data } as StepConfig["data"];
  }
}

function createUniqueStepId(
  value: unknown,
  index: number,
  usedIds: Set<string>,
) {
  const fallback = `step-${index + 1}`;
  const baseId = readString(value, fallback).trim() || fallback;
  let candidate = baseId;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeAiStep(
  value: unknown,
  index: number,
  previousStepId: string,
  usedIds: Set<string>,
): StepConfig | null {
  if (!isRecord(value) || !isKeyOf(value.type, STEP_LABELS)) return null;

  const id = createUniqueStepId(value.id, index, usedIds);
  const name =
    readString(value.name, "").trim() ||
    readString(value.label, "").trim() ||
    STEP_LABELS[value.type];
  const parentId =
    readString(value.parentId, "").trim() ||
    (index === 0 ? "trigger" : previousStepId);
  const data = normalizeStepData(value.type, readDataRecord(value), id, name);

  return {
    id,
    type: value.type,
    name,
    parentId,
    data,
    position: normalizePosition(value.position),
  };
}

function repairParentIds(steps: StepConfig[]) {
  const ids = new Set(steps.map((step) => step.id));

  return steps.map((step, index) => {
    const fallbackParentId = index === 0 ? "trigger" : steps[index - 1]?.id ?? "trigger";
    const parentId = step.parentId || fallbackParentId;

    if (parentId === "trigger" || ids.has(parentId)) {
      return { ...step, parentId };
    }

    return { ...step, parentId: fallbackParentId };
  });
}

function getManagedConnectorNames(owner: StepConfig): string[] {
  const data = (owner.data ?? {}) as {
    addTimeoutBranch?: boolean;
    addMessageFailureBranch?: boolean;
  };

  if (owner.type === "ask_question") {
    return [
      "Success",
      "Failure",
      ...(data.addTimeoutBranch ? ["Timeout"] : []),
      ...(data.addMessageFailureBranch ? ["Message Failure"] : []),
    ];
  }

  if (owner.type === "send_message" && data.addMessageFailureBranch) {
    return ["Success", "Failure"];
  }

  if (owner.type === "date_time") {
    return ["In Range", "Out of Range"];
  }

  return [];
}

function normalizeManagedConnectorNames(steps: StepConfig[]) {
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const assignedNamesByParent = new Map<string, Set<string>>();

  steps.forEach((step) => {
    if (step.type !== "branch_connector" || !step.parentId) return;
    const owner = stepById.get(step.parentId);
    if (!owner) return;
    const managedNames = getManagedConnectorNames(owner);
    if (!managedNames.includes(step.name)) return;

    const assignedNames =
      assignedNamesByParent.get(owner.id) ?? new Set<string>();
    assignedNames.add(step.name);
    assignedNamesByParent.set(owner.id, assignedNames);
  });

  return steps.map((step) => {
    if (step.type !== "branch_connector" || !step.parentId) return step;

    const owner = stepById.get(step.parentId);
    if (!owner) return step;

    const managedNames = getManagedConnectorNames(owner);
    if (managedNames.length === 0 || managedNames.includes(step.name)) {
      return step;
    }

    const assignedNames =
      assignedNamesByParent.get(owner.id) ?? new Set<string>();
    const nextName = managedNames.find((name) => !assignedNames.has(name));
    if (!nextName) return step;

    assignedNames.add(nextName);
    assignedNamesByParent.set(owner.id, assignedNames);
    return { ...step, name: nextName };
  });
}

function getDataConnectorIds(step: StepConfig) {
  const data = (step.data ?? {}) as { connectors?: unknown };
  return readStringArray(data.connectors);
}

function createGeneratedConnectorId(
  ownerId: string,
  index: number,
  usedIds: Set<string>,
) {
  const suffix = index === 0 ? "branch-1" : index === 1 ? "else" : `branch-${index + 1}`;
  const baseId = `conn-${ownerId}-${suffix}`;
  let candidate = baseId;
  let attempt = 2;

  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${attempt}`;
    attempt += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function getConnectorName(ownerType: StepType, index: number, total: number) {
  if (ownerType === "date_time") {
    if (index === 0) return "In Range";
    if (index === 1) return "Out of Range";
    return `Path ${index + 1}`;
  }

  if (index === total - 1) return "Else";
  return `Branch ${index + 1}`;
}

function createBranchConnector(
  ownerType: StepType,
  ownerId: string,
  id: string,
  index: number,
  total: number,
): StepConfig {
  const name = getConnectorName(ownerType, index, total);
  const isElse = ownerType === "branch" && index === total - 1;

  return {
    id,
    type: "branch_connector",
    name,
    parentId: ownerId,
    data: isElse ? { conditions: [], isElse: true } : { conditions: [] },
    position: { x: 0, y: 0 },
  };
}

function ensureBranchConnectorSteps(steps: StepConfig[]) {
  let nextSteps = [...steps];

  steps.forEach((owner) => {
    if (owner.type !== "branch" && owner.type !== "date_time") return;

    const directConnectors = nextSteps.filter(
      (candidate) =>
        candidate.parentId === owner.id &&
        candidate.type === "branch_connector",
    );
    const usedIds = new Set(nextSteps.map((step) => step.id));
    const connectorIds: string[] = [];

    [...getDataConnectorIds(owner), ...directConnectors.map((step) => step.id)]
      .filter((id, index, list) => list.indexOf(id) === index)
      .forEach((id) => {
        const existing = nextSteps.find((step) => step.id === id);
        if (
          existing &&
          (existing.type !== "branch_connector" || existing.parentId !== owner.id)
        ) {
          return;
        }
        connectorIds.push(id);
        usedIds.add(id);
      });

    const minimumCount = owner.type === "date_time" ? 2 : 2;
    while (connectorIds.length < minimumCount) {
      connectorIds.push(
        createGeneratedConnectorId(owner.id, connectorIds.length, usedIds),
      );
    }

    const existingConnectorIds = new Set(
      nextSteps
        .filter(
          (candidate) =>
            candidate.parentId === owner.id &&
            candidate.type === "branch_connector",
        )
        .map((connector) => connector.id),
    );

    const connectorSteps = connectorIds
      .filter((id) => !existingConnectorIds.has(id))
      .map((id, index) =>
        createBranchConnector(owner.type, owner.id, id, index, connectorIds.length),
      );

    nextSteps = [
      ...nextSteps.map((step) => {
        if (step.id === owner.id) {
          return {
            ...step,
            data: {
              ...((step.data ?? {}) as Record<string, unknown>),
              connectors: connectorIds,
            } as StepConfig["data"],
          };
        }

        if (
          step.parentId === owner.id &&
          step.type !== "branch_connector" &&
          connectorIds[0]
        ) {
          return { ...step, parentId: connectorIds[0] };
        }

        return step;
      }),
      ...connectorSteps,
    ];
  });

  return nextSteps;
}

function normalizeAiSteps(value: unknown, fallback: StepConfig[]) {
  if (!Array.isArray(value)) return fallback;

  const usedIds = new Set<string>();
  const steps = value.reduce<StepConfig[]>((currentSteps, rawStep, index) => {
    const previousStepId = currentSteps[currentSteps.length - 1]?.id ?? "trigger";
    const step = normalizeAiStep(rawStep, index, previousStepId, usedIds);
    return step ? [...currentSteps, step] : currentSteps;
  }, []);

  return ensureBranchConnectorSteps(
    normalizeManagedConnectorNames(repairParentIds(steps)),
  );
}

function normalizeWorkflowSettings(
  value: unknown,
  fallback: WorkflowSettings,
): WorkflowSettings {
  const settings = isRecord(value) ? value : {};

  return {
    allowStopForContact: readBoolean(
      settings.allowStopForContact,
      fallback.allowStopForContact ?? DEFAULT_SETTINGS.allowStopForContact,
    ),
    exitOnOutgoingMessage: readBoolean(
      settings.exitOnOutgoingMessage,
      fallback.exitOnOutgoingMessage ?? DEFAULT_SETTINGS.exitOnOutgoingMessage,
    ),
    exitOnIncomingMessage: readBoolean(
      settings.exitOnIncomingMessage,
      fallback.exitOnIncomingMessage ?? DEFAULT_SETTINGS.exitOnIncomingMessage,
    ),
    exitOnManualAssignment: readBoolean(
      settings.exitOnManualAssignment,
      fallback.exitOnManualAssignment ?? DEFAULT_SETTINGS.exitOnManualAssignment,
    ),
  };
}

function coerceWorkflowConfig(
  value: unknown,
  fallback: Workflow["config"],
): Workflow["config"] | null {
  if (!isRecord(value)) return null;

  return {
    trigger:
      value.trigger === undefined
        ? fallback.trigger
        : normalizeAiTrigger(value.trigger, fallback.trigger),
    steps: normalizeAiSteps(value.steps, fallback.steps),
    settings: normalizeWorkflowSettings(value.settings, fallback.settings),
  };
}

function buildUpdateFromDraft(
  draft: WorkflowAiBuilderChatResponse["draft"],
  workflow: Workflow,
): WorkflowBuilderUpdate | null {
  if (!draft) return null;

  const config = draft.config
    ? coerceWorkflowConfig(draft.config, workflow.config)
    : undefined;

  return {
    ...(typeof draft.name === "string" && draft.name.trim()
      ? { name: draft.name.trim() }
      : {}),
    ...(draft.description !== undefined
      ? { description: draft.description }
      : {}),
    ...(config ? { config } : {}),
  };
}

function buildUpdateFromPatch(
  patch: WorkflowAiBuilderPatchOperation[] | undefined,
  workflow: Workflow,
): WorkflowBuilderUpdate | null {
  if (!patch?.length) return null;

  const root = cloneJson({
    name: workflow.name,
    description: workflow.description ?? "",
    config: workflow.config,
  }) as Record<string, unknown>;

  const applied = patch.every((operation) => applyPatchOperation(root, operation));
  if (!applied) return null;

  const config = coerceWorkflowConfig(root.config, workflow.config);
  if (!config) return null;

  return {
    name: typeof root.name === "string" ? root.name : workflow.name,
    description:
      typeof root.description === "string" ? root.description : workflow.description,
    config,
  };
}

function resultHasApplicableChange(result?: WorkflowAiBuilderChatResponse) {
  return Boolean(result?.draft?.config || result?.patch?.length || result?.draft?.name);
}

export function WorkflowAiBuilderPanel({
  isOpen,
  isMobile,
  workflow,
  selectedStep,
  workspaceFacts,
  onClose,
}: WorkflowAiBuilderPanelProps) {
  const { applyBuilderUpdate } = useWorkflow();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextVersion, setContextVersion] = useState<string | null>(null);
  const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    workspaceApi
      .getWorkflowAiBuilderContext()
      .then((response: unknown) => {
        if (isRecord(response) && isRecord(response.context)) {
          const version = response.context.version;
          if (typeof version === "string") setContextVersion(version);
        }
      })
      .catch(() => undefined);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [isOpen, messages]);

  const latestResult = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant" && message.result)
        ?.result,
    [messages],
  );

  const sendPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || !workflow || isSending) return;

    const userMessage: BuilderMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
    };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const result = await workspaceApi.chatWorkflowAiBuilder(workflow.id, {
        message: trimmedPrompt,
        history,
        currentConfig: workflow.config,
        workspaceFacts: {
          ...workspaceFacts,
          selectedStep,
        },
      });
      const assistantMessage: BuilderMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.assistantMessage,
        result,
      };
      setMessages((current) => [...current, assistantMessage]);
      setContextVersion(result.contextVersion ?? contextVersion);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "AI builder could not respond.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not complete that request. Check the workflow and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const applyResult = (message: BuilderMessage) => {
    if (!workflow || !message.result) return;

    const update =
      buildUpdateFromDraft(message.result.draft, workflow) ??
      buildUpdateFromPatch(message.result.patch, workflow);

    if (!update || (!update.config && !update.name && update.description === undefined)) {
      setError("This AI response does not contain a safe workflow change to apply.");
      return;
    }

    applyBuilderUpdate(update);
    setAppliedMessageIds((current) => new Set(current).add(message.id));
    setError(null);
  };

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-gray-900)]">
                <Wand2 size={15} className="text-[var(--color-primary)]" />
                Start with a goal
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendPrompt(prompt)}
                    className="rounded-md border border-[var(--color-gray-200)] bg-white px-2.5 py-1.5 text-left text-xs font-medium text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {selectedStep ? (
              <div className="rounded-lg border border-[var(--color-gray-200)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-gray-400)]">
                  Selected step
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-gray-900)]">
                  {selectedStep.name}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              const applied = appliedMessageIds.has(message.id);
              const canApply =
                isAssistant &&
                message.result &&
                resultHasApplicableChange(message.result) &&
                !applied;

              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-lg px-3 py-2 text-sm leading-5 ${
                      isAssistant
                        ? "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-800)]"
                        : "bg-[var(--color-primary)] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {message.result?.questions?.length ? (
                      <div className="mt-2 space-y-1">
                        {message.result.questions.map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => setInput(question)}
                            className="block w-full rounded border border-[var(--color-gray-200)] px-2 py-1 text-left text-xs text-[var(--color-gray-600)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {message.result?.warnings?.length ? (
                      <div className="mt-2 space-y-1">
                        {message.result.warnings.map((warning) => (
                          <div
                            key={warning}
                            className="flex gap-1.5 rounded bg-orange-50 px-2 py-1 text-xs text-orange-700"
                          >
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {message.result?.suggestions?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.result.suggestions.slice(0, 4).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="rounded border border-[var(--color-gray-200)] px-2 py-1 text-xs text-[var(--color-gray-600)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {canApply || applied ? (
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="xs"
                          variant={applied ? "secondary" : "primary"}
                          disabled={applied}
                          leftIcon={applied ? <Check size={13} /> : <Sparkles size={13} />}
                          onClick={() => applyResult(message)}
                        >
                          {applied ? "Applied" : "Apply to draft"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isSending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gray-200)] bg-white px-3 py-2 text-sm text-[var(--color-gray-500)]">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {latestResult?.model ? (
        <div className="border-t border-[var(--color-gray-100)] px-4 py-2 text-[11px] text-[var(--color-gray-400)]">
          {latestResult.model.provider} / {latestResult.model.name}
        </div>
      ) : contextVersion ? (
        <div className="border-t border-[var(--color-gray-100)] px-4 py-2 text-[11px] text-[var(--color-gray-400)]">
          Builder context {contextVersion}
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <form
        className="border-t border-[var(--color-gray-200)] p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void sendPrompt(input);
        }}
      >
        <TextareaInput
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI to build, improve, or explain this workflow"
          rows={2}
          maxRows={5}
          autoResize
          disabled={isSending || !workflow}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendPrompt(input);
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--color-gray-400)]">
            Preview changes before saving.
          </p>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!input.trim() || isSending || !workflow}
            loading={isSending}
            loadingMode="inline"
            leftIcon={<Send size={14} />}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={isOpen}
        onClose={onClose}
        fullScreen
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workflow
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Build with AI
            </h2>
          </div>
        }
      >
        {content}
      </MobileSheet>
    );
  }

  return (
    <SideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Build with AI"
      subtitle="Chat, preview, then apply changes to the draft."
      headerIcon={<Sparkles size={18} className="text-[var(--color-primary)]" />}
      width={420}
      bodyPadding="none"
      showOverlay={false}
      lockBodyScroll={false}
    >
      {content}
    </SideModal>
  );
}
