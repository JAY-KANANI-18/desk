import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "@/components/ui/icons";
import { BackButton } from "../../components/channels/BackButton";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { CheckboxInput } from "../../components/ui/inputs";
import {
  BaseSelect,
  ChannelSelectMenu,
  LifecycleSelectMenu,
  type ChannelSelectMenuChannel,
  type VariableSuggestionOption,
} from "../../components/ui/Select";
import { PageLayout } from "../../components/ui/PageLayout";
import { VariableTextEditor } from "../../components/ui/variable-editor";
import {
  SnippetSuggestionMenu,
  useWorkspaceSnippets,
} from "../../components/snippets/SnippetSuggestionMenu";
import { FeatureGate } from "../../context/FeatureFlagContext";
import { channelSupportsBroadcast } from "../../config/channelMetadata";
import type { BroadcastSendResult } from "../../lib/broadcastApi";
import {
  filterSnippets,
  getSnippetTriggerQuery,
  replaceSnippetTrigger,
} from "../../lib/snippets";
import {
  WhatsAppPreview,
  type Template as WhatsAppPreviewTemplate,
} from "../inbox/TemplateModal";
import { BroadcastChannelLabel } from "./BroadcastChannelLabel";
import { BroadcastTagPicker } from "./BroadcastTagPicker";
import type {
  BroadcastAudiencePreviewState,
  BroadcastFormState,
  BroadcastTemplate,
  LifecycleRow,
  TagRow,
} from "./types";
import {
  formatDateTime,
  templateFieldLabel,
  templateVariableKeys,
} from "./utils";

type ComposerStepId = "setup" | "audience" | "message" | "review";

type BroadcastComposerPageProps = {
  channels: ChannelSelectMenuChannel[];
  form: BroadcastFormState;
  onFormChange: (next: BroadcastFormState) => void;
  tags: TagRow[];
  lifecycles: LifecycleRow[];
  audiencePreview: BroadcastAudiencePreviewState | null;
  previewLoading: boolean;
  onPreviewAudience: () => void | Promise<void>;
  isWhatsApp: boolean;
  waTemplates: BroadcastTemplate[];
  selectedTemplateId: string;
  onSelectedTemplateIdChange: (value: string) => void;
  selectedTemplate?: BroadcastTemplate;
  selectedChannel?: ChannelSelectMenuChannel | null;
  templateVars: Record<string, string>;
  onTemplateVarsChange: (next: Record<string, string>) => void;
  sending: boolean;
  onBack: () => void;
  onSend: () => Promise<BroadcastSendResult | null>;
};

type TemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type?: string;
    text?: string;
    url?: string;
    phone_number?: string;
  }>;
  example?: {
    header_handle?: string[];
  };
};

const COMPOSER_STEPS: Array<{
  id: ComposerStepId;
  label: string;
  description: string;
}> = [
  {
    id: "setup",
    label: "Create broadcast",
    description: "Name and sender",
  },
  {
    id: "message",
    label: "Select message",
    description: "Template or text",
  },
  {
    id: "audience",
    label: "Select audience",
    description: "People and filters",
  },
  {
    id: "review",
    label: "Preview",
    description: "Timing and send",
  },
];

const BROADCAST_VARIABLE_OPTIONS: VariableSuggestionOption[] = [
  {
    key: "contact_name",
    label: "Contact name",
    description: "Full name, email, or phone",
  },
  {
    key: "contact_first_name",
    label: "First name",
    description: "Contact first name",
  },
  {
    key: "contact_last_name",
    label: "Last name",
    description: "Contact last name",
  },
  {
    key: "contact_email",
    label: "Email",
    description: "Contact email address",
  },
  {
    key: "contact_phone",
    label: "Phone",
    description: "Contact phone number",
  },
  {
    key: "agent_name",
    label: "Agent name",
    description: "Broadcast sender",
  },
  {
    key: "last_message",
    label: "Last message",
    description: "Most recent conversation message",
  },
];

