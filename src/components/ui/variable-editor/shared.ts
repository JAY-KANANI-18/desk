export interface VariableTokenRange {
  start: number;
  end: number;
}

export interface MentionToken {
  id: string;
  label: string;
}

export const VARIABLE_TRIGGER_PATTERN = /\$([a-zA-Z0-9._-]*)$/;
export const MENTION_TRIGGER_PATTERN = /@([\w.-]*)$/;
export const VARIABLE_TOKEN_PATTERN = /\{\{\s*\$?([a-zA-Z0-9._-]+)\s*\}\}/g;
export const STRUCTURED_MENTION_PATTERN = /@\[([^|\]]+)\|([^\]]+)\]/g;
const EDITOR_TOKEN_PATTERN = /@\[\s*([^|\]]+)\|([^\]]+)\]|\{\{\s*\$?([a-zA-Z0-9._-]+)\s*\}\}/g;
export const VARIABLE_TOKEN_CLASS_NAME =
  "inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)] px-2 py-0.5 mx-0.5 text-sm font-semibold text-[var(--color-primary)] align-middle variable-token";
export const MENTION_TOKEN_CLASS_NAME =
  "inline-flex items-center rounded-[var(--radius-sm)] px-0.5 text-sm font-semibold text-[var(--color-primary)] align-middle mention-token";

export function formatVariableToken(key: string) {
  return `{{${key}}}`;
}

export function formatVariableTokenLabel(key: string) {
  return `$${key}`;
}

export function formatMentionToken(id: string, label: string) {
  return `@[${id}|${label}]`;
}

export function formatMentionTokenLabel(label: string) {
  return `@${label}`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function renderVariableTokenHtml(text: string) {
  let html = "";
  let lastIndex = 0;

  for (const match of text.matchAll(EDITOR_TOKEN_PATTERN)) {
    html += escapeHtml(text.slice(lastIndex, match.index));

    const mentionId = match[1]?.trim();
    const mentionLabel = match[2]?.trim();
    const variableKey = match[3]?.trim();

    if (mentionId && mentionLabel) {
      html +=
        `<span contenteditable="false" data-mention-id="${escapeHtmlAttribute(mentionId)}" data-mention-label="${escapeHtmlAttribute(mentionLabel)}" class="${MENTION_TOKEN_CLASS_NAME}">${escapeHtml(formatMentionTokenLabel(mentionLabel))}</span>`;
    } else if (variableKey) {
      html +=
        `<span contenteditable="false" data-variable="${escapeHtmlAttribute(variableKey)}" class="${VARIABLE_TOKEN_CLASS_NAME}">${escapeHtml(formatVariableTokenLabel(variableKey))}</span>`;
    }

    lastIndex = (match.index ?? 0) + match[0].length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

export function createVariableTokenElement(key: string) {
  const span = document.createElement("span");
  span.setAttribute("contenteditable", "false");
  span.setAttribute("data-variable", key);
  span.className = VARIABLE_TOKEN_CLASS_NAME;
  span.textContent = formatVariableTokenLabel(key);
  return span;
}

export function createMentionTokenElement(id: string, label: string) {
  const span = document.createElement("span");
  span.setAttribute("contenteditable", "false");
  span.setAttribute("data-mention-id", id);
  span.setAttribute("data-mention-label", label);
  span.className = MENTION_TOKEN_CLASS_NAME;
  span.textContent = formatMentionTokenLabel(label);
  return span;
}

export function extractMentionIds(text: string) {
  const mentionPattern = new RegExp(STRUCTURED_MENTION_PATTERN.source, "g");
  const ids = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    const userId = match[1]?.trim();
    if (userId) ids.add(userId);
  }

  return Array.from(ids);
}

export function findVariableDeleteRange(
  text: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const variablePattern = new RegExp(VARIABLE_TOKEN_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = variablePattern.exec(text)) !== null) {
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;
    const deleteEnd = text[tokenEnd] === " " ? tokenEnd + 1 : tokenEnd;
    const overlapsSelection =
      selectionStart !== selectionEnd &&
      selectionStart < deleteEnd &&
      selectionEnd > tokenStart;
    const cursorTouchesToken =
      selectionStart === selectionEnd &&
      selectionStart > tokenStart &&
      selectionStart <= deleteEnd;

    if (overlapsSelection || cursorTouchesToken) {
      return { start: tokenStart, end: deleteEnd };
    }
  }

  return null;
}
