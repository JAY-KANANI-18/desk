// ── 3. Contact Tag Updated ────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { workspaceApi } from "../../../../lib/workspaceApi";
import { ConversationTag } from "../../../workspace/types";
import { Props, ContactTagUpdatedData } from "../../workflow.types";
import { Field, Select, TagInput, InfoBox, Section } from "../PanelShell";


export function ContactTagConfig({ trigger, onChange }: Props) {
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = trigger.data as ContactTagUpdatedData;

  const load = useCallback(async () => {
    // setLoading(true);
    setError(null);
    setTags(await workspaceApi.getTags());
  }, []);


  useEffect(() => {
    load();
  }, [load]);

  return (
    <Section title="Configuration">
      <Field label="Action" required>
        <Select
          value={data.action}
          onChange={(v) =>
            onChange({ data: { ...data, action: v as "added" | "removed" } })
          }
          options={[
            { value: "added", label: "Tag is added" },
            { value: "removed", label: "Tag is removed" },
          ]}
        />
      </Field>
      <Field
        label="Tags"
        required
        hint="Workflow fires when any of these tags match"
      >
        <TagInput
          values={data.tags}
          onChange={(tags) => onChange({ data: { ...data, tags } })}
          placeholder="Type and press Enter..."
          suggestions={tags}
        />
      </Field>
      <InfoBox>
        Importing contacts with tags does not auto-trigger this workflow.
      </InfoBox>
    </Section>
  );
}
