
// ─── 12. Trigger Another Workflow ─────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { SP, TriggerAnotherWorkflowData } from "../../workflow.types";
import { useWorkflow } from "../../WorkflowContext";
import { Field, InfoBox, Section, Select } from "../PanelShell";

interface WorkflowOptionSource {
  id: string | number;
  name?: string;
}

export function TriggerAnotherWorkflowConfig({ step, onChange }: SP) {
  const data = step.data as TriggerAnotherWorkflowData;
  const u = (p: Partial<TriggerAnotherWorkflowData>) => onChange({ ...data, ...p });
  const { state } = useWorkflow();
  const currentWorkflowId = state.workflow?.id;
  const [workflowOptions, setWorkflowOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let isActive = true;

    workspaceApi.getWorkflows()
      .then((response) => {
        if (!isActive) return;

        const workflows = Array.isArray(response)
          ? (response as WorkflowOptionSource[])
          : [];

        setWorkflowOptions(
          workflows
            .filter((workflow) => String(workflow.id) !== String(currentWorkflowId ?? ""))
            .map((workflow) => ({
              value: String(workflow.id),
              label: workflow.name || `Workflow ${workflow.id}`,
            })),
        );
      })
      .catch(() => {
        if (isActive) {
          setWorkflowOptions([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentWorkflowId]);

  useEffect(() => {
    if (
      data.targetWorkflowId &&
      currentWorkflowId &&
      String(data.targetWorkflowId) === String(currentWorkflowId)
    ) {
      u({ targetWorkflowId: "" });
    }
  }, [currentWorkflowId, data.targetWorkflowId]);

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
