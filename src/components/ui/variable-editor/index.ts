export { VariableTextEditor } from "./VariableTextEditor";
export { VariableHtmlEditor } from "./VariableHtmlEditor";
export type {
  VariableTextEditorHandle,
  VariableTextEditorProps,
} from "./VariableTextEditor";
export type {
  VariableHtmlEditorHandle,
  VariableHtmlEditorProps,
} from "./VariableHtmlEditor";
export {
  createMentionTokenElement,
  createVariableTokenElement,
  extractMentionIds,
  findVariableDeleteRange,
  formatMentionToken,
  formatMentionTokenLabel,
  formatVariableToken,
  formatVariableTokenLabel,
  MENTION_TOKEN_CLASS_NAME,
  MENTION_TRIGGER_PATTERN,
  renderVariableTokenHtml,
  STRUCTURED_MENTION_PATTERN,
  VARIABLE_TOKEN_CLASS_NAME,
  VARIABLE_TOKEN_PATTERN,
  VARIABLE_TRIGGER_PATTERN,
} from "./shared";
export type { MentionToken, VariableTokenRange } from "./shared";
export {
  createRichVariableFragmentFromClipboard,
  createRichVariableFragmentFromHtml,
  createRichVariableFragmentFromPlainText,
  isRichHtmlEmpty,
  renderRichVariableHtml,
  richHtmlToPlainText,
  sanitizeRichVariableHtml,
  serializeRichVariableEditorHtml,
} from "./html";
