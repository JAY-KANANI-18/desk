import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { channelSupportsBroadcast } from "../../config/channelMetadata";
import { ShieldCheck, Users } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { FeatureGate } from "../../context/FeatureFlagContext";
import { Input } from "../../components/ui/Input";
import { CheckboxInput } from "../../components/ui/inputs";
import {
  BaseSelect,
  ChannelSelectMenu,
  LifecycleSelectMenu,
} from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ResponsiveModal } from "../../components/ui/modal";
import {
  SnippetSuggestionMenu,
  useWorkspaceSnippets,
} from "../../components/snippets/SnippetSuggestionMenu";
import { BroadcastTagPicker } from "./BroadcastTagPicker";

import { templateFieldLabel, templateVariableKeys } from "./utils";
import {
  filterSnippets,
  getSnippetTriggerQuery,
  replaceSnippetTrigger,
} from "../../lib/snippets";
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
  const [snippetHighlightIndex, setSnippetHighlightIndex] = useState(0);
  const [dismissedSnippetDraft, setDismissedSnippetDraft] = useState<string | null>(null);
  const { snippets, snippetsLoading } = useWorkspaceSnippets();
  const templateOptions = [
    { value: "", label: "Choose approved message" },
    ...waTemplates.map((template) => ({
      value: template.id,
      label: `${template.name} (${template.language}) - ${template.category}`,
    })),
  ];
  const snippetQuery = getSnippetTriggerQuery(form.text);
  const snippetMenuOpen =
    !isWhatsApp &&
    snippetQuery !== null &&
    dismissedSnippetDraft !== form.text;
  const snippetOptions = useMemo(
    () => (snippetQuery === null ? [] : filterSnippets(snippets, snippetQuery)),
    [snippetQuery, snippets],
  );

  useEffect(() => {
    setSnippetHighlightIndex(0);
  }, [snippetQuery, snippetOptions.length]);

  const updateBroadcastText = useCallback((text: string) => {
    if (text !== form.text) {
      setDismissedSnippetDraft(null);
    }
    onFormChange({ ...form, text });
  }, [form, onFormChange]);

  const handleSelectSnippet = useCallback((snippet: (typeof snippets)[number]) => {
    setDismissedSnippetDraft(null);
    onFormChange({
      ...form,
      text: replaceSnippetTrigger(form.text, snippet.content),
    });
  }, [form, onFormChange]);

  const handleSnippetKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!snippetMenuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setDismissedSnippetDraft(form.text);
      return;
    }

    if (snippetOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSnippetHighlightIndex((index) => Math.min(index + 1, snippetOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSnippetHighlightIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const snippet = snippetOptions[snippetHighlightIndex];
      if (snippet) handleSelectSnippet(snippet);
    }
  }, [form.text, handleSelectSnippet, snippetHighlightIndex, snippetMenuOpen, snippetOptions]);

  const content = (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <Input
        label="Broadcast name"
        placeholder="June offer for customers"
        value={form.name}
        onChange={(event) =>
          onFormChange({ ...form, name: event.target.value })
        }
      />

      <ChannelSelectMenu
        label="Send from"
        hint="Broadcasts are available for WhatsApp and Email."
        value={form.channelId}
        channels={channels}
        onChange={(channelId) =>
          onFormChange({ ...form, channelId })
        }
        placeholder="Choose a connected channel"
        groupLabel="Broadcast-ready channels"
        emptyMessage="Connect WhatsApp or Email to send broadcasts."
        channelFilter={(channel) =>
          (channel.status === "connected" || !channel.status) &&
          channelSupportsBroadcast(channel.type)
        }
        searchable
      />

      <FeatureGate flag="lifecycle">
        <LifecycleSelectMenu
          label="Customer stage"
          value={form.lifecycleId}
          stages={lifecycles}
          onChange={(stageId) =>
            onFormChange({ ...form, lifecycleId: stageId ?? "" })
          }
          noneLabel="Any stage"
        />
      </FeatureGate>

      <BroadcastTagPicker
        label="Send to people with these tags"
        hint="Leave empty to include everyone on the selected channel."
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
              Do not message people who opted out
            </span>
          }
          description={
            <span className="text-xs text-gray-500">
              Recommended for promotions. People who opted out will be skipped.
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
          Check people
        </Button>
        {audiencePreview ? (
          <span className="text-sm text-gray-600">
            {audiencePreview.totalMatching} people found
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
            Approved WhatsApp message
          </p>
          <p className="text-xs text-gray-500">
            WhatsApp requires an approved message before you can contact
            people first.
          </p>
          <BaseSelect
            value={selectedTemplateId}
            onChange={onSelectedTemplateIdChange}
            options={templateOptions}
          />
          {selectedTemplate
            ? templateVariableKeys(selectedTemplate.variables).map((key) => (
                <Input
                  key={key}
                  label={templateFieldLabel(key)}
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
        <div className="relative">
          <SnippetSuggestionMenu
            open={snippetMenuOpen}
            query={snippetQuery ?? ""}
            options={snippetOptions}
            highlightedIndex={snippetHighlightIndex}
            onHighlightChange={setSnippetHighlightIndex}
            onSelect={handleSelectSnippet}
            loading={snippetsLoading}
          />
          <Textarea
            label="Message"
            value={form.text}
            onChange={(event) => updateBroadcastText(event.target.value)}
            onKeyDown={handleSnippetKeyDown}
            rows={4}
            placeholder="Write the message for this channel..."
          />
        </div>
      )}

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-800">When should it go?</p>
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
            Pick a time
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
            helperText="We will start sending at this time."
          />
        ) : null}
      </div>

      <Input
        label="People to send to"
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
        helperText="Maximum 500 people in one broadcast."
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

  return (
    <ResponsiveModal
      isOpen={open}
      onClose={onClose}
      title="New message broadcast"
      mobileTitle={
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Broadcast
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Users size={18} />
            New message broadcast
          </h2>
        </div>
      }
      headerIcon={<Users size={20} />}
      size="md"
      width={512}
      closeOnOverlayClick={false}
      bodyPadding="none"
      mobileFullScreen
      mobileFooter={footer}
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
    </ResponsiveModal>
  );
}
