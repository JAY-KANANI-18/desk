

// ── 1. Conversation Opened ────────────────────────────────────────────────────

import { ChevronDown, Info, ChevronUp, Trash2, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TriggerConfig, ConditionOperator, TriggerCondition, ConversationSource, Props, FIELD_OPTIONS, OPERATOR_OPTIONS, VALUE_OPTIONS_BY_FIELD } from "../../workflow.types";



// ── Shared Select ──────────────────────────────────────────────────────────

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

// ── Shared ConditionBuilder ────────────────────────────────────────────────
// Reusable across ALL trigger types — just pass trigger.conditions + onChange

export function ConditionBuilder({ conditions, onChange }: {
  conditions: TriggerCondition[];
  onChange: (next: TriggerCondition[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const uid = () => Math.random().toString(36).slice(2, 8);

  const add = () => {
    const withLogic = conditions.length > 0
      ? conditions.map((c, i) =>
          i === conditions.length - 1 && !c.logicalOperator
            ? { ...c, logicalOperator: 'AND' as const }
            : c
        )
      : conditions;
    onChange([
      ...withLogic,
      { id: uid(), field: 'source', operator: 'is_equal_to', value: '' },
    ]);
  };

  const remove = (id: string) => onChange(conditions.filter((c) => c.id !== id));

  const update = (id: string, patch: Partial<TriggerCondition>) =>
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const toggleLogic = (id: string) =>
    onChange(
      conditions.map((c) =>
        c.id === id
          ? { ...c, logicalOperator: c.logicalOperator === 'AND' ? 'OR' : 'AND' }
          : c
      )
    );

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
              No conditions — triggers on every conversation open.
            </p>
          )}

          {conditions.map((cond, idx) => {
            const isLast = idx === conditions.length - 1;
            const valueOpts = VALUE_OPTIONS_BY_FIELD[cond.field] ?? [];

            return (
              <div key={cond.id}>
                {/* Field + Operator + Delete */}
                <div className="flex items-center gap-2">
                  <Select
                    value={cond.field as any}
                    options={FIELD_OPTIONS as any}
                    onChange={(v) => update(cond.id, { field: v, value: '' })}
                    className="flex-1"
                  />
                  <Select
                    value={cond.operator}
                    options={OPERATOR_OPTIONS}
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

                {/* Value */}
                {valueOpts.length > 0 && (
                  <div className="mt-1.5">
                    <Select
                      value={cond.value as string}
                      options={valueOpts as any}
                      onChange={(v) => update(cond.id, { value: v })}
                      placeholder="Select value…"
                    />
                  </div>
                )}

                {/* AND / OR between conditions */}
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
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add filter */}
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

// ── ConversationOpenedConfig ───────────────────────────────────────────────

export function ConversationOpenedConfig({ trigger, onChange }: Props) {
  return (
    <ConditionBuilder
      conditions={trigger.conditions}
      onChange={(conditions) => onChange({ conditions })}
    />
  );
}