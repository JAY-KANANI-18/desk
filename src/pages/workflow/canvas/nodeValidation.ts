import type {
  AddCommentData,
  AskQuestionData,
  AssignToData,
  BranchCondition,
  BranchConnectorData,
  CloseConversationData,
  DateTimeData,
  HttpHeader,
  HttpRequestData,
  HttpResponseMapping,
  JumpToData,
  SendMessageData,
  StepConfig,
  StepType,
  TriggerConfig,
  TriggerAnotherWorkflowData,
  UpdateContactFieldData,
  UpdateContactTagData,
  WaitData,
} from "../workflow.types";
import {
  WORKFLOW_STEP_METADATA,
  getWorkflowNodeColor,
} from "../../../config/workflowMetadata";
import { isElseBranchConnector } from "./branchConnectors";

type StepWithBranchConnectorData = StepConfig & {
  parentId?: string;
  data: StepConfig["data"] & Partial<BranchConnectorData>;
};

export interface WorkflowValidationWarning {
  nodeId: string;
  title: string;
  message: string;
  color: string;
  type: StepType | "trigger";
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.replace(/\s+/g, " ").trim());
}

function hasPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function hasCompleteHeader(header: HttpHeader) {
  return hasText(header.key) && hasText(header.value);
}

function hasCompleteMapping(mapping: HttpResponseMapping) {
  return hasText(mapping.jsonKey) && hasText(mapping.variableName);
}

function getSendMessageIssue(data: SendMessageData) {
  if (!hasText(data.channel)) return "Select a channel";

  if (data.defaultMessage?.type === "media") {
    const hasAttachment = (data.attachments ?? []).some((attachment) =>
      hasText(attachment.url),
    );
    if (!hasAttachment && !hasText(data.defaultMessage.mediaUrl)) {
      return "Upload media";
    }
    return undefined;
  }

  const hasDefaultText = hasText(data.defaultMessage?.text);
  const hasChannelText = (data.channelResponses ?? []).some((response) =>
    hasText(response.content?.text),
  );

  return hasDefaultText || hasChannelText ? undefined : "Type a message";
}

function getAskQuestionIssue(data: AskQuestionData) {
  if (!hasText(data.questionText)) return "Type a question";

  if (data.questionType === "multiple_choice") {
    const completeOptions = (data.multipleChoiceOptions ?? []).filter((option) =>
      hasText(option.label),
    );
    if (completeOptions.length < 2) return "Add at least 2 answer choices";
  }

  if (
    data.questionType === "number" &&
    typeof data.numberMin === "number" &&
    typeof data.numberMax === "number" &&
    data.numberMin > data.numberMax
  ) {
    return "Fix the number range";
  }

  if (data.saveAsContactField && !hasText(data.contactFieldId)) {
    return "Choose a contact field";
  }

  if (data.saveAsVariable && !hasText(data.variableName)) {
    return "Enter a variable name";
  }

  if (data.addTimeoutBranch && !hasPositiveNumber(data.timeoutValue)) {
    return "Set a valid timeout";
  }

  return undefined;
}

function getAssignToIssue(data: AssignToData) {
  if (data.action === "specific_user" && !hasText(data.userId)) {
    return "Choose a user";
  }

  if (data.action === "user_in_team" && !hasText(data.teamId)) {
    return "Choose a team";
  }

  if (data.addTimeoutBranch && !hasPositiveNumber(data.timeoutValue)) {
    return "Set a valid timeout";
  }

  if (
    typeof data.maxOpenContacts === "number" &&
    !hasPositiveNumber(data.maxOpenContacts)
  ) {
    return "Set a valid max open contacts value";
  }

  return undefined;
}

function hasConditionValue(condition: BranchCondition) {
  if (Array.isArray(condition.value)) return condition.value.some((value) => hasText(String(value)));
  return condition.value !== undefined && condition.value !== null && hasText(String(condition.value));
}

function hasCompleteBranchCondition(condition: BranchCondition) {
  if (!condition.category || !condition.operator) return false;

  const operatorsWithoutValue = ["exists", "does_not_exist", "has_none_of"];
  if (operatorsWithoutValue.includes(condition.operator)) return true;

  return hasConditionValue(condition);
}

function getBranchIssue(step: StepConfig, steps: StepWithBranchConnectorData[]) {
  const connectors = steps.filter(
    (candidate) =>
      candidate.parentId === step.id && candidate.type === "branch_connector",
  );
  const conditionConnectors = connectors.filter(
    (connector, index) => !isElseBranchConnector(connector, index, connectors),
  );

  if (conditionConnectors.length === 0) return "Add a branch condition";

  const hasValidCondition = conditionConnectors.some((connector) =>
    (connector.data.conditions ?? []).some(hasCompleteBranchCondition),
  );

  return hasValidCondition ? undefined : "Add a branch condition";
}

