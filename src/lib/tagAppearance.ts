const TAG_COLOR_MAP: Record<string, string> = {
  'tag-grey': '#9ca3af',
  'tag-red': '#f87171',
  'tag-orange': '#fb923c',
  'tag-yellow': '#fbbf24',
  'tag-green': '#4ade80',
  'tag-blue': '#60a5fa',
  'tag-indigo': '#818cf8',
  'tag-purple': '#c084fc',
  'tag-pink': '#f472b6',
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const chunk = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  const int = Number.parseInt(chunk, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveTagBaseColor(color?: string | null) {
  if (!color) return TAG_COLOR_MAP['tag-indigo'];
  if (color.startsWith('#')) return color;
  return TAG_COLOR_MAP[color] || TAG_COLOR_MAP['tag-indigo'];
}

export function getTagSurfaceStyle(color?: string | null) {
  const base = resolveTagBaseColor(color);

  return {
    backgroundColor: hexToRgba(base, 0.12),
    borderColor: hexToRgba(base, 0.24),
    color: '#374151',
  };
}

export const TAG_COLOR_OPTIONS = [
  { value: 'tag-grey', hex: TAG_COLOR_MAP['tag-grey'] },
  { value: 'tag-red', hex: TAG_COLOR_MAP['tag-red'] },
  { value: 'tag-orange', hex: TAG_COLOR_MAP['tag-orange'] },
  { value: 'tag-yellow', hex: TAG_COLOR_MAP['tag-yellow'] },
  { value: 'tag-green', hex: TAG_COLOR_MAP['tag-green'] },
  { value: 'tag-blue', hex: TAG_COLOR_MAP['tag-blue'] },
  { value: 'tag-indigo', hex: TAG_COLOR_MAP['tag-indigo'] },
  { value: 'tag-purple', hex: TAG_COLOR_MAP['tag-purple'] },
  { value: 'tag-pink', hex: TAG_COLOR_MAP['tag-pink'] },
];
