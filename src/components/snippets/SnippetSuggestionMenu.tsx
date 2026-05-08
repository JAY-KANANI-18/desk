import { useEffect, useState, type CSSProperties } from 'react';
import {
  AlignLeft,
  FileText,
  Loader2,
  Paperclip,
} from '@/components/ui/icons';
import { workspaceApi } from '../../lib/workspaceApi';
import { getSnippetLabel, type Snippet } from '../../lib/snippets';
import { Button } from '../ui/Button';

export function useWorkspaceSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetsLoading, setSnippetsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setSnippetsLoading(true);
    workspaceApi.getSnippets()
      .then((rows) => {
        if (mounted) setSnippets(rows);
      })
      .catch(() => {
        if (mounted) setSnippets([]);
      })
      .finally(() => {
        if (mounted) setSnippetsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { snippets, snippetsLoading };
}

export function SnippetSuggestionMenu({
  open,
  query,
  options,
  highlightedIndex,
  onHighlightChange,
  onSelect,
  loading = false,
  placement = 'top',
}: {
  open: boolean;
  query: string;
  options: Snippet[];
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  onSelect: (snippet: Snippet) => void;
  loading?: boolean;
  placement?: 'top' | 'bottom';
}) {
  if (!open) return null;

  const hasOptions = options.length > 0;
  const placementClass = placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <div className={`absolute left-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${placementClass}`}>
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <AlignLeft size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800">Snippets</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {query ? `/${query}` : 'Type a snippet ID'}
          </p>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            Loading snippets...
          </div>
        ) : hasOptions ? (
          options.map((snippet, index) => {
            const attachmentCount = snippet.attachments?.length ?? 0;
            return (
              <Button
                key={snippet.id}
                type="button"
                variant="unstyled"
                fullWidth
                contentAlign="start"
                preserveChildLayout
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHighlightChange(index)}
                onClick={() => onSelect(snippet)}
                className={`flex min-h-[56px] rounded-lg border px-3 py-2 text-left transition-colors ${
                  highlightedIndex === index
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-transparent hover:bg-[var(--color-gray-50)]'
                }`}
                style={classDrivenButtonStyle}
              >
                <span className="flex w-full min-w-0 items-center gap-2.5 text-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-gray-100)] text-[var(--color-gray-500)]">
                    <FileText size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {getSnippetLabel(snippet)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {snippet.shortcut}
                      {snippet.topic ? ` - ${snippet.topic}` : ''}
                    </span>
                  </span>
                  {attachmentCount > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
                      <Paperclip size={12} />
                      {attachmentCount}
                    </span>
                  ) : null}
                </span>
              </Button>
            );
          })
        ) : (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            No snippets found
          </p>
        )}
      </div>

      {hasOptions ? (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5">
          <p className="text-[10px] text-gray-400">
            Arrow keys navigate - Enter selects - Esc dismisses
          </p>
        </div>
      ) : null}
    </div>
  );
}

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;
