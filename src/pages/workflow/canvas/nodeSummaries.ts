import type { ChannelSelectMenuChannel } from "@/components/ui/select";
import { CHANNEL_SELECT_META } from "@/config/channelMetadata";
import {
  MOCK_FIELDS,
  QUESTION_TYPES,
  TIMEZONES,
  type AddCommentData,
  type AskQuestionData,
  type AssignToData,
  type BranchCondition,
  type CloseConversationData,
  type DateTimeData,
  type HttpRequestData,
  type JumpToData,
  type SendMessageData,
  type StepConfig,
  type TriggerAnotherWorkflowData,
  type UpdateContactFieldData,
  type UpdateContactTagData,
  type WaitData,
} from "../workflow.types";
import { isElseBranchConnector } from "./branchConnectors";

type StepExtraData = {
  conditions?: BranchCondition[];
  connectors?: string[];
};

export type WorkflowCanvasStep = StepConfig & {
  parentId?: string;
  data: StepConfig["data"] & StepExtraData;
};

export interface WorkflowPreviewUser {
  id: string | number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface WorkflowPreviewTag {
  id: string | number;
  name: string;
  color?: string | null;
  emoji?: string | null;
  bundle?: {
    color?: string | null;
    emoji?: string | null;
  } | null;
}

export interface WorkflowPreviewContext {
  channels: ChannelSelectMenuChannel[];
  steps: WorkflowCanvasStep[];
  workspaceUsers: WorkflowPreviewUser[];
  workspaceTags: WorkflowPreviewTag[];
  highlightStepId?: string | null;
}

export type WorkflowNodePreviewTokenKind = "channel" | "tag" | "value" | "status";

export interface WorkflowNodePreviewToken {
  label: string;
  kind?: WorkflowNodePreviewTokenKind;
  value?: string;
  iconUrl?: string;
  emoji?: string;
  bgColor?: string;
  textColor?: string;
}

export interface WorkflowNodePreview {
  label: string;
  text?: string;
  tokens: WorkflowNodePreviewToken[];
  variant?: "message" | "question" | "assignment" | "branch" | "tags" | "field" | "conversation" | "plain" | "jump";
  isPlaceholder?: boolean;
}

function cleanText(value: string | null | undefined, maxLength = 90) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}

function valueLabel(
  value: string | null | undefined,
  options: Array<{ value: string; label: string }>,
) {
  if (!value) return undefined;
  return options.find((option) => option.value === value)?.label ?? value;
}

function getChannelToken(
  channelValue: string | null | undefined,
  channels: ChannelSelectMenuChannel[],
) {
  if (!channelValue || channelValue === "last_interacted") {
    return { label: "Last interacted", kind: "channel" as const };
  }

  const selectedChannel = channels.find((channel) => {
    const id = String(channel.id ?? "");
    return id === channelValue || `${String(channel.type ?? "unknown")}::${id}` === channelValue;
  });

  if (selectedChannel) {
    const type = String(selectedChannel.type ?? "").toLowerCase();
    const label =
      selectedChannel.name ||
      CHANNEL_SELECT_META[type]?.label ||
      selectedChannel.type ||
      `Channel ${channelValue}`;

    return {
      label: String(label),
      kind: "channel" as const,
      iconUrl:
        typeof selectedChannel.icon === "string"
          ? selectedChannel.icon
          : CHANNEL_SELECT_META[type]?.icon,
    };
  }

  const meta = CHANNEL_SELECT_META[channelValue.toLowerCase()];
  return {
    label: meta?.label ?? `Channel ${channelValue}`,
    kind: "channel" as const,
    iconUrl: meta?.icon,
  };
}

function getMessageDetails(data: SendMessageData) {
  if (data.defaultMessage?.type === "media") {
    const attachments = data.attachments ?? [];
    if (attachments.length > 0) {
      const firstAttachment = attachments[0];
      const fileLabel =
        firstAttachment.filename || firstAttachment.type || firstAttachment.url.split("/").pop();
      return {
        text: attachments.length === 1
          ? fileLabel ?? "attachment"
          : `${fileLabel ?? "attachment"} +${attachments.length - 1} more`,
        typeLabel: "Media",
        isPlaceholder: false,
      };
    }

    if (data.defaultMessage.mediaUrl) {
      return {
        text: data.defaultMessage.mediaUrl.split("/").pop() ?? "file",
        typeLabel: "Media",
        isPlaceholder: false,
      };
    }

    return { text: "Media message", typeLabel: "Media", isPlaceholder: false };
  }

  const channelSpecificText = (data.channelResponses ?? []).find((response) =>
    cleanText(response.content.text),
  )?.content.text;

  const text = cleanText(data.defaultMessage?.text || channelSpecificText);

  return {
    text: text || "No message provided",
    typeLabel: "Text",
    isPlaceholder: !text,
  };
}

