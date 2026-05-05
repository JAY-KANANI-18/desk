// ─── 2. Ask a Question ────────────────────────────────────────────────────────

import { Trash2, Plus } from "@/components/ui/icons";
import { Button } from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { SelectWithIconLabel } from "../../../../components/ui/select";
import { QuestionType, SP, AskQuestionData, QUESTION_TYPES, genId, MOCK_FIELDS } from "../../workflow.types";
import { Field, Textarea, Select, TextInput, ToggleRow, DurationInput, Section } from "../PanelShell";
import { toQuestionTypeIconOption } from "../../questionTypeVisuals";

const QUESTION_TYPE_OPTIONS = QUESTION_TYPES.map(toQuestionTypeIconOption);


export function AskQuestionConfig({ step, onChange }: SP) {
  const data = step.data as AskQuestionData;
  const u = (p: Partial<AskQuestionData>) => onChange({ ...data, ...p });
  const addOpt = () => { if (data.multipleChoiceOptions.length < 10) u({ multipleChoiceOptions: [...data.multipleChoiceOptions, { id: genId(), label: '' }] }); };
  const updOpt = (id: string, label: string) => u({ multipleChoiceOptions: data.multipleChoiceOptions.map((o) => o.id === id ? { ...o, label } : o) });
  const delOpt = (id: string) => u({ multipleChoiceOptions: data.multipleChoiceOptions.filter((o) => o.id !== id) });

  return (
    <>
      <Section title="Question">
        <Field label="Question Text" required>
          <Textarea value={data.questionText} onChange={(v) => u({ questionText: v })} placeholder="What is your email address?" rows={3} />
        </Field>
        <SelectWithIconLabel
          label="Answer Type"
          required
          value={data.questionType}
          onChange={(v) => u({ questionType: v as QuestionType })}
          options={QUESTION_TYPE_OPTIONS}
          placeholder="Select answer type"
          size="sm"
        />
        {data.questionType === 'multiple_choice' && (
          <Field label="Options" hint="Up to 10, max 20 chars each">
            <div className="space-y-2">
              {data.multipleChoiceOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 w-4 flex-shrink-0">{idx + 1}</span>
                  <TextInput value={opt.label} onChange={(v) => updOpt(opt.id, v.slice(0, 20))} placeholder={`Option ${idx + 1}`} className="flex-1" />
                  <IconButton
                    aria-label={`Remove option ${idx + 1}`}
                    icon={<Trash2 size={12} />}
                    variant="danger-ghost"
                    size="xs"
                    onClick={() => delOpt(opt.id)}
                  />
                </div>
              ))}
              {data.multipleChoiceOptions.length < 10 && (
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftIcon={<Plus size={12} />}
                  onClick={addOpt}
                >
                  Add Option
                </Button>
              )}
            </div>
          </Field>
        )}
        {data.questionType === 'number' && (
          <div className="flex gap-2">
            <Field label="Min" className="flex-1"><TextInput type="number" value={String(data.numberMin ?? '')} onChange={(v) => u({ numberMin: v ? Number(v) : undefined })} placeholder="No min" /></Field>
            <Field label="Max" className="flex-1"><TextInput type="number" value={String(data.numberMax ?? '')} onChange={(v) => u({ numberMax: v ? Number(v) : undefined })} placeholder="No max" /></Field>
          </div>
        )}
      </Section>
      <Section title="Save Response As">
        <ToggleRow label="Contact Field" checked={data.saveAsContactField} onChange={(v) => u({ saveAsContactField: v })} />
        {data.saveAsContactField && <div className="mt-2"><Select value={data.contactFieldId ?? ''} onChange={(v) => u({ contactFieldId: v })} placeholder="Select contact field..." options={MOCK_FIELDS} /></div>}
        <div className="mt-2"><ToggleRow label="Variable" checked={data.saveAsVariable} onChange={(v) => u({ saveAsVariable: v })} /></div>
        {data.saveAsVariable && <div className="mt-2"><TextInput value={data.variableName ?? ''} onChange={(v) => u({ variableName: v })} placeholder="variable_name" /></div>}
        {data.questionType === 'multiple_choice' && <div className="mt-2"><ToggleRow label="Tag" description="Selected option is added as a contact tag" checked={data.saveAsTag} onChange={(v) => u({ saveAsTag: v })} /></div>}
      </Section>
      <Section title="Advanced" collapsible defaultOpen={false}>
        <ToggleRow label="Timeout Branch" description="Contact exits if no reply within the set time" checked={data.addTimeoutBranch} onChange={(v) => u({ addTimeoutBranch: v })} />
        {data.addTimeoutBranch && <div className="mt-2"><DurationInput value={data.timeoutValue} unit={data.timeoutUnit} onValueChange={(v) => u({ timeoutValue: v })} onUnitChange={(u2) => u({ timeoutUnit: u2 })} max={7} /><p className="text-xs text-gray-400 mt-1">Maximum 7 days</p></div>}
        <div className="mt-2"><ToggleRow label="Message Failure Branch" checked={data.addMessageFailureBranch} onChange={(v) => u({ addMessageFailureBranch: v })} /></div>
      </Section>
    </>
  );
}
