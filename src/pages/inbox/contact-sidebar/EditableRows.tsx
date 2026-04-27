import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Tooltip } from '../../../components/ui/Tooltip';
import { IconButton } from '../../../components/ui/button/IconButton';

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);

  return (
    <Tooltip content={ok ? 'Copied' : 'Copy'}>
      <span className="inline-flex">
        <IconButton
          type="button"
          aria-label={ok ? 'Copied' : 'Copy'}
          icon={ok ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          size="xs"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            navigator.clipboard.writeText(value).catch(() => undefined);
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          }}
        />
      </span>
    </Tooltip>
  );
}

function InlineActionButton({
  onClick,
  title,
  disabled,
  tone = 'neutral',
  icon,
  loading = false,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  tone?: 'neutral' | 'primary';
  icon: ReactNode;
  loading?: boolean;
}) {
  return (
    <Tooltip content={title}>
      <span className="inline-flex">
        <IconButton
          type="button"
          onClick={onClick}
          disabled={disabled}
          loading={loading}
          aria-label={title}
          icon={icon}
          size="xs"
          variant={tone === 'primary' ? 'primary' : 'ghost'}
        />
      </span>
    </Tooltip>
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
  type?: ComponentProps<typeof Input>['type'];
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
            <div className="min-w-0 flex-1">
              <Input
                ref={inputRef}
                type={type}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void save();
                  }
                  if (event.key === 'Escape') {
                    setDraft(value);
                    onDeactivate();
                  }
                }}
                placeholder={placeholder}
                aria-label={label}
                appearance="sidebar"
                inputSize="sm"
              />
            </div>
            <InlineActionButton
              title="Cancel"
              onClick={() => {
                setDraft(value);
                setErr('');
                onDeactivate();
              }}
              icon={<X size={14} />}
            />
            <InlineActionButton
              title="Save"
              onClick={() => void save()}
              disabled={saving}
              tone="primary"
              icon={<Check size={14} />}
              loading={saving}
            />
          </div>
          {err ? <p className="text-[11px] text-red-500 px-0.5">{err}</p> : null}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={isBlocked ? -1 : 0}
          aria-disabled={isBlocked || undefined}
          className="group/row flex items-center justify-between gap-2 cursor-pointer py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-1"
          onClick={() => onActivate(fieldKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(fieldKey);
            }
          }}
        >
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
            <div className="min-w-0 flex-1">
              <Select
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                options={options}
                aria-label={label}
                appearance="sidebar"
                size="sm"
              />
            </div>
            <InlineActionButton
              title="Cancel"
              onClick={() => {
                setDraft(value);
                setErr('');
                onDeactivate();
              }}
              icon={<X size={14} />}
            />
            <InlineActionButton
              title="Save"
              onClick={() => void save()}
              disabled={saving}
              tone="primary"
              icon={<Check size={14} />}
              loading={saving}
            />
          </div>
          {err ? <p className="text-[11px] text-red-500 px-0.5">{err}</p> : null}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={isBlocked ? -1 : 0}
          aria-disabled={isBlocked || undefined}
          className="group/row flex items-center justify-between gap-2 cursor-pointer py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-1"
          onClick={() => onActivate(fieldKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(fieldKey);
            }
          }}
        >
          <span className={`text-[13px] leading-snug truncate ${value ? 'text-[#1c2030]' : 'text-[#c8cdd8] italic font-normal'}`}>
            {selectedLabel}
          </span>
        </div>
      )}
    </div>
  );
}