function getQuestionPreview(data: AskQuestionData) {
  const typeLabel = valueLabel(data.questionType, QUESTION_TYPES) ?? "Answer";
  const questionText = cleanText(data.questionText);

  return {
    label: "Question",
    text: questionText || "No question provided",
    tokens: [{ label: typeLabel, value: data.questionType, kind: "value" as const, bgColor: "tag-blue" }],
    variant: "question",
    isPlaceholder: !questionText,
  };
}

function getUserLabel(userId: string | undefined, users: WorkflowPreviewUser[]) {
  if (!userId) return undefined;
  const user = users.find((candidate) => String(candidate.id) === String(userId));
  if (!user) return undefined;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || undefined;
}

function getAssignmentPreview(data: AssignToData, users: WorkflowPreviewUser[]) {
  const logic =
    data.assignmentLogic === "least_open_contacts"
      ? "least open contacts"
      : "round robin";

  if (data.action === "unassign") {
    return {
      label: "Assignment",
      text: "Unassign conversation",
      tokens: [],
      variant: "assignment",
    };
  }

  if (data.action === "specific_user") {
    return {
      label: "Assignment",
      text: `Assign to ${getUserLabel(data.userId, users) ?? "selected user"}`,
      tokens: [],
      variant: "assignment",
    };
  }

  if (data.action === "user_in_team") {
    return {
      label: "Assignment",
      text: `Assign to users ${logic}`,
      tokens: [],
      variant: "assignment",
    };
  }

  return {
    label: "Assignment",
    text: `Assign to workspace ${logic}`,
    tokens: [],
    variant: "assignment",
  };
}

function getBranchPreview(step: WorkflowCanvasStep, steps: WorkflowCanvasStep[]) {
  const connectors = steps.filter(
    (candidate) =>
      candidate.parentId === step.id && candidate.type === "branch_connector",
  );
  const conditionConnectors = connectors.filter(
    (connector, index) => !isElseBranchConnector(connector, index, connectors),
  );

  if (conditionConnectors.length === 0) {
    return {
      label: "Branch",
      text: "No conditions provided",
      tokens: [],
      variant: "branch",
      isPlaceholder: true,
    };
  }

  const conditionCount = conditionConnectors.reduce(
    (count, connector) => count + (connector.data.conditions?.length ?? 0),
    0,
  );

  const hasConditions = conditionCount > 0;

  return {
    label: "Branch",
    text:
      hasConditions
        ? `${plural(conditionCount, "condition")} provided`
        : "No conditions provided",
    tokens: [],
    variant: "branch",
    isPlaceholder: !hasConditions,
  };
}

function getTagToken(
  tagValue: string,
  workspaceTags: WorkflowPreviewTag[],
): WorkflowNodePreviewToken {
  const tag = workspaceTags.find(
    (candidate) =>
      String(candidate.id) === String(tagValue) ||
      candidate.name === tagValue,
  );

  return {
    label: cleanText(tag?.name ?? tagValue, 28),
    kind: "tag",
    value: String(tag?.id ?? tagValue),
    emoji: tag?.bundle?.emoji ?? tag?.emoji ?? undefined,
    bgColor: tag?.bundle?.color ?? tag?.color ?? "tag-grey",
  };
}

function getTagPreview(
  data: UpdateContactTagData,
  workspaceTags: WorkflowPreviewTag[],
) {
  const action = data.action === "remove" ? "Remove Tag" : "Add Tag";
  const tagTokens = (data.tags ?? [])
    .filter(Boolean)
    .map((tag) => getTagToken(tag, workspaceTags));

  return {
    label: "Action",
    text: action,
    tokens:
      tagTokens.length > 0
        ? tagTokens
        : [{ label: "No tags", kind: "status" as const, bgColor: "tag-grey" }],
    variant: "tags",
  };
}

function getFieldPreview(data: UpdateContactFieldData) {
  const fieldLabel =
    data.fieldName ||
    valueLabel(data.fieldId, MOCK_FIELDS) ||
    "Select field";
  const fieldValue = cleanText(data.value);

  return {
    label: "Field",
    text: fieldValue || "No value",
    tokens: [{ label: fieldLabel, kind: "value" as const, bgColor: "tag-purple" }],
    variant: "field",
    isPlaceholder: !fieldValue,
  };
}

function getCloseConversationPreview(data: CloseConversationData) {
  if (!data.addClosingNotes) {
    return {
      label: "Close",
      text: "No category or summary provided",
      tokens: [],
      variant: "conversation",
      isPlaceholder: true,
    };
  }

  const categoryLabel = valueLabel(data.category, [
    { value: "resolved", label: "Resolved" },
    { value: "spam", label: "Spam" },
    { value: "escalated", label: "Escalated" },
    { value: "other", label: "Other" },
  ]);

  const notes = cleanText(data.notes);

  return {
    label: "Close",
    text: notes || "No summary provided",
    tokens: [
      {
        label: categoryLabel ?? "Closing notes",
        kind: "value" as const,
        bgColor: "tag-blue",
      },
    ],
    variant: "conversation",
    isPlaceholder: !notes,
  };
}

