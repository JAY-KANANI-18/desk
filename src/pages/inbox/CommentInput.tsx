import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  AtSign,
  EyeOff,
  MessageSquare,
  Paperclip,
  Smile,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/button/IconButton";
import { VariableSuggestionMenu } from "../../components/ui/Select";
import { Tag } from "../../components/ui/Tag";
import { TextareaInput } from "../../components/ui/inputs/TextareaInput";
import { teamMembers, variables } from "./data";
import { EmojiPicker } from "./EmojiPicker";
import { ComposerAttachmentPreviewStrip } from "./composerShared";
import type { AttachmentType, Message } from "./types";

interface CommentInputProps {
  conversationId: number;
  onSendMessage: (msg: Message) => void;
}

type CommentAttachedFile = {
  file: File;
  type: AttachmentType;
  previewUrl?: string;
};

function getCommentAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "doc";
}

function revokeCommentPreview(file: CommentAttachedFile) {
  if (file.previewUrl) {
    URL.revokeObjectURL(file.previewUrl);
  }
}

export function CommentInput({ conversationId, onSendMessage }: CommentInputProps) {
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState<CommentAttachedFile[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [variableQuery, setVariableQuery] = useState<string | null>(null);
  const [variableHighlight, setVariableHighlight] = useState(0);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const commentFilesRef = useRef<CommentAttachedFile[]>([]);

  const filteredMentionMembers =
    mentionQuery !== null
      ? teamMembers.filter((member) =>
          member.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
      : [];

  const filteredVariables =
    variableQuery !== null
      ? variables.filter(
          (variable) =>
            variable.key.toLowerCase().includes(variableQuery.toLowerCase()) ||
            variable.label.toLowerCase().includes(variableQuery.toLowerCase()),
        )
      : [];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(target) &&
        commentInputRef.current &&
        !commentInputRef.current.contains(target)
      ) {
        setMentionQuery(null);
      }

      if (
        variableDropdownRef.current &&
        !variableDropdownRef.current.contains(target) &&
        commentInputRef.current &&
        !commentInputRef.current.contains(target)
      ) {
        setVariableQuery(null);
      }

      if (emojiRef.current && !emojiRef.current.contains(target)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    commentFilesRef.current = commentFiles;
  }, [commentFiles]);

  useEffect(() => (
    () => {
      commentFilesRef.current.forEach(revokeCommentPreview);
    }
  ), []);

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setCommentText(value);

    const cursorPos = event.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w[\w ]*)$/);
    const atOnlyMatch = textBeforeCursor.match(/@$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionHighlight(0);
    } else if (atOnlyMatch) {
      setMentionQuery("");
      setMentionHighlight(0);
    } else {
      setMentionQuery(null);
    }

    if (!mentionMatch && !atOnlyMatch) {
      const variableMatch = textBeforeCursor.match(/\$(\w*)$/);
      if (variableMatch) {
        setVariableQuery(variableMatch[1]);
        setVariableHighlight(0);
      } else {
        setVariableQuery(null);
      }
    } else {
      setVariableQuery(null);
    }
  };

  const insertMention = (member: (typeof teamMembers)[0]) => {
    if (!commentInputRef.current) return;

    const cursorPos = commentInputRef.current.selectionStart ?? commentText.length;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const mentionMatch =
      textBeforeCursor.match(/@(\w[\w ]*)$/) || textBeforeCursor.match(/@$/);

    if (!mentionMatch) return;

    const start = cursorPos - mentionMatch[0].length;
    const nextText =
      commentText.slice(0, start) +
      `@${member.name} ` +
      commentText.slice(cursorPos);

    setCommentText(nextText);
    setMentionQuery(null);
    setTimeout(() => {
      const nextPos = start + member.name.length + 2;
      commentInputRef.current?.focus();
      commentInputRef.current?.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const insertVariable = (variable: (typeof variables)[0]) => {
    if (!commentInputRef.current) return;

    const cursorPos = commentInputRef.current.selectionStart ?? commentText.length;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const variableMatch = textBeforeCursor.match(/\$(\w*)$/);

    if (!variableMatch) return;

    const start = cursorPos - variableMatch[0].length;
    const insertion = `{{${variable.key}}}`;
    const nextText =
      commentText.slice(0, start) + insertion + commentText.slice(cursorPos);

    setCommentText(nextText);
    setVariableQuery(null);
    setTimeout(() => {
      const nextPos = start + insertion.length;
      commentInputRef.current?.focus();
      commentInputRef.current?.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMentionMembers.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionHighlight((value) => Math.min(value + 1, filteredMentionMembers.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionHighlight((value) => Math.max(value - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        insertMention(filteredMentionMembers[mentionHighlight]);
        return;
      }
      if (event.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    if (variableQuery !== null && filteredVariables.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setVariableHighlight((value) => Math.min(value + 1, filteredVariables.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setVariableHighlight((value) => Math.max(value - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        insertVariable(filteredVariables[variableHighlight]);
        return;
      }
      if (event.key === "Escape") {
        setVariableQuery(null);
      }
    }
  };

  const insertAtSymbol = () => {
    if (!commentInputRef.current) return;

    const position = commentInputRef.current.selectionStart ?? commentText.length;
    const nextText = commentText.slice(0, position) + "@" + commentText.slice(position);

    setCommentText(nextText);
    setMentionQuery("");
    setMentionHighlight(0);
    setTimeout(() => {
      commentInputRef.current?.focus();
      commentInputRef.current?.setSelectionRange(position + 1, position + 1);
    }, 0);
  };

  const removeCommentFile = (index: number) => {
    const fileToRemove = commentFiles[index];
    if (fileToRemove) {
      revokeCommentPreview(fileToRemove);
    }
    setCommentFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearCommentFiles = () => {
    commentFiles.forEach(revokeCommentPreview);
    setCommentFiles([]);
  };

  const handleSend = () => {
    const text = commentText.trim();
    if (!text) return;

    onSendMessage({
      id: Date.now(),
      conversationId,
      type: "comment",
      text,
      author: "You",
      initials: "ME",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setCommentText("");
    clearCommentFiles();
    setMentionQuery(null);
    setVariableQuery(null);
  };

  return (
    <div className="bg-amber-50/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Tag
          label="Internal note - only visible to agents"
          size="sm"
          bgColor="warning"
          icon={<EyeOff size={11} />}
        />
      </div>

      <div className="relative rounded-xl border border-amber-300 bg-white shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400">
        {mentionQuery !== null && filteredMentionMembers.length > 0 ? (
          <div
            ref={mentionDropdownRef}
            className="absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <AtSign size={13} className="text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mention an agent</span>
              {mentionQuery ? (
                <Tag label={`@${mentionQuery}`} size="sm" bgColor="warning" />
              ) : null}
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredMentionMembers.map((member, index) => (
                <Button
                  key={member.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(member);
                  }}
                  variant="unstyled"
                  fullWidth
                  contentAlign="start"
                  preserveChildLayout
                  className={`text-left ${mentionHighlight === index ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <span className="flex w-full items-center gap-3 px-3 py-2.5">
                    <Avatar
                      name={member.name}
                      size="md"
                      showStatus
                      statusColor={member.online ? "var(--color-success)" : "var(--color-gray-300)"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">{member.name}</span>
                      <span className={`text-xs ${member.online ? "text-green-600" : "text-gray-400"}`}>
                        {member.online ? "Online" : "Offline"}
                      </span>
                    </span>
                    {mentionHighlight === index ? (
                      <span className="flex-shrink-0 text-xs font-medium text-amber-500">Enter</span>
                    ) : null}
                  </span>
                </Button>
              ))}
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5">
              <p className="text-[10px] text-gray-400">Arrow keys navigate - Enter selects - Esc dismisses</p>
            </div>
          </div>
        ) : null}

        {mentionQuery !== null && mentionQuery.length > 0 && filteredMentionMembers.length === 0 ? (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-gray-400">
                No agents match <span className="font-medium text-gray-600">@{mentionQuery}</span>
              </p>
            </div>
          </div>
        ) : null}

        <VariableSuggestionMenu
          ref={variableDropdownRef}
          isOpen={variableQuery !== null}
          query={variableQuery ?? ""}
          options={filteredVariables}
          highlightedIndex={variableHighlight}
          onHighlightChange={setVariableHighlight}
          onSelect={insertVariable}
          showEmptyState={Boolean(variableQuery)}
        />

        <TextareaInput
          ref={commentInputRef}
          value={commentText}
          onChange={handleCommentChange}
          onKeyDown={handleCommentKeyDown}
          placeholder="Add an internal note... type @ to mention, $ for variables"
          appearance="composer-note"
          rows={3}
          autoResize
          maxRows={7}
        />

        <ComposerAttachmentPreviewStrip
          files={commentFiles}
          onRemove={removeCommentFile}
          tone="note"
        />

        <div className="flex items-center justify-between border-t border-amber-100 px-3 py-2">
          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => fileRef.current?.click()}
              variant="ghost"
              size="sm"
              icon={<Paperclip size={17} />}
              aria-label="Attach file"
            />
            <div className="relative" ref={emojiRef}>
              <IconButton
                onClick={() => setEmojiOpen((open) => !open)}
                variant={emojiOpen ? "soft-warning" : "ghost"}
                size="sm"
                icon={<Smile size={17} />}
                aria-label="Insert emoji"
              />
              {emojiOpen ? (
                <EmojiPicker
                  mode="comment"
                  accent="amber"
                  onSelect={(emoji) => {
                    setCommentText((value) => value + emoji);
                    setEmojiOpen(false);
                  }}
                />
              ) : null}
            </div>
            <Button
              onMouseDown={(event) => {
                event.preventDefault();
                insertAtSymbol();
              }}
              variant={mentionQuery !== null ? "soft-warning" : "ghost"}
           
              leftIcon={<AtSign size={15} />}
            >
              Mention
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!commentText.trim()}
            variant={commentText.trim() ? "warning" : "soft"}
           
            leftIcon={<MessageSquare size={14} />}
          >
            Add Note
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-amber-500/80">
        Tip: use <kbd className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px] text-amber-600">@</kbd> to mention agents and{" "}
        <kbd className="rounded bg-violet-100 px-1 py-0.5 font-mono text-[10px] text-violet-600">$</kbd> to insert variables.
      </p>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            const files = Array.from(event.target.files).map((file) => ({
              file,
              type: getCommentAttachmentType(file),
              previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            }));
            setCommentFiles((prev) => [...prev, ...files]);
            event.target.value = "";
          }
        }}
      />
    </div>
  );
}
