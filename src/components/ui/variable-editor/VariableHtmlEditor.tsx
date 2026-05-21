import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { useDisclosure } from "@/hooks/useDisclosure";
import {
  VariableSuggestionMenu,
  type VariableSuggestionMenuPlacement,
  type VariableSuggestionOption,
} from "../select";
import {
  cx,
  getInputControlClassName,
  type InputAppearance,
  type InputSize,
} from "../inputs/shared";
import { createVariableTokenElement, VARIABLE_TRIGGER_PATTERN } from "./shared";
import {
  createRichVariableFragmentFromHtml,
  createRichVariableFragmentFromClipboard,
  isRichHtmlEmpty,
  renderRichVariableHtml,
  serializeRichVariableEditorHtml,
} from "./html";

const SUGGESTION_CONTROL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "Enter",
  "Escape",
]);
const SUGGESTION_MENU_OPEN_EVENT = "axodesk:suggestion-menu-open";

type SuggestionTrigger = { query: string };

export interface VariableHtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: VariableSuggestionOption[];
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
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  "aria-label"?: string;
}

export interface VariableHtmlEditorHandle {
  focus: () => void;
  insertHtml: (html: string) => void;
}

function getSuggestionMenuOpenInstanceId(event: Event) {
  if (!(event instanceof CustomEvent)) return null;

  const detail = event.detail;
  if (
    typeof detail === "object" &&
    detail !== null &&
    "instanceId" in detail &&
    typeof detail.instanceId === "string"
  ) {
    return detail.instanceId;
  }

  return null;
}

function isEditorSelection(editor: HTMLElement, selection: Selection | null) {
  if (!selection || !selection.anchorNode) return false;
  return editor.contains(selection.anchorNode);
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

function insertFragmentAtSelection(editor: HTMLElement, fragment: DocumentFragment) {
  const selection = window.getSelection();
  let range: Range;

  if (selection?.rangeCount && isEditorSelection(editor, selection)) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);

  if (lastNode) {
    setCaretAfter(lastNode);
  }
}

export const VariableHtmlEditor = forwardRef<
  VariableHtmlEditorHandle,
  VariableHtmlEditorProps
