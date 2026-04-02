
// ─── 8. Close Conversation ────────────────────────────────────────────────────

import { SP, CloseConversationData } from "../../workflow.types";
import { ToggleRow, Field, Select, Textarea, InfoBox, Section } from "../PanelShell";

export function CloseConversationConfig({ step, onChange }: SP) {
  const data = step.data as CloseConversationData;
  const u = (p: Partial<CloseConversationData>) => onChange({ ...data, ...p });
  return (
    <Section title="Configuration">
      <ToggleRow label="Add Closing Notes" description="Record a category and summary when closing" checked={data.addClosingNotes} onChange={(v) => u({ addClosingNotes: v })} />
      {data.addClosingNotes && (
        <div className="mt-3 space-y-3">
          <Field label="Category"><Select value={data.category ?? ''} onChange={(v) => u({ category: v })} placeholder="Select category..." options={[{ value: 'resolved', label: 'Resolved' }, { value: 'spam', label: 'Spam' }, { value: 'escalated', label: 'Escalated' }, { value: 'other', label: 'Other' }]} /></Field>
          <Field label="Notes"><Textarea value={data.notes ?? ''} onChange={(v) => u({ notes: v })} placeholder="Optional closing notes..." rows={3} /></Field>
        </div>
      )}
      <InfoBox>The workflow continues even after conversation closes. It only ends if the workflow itself stops.</InfoBox>
    </Section>
  );
}