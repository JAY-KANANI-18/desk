import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Check, Copy, Loader2, X } from '@/components/ui/icons';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Tooltip } from '../../../components/ui/Tooltip';
import { IconButton } from '../../../components/ui/button/IconButton';

const blockedRowClassName = 'opacity-50 pointer-events-none select-none';
const activeRowClassName = 'opacity-100';
const labelIconClassName = 'text-[#8b95a5]';
const labelTextClassName = 'text-[10px] font-semibold uppercase text-[#5f6b7a]';
const inactiveRowClassName =
  'group/row -mx-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#f7f9fc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1';
const inactiveValueClassName = 'text-[13px] font-medium leading-snug text-[#1c2030]';
const inactivePlaceholderClassName = 'text-[13px] font-medium leading-snug text-[#7b8494]';

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'Save failed';
}

function CopyBtn({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);

  return (
    <Tooltip content={ok ? 'Copied' : label}>
      <span className="inline-flex opacity-60 transition-opacity md:pointer-events-none md:opacity-0 md:group-hover/row:pointer-events-auto md:group-hover/row:opacity-70 md:group-focus-within/row:pointer-events-auto md:group-focus-within/row:opacity-100">
        <IconButton
          type="button"
          aria-label={ok ? 'Copied' : label}
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

interface ContactNameRowProps extends Omit<SharedRowProps, 'label' | 'icon'> {
  firstName: string;
  lastName: string;
  displayName: string;
  onSave: (value: { firstName: string; lastName: string }) => Promise<void>;
}

export function ContactNameRow({
  fieldKey,
  firstName,
  lastName,
  displayName,
  activeField,
  onActivate,
  onDeactivate,
  onSave,
}: ContactNameRowProps) {
  const [draftFirstName, setDraftFirstName] = useState(firstName);
  const [draftLastName, setDraftLastName] = useState(lastName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isActive = activeField === fieldKey;
  const isBlocked = activeField !== null && !isActive;
  const copyNameValue = [firstName, lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    setDraftFirstName(firstName);
    setDraftLastName(lastName);
  }, [firstName, lastName]);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => firstInputRef.current?.focus(), 20);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleOutside = (event: MouseEvent) => {
      if (saving) return;
      if (!rowRef.current?.contains(event.target as Node)) {
        setDraftFirstName(firstName);
        setDraftLastName(lastName);
        setErr('');
        onDeactivate();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [firstName, isActive, lastName, onDeactivate, saving]);

  const cancel = () => {
    setDraftFirstName(firstName);
    setDraftLastName(lastName);
    setErr('');
    onDeactivate();
  };

  const save = async () => {
    const trimmedFirstName = draftFirstName.trim();
    const trimmedLastName = draftLastName.trim();

    if (trimmedFirstName === firstName.trim() && trimmedLastName === lastName.trim()) {
      onDeactivate();
      return;
    }

    setSaving(true);
    setErr('');
    try {
      await onSave({ firstName: trimmedFirstName, lastName: trimmedLastName });
      onDeactivate();
    } catch (error: unknown) {
      setErr(messageFromError(error));
    } finally {
      setSaving(false);
    }
  };

  if (!isActive) {
    return (
      <div
        className={`group/row inline-flex max-w-full min-w-0 items-center gap-0.5 ${isBlocked ? blockedRowClassName : activeRowClassName}`}
      >
        <button
          type="button"
          tabIndex={isBlocked ? -1 : 0}
          aria-disabled={isBlocked || undefined}
          className="min-w-0 max-w-[calc(100%-1.75rem)] rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-1"
          onClick={() => {
            if (!isBlocked) {
              onActivate(fieldKey);
            }
          }}
          aria-label="Edit contact name"
        >
          <span className="block truncate text-[15px] font-semibold leading-tight text-[#1c2030]">
            {displayName}
          </span>
        </button>
        {copyNameValue ? <CopyBtn value={copyNameValue} label="Copy full name" /> : null}
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className="rounded-xl border border-[#e0e4ed] bg-[#fafbfc] p-2.5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <Input
            ref={firstInputRef}
            value={draftFirstName}
            onChange={(event) => setDraftFirstName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void save();
              }
              if (event.key === 'Escape') {
                cancel();
              }
            }}
            placeholder="First name"
            aria-label="First name"
            appearance="sidebar"
            inputSize="xs"
            disabled={saving}
          />
          <Input
            value={draftLastName}
            onChange={(event) => setDraftLastName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void save();
              }
              if (event.key === 'Escape') {
                cancel();
              }
            }}
            placeholder="Last name"
            aria-label="Last name"
            appearance="sidebar"
            inputSize="xs"
            disabled={saving}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineActionButton
            title="Cancel"
            onClick={cancel}
            disabled={saving}
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
      </div>
      {err ? <p className="mt-2 text-[11px] text-red-500 px-0.5">{err}</p> : null}
    </div>
  );
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
    } catch (error: unknown) {
      setErr(messageFromError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rowRef} className={`transition-opacity ${isBlocked ? blockedRowClassName : activeRowClassName}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className={labelIconClassName}>{icon}</span>}
        <span className={labelTextClassName}>{label}</span>
        {warn && <span className="text-[10px] text-amber-500 font-semibold ml-1">merge suggestion</span>}
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
          className={inactiveRowClassName}
          onClick={() => onActivate(fieldKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(fieldKey);
            }
          }}
        >
          <span className={`truncate ${value ? inactiveValueClassName : inactivePlaceholderClassName}`}>
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
    } catch (error: unknown) {
      setErr(messageFromError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rowRef} className={`transition-opacity ${isBlocked ? blockedRowClassName : activeRowClassName}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className={labelIconClassName}>{icon}</span>}
        <span className={labelTextClassName}>{label}</span>
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
          className={inactiveRowClassName}
          onClick={() => onActivate(fieldKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate(fieldKey);
            }
          }}
        >
          <span className={`truncate ${value ? inactiveValueClassName : inactivePlaceholderClassName}`}>
            {selectedLabel}
          </span>
        </div>
      )}
    </div>
  );
}
