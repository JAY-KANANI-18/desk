
// ─── 6. Update Contact Field ──────────────────────────────────────────────────

import { MOCK_FIELDS, SP, type UpdateContactFieldData } from "../../workflow.types";
import { Field, InfoBox, Section, Select, TextInput } from "../PanelShell";

export function UpdateContactFieldConfig({ step, onChange }: SP) {
  const data = step.data as UpdateContactFieldData;
  const u = (p: Partial<UpdateContactFieldData>) => onChange({ ...data, ...p });
  return (
    <Section title="Configuration">
      <Field label="Contact Field" required>
        <Select value={data.fieldId ?? ''} onChange={(v) => { const f = MOCK_FIELDS.find((x) => x.value === v); u({ fieldId: v, fieldName: f?.label ?? v }); }} placeholder="Select field..." options={MOCK_FIELDS} />
      </Field>
      <Field label="New Value" required hint="Use $variable_name for dynamic values">
        <TextInput value={data.value ?? ''} onChange={(v) => u({ value: v })} placeholder="Enter value or $variable" />
      </Field>
      <InfoBox>To control Dialogflow bot: select "Bot Status" field and set to On or Off.</InfoBox>
    </Section>
  );
}
