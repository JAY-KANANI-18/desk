import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Trash2, ChevronUp, ChevronDown, Plus, AlignStartVertical, X } from 'lucide-react';
import { SP, BranchCondition, BranchCategory, ConditionOperator, ALL_OPERATORS, ASSIGNEE_STATUS_OPTIONS, BRANCH_CATS, NO_VALUE_OPS, OPERATORS_BY_CAT, OUTGOING_SOURCE_OPTIONS, SUB_FIELDS, Tag, TIME_OPS, TIME_UNITS } from '../../workflow.types';
import { useWorkflow } from '../../WorkflowContext';
import { workspaceApi } from '../../../../lib/workspaceApi';


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
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
      >
        <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors ${
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

// ── Tag MultiSelect with color dots ───────────────────────────────────────

function TagSelect({
  values,
  tags,
  loading,
  onChange,
}: {
  values: string[];
  tags: Tag[];
  loading: boolean;
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) =>
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);

  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((x) => x !== id));
  };

  const selectedTags = tags.filter((t) => values.includes(t.id));

  return (
    <div ref={ref} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 min-h-[34px] text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedTags.length === 0 ? (
            <span className="text-gray-400">Select tags…</span>
          ) : (
            selectedTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                style={{ backgroundColor: t.color }}
              >
                {t.name}
                <span
                  role="button"
                  onClick={(e) => removeChip(t.id, e)}
                  className="opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <X size={9} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={12}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="px-2.5 py-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags…"
              className="w-full text-xs outline-none placeholder-gray-400 text-gray-700"
            />
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            {loading && (
              <div className="px-3 py-2 text-xs text-gray-400">Loading…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">No tags found</div>
            )}
            {!loading && filtered.map((t) => {
              const checked = values.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      checked ? 'border-0' : 'border-gray-300'
                    }`}
                    style={checked ? { backgroundColor: t.color } : {}}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs text-gray-700 flex-1 text-left">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DateTime input ─────────────────────────────────────────────────────────

function DateTimeInput({
  value,
  onChange,
  placeholder = 'Select date & time…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
    />
  );
}

// ── Value Input — now context-aware ───────────────────────────────────────

function ValueInput({
  operator,
  category,
  value,
  onChange,
  tags,
  tagsLoading,
}: {
  operator: ConditionOperator;
  category: BranchCategory;
  value: string | string[] | number;
  onChange: (v: string | string[] | number) => void;
  tags: Tag[];
  tagsLoading: boolean;
}) {
  const [touched, setTouched] = useState(false);

  if (NO_VALUE_OPS.includes(operator)) return null;

  const strVal = String(value ?? '');
  const isEmpty = strVal.trim() === '' && !Array.isArray(value);
  const showError = touched && isEmpty && !Array.isArray(value);

  // ── Tags: always multi-select with color chips ──
  if (category === 'contact_tags') {
    return (
      <TagSelect
        values={Array.isArray(value) ? (value as string[]) : []}
        tags={tags}
        loading={tagsLoading}
        onChange={onChange}
      />
    );
  }

  // ── Assignee status: fixed options ──
  if (category === 'assignee_status') {
    return (
      <div className="mt-1.5">
        <Select
          value={strVal as any}
          options={ASSIGNEE_STATUS_OPTIONS as any}
          onChange={onChange}
          placeholder="Select status…"
        />
      </div>
    );
  }

  // ── Last outgoing message source: fixed options ──
  if (category === 'last_outgoing_message_source') {
    return (
      <div className="mt-1.5">
        <Select
          value={strVal as any}
          options={OUTGOING_SOURCE_OPTIONS as any}
          onChange={onChange}
          placeholder="Select source…"
        />
      </div>
    );
  }

  // ── Between (number range) ──
  if (operator === 'is_between') {
    const parts = strVal.includes('|') ? strVal.split('|') : [strVal, ''];
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <input
          type="number"
          value={parts[0]}
          onChange={(e) => onChange(`${e.target.value}|${parts[1]}`)}
          placeholder="From"
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <span className="text-xs text-gray-400">—</span>
        <input
          type="number"
          value={parts[1]}
          onChange={(e) => onChange(`${parts[0]}|${e.target.value}`)}
          placeholder="To"
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
    );
  }

  // ── Timestamp between: two datetime pickers ──
  if (operator === 'is_timestamp_between') {
    const parts = strVal.includes('|') ? strVal.split('|') : [strVal, ''];
    return (
      <div className="flex flex-col gap-1.5 mt-1.5">
        <DateTimeInput
          value={parts[0]}
          onChange={(v) => onChange(`${v}|${parts[1]}`)}
          placeholder="From date & time"
        />
        <DateTimeInput
          value={parts[1]}
          onChange={(v) => onChange(`${parts[0]}|${v}`)}
          placeholder="To date & time"
        />
      </div>
    );
  }

  // ── Between time: number + unit ──
  if (operator === 'is_between_time') {
    const parts = strVal.includes('|') ? strVal.split('|') : [strVal, '', 'minutes'];
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <input
          type="number"
          min={0}
          value={parts[0]}
          onChange={(e) => onChange(`${e.target.value}|${parts[1]}|${parts[2]}`)}
          placeholder="From"
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <span className="text-xs text-gray-400">—</span>
        <input
          type="number"
          min={0}
          value={parts[1]}
          onChange={(e) => onChange(`${parts[0]}|${e.target.value}|${parts[2]}`)}
          placeholder="To"
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <Select
          value={parts[2] as any}
          options={TIME_UNITS as any}
          onChange={(u) => onChange(`${parts[0]}|${parts[1]}|${u}`)}
          className="w-24"
        />
      </div>
    );
  }

  // ── Time operators: number + unit ──
  if (TIME_OPS.includes(operator)) {
    const parts = strVal.includes('|') ? strVal.split('|') : [strVal, 'minutes'];
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <input
          type="number"
          min={0}
          value={parts[0]}
          onChange={(e) => onChange(`${e.target.value}|${parts[1]}`)}
          onBlur={() => setTouched(true)}
          placeholder="Amount"
          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <Select
          value={parts[1] as any}
          options={TIME_UNITS as any}
          onChange={(u) => onChange(`${parts[0]}|${u}`)}
          className="w-28"
        />
      </div>
    );
  }

  // ── Timestamp after / before: datetime picker ──
  if (['is_timestamp_after', 'is_timestamp_before'].includes(operator)) {
    return (
      <div className="mt-1.5">
        <DateTimeInput value={strVal} onChange={onChange} />
      </div>
    );
  }

  // ── Default: text input ──
  return (
    <div className="mt-1.5">
      <input
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Value"
        className={`w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 transition-colors ${
          showError
            ? 'border-red-400 focus:ring-red-300 bg-red-50'
            : 'border-gray-200 focus:ring-gray-300'
        }`}
      />
      {showError && (
        <p className="text-xs text-red-500 mt-0.5">This field is required</p>
      )}
    </div>
  );
}

// ── useTags hook ───────────────────────────────────────────────────────────

function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTags(await workspaceApi.getTags());
    } catch {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { tags, loading, error };
}

// ── ConditionRow — now receives tags ──────────────────────────────────────

function ConditionRow({
  cond, showLogic, onUpdate, onRemove, tags, tagsLoading,
}: {
  cond: BranchCondition;
  showLogic: boolean;
  onUpdate: (patch: Partial<BranchCondition>) => void;
  onRemove: () => void;
  tags: Tag[];
  tagsLoading: boolean;
}) {
  const {state} = useWorkflow();
const variables =
  state.workflow?.config?.steps
    ?.map((s) => s?.data?.variableName)
    ?.filter((v): v is string => typeof v === "string" && v.trim().length > 0) ?? [];

  const subFields = variables.length > 0 ? variables.map((v) => ({ value: v, label: v })) : SUB_FIELDS[cond.category];

  const hasSubField = !!subFields && subFields.length > 0;
  
  const availableOpValues = OPERATORS_BY_CAT[cond.category] ?? [];
  const operators = ALL_OPERATORS.filter((o) => availableOpValues.includes(o.value));

  const handleCategoryChange = (cat: BranchCategory) => {
    const newOpValues = OPERATORS_BY_CAT[cat] ?? [];
    const newOps = ALL_OPERATORS.filter((o) => newOpValues.includes(o.value));
    onUpdate({ category: cat, field: '', operator: newOps[0]?.value ?? 'is_equal_to', value: '' });
  };

  return (
    <div className="space-y-1.5">
      {/* AND / OR */}
      {showLogic && (
        <div className="flex items-center gap-1 py-1">
          {(['AND', 'OR'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => onUpdate({ logicalOperator: op })}
              className={`px-3 py-0.5 rounded text-xs font-semibold border transition-colors ${
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

      {/* Block with delete pinned top-right */}
      <div className="relative pr-8">
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-0 right-0 p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors bg-white z-10"
        >
          <Trash2 size={12} />
        </button>

        {/* Row 1: Category + SubField */}
        <div className="flex gap-1.5 mb-1.5">
          <Select
            value={cond.category}
            options={BRANCH_CATS}
            onChange={handleCategoryChange}
            placeholder="Category"
            className="flex-1 min-w-0"
          />
          {hasSubField && (
            <Select
              value={(cond.field ?? '') as string}
              options={subFields as any}
              onChange={(v) => onUpdate({ field: v })}
              placeholder="Field…"
              className="flex-1 min-w-0"
            />
          )}
        </div>

        {/* Row 2: Operator */}
        <Select
          value={cond.operator}
          options={operators}
          onChange={(op) => onUpdate({ operator: op, value: '' })}
          placeholder="Operator"
          className="w-full"
        />

        {/* Row 3: Value */}
        <ValueInput
          operator={cond.operator}
          category={cond.category}
          value={cond.value}
          onChange={(v) => onUpdate({ value: v })}
          tags={tags}
          tagsLoading={tagsLoading}
        />
      </div>
    </div>
  );
}


// ── Branch Card ────────────────────────────────────────────────────────────

function BranchCard({
  conn, index, canClone,
  onRename, onClone, onRemove,
  onAddCondition, onUpdateCondition, onRemoveCondition,
  tags, tagsLoading
}: {
  conn: any; index: number; canClone: boolean;
  onRename: (n: string) => void;
  onClone: () => void;
  onRemove: () => void;
  onAddCondition: () => void;
  onUpdateCondition: (id: string, patch: Partial<BranchCondition>) => void;
  onRemoveCondition: (id: string) => void;
    tags: Tag[];
  tagsLoading: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conn.name);
  const conditions: BranchCondition[] = conn.data?.conditions ?? [];

  return (
    <div className="border border-gray-200 rounded-lg ">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <AlignStartVertical size={14} className="text-gray-400 flex-shrink-0" />

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onRename(draft || conn.name); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(draft); setEditing(false); }
              if (e.key === 'Escape') setEditing(false);
            }}
            className="flex-1 text-sm font-medium bg-transparent border-b border-gray-400 outline-none"
          />
        ) : (
          <span
            title="Double-click to rename"
            className="flex-1 text-sm font-medium text-gray-700 cursor-pointer select-none"
            onDoubleClick={() => { setDraft(conn.name); setEditing(true); }}
          >
            {conn.name}
          </span>
        )}

        {/* Clone */}
        <button
          onClick={onClone}
          disabled={!canClone}
          title="Clone branch"
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
        >
          <Copy size={13} className="text-gray-400" />
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          title="Delete branch"
          className="p-1 hover:bg-gray-200 rounded transition-colors group"
        >
          <Trash2 size={13} className="text-gray-400 group-hover:text-red-500 transition-colors" />
        </button>

        {/* Collapse */}
        <button onClick={() => setOpen((v) => !v)} className="p-1 hover:bg-gray-200 rounded transition-colors">
          {open
            ? <ChevronUp size={13} className="text-gray-400" />
            : <ChevronDown size={13} className="text-gray-400" />}
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="p-3 space-y-1">
          {conditions.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">No conditions — always matches.</p>
          )}

          {conditions.map((cond, ci) => (
            <ConditionRow
              key={cond.id}
              cond={cond}
              showLogic={ci > 0}
              onUpdate={(patch) => onUpdateCondition(cond.id, patch)}
              onRemove={() => onRemoveCondition(cond.id)}
               tags={tags}           // ← add
        tagsLoading={tagsLoading}  // ← add
            />
          ))}

          {conditions.length < 10 && (
            <button
              onClick={onAddCondition}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus size={12} />
              Add filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── BranchConfig ───────────────────────────────────────────────────────────

export function BranchConfig({ step, onChange }: SP) {
  const { state, addStep, deleteStep, updateStep } = useWorkflow();
    const { tags, loading: tagsLoading } = useTags(); // ← fetch once here


  const connectors = (state.workflow?.config?.steps ?? []).filter(
    (s) => s.parentId === step.id && s.type === 'branch_connector'
  );

  const uid = () => `conn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const addConnector = () => {
    if (connectors.length >= 9) return;
    const id = uid();
    addStep({
      id, type: 'branch_connector',
      name: `Branch ${connectors.length + 1}`,
      parentId: step.id,
      data: { conditions: [] },
      position: { x: 0, y: 0 },
    });
    updateStep({ ...step, data: { ...step.data, connectors: [...(step.data?.connectors ?? []), id] } });
  };

  const removeConnector = (id: string) => {
    (state.workflow?.steps ?? []).filter((s) => s.parentId === id).forEach((c) => deleteStep(c.id));
    deleteStep(id);
  };

  const cloneConnector = (conn: any) => {
    if (connectors.length >= 9) return;
    const id = uid();
    addStep({
      ...conn, id,
      name: `${conn.name} (copy)`,
      parentId: step.id,
      data: {
        ...conn.data,
        conditions: (conn.data?.conditions ?? []).map((c: any) => ({ ...c, id: `cond-${Date.now()}-${Math.random().toString(36).slice(2,5)}` })),
      },
      position: { x: 0, y: 0 },
    });
    updateStep({ ...step, data: { ...step.data, connectors: [...(step.data?.connectors ?? []), id] } });
  };

  const renameConnector = (id: string, name: string) => {
    const conn = connectors.find((c) => c.id === id);
    if (conn) updateStep({ ...conn, name });
  };

  const addCondition = (connId: string) => {
    const conn = connectors.find((c) => c.id === connId);
    if (!conn) return;
    const conditions = conn.data?.conditions ?? [];
    const firstCat: BranchCategory = 'contact_field';
    const firstOp = OPERATORS_BY_CAT[firstCat][0];
    updateStep({
      ...conn,
      data: {
        ...conn.data,
        conditions: [
          ...conditions,
          {
            id: `cond-${Date.now()}`,
            category: firstCat,
            operator: firstOp,
            value: '',
            logicalOperator: conditions.length > 0 ? ('AND' as const) : undefined,
          },
        ],
      },
    });
  };

  const updateCondition = (connId: string, condId: string, patch: Partial<BranchCondition>) => {
    const conn = connectors.find((c) => c.id === connId);
    if (!conn) return;
    updateStep({
      ...conn,
      data: {
        ...conn.data,
        conditions: (conn.data?.conditions ?? []).map((c: BranchCondition) =>
          c.id === condId ? { ...c, ...patch } : c
        ),
      },
    });
  };

  const removeCondition = (connId: string, condId: string) => {
    const conn = connectors.find((c) => c.id === connId);
    if (!conn) return;
    updateStep({
      ...conn,
      data: {
        ...conn.data,
        conditions: (conn.data?.conditions ?? []).filter((c: BranchCondition) => c.id !== condId),
      },
    });
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-500">
          Each branch is a path. Contacts matching no branch go to Else.
        </p>
        {connectors.length < 9 && (
          <button
            onClick={addConnector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex-shrink-0 ml-3"
          >
            <Plus size={12} />
            Add Branch
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3">
        {connectors.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-400">
            No branches yet — click <strong>Add Branch</strong> to get started.
          </div>
        )}

        {connectors.map((conn, idx) => (
          <BranchCard
            key={conn.id}
            conn={conn}
            index={idx}
            canClone={connectors.length < 9}
            onRename={(name) => renameConnector(conn.id, name)}
            onClone={() => cloneConnector(conn)}
            onRemove={() => removeConnector(conn.id)}
            onAddCondition={() => addCondition(conn.id)}
            onUpdateCondition={(cid, patch) => updateCondition(conn.id, cid, patch)}
            onRemoveCondition={(cid) => removeCondition(conn.id, cid)}
             tags={tags}           // ← add
        tagsLoading={tagsLoading}  // ← add
          />
        ))}

        {/* Else */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50">
          <span className="text-xs font-semibold text-gray-400">Else</span>
          <span className="text-xs text-gray-400">— fallback if no branch matches</span>
        </div>
      </div>
    </div>
  );
}