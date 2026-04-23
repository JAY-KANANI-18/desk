import { Loader2, ShieldCheck, Users, X } from "lucide-react";
import { MobileSheet } from "../../components/topbar/MobileSheet";
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

  const content = (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Internal name
        </label>
        <input
          type="text"
          placeholder="Q1 promo - WhatsApp"
          value={form.name}
          onChange={(event) =>
            onFormChange({ ...form, name: event.target.value })
          }
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Channel
        </label>
        <select
          value={form.channelId}
          onChange={(event) =>
            onFormChange({ ...form, channelId: event.target.value })
          }
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select channel</option>
          {channels
            .filter(
              (channel) =>
                channel.status === "connected" || !channel.status,
            )
            .map((channel) => (
              <option key={String(channel.id)} value={String(channel.id)}>
                {channel.name ?? channel.type} ({channel.type})
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Lifecycle
        </label>
        <select
          value={form.lifecycleId}
          onChange={(event) =>
            onFormChange({ ...form, lifecycleId: event.target.value })
          }
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Any stage</option>
          {lifecycles.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {`${stage.emoji ?? ""} ${stage.name}`.trim()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tags (any match)
        </label>
        <BroadcastTagPicker
          tags={tags}
          value={form.tagIds}
          onChange={(tagIds) => onFormChange({ ...form, tagIds })}
        />
        <p className="mt-1 text-xs text-gray-500">
          Recipients match if they have at least one selected tag.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
        <input
          type="checkbox"
          checked={form.respectMarketingOptOut}
          onChange={(event) =>
            onFormChange({
              ...form,
              respectMarketingOptOut: event.target.checked,
            })
          }
          className="mt-1 rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            Exclude marketing opt-outs
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Recommended for promotional campaigns. Contacts with
            marketing opt-out are skipped.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPreviewAudience}
          disabled={previewLoading || !form.channelId}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {previewLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          Preview audience
        </button>
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
          <select
            value={selectedTemplateId}
            onChange={(event) =>
              onSelectedTemplateIdChange(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select template</option>
            {waTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.language}) - {template.category}
              </option>
            ))}
          </select>
          {selectedTemplate
            ? templateVariableKeys(selectedTemplate.variables).map((key) => (
                <div key={key}>
                  <label className="text-xs text-gray-600">
                    {`{{${key}}}`}
                  </label>
                  <input
                    value={templateVars[key] ?? ""}
                    onChange={(event) =>
                      onTemplateVarsChange({
                        ...templateVars,
                        [key]: event.target.value,
                      })
                    }
                    className="mt-0.5 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))
            : null}
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            value={form.text}
            onChange={(event) =>
              onFormChange({ ...form, text: event.target.value })
            }
            rows={4}
            placeholder="Write the message for this channel..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-800">Send time</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onFormChange({
                ...form,
                scheduleMode: "now",
                scheduledAt: "",
              })
            }
            className={`rounded-xl border px-3 py-2 text-sm ${
              form.scheduleMode === "now"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Send now
          </button>
          <button
            type="button"
            onClick={() =>
              onFormChange({ ...form, scheduleMode: "later" })
            }
            className={`rounded-xl border px-3 py-2 text-sm ${
              form.scheduleMode === "later"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Schedule
          </button>
        </div>
        {form.scheduleMode === "later" ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Date and time
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  scheduledAt: event.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              The server will pick it up when the scheduled time is due.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Batch limit
        </label>
        <input
          type="number"
          min={1}
          max={500}
          value={form.limit}
          onChange={(event) =>
            onFormChange({
              ...form,
              limit: parseInt(event.target.value, 10) || 200,
            })
          }
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Max 500 per run. Larger campaigns should be split.
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-white"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : null}
        {form.scheduleMode === "later"
          ? "Schedule broadcast"
          : "Send broadcast"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users size={20} />
            New broadcast
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 transition hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>
        {content}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}
