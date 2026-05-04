import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { useDisclosure } from "@/hooks/useDisclosure";
import {
  MentionSuggestionMenu,
  VariableSuggestionMenu,
  type MentionSuggestionOption,
  type VariableSuggestionMenuPlacement,
  type VariableSuggestionOption,
} from "../select";
import {
  cx,
  getInputControlClassName,
  type InputAppearance,
  type InputSize,
} from "../inputs/shared";
import {
  createMentionTokenElement,
  createVariableTokenElement,
  formatMentionToken,
  formatVariableToken,
  MENTION_TRIGGER_PATTERN,
  renderVariableTokenHtml,
  VARIABLE_TRIGGER_PATTERN,
} from "./shared";

const BLOCK_ELEMENT_TAGS = new Set(["DIV", "P"]);
const SUGGESTION_CONTROL_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter", "Escape"]);

type SuggestionTrigger = { type: "variable" | "mention"; query: string };

export interface VariableTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: VariableSuggestionOption[];
  mentionOptions?: MentionSuggestionOption[];
  mentionTitle?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  size?: InputSize;
  appearance?: InputAppearance;
  className?: string;
  editorClassName?: string;
  placeholderClassName?: string;
  menuPlacement?: VariableSuggestionMenuPlacement;
  onSubmit?: () => void;
  "aria-label"?: string;
}

export interface VariableTextEditorHandle {
  focus: () => void;
  insertText: (text: string) => void;
}

function isEditorSelection(editor: HTMLElement, selection: Selection | null) {
  if (!selection || !selection.anchorNode) return false;
  return editor.contains(selection.anchorNode);
}

function serializeNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const variable = element.dataset.variable;
  const mentionId = element.dataset.mentionId;
  const mentionLabel = element.dataset.mentionLabel;

  if (variable) {
    return formatVariableToken(variable);
  }

  if (mentionId && mentionLabel) {
    return formatMentionToken(mentionId, mentionLabel);
  }

  if (element.tagName === "BR") {
    return "\n";
  }

  return Array.from(element.childNodes).map(serializeNode).join("");
}

function extractRawText(editor: HTMLElement) {
  const pieces = Array.from(editor.childNodes).map((node, index, nodes) => {
    const text = serializeNode(node);
    const isBlock =
      node.nodeType === Node.ELEMENT_NODE &&
      BLOCK_ELEMENT_TAGS.has((node as HTMLElement).tagName);
    const hasNext = index < nodes.length - 1;

    if (isBlock && hasNext && !text.endsWith("\n")) {
      return `${text}\n`;
    }

    return text;
  });

  return pieces.join("").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n");
}

function setCaretAfter(node: Node) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export const VariableTextEditor = forwardRef<
  VariableTextEditorHandle,
  VariableTextEditorProps
