import { Loader2, ShieldCheck, Users, X } from "lucide-react";
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Users size={20} />
            New broadcast
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 transition hover:text-slate-600">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Internal name</label>
            <input
              type="text"
              placeholder="Q1 promo - WhatsApp"
              value={form.name}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Channel</label>
            <select
              value={form.channelId}
              onChange={(event) => onFormChange({ ...form, channelId: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
            >
              <option value="">Select channel</option>
              {channels
                .filter((channel) => channel.status === "connected" || !channel.status)
                .map((channel) => (
                  <option key={String(channel.id)} value={String(channel.id)}>
                    {channel.name ?? channel.type} ({channel.type})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lifecycle</label>
            <select
              value={form.lifecycleId}
              onChange={(event) => onFormChange({ ...form, lifecycleId: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Tags (any match)</label>
            <BroadcastTagPicker
              tags={tags}
              value={form.tagIds}
              onChange={(tagIds) => onFormChange({ ...form, tagIds })}
            />
            <p className="mt-1 text-xs text-slate-500">Recipients match if they have at least one selected tag.</p>
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
            <input
              type="checkbox"
              checked={form.respectMarketingOptOut}
              onChange={(event) =>
                onFormChange({ ...form, respectMarketingOptOut: event.target.checked })
              }
              className="mt-1 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck size={14} className="text-emerald-600" />
                Exclude marketing opt-outs
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Recommended for promotional campaigns. Contacts with marketing opt-out are skipped.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPreviewAudience}
              disabled={previewLoading || !form.channelId}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {previewLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              Preview audience
            </button>
            {audiencePreview && <span className="text-sm text-slate-600">~{audiencePreview.totalMatching} recipients</span>}
          </div>

          {audiencePreview && audiencePreview.sample.length > 0 && (
            <ul className="max-h-24 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-2 text-xs text-slate-500">
              {audiencePreview.sample.slice(0, 8).map((sample, index) => (
                <li key={`${sample.identifier}-${index}`}>
                  {sample.name} · {sample.identifier}
                </li>
              ))}
            </ul>
          )}

          {isWhatsApp ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-800">WhatsApp template</p>
              <p className="text-xs text-slate-500">
                Meta requires an approved template for most outbound WhatsApp broadcasts.
              </p>
              <select
                value={selectedTemplateId}
                onChange={(event) => onSelectedTemplateIdChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select template</option>
                {waTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.language}) · {template.category}
                  </option>
                ))}
              </select>
              {selectedTemplate &&
                templateVariableKeys(selectedTemplate.variables).map((key) => (
                  <div key={key}>
                    <label className="text-xs text-slate-600">{`{{${key}}}`}</label>
                    <input
                      value={templateVars[key] ?? ""}
                      onChange={(event) =>
                        onTemplateVarsChange({ ...templateVars, [key]: event.target.value })
                      }
                      className="mt-0.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={form.text}
                onChange={(event) => onFormChange({ ...form, text: event.target.value })}
                rows={4}
                placeholder="Write the message for this channel..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
              />
            </div>
          )}

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-800">Send time</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onFormChange({ ...form, scheduleMode: "now", scheduledAt: "" })}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  form.scheduleMode === "now"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-700"
                }`}
              >
                Send now
              </button>
              <button
                type="button"
                onClick={() => onFormChange({ ...form, scheduleMode: "later" })}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  form.scheduleMode === "later"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-700"
                }`}
              >
                Schedule
              </button>
            </div>
            {form.scheduleMode === "later" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date and time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) => onFormChange({ ...form, scheduledAt: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">The server will pick it up when the scheduled time is due.</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Batch limit</label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.limit}
              onChange={(event) =>
                onFormChange({ ...form, limit: parseInt(event.target.value, 10) || 200 })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Max 500 per run. Larger campaigns should be split.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : null}
            {form.scheduleMode === "later" ? "Schedule broadcast" : "Send broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}