function stepIcon(step: ComposerStepId) {
  if (step === "setup") return <Sparkles size={15} />;
  if (step === "audience") return <Users size={15} />;
  if (step === "message") return <MessageSquareText size={15} />;
  return <Send size={15} />;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractTemplateKeys(...texts: Array<string | undefined>) {
  const keys = texts.flatMap((text) =>
    text ? [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]) : [],
  );
  return Array.from(new Set(keys));
}

function templateComponents(template?: BroadcastTemplate) {
  if (!template || !Array.isArray(template.components)) return [];
  return template.components.filter(isRecord) as TemplateComponent[];
}

function normalizeTemplateCategory(
  category?: string,
): WhatsAppPreviewTemplate["category"] {
  const normalized = category?.toUpperCase();
  if (
    normalized === "UTILITY" ||
    normalized === "AUTHENTICATION" ||
    normalized === "SERVICE"
  ) {
    return normalized;
  }
  return "MARKETING";
}

function buildWhatsAppPreviewTemplate(
  template?: BroadcastTemplate,
): WhatsAppPreviewTemplate | null {
  if (!template) return null;

  const components = templateComponents(template);
  const getComponent = (type: string) =>
    components.find((component) => component.type === type);
  const header = getComponent("HEADER");
  const body = getComponent("BODY");
  const footer = getComponent("FOOTER");
  const buttonsComponent = getComponent("BUTTONS");
  const bodyText = body?.text ?? "Template content will appear here.";
  const headerText = header?.format === "TEXT" ? header.text : undefined;
  const headerMedia = header?.example?.header_handle?.[0];
  const formatType: Record<string, WhatsAppPreviewTemplate["type"]> = {
    IMAGE: "image",
    VIDEO: "video",
    DOCUMENT: "document",
    LOCATION: "location",
  };
  const type = header?.format ? formatType[header.format] ?? "text" : "text";
  const buttonRows = (buttonsComponent?.buttons ?? []).map((button) => {
    const label = button.text || "Button";
    if (button.type === "URL") {
      return { kind: "url" as const, label, url: button.url ?? "" };
    }
    if (button.type === "PHONE_NUMBER") {
      return { kind: "phone" as const, label, phone: button.phone_number ?? "" };
    }
    if (button.type === "COPY_CODE") {
      return { kind: "copy_code" as const, label, code: label };
    }
    return { kind: "quick_reply" as const, label };
  });
  const variables = Array.from(
    new Set([
      ...templateVariableKeys(template.variables),
      ...extractTemplateKeys(headerText, bodyText, footer?.text),
    ]),
  ).map((key) => ({ key, label: key }));

  return {
    id: template.id,
    name: template.name,
    category: normalizeTemplateCategory(template.category),
    language: template.language,
    type,
    header: headerText ?? (type === "document" ? header?.text : undefined),
    body: bodyText,
    footer: footer?.text,
    buttons: buttonRows.length ? buttonRows : undefined,
    mediaUrl: type === "image" || type === "video" ? headerMedia : undefined,
    variables,
  };
}

function audienceLabel(audiencePreview: BroadcastAudiencePreviewState | null) {
  if (!audiencePreview) return "Not checked yet";
  return `${audiencePreview.totalMatching} ${
    audiencePreview.totalMatching === 1 ? "person" : "people"
  }`;
}

function scheduleLabel(form: BroadcastFormState) {
  if (form.scheduleMode === "later" && form.scheduledAt) {
    return formatDateTime(form.scheduledAt);
  }
  return "Send now";
}

