import { useMemo } from "react";

import type { User } from "../../../../context/AuthContext";
import { useWorkspace } from "../../../../context/WorkspaceContext";
import {
  extractMentionIds,
  VariableTextEditor,
} from "../../../../components/ui/variable-editor";
import type { MentionSuggestionOption, VariableSuggestionOption } from "../../../../components/ui/Select";
import { AddCommentData, SP, VARIABLE_OPTIONS } from "../../workflow.types";
import { Field, Section } from "../PanelShell";

const workflowVariableOptions: VariableSuggestionOption[] = VARIABLE_OPTIONS.map((key) => ({
  key,
  label: key,
}));

function getUserLabel(user: User) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email || "Teammate";
}

function getMentionStatus(user: User): MentionSuggestionOption["status"] | undefined {
  switch (user.activityStatus?.toLowerCase()) {
    case "online":
      return "online";
    case "away":
      return "away";
    case "busy":
      return "busy";
    case "offline":
      return "offline";
    default:
      return undefined;
  }
}

function getMentionStatusLabel(status: MentionSuggestionOption["status"] | undefined) {
  if (!status) return undefined;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AddCommentConfig({ step, onChange }: SP) {
  const data = step.data as AddCommentData;
  const { workspaceUsers } = useWorkspace();

  const mentionOptions = useMemo(
    () =>
      (workspaceUsers ?? []).map((user) => {
        const status = getMentionStatus(user);
        return {
          id: String(user.id),
          label: getUserLabel(user),
          subtitle: user.email,
          avatarSrc: user.avatarUrl,
          status,
          statusLabel: getMentionStatusLabel(status),
        };
      }),
    [workspaceUsers],
  );

  return (
    <Section title="Configuration">
      <Field
        label="Comment"
        required
        hint="Internal note - visible only to agents. Type @ to mention teammates and $ for variables."
      >
        <VariableTextEditor
          value={data.comment ?? ""}
          onChange={(comment) =>
            onChange({
              ...data,
              comment,
              mentionedUserIds: extractMentionIds(comment),
            })
          }
          variables={workflowVariableOptions}
          mentionOptions={mentionOptions}
          mentionTitle="Mention a teammate"
          placeholder="Add an internal note..."
          menuPlacement="bottom"
          aria-label="Workflow internal note"
          editorClassName="min-h-[110px] w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm text-[var(--color-gray-700)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
        />
      </Field>
    </Section>
  );
}
