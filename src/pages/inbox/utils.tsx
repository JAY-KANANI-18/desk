export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const STRUCTURED_MENTION_REGEX = /@\[(?<userId>[^|\]]+)\|(?<displayName>[^\]]+)\]/g;

export function extractMentionIds(text: string) {
  if (!text) return [];

  const ids = new Set<string>();
  for (const match of text.matchAll(STRUCTURED_MENTION_REGEX)) {
    const userId = match.groups?.userId?.trim();
    if (userId) ids.add(userId);
  }
  return Array.from(ids);
}

export function extractMentionLabels(text: string) {
  if (!text) return [];

  const labels = new Map<string, string>();
  for (const match of text.matchAll(STRUCTURED_MENTION_REGEX)) {
    const userId = match.groups?.userId?.trim();
    const displayName = match.groups?.displayName?.trim();
    if (userId && displayName) labels.set(userId, displayName);
  }
  return Array.from(labels.entries()).map(([userId, displayName]) => ({ userId, displayName }));
}

export function renderCommentText(text: string) {
  const parts = text.split(/(@\[[^|\]]+\|[^\]]+\]|@[A-Za-z][A-Za-z ]*)/g);
  return parts.map((part, i) =>
    part.startsWith('@[') ? (
      <span key={i} className="inline-flex items-center gap-0.5 text-blue-600 font-semibold bg-blue-50 rounded px-1 py-0.5 text-xs">
        @{part.replace(/^@\[[^|\]]+\|([^\]]+)\]$/, '$1')}
      </span>
    ) : part.startsWith('@') ? (
      <span key={i} className="inline-flex items-center gap-0.5 text-blue-600 font-semibold bg-blue-50 rounded px-1 py-0.5 text-xs">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
