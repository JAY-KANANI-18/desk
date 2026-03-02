export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function renderCommentText(text: string) {
  const parts = text.split(/(@[A-Za-z][A-Za-z ]*)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="inline-flex items-center gap-0.5 text-blue-600 font-semibold bg-blue-50 rounded px-1 py-0.5 text-xs">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
