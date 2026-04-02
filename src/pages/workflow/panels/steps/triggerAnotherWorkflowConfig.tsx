
// ─── 12. Trigger Another Workflow ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { MOCK_WF } from ".";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { SP, TriggerAnotherWorkflowData } from "../../workflow.types";
import { Field, InfoBox, Section, Select } from "../PanelShell";

export function TriggerAnotherWorkflowConfig({ step, onChange }: SP) {
  const data = step.data as TriggerAnotherWorkflowData;
  const u = (p: Partial<TriggerAnotherWorkflowData>) => onChange({ ...data, ...p });
const [workflowOptions, setWorkflowOptions] = useState([]);

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
            <button key={m} onClick={() => u({ startFrom: m, targetStepId: undefined })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${data.startFrom === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {m === 'beginning' ? 'Beginning' : 'Specific Step'}
            </button>
          ))}
        </div>
      </Field>
      <InfoBox>Use this step with Manual Trigger to build modular, reusable workflow modules.</InfoBox>
    </Section>
  );
}