import { ShieldCheck, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { CheckboxInput } from "../../components/ui/inputs";
import { CenterModal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { MobileSheet } from "../../components/ui/modal";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BroadcastTagPicker } from "./BroadcastTagPicker";
import { templateVariableKeys } from "./utils";
import type {
  BroadcastAudiencePreviewState,
  BroadcastFormState,
  BroadcastTemplate,
  LifecycleRow,
  TagRow,
} from "./types";

type BroadcastComposerModalProps = {
  open: boolean;
  channels: any[];
  form: BroadcastFormState;
  onFormChange: (next: BroadcastFormState) => void;
  tags: TagRow[];
  lifecycles: LifecycleRow[];
  audiencePreview: BroadcastAudiencePreviewState | null;
  previewLoading: boolean;
  onPreviewAudience: () => void;
  isWhatsApp: boolean;
  waTemplates: BroadcastTemplate[];
  selectedTemplateId: string;
  onSelectedTemplateIdChange: (value: string) => void;
  selectedTemplate?: BroadcastTemplate;
  templateVars: Record<string, string>;
  onTemplateVarsChange: (next: Record<string, string>) => void;
  sending: boolean;
  onClose: () => void;
  onSend: () => void;
};

export function BroadcastComposerModal({
  open,
  channels,
  form,
  onFormChange,
  tags,
  lifecycles,
  audiencePreview,
  previewLoading,
  onPreviewAudience,
  isWhatsApp,
  waTemplates,
  selectedTemplateId,
  onSelectedTemplateIdChange,
  selectedTemplate,
  templateVars,
  onTemplateVarsChange,
  sending,
  onClose,
  onSend,
}: BroadcastComposerModalProps) {
  const isMobile = useIsMobile();

  if (!open) return null;

  const channelOptions = [
    { value: "", label: "Select channel" },
    ...channels
      .filter((channel) => channel.status === "connected" || !channel.status)
      .map((channel) => ({
        value: String(channel.id),
        label: `${channel.name ?? channel.type} (${channel.type})`,
      })),
  ];

  const lifecycleOptions = [
    { value: "", label: "Any stage" },
    ...lifecycles.map((stage) => ({
      value: stage.id,
      label: `${stage.emoji ?? ""} ${stage.name}`.trim(),
    })),
  ];

  const templateOptions = [
    { value: "", label: "Select template" },
    ...waTemplates.map((template) => ({
      value: template.id,
      label: `${template.name} (${template.language}) - ${template.category}`,
    })),
  ];

  const content = (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <Input
        label="Internal name"
        placeholder="Q1 promo - WhatsApp"
        value={form.name}
        onChange={(event) =>
          onFormChange({ ...form, name: event.target.value })
        }
      />

      <Select
        label="Channel"
        value={form.channelId}
        onChange={(event) =>
          onFormChange({ ...form, channelId: event.target.value })
        }
        options={channelOptions}
      />

      <Select
        label="Lifecycle"
        value={form.lifecycleId}
        onChange={(event) =>
          onFormChange({ ...form, lifecycleId: event.target.value })
        }
        options={lifecycleOptions}
      />

      <BroadcastTagPicker
        label="Tags (any match)"
        hint="Recipients match if they have at least one selected tag."
        tags={tags}
        value={form.tagIds}
        onChange={(tagIds) => onFormChange({ ...form, tagIds })}
      />

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
        <CheckboxInput
          checked={form.respectMarketingOptOut}
          onChange={(checked) =>
            onFormChange({
              ...form,
              respectMarketingOptOut: checked,
            })
          }
          label={
            <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <ShieldCheck size={14} className="text-emerald-600" />
              Exclude marketing opt-outs
            </span>
          }
          description={
            <span className="text-xs text-gray-500">
              Recommended for promotional campaigns. Contacts with marketing
              opt-out are skipped.
            </span>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={onPreviewAudience}
          disabled={previewLoading || !form.channelId}
          loading={previewLoading}
          loadingMode="inline"
          variant="secondary"
          
        >
          Preview audience
        </Button>
        {audiencePreview ? (
          <span className="text-sm text-gray-600">
            ~{audiencePreview.totalMatching} recipients
          </span>
        ) : null}
      </div>

      {audiencePreview && audiencePreview.sample.length > 0 ? (
        <ul className="max-h-24 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-2 text-xs text-gray-500">
          {audiencePreview.sample.slice(0, 8).map((sample, index) => (
            <li key={`${sample.identifier}-${index}`}>
              {sample.name} - {sample.identifier}
            </li>
          ))}
        </ul>
      ) : null}

      {isWhatsApp ? (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-800">
            WhatsApp template
          </p>
          <p className="text-xs text-gray-500">
            Meta requires an approved template for most outbound
            WhatsApp broadcasts.
          </p>
          <Select
            value={selectedTemplateId}
            onChange={(event) =>
              onSelectedTemplateIdChange(event.target.value)
            }
            options={templateOptions}
          />
          {selectedTemplate
            ? templateVariableKeys(selectedTemplate.variables).map((key) => (
                <Input
                  key={key}
                  label={`{{${key}}}`}
                  inputSize="sm"
                  value={templateVars[key] ?? ""}
                  onChange={(event) =>
                    onTemplateVarsChange({
                      ...templateVars,
                      [key]: event.target.value,
                    })
                  }
                />
              ))
            : null}
        </div>
      ) : (
        <Textarea
          label="Message"
          value={form.text}
          onChange={(event) =>
            onFormChange({ ...form, text: event.target.value })
          }
          rows={4}
          placeholder="Write the message for this channel..."
        />
      )}

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-800">Send time</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            fullWidth
            variant={
              form.scheduleMode === "now" ? "soft-primary" : "secondary"
            }
            onClick={() =>
              onFormChange({
                ...form,
                scheduleMode: "now",
                scheduledAt: "",
              })
            }
          >
            Send now
          </Button>
          <Button
            type="button"
            fullWidth
            variant={
              form.scheduleMode === "later" ? "soft-primary" : "secondary"
            }
            onClick={() =>
              onFormChange({ ...form, scheduleMode: "later" })
            }
          >
            Schedule
          </Button>
        </div>
        {form.scheduleMode === "later" ? (
          <Input
            label="Date and time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(event) =>
              onFormChange({
                ...form,
                scheduledAt: event.target.value,
              })
            }
            helperText="The server will pick it up when the scheduled time is due."
          />
        ) : null}
      </div>

      <Input
        label="Batch limit"
        type="number"
        min={1}
        max={500}
        value={String(form.limit)}
        onChange={(event) =>
          onFormChange({
            ...form,
            limit: parseInt(event.target.value, 10) || 200,
          })
        }
        helperText="Max 500 per run. Larger campaigns should be split."
      />
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        onClick={onClose}
        variant="secondary"
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={onSend}
        loading={sending}
        loadingMode="inline"
      >
        {form.scheduleMode === "later"
          ? "Schedule broadcast"
          : "Send broadcast"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        fullScreen
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Broadcast
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Users size={18} />
              New broadcast
            </h2>
          </div>
        }
        footer={footer}
      >
        {content}
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title="New broadcast"
      headerIcon={<Users size={20} />}
      size="md"
      width={512}
      closeOnOverlayClick={false}
      bodyPadding="none"
      secondaryAction={
        <Button
          type="button"
          onClick={onClose}
          variant="secondary"
        >
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          type="button"
          onClick={onSend}
          disabled={sending}
          loading={sending}
          loadingMode="inline"
        >
          {form.scheduleMode === "later"
            ? "Schedule broadcast"
            : "Send broadcast"}
        </Button>
      }
    >
      <div className="h-full overflow-y-auto">
        {content}
      </div>
    </CenterModal>
  );
}
