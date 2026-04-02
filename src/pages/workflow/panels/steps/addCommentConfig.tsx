// ─── 9. Add Comment ───────────────────────────────────────────────────────────

import { SP, AddCommentData } from "../../workflow.types";
import { Field, Section, Textarea } from "../PanelShell";

export function AddCommentConfig({ step, onChange }: SP) {
  const data = step.data as AddCommentData;
  return (
    <Section title="Configuration">
      <Field label="Comment" required hint="Internal note — visible only to agents. Supports $variables.">
        <Textarea value={data.comment} onChange={(v) => onChange({ ...data, comment: v })} placeholder="Add an internal note..." rows={4} />
      </Field>
    </Section>
  );
}