
// ─── 12. Trigger Another Workflow ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/Button";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { SP, TriggerAnotherWorkflowData } from "../../workflow.types";
import { Field, InfoBox, Section, Select } from "../PanelShell";

export function TriggerAnotherWorkflowConfig({ step, onChange }: SP) {
  const data = step.data as TriggerAnotherWorkflowData;
  const u = (p: Partial<TriggerAnotherWorkflowData>) => onChange({ ...data, ...p });
const [workflowOptions, setWorkflowOptions] = useState<Array<{ value: string; label: string }>>([]);

  const loadWorkflows = (inputValue: string) => {
    workspaceApi.getWorkflows().then((workflows) => {
        setWorkflowOptions(workflows.map(wf => ({ value: wf.id, label: wf.name })));
    });
  }
  useEffect(() => {
    loadWorkflows('');
  }, []);

  return (
    <Section title="Configuration">
      <Field label="Target Workflow" required hint="The target workflow must use a Manual Trigger">
        <Select value={data.targetWorkflowId ?? ''} onChange={(v) => u({ targetWorkflowId: v })} placeholder="Select workflow..." options={workflowOptions} />
      </Field>
      <Field label="Start From">
        <div className="flex gap-2">
          {(['beginning','specific_step'] as const).map((m) => (
            <div key={m} className="flex-1">
              <Button
                variant={data.startFrom === m ? "dark" : "secondary"}
                size="sm"
                fullWidth
                onClick={() => u({ startFrom: m, targetStepId: undefined })}
              >
              {m === 'beginning' ? 'Beginning' : 'Specific Step'}
              </Button>
            </div>
          ))}
        </div>
      </Field>
      <InfoBox>Use this step with Manual Trigger to build modular, reusable workflow modules.</InfoBox>
    </Section>
  );
}
