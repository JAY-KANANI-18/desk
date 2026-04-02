
// ── 10. Lifecycle Updated ─────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Props, LifecycleUpdatedData } from "../../workflow.types";
import { InfoBox, Field, Section } from "../PanelShell";
import { workspaceApi } from "../../../../lib/workspaceApi";


export function LifecycleConfig({ trigger, onChange }: Props) {
  const data = trigger.data as LifecycleUpdatedData;
    const [stages, setStages]         = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [loadError, setLoadError]   = useState<string | null>(null);
  const toggle = (stage: string) => {
    const stages = data.stages.includes(stage) ? data.stages.filter((s) => s !== stage) : [...data.stages, stage];
    onChange({ data: { ...data, stages } });
    
  };

    const load = useCallback(async () => {
      // setLoading(true); 
      setLoadError(null);
     setStages(await workspaceApi.getLifecycleStages()); 
      
    }, []);
  
    useEffect(() => { load(); }, [load]);
  return (
    <Section title="Configuration">
      <InfoBox>Requires Lifecycle feature to be enabled in Workspace Settings.</InfoBox>
      <div className="mt-3 space-y-3">
        <Field label="Stage Selection">
          <div className="flex gap-2">
            {(['all', 'specific'] as const).map((m) => (
              <button key={m} onClick={() => onChange({ data: { ...data, stageSelection: m } })}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${m === data.stageSelection ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {m === 'all' ? 'All Stages' : 'Specific Stages'}
              </button>
            ))}
          </div>
        </Field>
        {data.stageSelection === 'specific' && (
          <div className="flex flex-wrap gap-1.5">
            {stages.map((stage) => {
              const active = data.stages.includes(stage.id);
              return (
                <button key={stage.id} onClick={() => toggle(stage.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${active ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {stage.name}
                </button>
              );
            })}
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={data.triggerWhenCleared}
            onChange={(e) => onChange({ data: { ...data, triggerWhenCleared: e.target.checked } })} className="rounded" />
          Also trigger when lifecycle stage is cleared
        </label>
      </div>
    </Section>
  );
}