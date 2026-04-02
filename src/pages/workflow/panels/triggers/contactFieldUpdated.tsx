// ── 4. Contact Field Updated ──────────────────────────────────────────────────

import { Props, ContactFieldUpdatedData, TRIGGER_FIELDS } from "../../workflow.types";
import { Field, Select, InfoBox, Section } from "../PanelShell";



export function ContactFieldConfig({ trigger, onChange }: Props) {
  const data = trigger.data as ContactFieldUpdatedData;
  return (
    <Section title="Configuration">
      <Field label="Contact Field" required hint="Any update to this field triggers the workflow">
        <Select value={data.fieldId}
          onChange={(v) => {
            const found = TRIGGER_FIELDS.find((f) => f.value === v);
            onChange({ data: { ...data, fieldId: v, fieldName: found?.label ?? v } });
          }}
          placeholder="Select a field..." options={TRIGGER_FIELDS} />
      </Field>
      <InfoBox>Importing contacts does not auto-trigger this workflow.</InfoBox>
    </Section>
  );
}