function getDateTimeIssue(data: DateTimeData) {
  if (!hasText(data.timezone)) return "Choose a timezone";

  if (data.mode === "date_range") {
    if (!hasText(data.dateRangeStart) || !hasText(data.dateRangeEnd)) {
      return "Set start and end dates";
    }

    if (String(data.dateRangeStart) > String(data.dateRangeEnd)) {
      return "Fix the date range";
    }

    return undefined;
  }

  const enabledHours = Object.values(data.businessHours ?? {}).filter(
    (hours) => hours.enabled,
  );

  if (enabledHours.length === 0) return "Select business hours";

  const hasInvalidTime = enabledHours.some(
    (hours) =>
      !hasText(hours.startTime) ||
      !hasText(hours.endTime) ||
      hours.startTime >= hours.endTime,
  );

  return hasInvalidTime ? "Fix business hours" : undefined;
}

function getHttpRequestIssue(data: HttpRequestData) {
  if (!hasText(data.url)) return "Enter a request URL";
  if (!/^https?:\/\//i.test(data.url.trim())) {
    return "URL must start with http:// or https://";
  }

  if ((data.headers ?? []).some((header) => !hasCompleteHeader(header))) {
    return "Complete or remove empty headers";
  }

  if ((data.responseMappings ?? []).some((mapping) => !hasCompleteMapping(mapping))) {
    return "Complete or remove empty response mappings";
  }

  if (data.saveResponseStatus && !hasText(data.responseStatusVariableName)) {
    return "Enter a response status variable";
  }

  return undefined;
}

export function getStepValidationIssue(step: StepConfig, steps: StepConfig[]) {
  switch (step.type) {
    case "send_message":
      return getSendMessageIssue(step.data as SendMessageData);
    case "ask_question":
      return getAskQuestionIssue(step.data as AskQuestionData);
    case "assign_to":
      return getAssignToIssue(step.data as AssignToData);
    case "branch":
      return getBranchIssue(step, steps as StepWithBranchConnectorData[]);
    case "update_contact_tag": {
      const data = step.data as UpdateContactTagData;
      return (data.tags ?? []).some(Boolean) ? undefined : "Choose at least one tag";
    }
    case "update_contact_field": {
      const data = step.data as UpdateContactFieldData;
      if (!hasText(data.fieldId)) return "Choose a contact field";
      return hasText(data.value) ? undefined : "Enter a field value";
    }
    case "open_conversation":
      return undefined;
    case "close_conversation": {
      const data = step.data as CloseConversationData;
      if (!data.addClosingNotes) return undefined;
      return hasText(data.category) || hasText(data.notes)
        ? undefined
        : "Add a closing category or note";
    }
    case "add_comment":
      return hasText((step.data as AddCommentData).comment)
        ? undefined
        : "Type a comment";
    case "jump_to": {
      const data = step.data as JumpToData;
      if (!hasText(data.targetStepId)) return "Choose a target step";
      if (data.targetStepId === step.id) return "Choose a different target step";
      return steps.some((candidate) => candidate.id === data.targetStepId)
        ? undefined
        : "Target step no longer exists";
    }
    case "wait":
      return hasPositiveNumber((step.data as WaitData).value)
        ? undefined
        : "Set a valid wait duration";
    case "trigger_another_workflow": {
      const data = step.data as TriggerAnotherWorkflowData;
      if (!hasText(data.targetWorkflowId)) return "Choose a workflow";
      if (data.startFrom === "specific_step" && !hasText(data.targetStepId)) {
        return "Choose a starting step";
      }
      return undefined;
    }
    case "date_time":
      return getDateTimeIssue(step.data as DateTimeData);
    case "http_request":
      return getHttpRequestIssue(step.data as HttpRequestData);
    default:
      return undefined;
  }
}

function getStepNumber(stepId: string, steps: StepConfig[]) {
  const visibleSteps = steps.filter((step) => step.type !== "branch_connector");
  const index = visibleSteps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index + 1 : undefined;
}

function getStepWarningTitle(step: StepConfig, steps: StepConfig[]) {
  const meta = WORKFLOW_STEP_METADATA[step.type];
  const stepNumber = getStepNumber(step.id, steps);
  return stepNumber ? `${meta.label} #${stepNumber}` : step.name || meta.label;
}

export function getWorkflowValidationWarnings(config: {
  trigger?: TriggerConfig | null;
  steps?: StepConfig[] | null;
}): WorkflowValidationWarning[] {
  const steps = config.steps ?? [];
  const warnings: WorkflowValidationWarning[] = [];

  if (!config.trigger?.type) {
    warnings.push({
      nodeId: "trigger",
      title: "Trigger",
      message: "No trigger selected",
      color: getWorkflowNodeColor("trigger"),
      type: "trigger",
    });
  }

  steps.forEach((step) => {
    if (step.type === "branch_connector") return;

    const message = getStepValidationIssue(step, steps);
    if (!message) return;

    warnings.push({
      nodeId: step.id,
      title: getStepWarningTitle(step, steps),
      message,
      color: getWorkflowNodeColor(step.type),
      type: step.type,
    });
  });

  return warnings;
}
