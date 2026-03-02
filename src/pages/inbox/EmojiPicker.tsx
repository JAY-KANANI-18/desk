import { Smile } from 'lucide-react';
import { emojiCategories } from './data';

interface EmojiPickerProps {
  mode: 'reply' | 'comment';
  accent: 'gray' | 'amber';
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ accent, onSelect }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className={`px-3 py-2 border-b border-gray-100 flex items-center gap-2 ${accent === 'amber' ? 'bg-amber-50' : 'bg-gray-50'}`}>
        <Smile size={13} className={accent === 'amber' ? 'text-amber-500' : 'text-gray-500'} />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emoji</span>
      </div>
      <div className="p-2 max-h-56 overflow-y-auto">
        {emojiCategories.map(cat => (
          <div key={cat.label} className="mb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">{cat.label}</p>
            <div className="flex flex-wrap gap-0.5">
              {cat.emojis.map(emoji => (
                <button
                  key={emoji}
                  onMouseDown={e => { e.preventDefault(); onSelect(emoji); }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
