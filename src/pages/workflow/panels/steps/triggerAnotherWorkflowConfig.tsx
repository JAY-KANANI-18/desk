
// ─── 12. Trigger Another Workflow ─────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { SP, StepConfig, TriggerAnotherWorkflowData, Workflow } from "../../workflow.types";
import { useWorkflow } from "../../WorkflowContext";
import { Field, InfoBox, Section, Select } from "../PanelShell";

interface WorkflowOptionSource {
  id: string | number;
  name?: string;
  status?: string;
  config?: Workflow["config"] | null;
}

const selectableStepTypes = new Set<StepConfig["type"]>([
  "send_message",
  "ask_question",
  "assign_to",
  "branch",
  "update_contact_tag",
  "update_contact_field",
  "open_conversation",
  "close_conversation",
  "add_comment",
  "jump_to",
  "wait",
  "trigger_another_workflow",
  "date_time",
  "http_request",
]);

function getTargetWorkflowIssue(workflow: WorkflowOptionSource) {
  if (workflow.status && workflow.status !== "published") return "publish it first";
  if (workflow.config && workflow.config.trigger?.type !== "manual_trigger") {
    return "manual trigger required";
  }
  return null;
}

function toStepOption(step: StepConfig, index: number) {
  return {
    value: step.id,
    label: `${index + 1}. ${step.name || step.type.replace(/_/g, " ")}`,
  };
}

export function TriggerAnotherWorkflowConfig({ step, onChange }: SP) {
  const data = step.data as TriggerAnotherWorkflowData;
  const u = (p: Partial<TriggerAnotherWorkflowData>) => onChange({ ...data, ...p });
  const { state } = useWorkflow();
  const currentWorkflowId = state.workflow?.id;
  const [workflowOptions, setWorkflowOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [targetWorkflow, setTargetWorkflow] = useState<Workflow | null>(null);
  const [isLoadingTargetWorkflow, setIsLoadingTargetWorkflow] = useState(false);
  const [targetWorkflowError, setTargetWorkflowError] = useState<string | null>(null);

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
    if (!data.targetWorkflowId) {
      setTargetWorkflow(null);
      setTargetWorkflowError(null);
      setIsLoadingTargetWorkflow(false);
      return;
    }

    let isActive = true;
    setIsLoadingTargetWorkflow(true);
    setTargetWorkflowError(null);

    workspaceApi
      .getWorkflow(data.targetWorkflowId)
      .then((workflow) => {
        if (isActive) {
          setTargetWorkflow(workflow);
        }
      })
      .catch(() => {
        if (isActive) {
          setTargetWorkflow(null);
          setTargetWorkflowError("Could not load steps for this workflow.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTargetWorkflow(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [data.targetWorkflowId]);

  const stepOptions =
    targetWorkflow?.config?.steps
      ?.filter((candidate) => selectableStepTypes.has(candidate.type))
      .map(toStepOption) ?? [];

  const selectedTargetStepExists =
    !data.targetStepId || stepOptions.some((option) => option.value === data.targetStepId);

  useEffect(() => {
    if (
      data.targetWorkflowId &&
      currentWorkflowId &&
      String(data.targetWorkflowId) === String(currentWorkflowId)
    ) {
      u({ targetWorkflowId: "" });
    }
  }, [currentWorkflowId, data.targetWorkflowId]);

  useEffect(() => {
    if (data.targetStepId && !selectedTargetStepExists) {
      u({ targetStepId: undefined });
    }
  }, [data.targetStepId, selectedTargetStepExists]);

  const selectedTargetIssue = targetWorkflow ? getTargetWorkflowIssue(targetWorkflow) : null;

  return (
    <Section title="Configuration">
      <Field label="Target Workflow" required hint="The target workflow must use a Manual Trigger">
        <Select
          value={data.targetWorkflowId ?? ""}
          onChange={(v) => u({ targetWorkflowId: v, targetStepId: undefined })}
          placeholder="Select workflow..."
          options={workflowOptions}
        />
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
      {data.startFrom === "specific_step" ? (
        <Field
          label="Starting Step"
          required
          hint="Choose the first step to run inside the selected workflow."
        >
          <Select
            value={data.targetStepId ?? ""}
            onChange={(v) => u({ targetStepId: v || undefined })}
            placeholder={
              !data.targetWorkflowId
                ? "Select workflow first..."
                : isLoadingTargetWorkflow
                  ? "Loading steps..."
                  : "Select step..."
            }
            options={stepOptions}
          />
        </Field>
      ) : null}
      {targetWorkflowError ? <InfoBox type="warning">{targetWorkflowError}</InfoBox> : null}
      {selectedTargetIssue ? (
        <InfoBox type="warning">This workflow cannot run from this step until you {selectedTargetIssue}.</InfoBox>
      ) : null}
      {data.startFrom === "specific_step" && data.targetWorkflowId && !isLoadingTargetWorkflow && !targetWorkflowError && stepOptions.length === 0 ? (
        <InfoBox type="warning">The selected workflow has no available steps.</InfoBox>
      ) : null}
      <InfoBox>Use this step with Manual Trigger to build modular, reusable workflow modules.</InfoBox>
    </Section>
  );
}
