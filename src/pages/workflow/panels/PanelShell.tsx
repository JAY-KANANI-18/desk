import React, { ReactNode } from 'react';
import { ArrowLeft, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

// ─── Panel Shell ─────────────────────────────────────────────────────────────

interface PanelShellProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: ReactNode;
}

export function PanelShell({ title, subtitle, onClose, children }: PanelShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header — no color, just border */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label={isMobile ? 'Back to canvas' : 'Close panel'}
          >
            {isMobile ? <ArrowLeft size={16} /> : <X size={14} />}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function Section({ title, children, collapsible = false, defaultOpen = true, className = '' }: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={`border-b border-gray-100 last:border-0 ${className}`}>
      <button
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${collapsible ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        disabled={!collapsible}
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {collapsible && (open ? <ChevronUp size={13} className="text-gray-300" /> : <ChevronDown size={13} className="text-gray-300" />)}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-gray-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex-1">
        <p className="text-sm text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="sr-only peer" />
        <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-disabled:opacity-50" />
      </label>
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: string;
}

export function TextInput({ value, onChange, placeholder, disabled, className = '', type = 'text' }: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300 ${className}`}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  maxLength?: number;
}

export function Textarea({ value, onChange, placeholder, rows = 4, className = '', maxLength }: TextareaProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-300 ${className}`}
      />
      {maxLength && (
        <p className="text-xs text-gray-300 text-right mt-0.5">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

interface TagInputProps {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  suggestions?: any[];
}

export function TagInput({ values, onChange, placeholder, suggestions = [] }: TagInputProps) {
  const [input, setInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const add = (val: string) => {
    const t = val.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setInput('');
  };
  const remove = (val: string) => onChange(values.filter((v) => v !== val));
  const filtered = suggestions.filter((s) => s?.name?.toLowerCase().includes(input.toLowerCase()) && !values.includes(s?.id));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 min-h-[38px] px-2.5 py-2 border border-gray-200 rounded-md bg-white focus-within:ring-1 focus-within:ring-gray-400 focus-within:border-gray-400">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
            {v}
            <button onClick={() => remove(v)} className="text-gray-400 hover:text-gray-700 ml-0.5 leading-none">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
            if (e.key === 'Backspace' && !input && values.length) remove(values[values.length - 1]);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent placeholder:text-gray-300"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-36 overflow-y-auto z-10 relative">
          {filtered.slice(0, 6).map((s) => (
            <button key={s.id} onMouseDown={() => add(s.id)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Info Box ─────────────────────────────────────────────────────────────────

interface InfoBoxProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'tip';
}

export function InfoBox({ children, type = 'info' }: InfoBoxProps) {
  return (
    <div className="flex gap-2 text-xs px-3 py-2.5 rounded-md bg-gray-50 border border-gray-100 text-gray-500">
      <span className="flex-shrink-0 mt-px">{type === 'warning' ? '!' : 'i'}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

// ─── Duration Input ───────────────────────────────────────────────────────────

interface DurationInputProps {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  onValueChange: (v: number) => void;
  onUnitChange: (u: 'seconds' | 'minutes' | 'hours' | 'days') => void;
  max?: number;
}

export function DurationInput({ value, unit, onValueChange, onUnitChange, max }: DurationInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as 'seconds' | 'minutes' | 'hours' | 'days')}
        className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
      >
        <option value="seconds">Seconds</option>
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </select>
    </div>
  );
}