function getJumpPreview(data: JumpToData, steps: WorkflowCanvasStep[]) {
  const targetStep = steps.find((step) => step.id === data.targetStepId);
  const targetLabel = targetStep?.name || (data.targetStepId ? "Selected step" : "No step selected");

  return {
    label: "Jump to",
    text: targetLabel,
    tokens: data.targetStepId
      ? [{ label: targetLabel, kind: "value" as const, value: data.targetStepId }]
      : [],
    variant: "jump",
    isPlaceholder: !data.targetStepId,
  };
}

function formatDuration(value: number | undefined, unit: WaitData["unit"] | undefined) {
  const resolvedValue = value || 1;
  const resolvedUnit = unit || "hours";
  const singularUnit = resolvedUnit.endsWith("s")
    ? resolvedUnit.slice(0, -1)
    : resolvedUnit;

  return `${resolvedValue} ${resolvedValue === 1 ? singularUnit : resolvedUnit}`;
}

function getTriggerWorkflowPreview(data: TriggerAnotherWorkflowData) {
  if (!data.targetWorkflowId) {
    return {
      label: "Workflow",
      text: "No workflow selected",
      tokens: [],
      variant: "plain",
      isPlaceholder: true,
    };
  }

  const startLabel =
    data.startFrom === "specific_step" ? "from selected step" : "from beginning";

  return {
    label: "Workflow",
    text: `Trigger selected workflow ${startLabel}`,
    tokens: [],
    variant: "plain",
  };
}

function formatDay(day: string) {
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
}

function getDateTimePreview(data: DateTimeData) {
  const timezone = valueLabel(data.timezone, TIMEZONES) ?? data.timezone;

  if (data.mode === "date_range") {
    const isPlaceholder = !data.dateRangeStart || !data.dateRangeEnd;

    return {
      label: "Schedule",
      text: `${data.dateRangeStart || "Start date"} to ${data.dateRangeEnd || "End date"} (${timezone})`,
      tokens: [],
      variant: "plain",
      isPlaceholder,
    };
  }

  const enabledDays = Object.entries(data.businessHours ?? {}).filter(
    ([, hours]) => hours.enabled,
  );

  if (enabledDays.length === 0) {
    return {
      label: "Schedule",
      text: `No business hours selected (${timezone})`,
      tokens: [],
      variant: "plain",
      isPlaceholder: true,
    };
  }

  if (enabledDays.length === 1) {
    const [day, hours] = enabledDays[0];
    return {
      label: "Schedule",
      text: `${formatDay(day)} ${hours.startTime}-${hours.endTime} (${timezone})`,
      tokens: [],
      variant: "plain",
    };
  }

  return {
    label: "Schedule",
    text: `${plural(enabledDays.length, "day")} configured (${timezone})`,
    tokens: [],
    variant: "plain",
  };
}

function getHttpPreview(data: HttpRequestData) {
  const method = data.method || "GET";
  const url = cleanText(data.url);

  return {
    label: "Request",
    text: `${method} ${url || "No URL yet"}`,
    tokens: [],
    variant: "plain",
    isPlaceholder: !url,
  };
}

export function getStepNodePreview(
  step: WorkflowCanvasStep,
  context: WorkflowPreviewContext,
) {
  switch (step.type) {
    case "send_message": {
      const data = step.data as SendMessageData;
      const message = getMessageDetails(data);
      return {
        label: "Message",
        text: message.text,
        tokens: [getChannelToken(data.channel, context.channels)],
        variant: "message",
        isPlaceholder: message.isPlaceholder,
      };
    }
    case "ask_question":
      return getQuestionPreview(step.data as AskQuestionData);
    case "assign_to":
      return getAssignmentPreview(step.data as AssignToData, context.workspaceUsers);
    case "branch":
      return getBranchPreview(step, context.steps);
    case "update_contact_tag":
      return getTagPreview(
        step.data as UpdateContactTagData,
        context.workspaceTags,
      );
    case "update_contact_field":
      return getFieldPreview(step.data as UpdateContactFieldData);
    case "open_conversation":
      return {
        label: "Conversation",
        text: "Open conversation",
        tokens: [],
        variant: "conversation",
      };
    case "close_conversation":
      return getCloseConversationPreview(step.data as CloseConversationData);
    case "add_comment":
      const commentText = cleanText((step.data as AddCommentData).comment);

      return {
        label: "Comment",
        text: commentText || "No comment provided",
        tokens: [],
        variant: "plain",
        isPlaceholder: !commentText,
      };
    case "jump_to":
      return getJumpPreview(step.data as JumpToData, context.steps);
    case "wait": {
      const data = step.data as WaitData;
      return {
        label: "Delay",
        text: `Wait for ${formatDuration(data.value, data.unit)}`,
        tokens: [],
        variant: "plain",
      };
    }
    case "trigger_another_workflow":
      return getTriggerWorkflowPreview(step.data as TriggerAnotherWorkflowData);
    case "date_time":
      return getDateTimePreview(step.data as DateTimeData);
    case "http_request":
      return getHttpPreview(step.data as HttpRequestData);
    default:
      return undefined;
  }
}
