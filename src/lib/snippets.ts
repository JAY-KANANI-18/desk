export type SnippetAttachmentType = 'image' | 'audio' | 'video' | 'doc';

export interface SnippetAttachment {
  type: SnippetAttachmentType;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export interface Snippet {
  id: string;
  workspaceId?: string;
  shortcut: string;
  name: string;
  title: string;
  content: string;
  topic?: string | null;
  attachments?: SnippetAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SnippetUpsertPayload {
  name: string;
  shortcut: string;
  content: string;
  topic?: string | null;
  attachments?: SnippetAttachment[];
}

export interface SnippetListParams {
  search?: string;
  topic?: string;
  page?: number;
  limit?: number;
}

export interface SnippetPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedSnippetResponse {
  items: Snippet[];
  pagination: SnippetPagination;
}

const SNIPPET_TRIGGER_PATTERN = /(^|[\s\n])\/([a-zA-Z0-9_-]*)$/;

export function getSnippetLabel(snippet: Pick<Snippet, 'name' | 'title' | 'shortcut'>) {
  return snippet.name || snippet.title || snippet.shortcut;
}

export function getSnippetTriggerQuery(text: string): string | null {
  const match = text.match(SNIPPET_TRIGGER_PATTERN);
  return match ? match[2] : null;
}

export function replaceSnippetTrigger(text: string, replacement: string) {
  return text.replace(
    SNIPPET_TRIGGER_PATTERN,
    (_match, prefix: string) => `${prefix}${replacement}`,
  );
}

export function filterSnippets(
  snippets: Snippet[],
  query: string,
  limit = 8,
): Snippet[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return snippets.slice(0, limit);
  }

  return snippets
    .filter((snippet) => {
      const haystack = [
        snippet.shortcut,
        snippet.name,
        snippet.title,
        snippet.content,
        snippet.topic ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .slice(0, limit);
}

export function snippetAttachmentTypeFromFile(file: File): SnippetAttachmentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'doc';
}
