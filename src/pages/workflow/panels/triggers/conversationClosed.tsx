import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, Plus, Info, ChevronUp, X } from 'lucide-react';
import { TriggerConfig, ConditionOperator, TriggerCondition, Props, FIELD_DEFS_BY_TRIGGER, FieldDef, MULTI_OPERATORS, SINGLE_OPERATORS } from '../../workflow.types';




// ── Shared Select (single value) ───────────────────────────────────────────

function Select<T extends string>({
  value, options, onChange, placeholder = 'Select…', className = '',
}: {
  value: T | '';
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  o.value === value ? 'text-gray-900 font-medium bg-gray-50' : 'text-gray-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-select with chips ────────────────────────────────────────────────

function MultiSelect({
  values, options, onChange, placeholder = 'Select values…',
}: {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  const removeChip = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((x) => x !== v));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 min-h-[38px] text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {values.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            values.map((v) => {
              const label = options.find((o) => o.value === v)?.label ?? v;
              return (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                >
                  {label}
                  <span
                    role="button"
                    onClick={(e) => removeChip(v, e)}
                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X size={10} />
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((o) => {
              const checked = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    checked ? 'text-gray-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {checked && (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ConditionBuilder ───────────────────────────────────────────────────────

export function ConditionBuilder({
  conditions,
  onChange,
  triggerType,
}: {
  conditions: TriggerCondition[];
  onChange: (next: TriggerCondition[]) => void;
  triggerType: string;
}) {
  const [open, setOpen] = useState(true);
  const fieldDefs: FieldDef[] = FIELD_DEFS_BY_TRIGGER[triggerType] ?? [];
  const uid = () => Math.random().toString(36).slice(2, 8);

  const getFieldDef = (field: string) => fieldDefs.find((f) => f.value === field);

  const add = () => {
    const firstField = fieldDefs[0];
    const withLogic = conditions.length > 0
      ? conditions.map((c, i) =>
          i === conditions.length - 1 && !c.logicalOperator
            ? { ...c, logicalOperator: 'AND' as const }
            : c
        )
      : conditions;
    onChange([
      ...withLogic,
      {
        id: uid(),
        field:    firstField?.value ?? 'source',
        operator: firstField?.multi ? 'has_any_of' : 'is_equal_to',
        value:    firstField?.multi ? [] : '',
      },
    ]);
  };

  const remove = (id: string) => onChange(conditions.filter((c) => c.id !== id));

  const update = (id: string, patch: Partial<TriggerCondition>) =>
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="border-b border-gray-100">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-blue-600">Trigger Conditions</span>
          <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Info size={10} className="text-white" />
          </div>
        </div>
        {open
          ? <ChevronUp size={15} className="text-blue-500" />
          : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {conditions.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">
              No conditions — triggers on every event.
            </p>
          )}

          {conditions.map((cond, idx) => {
            const isLast   = idx === conditions.length - 1;
            const fieldDef = getFieldDef(cond.field);
            const isMulti  = fieldDef?.multi ?? false;
            const operators = isMulti ? MULTI_OPERATORS : SINGLE_OPERATORS;
            const valueOpts = fieldDef?.options ?? [];
            const multiValues = Array.isArray(cond.value) ? cond.value : [];
            const singleValue = typeof cond.value === 'string' ? cond.value : '';

            return (
              <div key={cond.id}>
                {/* Field + Operator + Delete */}
                <div className="flex items-center gap-2">
                  <Select
                    value={cond.field}
                    options={fieldDefs.map((f) => ({ value: f.value, label: f.label }))}
                    onChange={(v) => {
                      const def = getFieldDef(v);
                      update(cond.id, {
                        field:    v,
                        operator: def?.multi ? 'has_any_of' : 'is_equal_to',
                        value:    def?.multi ? [] : '',
                      });
                    }}
                    className="flex-1"
                  />
                  <Select
                    value={cond.operator}
                    options={operators}
                    onChange={(v) => update(cond.id, { operator: v })}
                    className="w-36"
                  />
                  <button
                    type="button"
                    onClick={() => remove(cond.id)}
                    className="flex-shrink-0 p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Value row */}
                {valueOpts.length > 0 && (
                  <div className="mt-1.5">
                    {isMulti ? (
                      <MultiSelect
                        values={multiValues}
                        options={valueOpts}
                        onChange={(v) => update(cond.id, { value: v })}
                        placeholder="Select values…"
                      />
                    ) : (
                      <Select
                        value={singleValue}
                        options={valueOpts}
                        onChange={(v) => update(cond.id, { value: v })}
                        placeholder="Select value…"
                      />
                    )}
                  </div>
                )}

                {!isMulti && valueOpts.length === 0 && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={singleValue}
                      onChange={(event) => update(cond.id, { value: event.target.value })}
                      placeholder="Enter value…"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                )}

                {/* AND / OR connector */}
                {!isLast && (
                  <div className="flex items-center gap-1 mt-2 mb-1">
                    {(['AND', 'OR'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => update(cond.id, { logicalOperator: op })}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                          (cond.logicalOperator ?? 'AND') === op
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {op === 'AND' ? 'And' : 'Or'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus size={13} />
            Add filter
          </button>
        </div>
      )}
    </div>
  );
}

// ── Trigger-specific thin wrappers ─────────────────────────────────────────

export function ConversationOpenedConfig({ trigger, onChange }: Props) {
  return (
    <ConditionBuilder
      triggerType="conversation_opened"
      conditions={trigger.conditions}
      onChange={(conditions) => onChange({ conditions })}
    />
  );
}

export function ConversationClosedConfig({ trigger, onChange }: Props) {
  return (
    <ConditionBuilder
      triggerType="conversation_closed"
      conditions={trigger.conditions}
      onChange={(conditions) => onChange({ conditions })}
    />
  );
}