function StepRail({
  activeStep,
  completed,
  furthestStepIndex,
  onSelect,
}: {
  activeStep: ComposerStepId;
  completed: Record<ComposerStepId, boolean>;
  furthestStepIndex: number;
  onSelect: (step: ComposerStepId) => void;
}) {
  const activeIndex = COMPOSER_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <div className="border-b border-slate-200 pb-4">
      <div className="grid grid-cols-4 items-start">
        {COMPOSER_STEPS.map((step, index) => {
          const active = activeStep === step.id;
          const done = completed[step.id];
          const reached = index <= furthestStepIndex;
          const passed = index < activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              aria-current={active ? "step" : undefined}
              aria-disabled={!reached}
              className="group relative flex min-w-0 flex-col items-center gap-3 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              {index > 0 ? (
                <span
                  className={`absolute left-0 top-[15px] h-px w-1/2 -translate-x-1/2 ${
                    passed || active ? "bg-[var(--color-primary)]" : "bg-slate-200"
                  }`}
                />
              ) : null}
              {index < COMPOSER_STEPS.length - 1 ? (
                <span
                  className={`absolute right-0 top-[15px] h-px w-1/2 translate-x-1/2 ${
                    passed || active ? "bg-[var(--color-primary)]" : "bg-slate-200"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all ${
                  done
                    ? "border-transparent bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white shadow-sm"
                    : active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_0_0_5px_var(--color-primary-light)]"
                      : reached
                        ? "border-slate-300 bg-white text-slate-600"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span className="relative z-10 hidden min-w-0 md:block">
                <span
                  className={`block truncate text-xs font-semibold ${
                    active ? "text-slate-950" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {step.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComposerSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-1 min-w-0 text-sm font-semibold text-slate-950">
          {value}
        </div>
      </div>
    </div>
  );
}

function VariableMessageField({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-[42px]",
  onKeyDown,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <VariableTextEditor
        value={value}
        onChange={onChange}
        variables={BROADCAST_VARIABLE_OPTIONS}
        placeholder={placeholder}
        menuPlacement="bottom"
        onKeyDown={onKeyDown}
        aria-label={label}
        className="mt-2"
        editorClassName={`${minHeight} w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm leading-6 text-slate-800 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]`}
        placeholderClassName="left-3 top-2 text-sm text-slate-400"
      />
    </label>
  );
}

function LivePreviewPanel({
  form,
  isWhatsApp,
  selectedTemplate,
  selectedChannel,
  templateVars,
  audiencePreview,
  compact = false,
}: {
  form: BroadcastFormState;
  isWhatsApp: boolean;
  selectedTemplate?: BroadcastTemplate;
  selectedChannel?: ChannelSelectMenuChannel | null;
  templateVars: Record<string, string>;
  audiencePreview: BroadcastAudiencePreviewState | null;
  compact?: boolean;
}) {
  const whatsappTemplate = buildWhatsAppPreviewTemplate(selectedTemplate);
  const channelName = selectedChannel?.name ?? "Broadcast channel";
  const previewTitle = isWhatsApp ? "WhatsApp preview" : "Email preview";

  return (
    <aside className={compact ? "space-y-3" : "space-y-3"}>
      <h2 className="text-base font-semibold text-slate-950">
        {previewTitle}
      </h2>

      {isWhatsApp ? (
        whatsappTemplate ? (
          <WhatsAppPreview template={whatsappTemplate} values={templateVars} />
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center border-y border-dashed border-slate-200 px-5 text-center">
            <MessageSquareText size={24} className="text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Choose an approved template
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The WhatsApp-style preview will appear here with your fields.
            </p>
          </div>
        )
      ) : (
        <div className="border-y border-slate-100 py-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Mail size={15} className="text-[var(--color-primary)]" />
              {channelName}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              To: {audienceLabel(audiencePreview).toLowerCase()}
            </p>
          </div>
          <div className="min-h-[180px] py-4">
            <p
              className={`whitespace-pre-wrap text-sm leading-6 ${
                form.text.trim() ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {form.text.trim() || "Write your message to preview it here."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="border-t border-slate-100 pt-2">
          <p className="text-slate-500">Audience</p>
          <p className="mt-1 font-semibold text-slate-950">
            {audienceLabel(audiencePreview)}
          </p>
        </div>
        <div className="border-t border-slate-100 pt-2">
          <p className="text-slate-500">Timing</p>
          <p className="mt-1 font-semibold text-slate-950">
            {scheduleLabel(form)}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function BroadcastComposerPage({
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
  selectedChannel,
  templateVars,
  onTemplateVarsChange,
  sending,
  onBack,
  onSend,
}: BroadcastComposerPageProps) {
  const [activeStep, setActiveStep] = useState<ComposerStepId>("setup");
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [snippetHighlightIndex, setSnippetHighlightIndex] = useState(0);
  const [dismissedSnippetDraft, setDismissedSnippetDraft] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const { snippets, snippetsLoading } = useWorkspaceSnippets();
  const templateOptions = useMemo(
    () => [
      { value: "", label: "Choose approved message" },
      ...waTemplates.map((template) => ({
        value: template.id,
        label: `${template.name} (${template.language}) - ${template.category}`,
      })),
    ],
    [waTemplates],
  );
  const snippetQuery = getSnippetTriggerQuery(form.text);
  const snippetMenuOpen =
    !isWhatsApp &&
    snippetQuery !== null &&
    dismissedSnippetDraft !== form.text;
  const snippetOptions = useMemo(
    () => (snippetQuery === null ? [] : filterSnippets(snippets, snippetQuery)),
    [snippetQuery, snippets],
  );
  const templateKeys = useMemo(
    () => templateVariableKeys(selectedTemplate?.variables),
    [selectedTemplate?.variables],
  );
  const missingTemplateVars = useMemo(
    () => templateKeys.filter((key) => !(templateVars[key] ?? "").trim()),
    [templateKeys, templateVars],
  );
  const completed: Record<ComposerStepId, boolean> = {
    setup: Boolean(form.name.trim() && form.channelId),
    audience: Boolean(audiencePreview),
    message: isWhatsApp
      ? Boolean(selectedTemplate && missingTemplateVars.length === 0)
      : Boolean(form.text.trim()),
    review: false,
  };
  const activeIndex = COMPOSER_STEPS.findIndex((step) => step.id === activeStep);
  const isReview = activeStep === "review";
  const messageHasPreview = isWhatsApp
    ? Boolean(selectedTemplate)
    : Boolean(form.text.trim());
  const showPreview = activeStep === "review" || (
    activeStep === "message" && messageHasPreview
  );

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

  const handleSnippetKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
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

  const validateStep = useCallback((step: ComposerStepId) => {
    if (step === "setup") {
      if (!form.name.trim()) {
        toast.error("Give this broadcast a name");
        return false;
      }
      if (!form.channelId) {
        toast.error("Choose where to send from");
        return false;
      }
      if (!selectedChannel || !channelSupportsBroadcast(selectedChannel.type)) {
        toast.error("Broadcasts are available for WhatsApp and Email only");
        return false;
      }
    }

    if (step === "message") {
      if (isWhatsApp) {
        if (!selectedTemplate) {
          toast.error("Choose an approved WhatsApp message");
          return false;
        }
        if (missingTemplateVars.length > 0) {
          toast.error(`Fill in ${templateFieldLabel(missingTemplateVars[0])}`);
          return false;
        }
      } else if (!form.text.trim()) {
        toast.error("Write your message");
        return false;
      }
    }

    return true;
  }, [
    form.channelId,
    form.name,
    form.text,
    isWhatsApp,
    missingTemplateVars,
    selectedChannel,
    selectedTemplate,
  ]);

  const goNext = useCallback(async () => {
    if (!validateStep(activeStep)) return;
    if (activeStep === "audience" && !audiencePreview && form.channelId) {
      void onPreviewAudience();
    }
    const nextIndex = Math.min(activeIndex + 1, COMPOSER_STEPS.length - 1);
    const nextStep = COMPOSER_STEPS[nextIndex];
    setFurthestStepIndex((index) => Math.max(index, nextIndex));
    setActiveStep(nextStep.id);
  }, [
    activeIndex,
    activeStep,
    audiencePreview,
    form.channelId,
    onPreviewAudience,
    validateStep,
  ]);

  const goPrevious = useCallback(() => {
    const previousStep = COMPOSER_STEPS[Math.max(activeIndex - 1, 0)];
    setActiveStep(previousStep.id);
  }, [activeIndex]);

  const goToReachedStep = useCallback((step: ComposerStepId) => {
    const targetIndex = COMPOSER_STEPS.findIndex((item) => item.id === step);
    if (targetIndex <= furthestStepIndex) {
      setActiveStep(step);
      return;
    }
    toast.error("Use Continue to move through the broadcast steps.");
  }, [furthestStepIndex]);

  const renderStep = () => {
    if (activeStep === "setup") {
      return (
        <ComposerSection
          title="Create broadcast"
        >
          <div className="grid gap-4">
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
              onChange={(channelId) => onFormChange({ ...form, channelId })}
              placeholder="Choose a connected channel"
              groupLabel="Broadcast-ready channels"
              emptyMessage="Connect WhatsApp or Email to send broadcasts."
              channelFilter={(channel) =>
                (channel.status === "connected" || !channel.status) &&
                channelSupportsBroadcast(channel.type)
              }
              searchable
            />
          </div>
        </ComposerSection>
      );
    }

    if (activeStep === "audience") {
      return (
        <ComposerSection
          title="Select audience"
        >
          <div className="grid gap-4">
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

            <div className="border-y border-slate-100 py-3">
              <CheckboxInput
                checked={form.respectMarketingOptOut}
                onChange={(checked) =>
                  onFormChange({
                    ...form,
                    respectMarketingOptOut: checked,
                  })
                }
                label={
                  <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Do not message people who opted out
                  </span>
                }
                description={
                  <span className="text-xs text-slate-500">
                    Recommended for promotions. People who opted out will be skipped.
                  </span>
                }
              />
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={onPreviewAudience}
                loading={previewLoading}
                loadingMode="inline"
                variant="secondary"
              >
                Check audience
              </Button>
              <span className="text-sm text-slate-600">
                {audiencePreview
                  ? `${audiencePreview.totalMatching} people found`
                  : "Check before sending to confirm eligibility."}
              </span>
            </div>

            {audiencePreview && audiencePreview.sample.length > 0 ? (
              <ul className="max-h-32 overflow-y-auto border-y border-slate-100 py-2 text-sm text-slate-600">
                {audiencePreview.sample.slice(0, 8).map((sample, index) => (
                  <li
                    key={`${sample.identifier}-${index}`}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="truncate font-medium text-slate-800">
                      {sample.name}
                    </span>
                    <span className="truncate text-slate-500">
                      {sample.identifier}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </ComposerSection>
      );
    }

    if (activeStep === "message") {
      return (
        <ComposerSection
          title={isWhatsApp ? "Select a WhatsApp template" : "Write the message"}
        >
          {isWhatsApp ? (
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Approved WhatsApp message
                </p>
                <div className="mt-2">
                  <BaseSelect
                    value={selectedTemplateId}
                    onChange={onSelectedTemplateIdChange}
                    options={templateOptions}
                  />
                </div>
              </div>

              {selectedTemplate && templateKeys.length > 0 ? (
                <div className="grid gap-3">
                  {templateKeys.map((key) => (
                    <VariableMessageField
                      key={key}
                      label={templateFieldLabel(key)}
                      value={templateVars[key] ?? ""}
                      placeholder="Type a value or $ for variables"
                      onChange={(value) =>
                        onTemplateVarsChange({
                          ...templateVars,
                          [key]: value,
                        })
                      }
                    />
                  ))}
                </div>
              ) : null}
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
                placement="bottom"
              />
              <VariableMessageField
                label="Message"
                value={form.text}
                onChange={updateBroadcastText}
                onKeyDown={handleSnippetKeyDown}
                placeholder="Write the message for this channel..."
                minHeight="min-h-[220px]"
              />
            </div>
          )}
        </ComposerSection>
      );
    }

    return (
      <ComposerSection
        title="Preview and send"
      >
        <div className="grid gap-5">
          <div className="border-y border-slate-100">
            <SummaryRow
              label="Broadcast"
              value={form.name.trim() || "Untitled broadcast"}
              icon={<Sparkles size={16} />}
            />
            <SummaryRow
              label="Send from"
              value={
                selectedChannel ? (
                  <BroadcastChannelLabel
                    channel={{
                      id: String(selectedChannel.id ?? ""),
                      name: selectedChannel.name ?? "",
                      type: String(selectedChannel.type ?? ""),
                      identifier: String(selectedChannel.identifier ?? ""),
                    }}
                  />
                ) : (
                  "No channel selected"
                )
              }
              icon={<MessageSquareText size={16} />}
            />
            <SummaryRow
              label="Audience"
              value={audienceLabel(audiencePreview)}
              icon={<Users size={16} />}
            />
            <SummaryRow
              label="Message"
              value={
                isWhatsApp
                  ? selectedTemplate
                    ? `${selectedTemplate.name} (${selectedTemplate.language})`
                    : "No template selected"
                  : form.text.trim()
                    ? "Text message ready"
                    : "No message written"
              }
              icon={<Mail size={16} />}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">When should it go?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                fullWidth
                variant={form.scheduleMode === "now" ? "soft-primary" : "secondary"}
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
                variant={form.scheduleMode === "later" ? "soft-primary" : "secondary"}
                onClick={() => onFormChange({ ...form, scheduleMode: "later" })}
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
        </div>
      </ComposerSection>
    );
  };

  const mobileHeader = (
    <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden">
      <div className="flex min-w-0 items-start gap-3">
        <BackButton onClick={onBack} ariaLabel="Back to broadcasts" size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-slate-400">Broadcasts</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-slate-950">
            Create broadcast
          </h1>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Broadcasts"
      title="Create broadcast"
      subtitle="Create and send a broadcast."
      leading={<BackButton onClick={onBack} ariaLabel="Back to broadcasts" />}
      className="bg-white"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
        {mobileHeader}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <StepRail
              activeStep={activeStep}
              completed={completed}
              furthestStepIndex={furthestStepIndex}
              onSelect={goToReachedStep}
            />

            <div
              className={
                showPreview
                  ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start"
                  : "w-full max-w-3xl"
              }
            >
              <div className="min-w-0">
                <div className="bg-white">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeStep}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {showPreview ? (
                  <div className="mt-4 lg:hidden">
                    <LivePreviewPanel
                      form={form}
                      isWhatsApp={isWhatsApp}
                      selectedTemplate={selectedTemplate}
                      selectedChannel={selectedChannel}
                      templateVars={templateVars}
                      audiencePreview={audiencePreview}
                      compact
                    />
                  </div>
                ) : null}
              </div>

              {showPreview ? (
                <motion.div
                  className="hidden lg:sticky lg:top-0 lg:block"
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <LivePreviewPanel
                    form={form}
                    isWhatsApp={isWhatsApp}
                    selectedTemplate={selectedTemplate}
                    selectedChannel={selectedChannel}
                    templateVars={templateVars}
                    audiencePreview={audiencePreview}
                  />
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {isReview ? (
                completed.message ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Ready for final review
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-amber-500" />
                    Finish the message before sending
                  </>
                )
              ) : (
                <>
                  {stepIcon(activeStep)}
                  Step {activeIndex + 1} of {COMPOSER_STEPS.length}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              {activeStep !== "setup" ? (
                <Button type="button" variant="secondary" onClick={goPrevious}>
                  Back
                </Button>
              ) : null}
              {isReview ? (
                <Button
                  type="button"
                  onClick={() => void onSend()}
                  loading={sending}
                  loadingMode="inline"
                  leftIcon={form.scheduleMode === "later" ? <Clock size={15} /> : <Send size={15} />}
                >
                  {form.scheduleMode === "later"
                    ? "Schedule broadcast"
                    : "Send broadcast"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void goNext()}
                  rightIcon={<ArrowRight size={15} />}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
