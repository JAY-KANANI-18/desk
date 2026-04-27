// ─── 10. Jump To ──────────────────────────────────────────────────────────────

import { SP, JumpToData } from "../../workflow.types";
import { useWorkflow } from "../../WorkflowContext";
import { RangeInput } from "../../../../components/ui/inputs";
import { Field, InfoBox, Section, Select } from "../PanelShell";

export function JumpToConfig({ step, onChange }: SP) {
  const data = step.data as JumpToData;
  const u = (p: Partial<JumpToData>) => onChange({ ...data, ...p });
  const { state } = useWorkflow();
  const { workflow } = state;
  const stepOptions =
    workflow?.config?.steps
      ?.filter((s) => s?.id?.includes("step-"))
      .map((s) => ({
        value: s.id,
        label: s.name,
      })) ?? [];
  console.log({ data });

  return (
    <Section title="Configuration">
      <Field
        label="Jump To Step"
        required
        hint="Can jump to any step in the workflow, in any direction"
      >
        <Select
          value={data.targetStepId ?? ""}
          onChange={(v) => u({ targetStepId: v })}
          placeholder="Select step..."
          options={stepOptions}
        />
      </Field>
      <Field
        label="Maximum Jumps"
        hint="After the limit, contact moves to the next step. Max: 10."
      >
        <RangeInput
          min={1}
          max={10}
          value={data.maxJumps}
          valueLabel={data.maxJumps}
          onChange={(e) => u({ maxJumps: Number(e.target.value) })}
        />
      </Field>
      <InfoBox type="warning">
        Best practice: use max 3 jumps to avoid disrupting contact flow.
      </InfoBox>
    </Section>
  );
}
