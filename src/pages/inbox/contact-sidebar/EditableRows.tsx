import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, Loader2, X } from 'lucide-react';

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        navigator.clipboard.writeText(value).catch(() => undefined);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex h-6 w-6 items-center justify-center text-[#98a2b3] transition-colors hover:text-[#1c2030] flex-shrink-0"
      title="Copy"
    >
      {ok ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

function InlineActionButton({
  onClick,
  title,
  disabled,
  tone = 'neutral',
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  tone?: 'neutral' | 'primary';
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all disabled:opacity-50 ${
        tone === 'primary'
          ? 'h-7 w-7 border border-transparent bg-transparent text-emerald-600 hover:bg-emerald-50'
          : 'h-7 w-7 border border-transparent bg-transparent text-[#6b7280] hover:bg-[#f3f4f6]'
      }`}
    >
      {children}
    </button>
  );
}

interface SharedRowProps {
  fieldKey: string;
  label: string;
  icon?: ReactNode;
  activeField: string | null;
  onActivate: (key: string) => void;
  onDeactivate: () => void;
}

interface FieldRowProps extends SharedRowProps {
  value: string;
  placeholder?: string;
  type?: string;
  copyable?: boolean;
  warn?: boolean;
  onSave: (value: string) => Promise<void>;
}

export function FieldRow({
  fieldKey,
  label,
  icon,
  value,
  placeholder = 'Not set',
  type = 'text',
  copyable,
  warn,
  activeField,
  onActivate,
  onDeactivate,
  onSave,
}: FieldRowProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isActive = activeField === fieldKey;
  const isBlocked = activeField !== null && !isActive;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleOutside = (event: MouseEvent) => {
      if (saving) return;
      if (!rowRef.current?.contains(event.target as Node)) {
        setDraft(value);
        setErr('');
        onDeactivate();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isActive, onDeactivate, saving, value]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      onDeactivate();
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await onSave(trimmed);
      onDeactivate();
    } catch (error: any) {
      setErr(error?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rowRef} className={`transition-opacity ${isBlocked ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-[#c8cdd8]">{icon}</span>}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#b0b8c8]">{label}</span>
        {warn && <span className="text-[9px] text-amber-400 font-semibold ml-1">merge suggestion</span>}
      </div>

      {isActive ? (
        <div className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={type}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') save();
                if (event.key === 'Escape') {
                  setDraft(value);
                  onDeactivate();
                }
              }}
              className={`min-w-0 flex-1 text-[13px] px-3 py-2 rounded-lg border focus:outline-none transition-all placeholder:text-[#c8cdd8] text-[#1c2030] ${
                warn
                  ? 'border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-200'
                  : 'border-[#e0e4ed] bg-[#fafbfc] focus:ring-2 focus:ring-[#1c2030]/15 focus:border-[#1c2030]'
              }`}
              placeholder={placeholder}
            />
            <InlineActionButton
              title="Cancel"
              onClick={() => {
                setDraft(value);
                setErr('');
                onDeactivate();
              }}
            >
              <X size={14} />
            </InlineActionButton>
            <InlineActionButton title="Save" onClick={save} disabled={saving} tone="primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </InlineActionButton>
          </div>
          {err ? <p className="text-[11px] text-red-500 px-0.5">{err}</p> : null}
        </div>
      ) : (
        <div className="group/row flex items-center justify-between gap-2 cursor-pointer py-0.5" onClick={() => onActivate(fieldKey)}>
          <span className={`text-[13px] leading-snug truncate ${value ? 'text-[#1c2030]' : 'text-[#c8cdd8] italic font-normal'}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {copyable && value ? <CopyBtn value={value} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectRowProps extends SharedRowProps {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onSave: (value: string) => Promise<void>;
}

export function SelectRow({
  fieldKey,
  label,
  icon,
  value,
  placeholder,
  options,
  activeField,
  onActivate,
  onDeactivate,
  onSave,
}: SelectRowProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);
  const isActive = activeField === fieldKey;
  const isBlocked = activeField !== null && !isActive;
  const selectedLabel = options.find((option) => option.value === value)?.label || placeholder;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!isActive) return;

    const handleOutside = (event: MouseEvent) => {
      if (saving) return;
      if (!rowRef.current?.contains(event.target as Node)) {
        setDraft(value);
        setErr('');
        onDeactivate();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isActive, onDeactivate, saving, value]);

  const save = async () => {
    if (draft === value) {
      onDeactivate();
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await onSave(draft);
      onDeactivate();
    } catch (error: any) {
      setErr(error?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rowRef} className={`transition-opacity ${isBlocked ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-[#c8cdd8]">{icon}</span>}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#b0b8c8]">{label}</span>
      </div>

      {isActive ? (
        <div className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2">
            <select
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-w-0 flex-1 text-[13px] px-3 py-2 rounded-lg border border-[#e0e4ed] bg-[#fafbfc] focus:outline-none transition-all text-[#1c2030] focus:ring-2 focus:ring-[#1c2030]/15 focus:border-[#1c2030]"
            >
              {options.map((option) => (
                <option key={`${fieldKey}-${option.value || 'empty'}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <InlineActionButton
              title="Cancel"
              onClick={() => {
                setDraft(value);
                setErr('');
                onDeactivate();
              }}
            >
              <X size={14} />
            </InlineActionButton>
            <InlineActionButton title="Save" onClick={save} disabled={saving} tone="primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </InlineActionButton>
          </div>
          {err ? <p className="text-[11px] text-red-500 px-0.5">{err}</p> : null}
        </div>
      ) : (
        <div className="group/row flex items-center justify-between gap-2 cursor-pointer py-0.5" onClick={() => onActivate(fieldKey)}>
          <span className={`text-[13px] leading-snug truncate ${value ? 'text-[#1c2030]' : 'text-[#c8cdd8] italic font-normal'}`}>
            {selectedLabel}
          </span>
        </div>
      )}
    </div>
  );
}
