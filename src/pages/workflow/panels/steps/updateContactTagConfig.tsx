// ─── 5. Update Contact Tag ────────────────────────────────────────────────────

import { SP, UpdateContactTagData } from "../../workflow.types";
import { Field, Section, Select, TagInput } from "../PanelShell";

export function UpdateContactTagConfig({ step, onChange }: SP) {
  const data = step.data as UpdateContactTagData;
  const u = (p: Partial<UpdateContactTagData>) => onChange({ ...data, ...p });
  return (
    <Section title="Configuration">
      <Field label="Action" required><Select value={data.action} onChange={(v) => u({ action: v as 'add' | 'remove' })} options={[{ value: 'add', label: 'Add Tag(s)' }, { value: 'remove', label: 'Remove Tag(s)' }]} /></Field>
      <Field label="Tags" required><TagInput values={data.tags} onChange={(tags) => u({ tags })} placeholder="Type and press Enter..." suggestions={['dummy']} /></Field>
    </Section>
  );
}