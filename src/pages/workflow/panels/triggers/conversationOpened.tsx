import type { Props } from "../../workflow.types";
import { ConditionBuilder } from "./conversationClosed";

export function ConversationOpenedConfig({ trigger, onChange }: Props) {
  return (
    <ConditionBuilder
      triggerType="conversation_opened"
      conditions={trigger.conditions}
      onChange={(conditions) => onChange({ conditions })}
      emptyMessage="No conditions - triggers on every conversation open."
    />
  );
}