>(
  (
    {
      value,
      onChange,
      variables,
      placeholder = "Write your message... type $ for variables",
      readOnly = false,
      disabled = false,
      size = "md",
      appearance,
      className,
      editorClassName,
      placeholderClassName,
      menuPlacement = "top",
      onSubmit,
      onKeyDown: onKeyDownProp,
      "aria-label": ariaLabel = "Rich text editor",
    },
    ref,
  ) => {
    const instanceId = useId();
    const editorRef = useRef<HTMLDivElement | null>(null);
    const suggestionMenu = useDisclosure();
    const [trigger, setTrigger] = useState<SuggestionTrigger | null>(null);
    const [query, setQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const isEditorEmpty = isRichHtmlEmpty(value);

    const filteredVariables = useMemo(() => {
      if (!query) return variables;
      const normalizedQuery = query.toLowerCase();
      return variables.filter((variable) => {
        const haystack =
          `${variable.key} ${variable.label} ${variable.description ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }, [query, variables]);

    const closeSuggestionMenu = useCallback(() => {
      suggestionMenu.close();
      setTrigger(null);
      setQuery("");
      setHighlightedIndex(0);
    }, [suggestionMenu]);

    const openSuggestionMenu = useCallback(
      (nextTrigger: SuggestionTrigger) => {
        const shouldResetHighlight = trigger?.query !== nextTrigger.query;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(SUGGESTION_MENU_OPEN_EVENT, {
              detail: { instanceId },
            }),
          );
        }

        suggestionMenu.open();
        setTrigger(nextTrigger);
        setQuery(nextTrigger.query);

        if (shouldResetHighlight) {
          setHighlightedIndex(0);
        }
      },
      [instanceId, suggestionMenu, trigger?.query],
    );

    useEffect(() => {
      if (typeof window === "undefined") return undefined;

      const handleSuggestionMenuOpen = (event: Event) => {
        const openInstanceId = getSuggestionMenuOpenInstanceId(event);

        if (openInstanceId && openInstanceId !== instanceId) {
          closeSuggestionMenu();
        }
      };

      window.addEventListener(SUGGESTION_MENU_OPEN_EVENT, handleSuggestionMenuOpen);
      return () =>
        window.removeEventListener(
          SUGGESTION_MENU_OPEN_EVENT,
          handleSuggestionMenuOpen,
        );
    }, [closeSuggestionMenu, instanceId]);

    useEffect(() => {
      if (!suggestionMenu.isOpen) return undefined;

      const handlePointerDown = (event: MouseEvent | TouchEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return;

        if (editorRef.current?.contains(target)) return;

        if (
          target instanceof Element &&
          target.closest("[data-variable-suggestion-menu='true']")
        ) {
          return;
        }

        closeSuggestionMenu();
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
      };
    }, [closeSuggestionMenu, suggestionMenu.isOpen]);

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
      const variableMatch = textBeforeCursor.match(VARIABLE_TRIGGER_PATTERN);

      if (!variableMatch) {
        closeSuggestionMenu();
        return;
      }

      openSuggestionMenu({ query: variableMatch[1] ?? "" });
    }, [closeSuggestionMenu, openSuggestionMenu]);

    const emitChange = useCallback(() => {
      const editor = editorRef.current;
      if (!editor) return;

      onChange(serializeRichVariableEditorHtml(editor));
      updateTrigger();
    }, [onChange, updateTrigger]);

    const insertHtmlAtSelection = useCallback(
      (html: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        insertFragmentAtSelection(editor, createRichVariableFragmentFromHtml(html));
        onChange(serializeRichVariableEditorHtml(editor));
        updateTrigger();
      },
      [onChange, updateTrigger],
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editorRef.current?.focus(),
        insertHtml: insertHtmlAtSelection,
      }),
      [insertHtmlAtSelection],
    );

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      if (
        document.activeElement === editor &&
        serializeRichVariableEditorHtml(editor) === value
      ) {
        return;
      }

      const html = renderRichVariableHtml(value);
      if (editor.innerHTML !== html) {
        editor.innerHTML = html;
      }
    }, [value]);

    const insertVariable = useCallback(
      (variable: VariableSuggestionOption) => {
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
          const match = before.match(VARIABLE_TRIGGER_PATTERN);

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

        const token = createVariableTokenElement(variable.key);
        const space = document.createTextNode(" ");
        const fragment = document.createDocumentFragment();
        fragment.append(token, space);
        range.deleteContents();
        range.insertNode(fragment);
        setCaretAfter(space);
        closeSuggestionMenu();
        onChange(serializeRichVariableEditorHtml(editor));
      },
      [closeSuggestionMenu, onChange],
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDownProp?.(event);
      if (event.defaultPrevented) return;

      if (readOnly || disabled) {
        event.preventDefault();
        return;
      }

      if (suggestionMenu.isOpen && filteredVariables.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setHighlightedIndex((index) =>
            Math.min(index + 1, filteredVariables.length - 1),
          );
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setHighlightedIndex((index) => Math.max(index - 1, 0));
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          insertVariable(filteredVariables[highlightedIndex]);
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
      const editor = editorRef.current;
      if (!editor) return;

      const html = event.clipboardData.getData("text/html");
      const text = event.clipboardData.getData("text/plain");
      const fragment = createRichVariableFragmentFromClipboard(html, text);

      insertFragmentAtSelection(editor, fragment);
      onChange(serializeRichVariableEditorHtml(editor));
      updateTrigger();
    };

    const handleCopy = (event: ClipboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      event.clipboardData.setData("text/html", serializeRichVariableEditorHtml(editor));
    };

    return (
      <div className={cx("relative", className)}>
        <VariableSuggestionMenu
          isOpen={suggestionMenu.isOpen}
          query={query}
          options={filteredVariables}
          highlightedIndex={highlightedIndex}
          onHighlightChange={setHighlightedIndex}
          onSelect={insertVariable}
          showEmptyState={Boolean(query)}
          placement={menuPlacement}
          anchorRef={editorRef}
        />

        <div
          ref={editorRef}
          contentEditable={!readOnly && !disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-label={ariaLabel}
          aria-placeholder={placeholder}
          aria-multiline="true"
          aria-disabled={disabled || undefined}
          onInput={emitChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
            "break-words outline-none [&_a]:text-[var(--color-primary)] [&_a]:underline [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:max-w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:p-1.5 [&_ul]:list-disc [&_ul]:pl-5",
            readOnly || disabled ? "cursor-wait text-[var(--color-gray-500)]" : undefined,
            editorClassName,
          )}
        />

        {isEditorEmpty ? (
          <div
            className={cx(
              "pointer-events-none absolute select-none text-sm leading-6 transition-transform duration-150",
              isFocused && "translate-x-[6px]",
              placeholderClassName ??
                "left-3 top-2 text-[var(--color-gray-400)]",
            )}
          >
            {placeholder}
          </div>
        ) : null}
      </div>
    );
  },
);

VariableHtmlEditor.displayName = "VariableHtmlEditor";