>(
  (
    {
      value,
      onChange,
      variables,
      mentionOptions = [],
      mentionTitle = "Mention a teammate",
      placeholder = "Type your message...",
      readOnly = false,
      disabled = false,
      size = "md",
      appearance,
      className,
      editorClassName,
      placeholderClassName,
      menuPlacement = "top",
      onSubmit,
      "aria-label": ariaLabel = "Message editor",
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const suggestionMenu = useDisclosure();
    const [trigger, setTrigger] = useState<SuggestionTrigger | null>(null);
    const [query, setQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const filteredVariables = useMemo(() => {
      if (!query) return variables;
      const normalizedQuery = query.toLowerCase();
      return variables.filter((variable) => {
        const haystack =
          `${variable.key} ${variable.label} ${variable.description ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }, [query, variables]);

    const filteredMentions = useMemo(() => {
      if (!query) return mentionOptions;
      const normalizedQuery = query.toLowerCase();
      return mentionOptions.filter((mention) => {
        const haystack = `${mention.label} ${mention.subtitle ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }, [mentionOptions, query]);

    const closeSuggestionMenu = useCallback(() => {
      suggestionMenu.close();
      setTrigger(null);
      setQuery("");
      setHighlightedIndex(0);
    }, [suggestionMenu]);

    const openSuggestionMenu = useCallback(
      (nextTrigger: SuggestionTrigger) => {
        const shouldResetHighlight =
          trigger?.type !== nextTrigger.type || trigger.query !== nextTrigger.query;

        suggestionMenu.open();
        setTrigger(nextTrigger);
        setQuery(nextTrigger.query);

        if (shouldResetHighlight) {
          setHighlightedIndex(0);
        }
      },
      [suggestionMenu, trigger],
    );

    const updateTrigger = useCallback(() => {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !isEditorSelection(editor, selection) || !selection?.rangeCount) {
        closeSuggestionMenu();
        return;
      }

      const range = selection.getRangeAt(0);
      const node = range.startContainer;

      if (node.nodeType !== Node.TEXT_NODE) {
        closeSuggestionMenu();
        return;
      }

      const textBeforeCursor = (node.textContent ?? "").slice(0, range.startOffset);
      const mentionMatch =
        mentionOptions.length > 0 ? textBeforeCursor.match(MENTION_TRIGGER_PATTERN) : null;

      if (mentionMatch) {
        const nextQuery = mentionMatch[1] ?? "";
        openSuggestionMenu({ type: "mention", query: nextQuery });
        return;
      }

      const variableMatch = textBeforeCursor.match(VARIABLE_TRIGGER_PATTERN);

      if (!variableMatch) {
        closeSuggestionMenu();
        return;
      }

      const nextQuery = variableMatch[1] ?? "";
      openSuggestionMenu({ type: "variable", query: nextQuery });
    }, [closeSuggestionMenu, mentionOptions.length, openSuggestionMenu]);

    const emitChange = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;

      onChange(extractRawText(editor));
      updateTrigger();
    }, [onChange, updateTrigger]);

    const insertTextAtSelection = useCallback(
      (text: string) => {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor) return;

        editor.focus();

        let range: Range;
        if (selection?.rangeCount && isEditorSelection(editor, selection)) {
          range = selection.getRangeAt(0);
        } else {
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        const textNode = document.createTextNode(text);
        range.deleteContents();
        range.insertNode(textNode);
        setCaretAfter(textNode);
        onChange(extractRawText(editor));
        updateTrigger();
      },
      [onChange, updateTrigger],
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editorRef.current?.focus(),
        insertText: insertTextAtSelection,
      }),
      [insertTextAtSelection],
    );

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      if (document.activeElement === editor && extractRawText(editor) === value) {
        return;
      }

      const html = renderVariableTokenHtml(value);
      if (editor.innerHTML !== html) {
        editor.innerHTML = html;
      }
    }, [value]);

    const insertToken = useCallback(
      (
        option: VariableSuggestionOption | MentionSuggestionOption,
        tokenType: "variable" | "mention",
      ) => {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor || !selection) return;

        editor.focus();

        let range: Range;
        if (selection.rangeCount && isEditorSelection(editor, selection)) {
          range = selection.getRangeAt(0);
        } else {
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          const node = range.startContainer;
          const text = node.textContent ?? "";
          const before = text.slice(0, range.startOffset);
          const after = text.slice(range.startOffset);
          const match = before.match(
            tokenType === "mention" ? MENTION_TRIGGER_PATTERN : VARIABLE_TRIGGER_PATTERN,
          );

          if (match) {
            const nextBefore = before.slice(0, before.length - match[0].length);
            node.textContent = nextBefore + after;
            range = document.createRange();
            range.setStart(node, nextBefore.length);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }

        const token =
          tokenType === "mention"
            ? createMentionTokenElement(
                (option as MentionSuggestionOption).id,
                option.label,
              )
            : createVariableTokenElement((option as VariableSuggestionOption).key);
        const space = document.createTextNode(" ");
        const fragment = document.createDocumentFragment();
        fragment.append(token, space);
        range.deleteContents();
        range.insertNode(fragment);
        setCaretAfter(space);
        closeSuggestionMenu();
        onChange(extractRawText(editor));
      },
      [closeSuggestionMenu, onChange],
    );

    const insertVariable = useCallback(
      (variable: VariableSuggestionOption) => insertToken(variable, "variable"),
      [insertToken],
    );

    const insertMention = useCallback(
      (mention: MentionSuggestionOption) => insertToken(mention, "mention"),
      [insertToken],
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (readOnly || disabled) {
        event.preventDefault();
        return;
      }

      const activeOptions = trigger?.type === "mention" ? filteredMentions : filteredVariables;

      if (suggestionMenu.isOpen && activeOptions.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setHighlightedIndex((index) => Math.min(index + 1, activeOptions.length - 1));
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setHighlightedIndex((index) => Math.max(index - 1, 0));
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (trigger?.type === "mention") {
            insertMention(filteredMentions[highlightedIndex]);
          } else {
            insertVariable(filteredVariables[highlightedIndex]);
          }
          return;
        }
      }

      if (event.key === "Escape" && suggestionMenu.isOpen) {
        event.preventDefault();
        closeSuggestionMenu();
        return;
      }

      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onSubmit?.();
      }
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
      if (suggestionMenu.isOpen && SUGGESTION_CONTROL_KEYS.has(event.key)) {
        return;
      }

      updateTrigger();
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      if (readOnly || disabled) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      emitChange();
    };

    const handleCopy = (event: ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      event.preventDefault();
      event.clipboardData.setData("text/plain", extractRawText(editor));
    };

    return (
      <div className={cx("relative", className)}>
        <VariableSuggestionMenu
          isOpen={suggestionMenu.isOpen && trigger?.type === "variable"}
          query={query}
          options={filteredVariables}
          highlightedIndex={highlightedIndex}
          onHighlightChange={setHighlightedIndex}
          onSelect={insertVariable}
          showEmptyState={Boolean(query)}
          placement={menuPlacement}
        />
        <MentionSuggestionMenu
          isOpen={suggestionMenu.isOpen && trigger?.type === "mention"}
          query={query}
          title={mentionTitle}
          options={filteredMentions}
          highlightedIndex={highlightedIndex}
          onHighlightChange={setHighlightedIndex}
          onSelect={insertMention}
          showEmptyState={Boolean(query)}
          placement={menuPlacement}
        />

        <div
          ref={editorRef}
          contentEditable={!readOnly && !disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-label={ariaLabel}
          aria-multiline="true"
          aria-disabled={disabled || undefined}
          onInput={emitChange}
          onClick={updateTrigger}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPaste={handlePaste}
          onCopy={handleCopy}
          className={cx(
            appearance
              ? getInputControlClassName({
                  size,
                  appearance,
                  multiline: true,
                })
              : "block w-full",
            "whitespace-pre-wrap break-words outline-none",
            readOnly || disabled ? "cursor-wait text-[var(--color-gray-500)]" : undefined,
            editorClassName,
          )}
        />

        {!value ? (
          <div
            className={cx(
              "pointer-events-none absolute text-sm",
              placeholderClassName ??
                (appearance === "composer-note"
                  ? "left-3 top-2 text-amber-400"
                  : "left-3 top-2 text-[var(--color-gray-400)]"),
            )}
          >
            {placeholder}
          </div>
        ) : null}
      </div>
    );
  },
);

VariableTextEditor.displayName = "VariableTextEditor";
