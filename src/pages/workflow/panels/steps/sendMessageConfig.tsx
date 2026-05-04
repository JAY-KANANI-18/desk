import { useCallback, useState } from "react";
import { MessageAttachment, SendMessageData, SP, VARIABLE_OPTIONS } from "../../workflow.types";
import { Field, Section, ToggleRow } from "../PanelShell";
import { Upload, X } from "@/components/ui/icons";
import { useWorkflow } from "../../WorkflowContext";
import { useChannel } from "../../../../context/ChannelContext";
import { Button } from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/button/IconButton";
import { ChannelSelectMenu } from "../../../../components/ui/Select";
import { VariableTextEditor } from "../../../../components/ui/variable-editor";
import type { VariableSuggestionOption } from "../../../../components/ui/Select";



function getAttachmentType(mimeType: string): MessageAttachment['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
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
  const { uploadFile } = useWorkflow();
  const { channels } = useChannel();

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
        console.error('Upload failed', err);
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

  return (
    <>
      <Section title="Channel">
        <Field label="Send on" required>
          <ChannelSelectMenu
            channels={channels}
            value={data.channel || "last_interacted"}
            onChange={(channel) => u({ channel })}
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
        <Field label="Type">
          <div className="flex gap-2 mb-3">
            {(["text", "media"] as const).map((t) => (
              <div key={t} className="flex-1">
                <Button
                  onClick={() =>
                    u({
                      defaultMessage: {
                        ...data.defaultMessage,
                        type: t,
                      },
                    })
                  }
                  variant={data.defaultMessage.type === t ? "dark" : "secondary"}
                  size="sm"
                  fullWidth
                >
                  {t === "text" ? "Text" : "Media"}
                </Button>
              </div>
            ))}
          </div>
        </Field>

        {data.defaultMessage.type === "text" ? (
          <Field
            label="Content"
            required
            hint="Type $ to insert variables. Example: {{contact.first_name}}"
          >
            <div className="relative">
              <VariableTextEditor
                value={data.defaultMessage.text ?? ""}
                onChange={(v) =>
                  u({
                    defaultMessage: {
                      ...data.defaultMessage,
                      text: v,
                    },
                  })
                }
                variables={workflowVariableOptions}
                placeholder="Type your message..."
                menuPlacement="bottom"
                editorClassName="min-h-[110px] w-full rounded-xl border border-[var(--color-gray-300)] px-3 py-2 text-sm text-[var(--color-gray-700)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />

            </div>
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
