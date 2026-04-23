import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChannelApi } from "../../../../lib/channelApi";
import { MessageAttachment, SendMessageData, SP, VARIABLE_OPTIONS } from "../../workflow.types";
import { Field, Section, Select, ToggleRow } from "../PanelShell";
import { ConnectedChannel } from "../../../channels/ManageChannelPage";
import { FileIcon, Upload, X } from "lucide-react";
import { useWorkflow } from "../../WorkflowContext";
import { useChannel } from "../../../../context/ChannelContext";



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
  const [showVarMenu, setShowVarMenu] = useState(false);
  const [varQuery, setVarQuery] = useState("");
  const [caretPos, setCaretPos] = useState(0);
  const { uploadFile } = useWorkflow();
    const [channels, setChannels] = useState<any[]>([]);

  const {channels:ch} = useChannel()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
      setChannels([
        { value: "", label: "Last Interacted Channel" },
        ...ch.map((c) => ({
          value: c.id,
          label: `${c.name} (${c.type})`,
        })),
      ]);
   
  }, [ch]);

  const textValue = data.defaultMessage.text ?? "";

  const filteredVariables = useMemo(() => {
    if (!varQuery) return VARIABLE_OPTIONS;
    return VARIABLE_OPTIONS.filter((v) =>
      v.toLowerCase().includes(varQuery.toLowerCase()),
    );
  }, [varQuery]);

  const detectVariableTrigger = (value: string, cursor: number) => {
    const textBeforeCursor = value.slice(0, cursor);

    // Find last "$" before cursor
    const match = textBeforeCursor.match(/\$([a-zA-Z0-9_]*)$/);

    if (match) {
      setShowVarMenu(true);
      setVarQuery(match[1] || "");
    } else {
      setShowVarMenu(false);
      setVarQuery("");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;

    u({
      defaultMessage: {
        ...data.defaultMessage,
        text: value,
      },
    });

    setCaretPos(cursor);
    detectVariableTrigger(value, cursor);
  };

  const handleSelectVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textValue;
    const cursor = caretPos;

    const beforeCursor = value.slice(0, cursor);
    const afterCursor = value.slice(cursor);

    // replace "$abc" with "{{$abc}}"
    const updatedBefore = beforeCursor.replace(
      /\$([a-zA-Z0-9_]*)$/,
      `{{$${variable}}}`,
    );

    const newValue = updatedBefore + afterCursor;

    u({
      defaultMessage: {
        ...data.defaultMessage,
        text: newValue,
      },
    });

    setShowVarMenu(false);
    setVarQuery("");

    requestAnimationFrame(() => {
      const newCursor = updatedBefore.length;
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
      setCaretPos(newCursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showVarMenu) return;

    if (e.key === "Escape") {
      setShowVarMenu(false);
      setVarQuery("");
    }
  };

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
          <Select
            value={data.channel}
            onChange={(v) => u({ channel: v })}
            options={channels}
          />
        </Field>
      </Section>

      <Section title="Message">
        <Field label="Type">
          <div className="flex gap-2 mb-3">
            {(["text", "media"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  u({
                    defaultMessage: {
                      ...data.defaultMessage,
                      type: t,
                    },
                  })
                }
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  data.defaultMessage.type === t
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {t === "text" ? "Text" : "Media"}
              </button>
            ))}
          </div>
        </Field>

        {data.defaultMessage.type === "text" ? (
          <Field
            label="Content"
            required
            hint="Type $ to insert variables. Example: {{$first_name}}"
          >
            <div className="relative">
              <VariableEditor
                value={data.defaultMessage.text ?? ""}
                onChange={(v) =>
                  u({
                    defaultMessage: {
                      ...data.defaultMessage,
                      text: v,
                    },
                  })
                }
                variables={VARIABLE_OPTIONS}
                placeholder="Type your message..."
              />

              {showVarMenu && filteredVariables.length > 0 && (
                <div className="absolute z-20 bottom-full mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50">
                    Insert Variable
                  </div>

                  <div className="max-h-56 overflow-auto">
                    {filteredVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => handleSelectVariable(variable)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                      >
                        <span className="text-gray-800">{variable}</span>
                        <span className="text-xs text-gray-400">
                          {`{{$${variable}}}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            <button
              type="button"
              onClick={() => removeAttachment(i)}
              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Image preview */}
          {att.type === 'image' && (
            <div className="relative w-fit rounded-lg border border-gray-200 bg-gray-50 p-1.5 overflow-hidden">
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X size={10} />
              </button>
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
              <FileIcon type={att.type} />
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
  const [showMenu, setShowMenu] = useState(false);
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
      setShowMenu(true);
      setQuery(match[1] || "");
    } else {
      setShowMenu(false);
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

    setShowMenu(false);
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

      {showMenu && filteredVariables.length > 0 && (
        <div className="absolute left-0 top-full mt-2 z-30 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50">
            Insert Variable
          </div>

          <div className="max-h-56 overflow-auto">
            {filteredVariables.map((variable) => (
              <button
                key={variable}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertVariable(variable);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
              >
                <span className="text-gray-800">${variable}</span>
                <span className="text-xs text-gray-400">
                  {`{{$${variable}}}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
