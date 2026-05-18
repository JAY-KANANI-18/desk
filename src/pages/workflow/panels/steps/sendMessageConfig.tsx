import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type {
  MessageAttachment,
  MessageTemplateData,
  SendMessageData,
  SP,
} from "../../workflow.types";
import { VARIABLE_OPTIONS } from "../../workflow.types";
import { Field, Section, ToggleRow } from "../PanelShell";
import { AlertCircle, FileText, Upload, X } from "@/components/ui/icons";
import { useWorkflow } from "../../WorkflowContext";
import { useChannel } from "../../../../context/ChannelContext";
import { Button } from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { BaseSelect, ChannelSelectMenu } from "../../../../components/ui/Select";
import { VariableTextEditor } from "../../../../components/ui/variable-editor";
import type { VariableSuggestionOption } from "../../../../components/ui/Select";
import { ChannelApi } from "../../../../lib/channelApi";
import {
  SnippetSuggestionMenu,
  useWorkspaceSnippets,
} from "../../../../components/snippets/SnippetSuggestionMenu";
import {
  filterSnippets,
  getSnippetTriggerQuery,
  replaceSnippetTrigger,
  type SnippetAttachment,
} from "../../../../lib/snippets";



function getAttachmentType(mimeType: string): MessageAttachment['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

function snippetAttachmentToMessageAttachment(attachment: SnippetAttachment): MessageAttachment {
  return {
    url: attachment.url,
    type: attachment.type === 'doc' ? 'document' : attachment.type,
    filename: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const workflowVariableOptions: VariableSuggestionOption[] = VARIABLE_OPTIONS.map((key) => ({
  key,
  label: key,
}));

const commerceVariableOptions: VariableSuggestionOption[] = [
  "trigger.orderNumber",
  "trigger.orderTotalAmount",
  "trigger.currency",
  "trigger.checkoutUrl",
  "trigger.customerEmail",
  "trigger.customerPhone",
].map((key) => ({ key, label: key }));

const messageVariableOptions = [...workflowVariableOptions, ...commerceVariableOptions];

type MessageMode = "text" | "media" | "template";

type TemplateOption = {
  id: string;
  metaId?: string | null;
  name: string;
  language: string;
  category?: string;
  status?: string;
  components: unknown[];
  variables: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clearTemplateMetadata(metadata?: SendMessageData["metadata"]) {
  if (!metadata?.template) return metadata;
  const rest = { ...metadata };
  delete rest.template;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

function supportsApprovedTemplates(channelType?: string | null) {
  return channelType === "whatsapp" || channelType === "messenger";
}

function extractTemplateKeysFromText(text: string | undefined) {
  if (!text) return [];
  return [...text.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)].map((match) => match[1]);
}

function extractTemplateKeysFromComponents(components: unknown[]) {
  const keys = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      extractTemplateKeysFromText(value).forEach((key) => keys.add(key));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (isRecord(value)) {
      Object.values(value).forEach(visit);
    }
  };
  components.forEach(visit);
  return Array.from(keys);
}

function normalizeTemplate(row: unknown): TemplateOption | null {
  if (!isRecord(row)) return null;
  const id = String(row.id ?? row.metaId ?? row.name ?? "");
  const name = String(row.name ?? "");
  const language = String(row.language ?? "");
  if (!id || !name || !language) return null;

  const components = Array.isArray(row.components) ? row.components : [];
  const rawVariables = Array.isArray(row.variables)
    ? row.variables.map((item) => {
        if (typeof item === "string") return item;
        return isRecord(item) ? String(item.key ?? item.label ?? "") : "";
      })
    : [];
  const variables = Array.from(
    new Set([...rawVariables.filter(Boolean), ...extractTemplateKeysFromComponents(components)]),
  );

  return {
    id,
    metaId: typeof row.metaId === "string" ? row.metaId : null,
    name,
    language,
    category: typeof row.category === "string" ? row.category : undefined,
    status: typeof row.status === "string" ? row.status : undefined,
    components,
    variables,
  };
}

function normalizeTemplateList(result: unknown) {
  const rows = isRecord(result) && Array.isArray(result.data)
    ? result.data
    : Array.isArray(result)
      ? result
      : [];
  return rows.map(normalizeTemplate).filter((item): item is TemplateOption => Boolean(item));
}

function templateId(template?: MessageTemplateData) {
  return template?.id ?? template?.metaId ?? (template?.name && template?.language
    ? `${template.name}:${template.language}`
    : "");
}

function templateOptionValue(template: TemplateOption) {
  return template.id || template.metaId || `${template.name}:${template.language}`;
}

function buildTemplateMetadata(template: TemplateOption, existing?: MessageTemplateData): MessageTemplateData {
  const currentVariables = existing?.variables ?? {};
  const variables = Object.fromEntries(
    template.variables.map((key) => [key, currentVariables[key] ?? ""]),
  );

  return {
    id: template.id,
    metaId: template.metaId,
    name: template.name,
    language: template.language,
    category: template.category,
    status: template.status,
    variables,
    components: template.components,
  };
}

function AttachmentIcon({ type }: { type: string }) {
  // simple icon based on type
  const icons: Record<string, string> = {
    image: '🖼️', video: '🎥', audio: '🎵', document: '📄', file: '📎',
  };
  return <span className="text-sm">{icons[type] ?? '📎'}</span>;
}
export function SendMessageConfig({ step, onChange }: SP) {
  const data = step.data as SendMessageData;
  const u = (p: Partial<SendMessageData>) => onChange({ ...data, ...p });

  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [snippetHighlightIndex, setSnippetHighlightIndex] = useState(0);
  const [dismissedSnippetDraft, setDismissedSnippetDraft] = useState<string | null>(null);
  const { uploadFile, state } = useWorkflow();
  const { channels } = useChannel();
  const { snippets, snippetsLoading } = useWorkspaceSnippets();
  const messageText = data.defaultMessage.text ?? "";
  const selectedChannel = useMemo(
    () => channels.find((channel: { id?: string | number }) => String(channel.id) === String(data.channel)),
    [channels, data.channel],
  );
  const selectedChannelType =
    typeof selectedChannel?.type === "string" ? selectedChannel.type : null;
  const templateChannel = supportsApprovedTemplates(selectedChannelType);
  const selectedTemplate = data.metadata?.template;
  const currentMode: MessageMode = selectedTemplate
    ? "template"
    : data.defaultMessage.type === "media"
      ? "media"
      : "text";
  const messageModes: MessageMode[] = templateChannel
    ? ["text", "media", "template"]
    : ["text", "media"];
  const selectedTemplateId = templateId(selectedTemplate);
  const isCommerceTrigger = Boolean(state.workflow?.config?.trigger?.type?.startsWith("commerce."));
  const snippetQuery = getSnippetTriggerQuery(messageText);
  const snippetMenuOpen =
    data.defaultMessage.type === "text" &&
    snippetQuery !== null &&
    dismissedSnippetDraft !== messageText;
  const snippetOptions = useMemo(
    () => (snippetQuery === null ? [] : filterSnippets(snippets, snippetQuery)),
    [snippetQuery, snippets],
  );

  useEffect(() => {
    setSnippetHighlightIndex(0);
  }, [snippetQuery, snippetOptions.length]);

  useEffect(() => {
    let cancelled = false;

    if (!templateChannel || !data.channel || data.channel === "last_interacted") {
      setTemplates([]);
      setTemplateError(null);
      setTemplatesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setTemplatesLoading(true);
    setTemplateError(null);

    const loadTemplates = selectedChannelType === "messenger"
      ? ChannelApi.listMessengerTemplates(data.channel)
      : ChannelApi.listWhatsAppTemplates(data.channel, { status: "APPROVED" });

    Promise.resolve(loadTemplates)
      .then((result) => {
        if (cancelled) return;
        setTemplates(normalizeTemplateList(result));
      })
      .catch(() => {
        if (cancelled) return;
        setTemplates([]);
        setTemplateError("Could not load approved templates for this channel.");
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data.channel, selectedChannelType, templateChannel]);

  const templateVariableKeys = useMemo(() => {
    if (selectedTemplate?.variables) return Object.keys(selectedTemplate.variables);
    const storedComponents = Array.isArray(selectedTemplate?.components)
      ? selectedTemplate.components
      : [];
    return extractTemplateKeysFromComponents(storedComponents);
  }, [selectedTemplate]);

  const selectedTemplateOption = useMemo(() => {
    const fromList = templates.find((template) => templateOptionValue(template) === selectedTemplateId);
    if (fromList) return fromList;
    if (!selectedTemplate?.name || !selectedTemplate.language) return null;

    return {
      id: selectedTemplate.id ?? selectedTemplateId,
      metaId: selectedTemplate.metaId,
      name: selectedTemplate.name,
      language: selectedTemplate.language,
      category: selectedTemplate.category,
      status: selectedTemplate.status,
      components: Array.isArray(selectedTemplate.components) ? selectedTemplate.components : [],
      variables: templateVariableKeys,
    } satisfies TemplateOption;
  }, [selectedTemplate, selectedTemplateId, templateVariableKeys, templates]);

  const commerceWindowWarning = useMemo(() => {
    if (!isCommerceTrigger) return null;
    if (data.channel === "last_interacted") {
      return "Commerce events do not open a chat window. Choose a specific sendable channel instead of Last Interacted.";
    }
    if (selectedChannelType === "whatsapp" && currentMode !== "template") {
      return "Shopify/order events do not open WhatsApp's 24-hour window. Use an approved template for first-touch order messages.";
    }
    if (selectedChannelType === "messenger" || selectedChannelType === "instagram" || selectedChannelType === "webchat") {
      return "This channel needs an existing customer conversation window. Commerce phone or email data alone cannot start it.";
    }
    return null;
  }, [currentMode, data.channel, isCommerceTrigger, selectedChannelType]);

  const updateMessageText = useCallback((text: string) => {
    if (text !== messageText) {
      setDismissedSnippetDraft(null);
    }
    u({
      defaultMessage: {
        ...data.defaultMessage,
        text,
      },
    });
  }, [data.defaultMessage, messageText, u]);

  const handleSelectSnippet = useCallback((snippet: (typeof snippets)[number]) => {
    const snippetAttachments = snippet.attachments ?? [];
    setDismissedSnippetDraft(null);
    u({
      defaultMessage: {
        ...data.defaultMessage,
        type: "text",
        text: replaceSnippetTrigger(messageText, snippet.content),
      },
      ...(snippetAttachments.length
        ? {
            attachments: [
              ...(data.attachments ?? []),
              ...snippetAttachments.map(snippetAttachmentToMessageAttachment),
            ],
          }
        : {}),
    });
  }, [data.attachments, data.defaultMessage, messageText, u]);

  const handleSnippetKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!snippetMenuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setDismissedSnippetDraft(messageText);
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
  }, [handleSelectSnippet, messageText, snippetHighlightIndex, snippetMenuOpen, snippetOptions]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      setUploading(true);
      try {
        const uploaded: MessageAttachment[] = [];

        for (const file of files) {
          // Use uploadFile from WorkflowContext directly
          const fileUrl = await uploadFile(file, step.id);

          uploaded.push({
            url:      fileUrl,
            type:     getAttachmentType(file.type),
            filename: file.name,
            mimeType: file.type,
            size:     file.size,
          });
        }

        u({ attachments: [...(data.attachments ?? []), ...uploaded] });
      } catch (err) {
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    },
    [data, step.id, uploadFile],
  );

  const removeAttachment = (index: number) => {
    const next = [...(data.attachments ?? [])];
    next.splice(index, 1);
    u({ attachments: next });
  };

  const setMessageMode = (mode: MessageMode) => {
    if (mode === "template") {
      u({
        defaultMessage: {
          ...data.defaultMessage,
          type: "text",
          text: "",
        },
        attachments: [],
        metadata: {
          ...(data.metadata ?? {}),
          template: data.metadata?.template ?? {
            name: "",
            language: "",
            variables: {},
          },
        },
      });
      return;
    }

    u({
      defaultMessage: {
        ...data.defaultMessage,
        type: mode,
      },
      metadata: clearTemplateMetadata(data.metadata),
    });
  };

  const handleTemplateChange = (value: string) => {
    const nextTemplate = templates.find((template) => templateOptionValue(template) === value);
    if (!nextTemplate) {
      u({
        metadata: clearTemplateMetadata(data.metadata),
      });
      return;
    }

    u({
      defaultMessage: {
        ...data.defaultMessage,
        type: "text",
        text: "",
      },
      attachments: [],
      metadata: {
        ...(data.metadata ?? {}),
        template: buildTemplateMetadata(nextTemplate, data.metadata?.template),
      },
    });
  };

  const updateTemplateVariable = (key: string, value: string) => {
    if (!selectedTemplate) return;
    u({
      metadata: {
        ...(data.metadata ?? {}),
        template: {
          ...selectedTemplate,
          variables: {
            ...(selectedTemplate.variables ?? {}),
            [key]: value,
          },
        },
      },
    });
  };

  return (
    <>
      <Section title="Channel">
        <Field label="Send on" required>
          <ChannelSelectMenu
            channels={channels}
            value={data.channel || "last_interacted"}
            onChange={(channel) => {
              const nextChannel = channels.find(
                (candidate: { id?: string | number }) => String(candidate.id) === String(channel),
              );
              const nextType = typeof nextChannel?.type === "string" ? nextChannel.type : null;
              u({
                channel,
                metadata: supportsApprovedTemplates(nextType)
                  ? data.metadata
                  : clearTemplateMetadata(data.metadata),
              });
            }}
            variant="panel"
            groupLabel="Channels"
            specialOptions={[
              {
                value: "last_interacted",
                label: "Last Interacted Channel",
                alwaysVisible: true,
              },
            ]}
            searchable
          />
        </Field>
      </Section>

      <Section title="Message">
        {commerceWindowWarning ? (
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{commerceWindowWarning}</span>
          </div>
        ) : null}
        <Field label="Type">
          <div className="flex gap-2 mb-3">
            {messageModes.map((t) => (
              <div key={t} className="flex-1">
                <Button
                  onClick={() => setMessageMode(t)}
                  variant={currentMode === t ? "dark" : "secondary"}
                  size="sm"
                  fullWidth
                  leftIcon={t === "template" ? <FileText size={13} /> : undefined}
                >
                  {t === "text" ? "Text" : t === "media" ? "Media" : "Template"}
                </Button>
              </div>
            ))}
          </div>
        </Field>

        {currentMode === "template" ? (
          <Field
            label="Approved template"
            required
            hint={
              selectedChannelType === "whatsapp"
                ? "Required for WhatsApp messages outside the 24-hour window."
                : "Requires an existing Messenger recipient identity."
            }
          >
            <div className="space-y-3">
              <BaseSelect
                options={[
                  { value: "", label: templatesLoading ? "Loading templates..." : "Choose approved template" },
                  ...templates.map((template) => ({
                    value: templateOptionValue(template),
                    label: `${template.name} (${template.language})${template.category ? ` - ${template.category}` : ""}`,
                  })),
                ]}
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                placeholder={templatesLoading ? "Loading templates..." : "Choose approved template"}
                disabled={templatesLoading || !templateChannel}
                emptyMessage="No approved templates found."
              />
              {templateError ? (
                <p className="text-xs text-red-500">{templateError}</p>
              ) : null}
              {selectedTemplateOption && templateVariableKeys.length > 0 ? (
                <div className="space-y-2">
                  {templateVariableKeys.map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        {`{{${key}}}`}
                      </label>
                      <VariableTextEditor
                        value={selectedTemplate?.variables?.[key] ?? ""}
                        onChange={(value) => updateTemplateVariable(key, value)}
                        variables={messageVariableOptions}
                        placeholder={`Value for ${key}`}
                        menuPlacement="bottom"
                        editorClassName="min-h-[38px] w-full rounded-lg border border-[var(--color-gray-300)] px-3 py-2 text-sm text-[var(--color-gray-700)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Field>
        ) : data.defaultMessage.type === "text" ? (
          <Field
            label="Content"
            required
            hint="Type $ to insert variables. Example: {{contact.first_name}}"
          >
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
              <VariableTextEditor
                value={messageText}
                onChange={updateMessageText}
                variables={messageVariableOptions}
                placeholder="Type your message..."
                menuPlacement="bottom"
                onKeyDown={handleSnippetKeyDown}
                editorClassName="min-h-[110px] w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm text-[var(--color-gray-700)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />

            </div>
            {(data.attachments ?? []).length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {(data.attachments ?? []).map((att, i) => (
                  <div key={`${att.url}-${i}`} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <AttachmentIcon type={att.type} />
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                      {att.filename ?? att.url.split('/').pop()}
                    </span>
                    <IconButton
                      aria-label="Remove attachment"
                      icon={<X size={13} />}
                      variant="danger-ghost"
                      size="xs"
                      onClick={() => removeAttachment(i)}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </Field>
        ) : (
     <Field label="File" required>
    <div className="space-y-2">
      {/* Uploaded attachments preview */}
      {(data.attachments ?? []).map((att, i) => (
        <div key={i} className="space-y-1.5">
          {/* Filename row */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
            <span className="flex-1 text-xs text-gray-700 truncate">
              {att.filename ?? att.url.split('/').pop()}
            </span>
            <IconButton
              aria-label="Remove attachment"
              icon={<X size={13} />}
              variant="danger-ghost"
              size="xs"
              onClick={() => removeAttachment(i)}
            />
          </div>

          {/* Image preview */}
          {att.type === 'image' && (
            <div className="relative w-fit rounded-lg border border-gray-200 bg-gray-50 p-1.5 overflow-hidden">
              <div className="absolute left-1 top-1 z-10">
                <IconButton
                  aria-label="Remove attachment"
                  icon={<X size={10} />}
                  variant="dark"
                  size="2xs"
                  radius="full"
                  onClick={() => removeAttachment(i)}
                />
              </div>
              <img
                src={att.url}
                alt={att.filename ?? 'attachment'}
                className="w-20 h-20 object-cover rounded-md"
              />
            </div>
          )}

          {/* Non-image file preview */}
          {att.type !== 'image' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <AttachmentIcon type={att.type} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{att.filename}</p>
                {att.size && (
                  <p className="text-[10px] text-gray-400">{formatBytes(att.size)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Upload zone */}
      <label
        className={`flex flex-col items-center justify-center gap-1 border border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
          uploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-gray-400 bg-white'
        }`}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
        />
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-blue-500">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload size={13} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Click to upload or drag files here</p>
            <p className="text-xs text-gray-400">Images, videos, documents up to 25MB</p>
          </>
        )}
      </label>
    </div>
  </Field>
        )}
      </Section>

      <Section title="Advanced" collapsible defaultOpen={false}>
        <ToggleRow
          label="Add Message Failure Branch"
          description="Handle cases where the message fails to send"
          checked={data.addMessageFailureBranch}
          onChange={(v) => u({ addMessageFailureBranch: v })}
        />
      </Section>
    </>
  );
}

/*
type VariableEditorProps = {
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  placeholder?: string;
};

export function VariableEditor({
  value,
  onChange,
  variables,
  placeholder = "Type your message...",
}: VariableEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const variableMenu = useDisclosure();
  const [query, setQuery] = useState("");

  const filteredVariables = useMemo(() => {
    if (!query) return variables;
    return variables.filter((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, variables]);

  // raw value -> visual HTML
  const renderHTML = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped.replace(
      /\{\{\$([a-zA-Z0-9._-]+)\}\}/g,
      (_, variable) =>
        `<span contenteditable="false" data-variable="${variable}" class="inline-flex items-center rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 mx-0.5 text-sm font-medium align-middle variable-token">$${variable}</span>`,
    );
  };

  // editor DOM -> raw string
  const extractRawText = () => {
    const editor = editorRef.current;
    if (!editor) return "";

    let result = "";

    editor.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || "";
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).dataset.variable
      ) {
        const variable = (node as HTMLElement).dataset.variable;
        result += `{{$${variable}}}`;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        result += (node as HTMLElement).innerText || "";
      }
    });

    return result;
  };

  const syncFromValue = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = renderHTML(value);
    if (editor.innerHTML !== html) {
      editor.innerHTML = html || "";
    }
  };

  useEffect(() => {
    syncFromValue();
  }, [value]);

  const saveChange = () => {
    const raw = extractRawText();
    onChange(raw);

    const selection = window.getSelection();
    const textBeforeCursor = selection?.anchorNode?.textContent?.slice(
      0,
      selection.anchorOffset,
    );

    const match = textBeforeCursor?.match(/\$([a-zA-Z0-9._-]*)$/);

    if (match) {
      variableMenu.open();
      setQuery(match[1] || "");
    } else {
      variableMenu.close();
      setQuery("");
    }
  };

  const insertVariable = (variable: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // remove "$abc" typed before cursor
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const node = range.startContainer;
      const text = node.textContent || "";
      const before = text.slice(0, range.startOffset);
      const after = text.slice(range.startOffset);

      const newBefore = before.replace(/\$([a-zA-Z0-9._-]*)$/, "");

      node.textContent = newBefore + after;

      const newOffset = newBefore.length;
      const newRange = document.createRange();
      newRange.setStart(node, newOffset);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    const span = document.createElement("span");
    span.setAttribute("contenteditable", "false");
    span.setAttribute("data-variable", variable);
    span.className =
      "inline-flex items-center rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 mx-0.5 text-sm font-medium align-middle variable-token";
    span.textContent = `$${variable}`; // 👈 only $ shown

    const space = document.createTextNode(" ");

    const currentRange = selection.getRangeAt(0);
    currentRange.insertNode(space);
    currentRange.insertNode(span);

    const afterRange = document.createRange();
    afterRange.setStartAfter(space);
    afterRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(afterRange);

    variableMenu.close();
    setQuery("");

    const raw = extractRawText();
    onChange(raw);
    editorRef.current?.focus();
  };

  // Copy should copy raw value with {{}}
  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = extractRawText();
    e.clipboardData.setData("text/plain", raw);
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={saveChange}
        onClick={saveChange}
        onKeyUp={saveChange}
        onCopy={handleCopy}
        className="min-h-[110px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap break-words"
      />

      {!value && (
        <div className="pointer-events-none absolute left-3 top-2 text-sm text-gray-400">
          {placeholder}
        </div>
      )}

      {variableMenu.isOpen && filteredVariables.length > 0 && (
        <div className="absolute left-0 top-full mt-2 z-30 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50">
            Insert Variable
          </div>

          <div className="max-h-56 overflow-auto">
            {filteredVariables.map((variable) => (
              <Button
                key={variable}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertVariable(variable);
                }}
                variant="inherit-ghost"
                radius="none"
                size="sm"
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="text-gray-800">${variable}</span>
                  <span className="text-xs text-gray-400">
                    {`{{$${variable}}}`}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
*/
