import { useCallback, useEffect, useState } from "react";
import type { LifecycleStage } from "../../../workspace/types";
import { Button } from "../../../../components/ui/Button";
import { CheckboxInput } from "../../../../components/ui/inputs";
import { workspaceApi } from "../../../../lib/workspaceApi";
import type { LifecycleUpdatedData, Props } from "../../workflow.types";
import { Field, InfoBox, Section } from "../PanelShell";

const stageSelectionOptions = [
  { value: "all", label: "All Stages" },
  { value: "specific", label: "Specific Stages" },
] as const;

export function LifecycleConfig({ trigger, onChange }: Props) {
  const data = trigger.data as LifecycleUpdatedData;
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const toggleStage = (stageId: string) => {
    const nextStages = data.stages.includes(stageId)
      ? data.stages.filter((id) => id !== stageId)
      : [...data.stages, stageId];

    onChange({ data: { ...data, stages: nextStages } });
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const nextStages = await workspaceApi.getLifecycleStages();
      setStages(Array.isArray(nextStages) ? nextStages : []);
    } catch {
      setStages([]);
      setLoadError("Failed to load lifecycle stages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Section title="Configuration">
      <InfoBox>
        Requires Lifecycle feature to be enabled in Workspace Settings.
      </InfoBox>

      <div className="mt-3 space-y-3">
        <Field label="Stage Selection">
          <div className="flex gap-2">
            {stageSelectionOptions.map((option) => (
              <div key={option.value} className="flex-1">
                <Button
                  variant={
                    option.value === data.stageSelection ? "dark" : "secondary"
                  }
                  size="sm"
                  fullWidth
                  onClick={() =>
                    onChange({
                      data: { ...data, stageSelection: option.value },
                    })
                  }
                >
                  {option.label}
                </Button>
              </div>
            ))}
          </div>
        </Field>

        {data.stageSelection === "specific" ? (
          loading ? (
            <p className="text-xs text-gray-400">Loading lifecycle stages...</p>
          ) : loadError ? (
            <InfoBox type="warning">{loadError}</InfoBox>
          ) : stages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stages.map((stage) => {
                const stageId = String(stage.id);
                const active = data.stages.includes(stageId);

                return (
                  <Button
                    key={stageId}
                    variant={active ? "dark" : "secondary"}
                    size="xs"
                    onClick={() => toggleStage(stageId)}
                  >
                    {stage.name}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No lifecycle stages configured.
            </p>
          )
        ) : null}

        <CheckboxInput
          checked={data.triggerWhenCleared}
          onChange={(checked) =>
            onChange({
              data: { ...data, triggerWhenCleared: checked },
            })
          }
          size="sm"
          label="Also trigger when lifecycle stage is cleared"
        />
      </div>
    </Section>
  );
}
