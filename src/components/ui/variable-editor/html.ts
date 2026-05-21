import DOMPurify from "dompurify";

import {
  createMentionTokenElement,
  createVariableTokenElement,
  formatMentionToken,
  formatVariableToken,
  renderVariableTokenHtml,
  VARIABLE_TOKEN_PATTERN,
} from "./shared";

const EMAIL_HTML_ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "col",
  "colgroup",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const EMAIL_HTML_ALLOWED_ATTR = [
  "align",
  "alt",
  "class",
  "colspan",
  "contenteditable",
  "data-mention-id",
  "data-mention-label",
  "data-variable",
  "height",
  "href",
  "rel",
  "rowspan",
  "src",
  "style",
  "target",
  "title",
  "width",
];

const FORBIDDEN_TAGS = [
  "button",
  "embed",
  "form",
  "iframe",
  "input",
  "link",
  "meta",
  "object",
  "script",
  "style",
];

const HTML_SOURCE_PATTERN = /<\/?[a-z][\s\S]*>/i;

function isBrowserDomAvailable() {
  return typeof document !== "undefined";
}

export function sanitizeRichVariableHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: EMAIL_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: EMAIL_HTML_ALLOWED_ATTR,
    ADD_ATTR: ["target"],
    FORBID_TAGS: FORBIDDEN_TAGS,
  });
}

function hasVariableToken(text: string) {
  return new RegExp(VARIABLE_TOKEN_PATTERN.source).test(text);
}

function decorateVariableTextNode(node: Text) {
  const text = node.textContent ?? "";
  const pattern = new RegExp(VARIABLE_TOKEN_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const fragment = document.createDocumentFragment();

  while ((match = pattern.exec(text)) !== null) {
    const key = match[1]?.trim();
    if (!key) continue;

    fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
    fragment.append(createVariableTokenElement(key));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) return;

  fragment.append(document.createTextNode(text.slice(lastIndex)));
  node.replaceWith(fragment);
}

function decorateVariableTextNodes(root: ParentNode) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (
        parent?.closest("[data-variable], [data-mention-id], script, style")
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return hasVariableToken(node.textContent ?? "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  nodes.forEach(decorateVariableTextNode);
}

export function renderRichVariableHtml(html: string) {
  if (!html) return "";

  const sanitized = sanitizeRichVariableHtml(html);
  if (!isBrowserDomAvailable()) return sanitized;

  const template = document.createElement("template");
  template.innerHTML = sanitized;
  decorateVariableTextNodes(template.content);
  return template.innerHTML;
}

export function createRichVariableFragmentFromHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = renderRichVariableHtml(html);
  return template.content;
}

export function createRichVariableFragmentFromPlainText(text: string) {
  const template = document.createElement("template");
  template.innerHTML = renderVariableTokenHtml(text).replace(/\n/g, "<br />");
  return template.content;
}

export function createRichVariableFragmentFromClipboard(html: string, text: string) {
  if (html.trim()) {
    return createRichVariableFragmentFromHtml(html);
  }

  if (HTML_SOURCE_PATTERN.test(text)) {
    return createRichVariableFragmentFromHtml(text);
  }

  return createRichVariableFragmentFromPlainText(text);
}

export function serializeRichVariableEditorHtml(editor: HTMLElement) {
  const clone = editor.cloneNode(true) as HTMLElement;

  clone.querySelectorAll<HTMLElement>("[data-variable]").forEach((element) => {
    element.replaceWith(
      document.createTextNode(formatVariableToken(element.dataset.variable ?? "")),
    );
  });

  clone
    .querySelectorAll<HTMLElement>("[data-mention-id][data-mention-label]")
    .forEach((element) => {
      element.replaceWith(
        document.createTextNode(
          formatMentionToken(
            element.dataset.mentionId ?? "",
            element.dataset.mentionLabel ?? "",
          ),
        ),
      );
    });

  return sanitizeRichVariableHtml(clone.innerHTML);
}

export function richHtmlToPlainText(html: string) {
  if (!html) return "";

  if (!isBrowserDomAvailable()) {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const template = document.createElement("template");
  template.innerHTML = sanitizeRichVariableHtml(html);
  return (template.content.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isRichHtmlEmpty(html: string) {
  return richHtmlToPlainText(html).length === 0;
}
