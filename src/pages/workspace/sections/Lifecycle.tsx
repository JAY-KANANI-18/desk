import { useState, useEffect, useCallback, useRef, useId } from "react";
import {
  Plus, GripVertical, MoreHorizontal,
  ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";

// ─── Types ────────────────────────────────────────────────────────────────────

type StageType = "lifecycle" | "lost";

interface LifecycleStage {
  id: number;
  workspaceId: number;
  name: string;
  description: string;
  emoji: string;
  type: StageType;
  order: number;
  isDefault: boolean;
  isWon: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI-only fields — never sent to BE
interface StageUI extends LifecycleStage {
  _showDesc: boolean;
  _saving: boolean;
  _isNew: boolean;
}

const toUI = (s: LifecycleStage): StageUI => ({
  ...s,
  _showDesc: !!s.description,
  _saving: false,
  _isNew: false,
});

const EMOJIS = [
  "🆕","🔥","💵","😎","🤩","🧊","⭐","🎯","💎","🚀",
  "📞","✅","❌","🤝","💡","📋","🏆","💼","🎪","🔔",
];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean }

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((message: string, ok = false) => {
    const id = ++counter.current;
    setToasts(p => [...p, { id, message, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  return { toasts, push };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Closes a floating panel when a click happens outside `ref`. */
function useOutsideClick(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref as React.RefObject<HTMLElement>, () => setOpen(false));

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-lg hover:border-indigo-400 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="Pick emoji"
      >
        {value}
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-11 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 grid grid-cols-5 gap-1 w-52"
          style={{ animation: "fadeSlideIn 120ms ease" }}
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              className={`w-8 h-8 text-base rounded-lg flex items-center justify-center transition-colors ${
                e === value ? "bg-indigo-100 ring-1 ring-indigo-400" : "hover:bg-gray-100"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── StageRow ─────────────────────────────────────────────────────────────────

interface RowProps {
  stage: StageUI;
  index: number;
  onChange: (id: number, patch: Partial<StageUI>) => void;
  onBlurSave: (id: number, patch: Partial<Pick<LifecycleStage, "name" | "description" | "emoji">>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onMenuAction: (id: number, action: "setDefault" | "setWon") => Promise<void>;
  onCommitNew: (id: number) => Promise<void>;
  // Drag props
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
  isDragOver: boolean;
  dragOverPosition: "above" | "below" | null;
}

const StageRow = ({
  stage, index, onChange, onBlurSave, onDelete, onMenuAction, onCommitNew,
  dragHandleProps, isDragging, isDragOver, dragOverPosition,
}: RowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useOutsideClick(menuRef as React.RefObject<HTMLElement>, () => setMenuOpen(false));

  // Auto-focus new stage name input
  useEffect(() => {
    if (stage._isNew) nameInputRef.current?.focus();
  }, [stage._isNew]);

  const handleEmojiChange = useCallback(async (emoji: string) => {
    onChange(stage.id, { emoji });
    if (!stage._isNew) await onBlurSave(stage.id, { emoji });
  }, [stage.id, stage._isNew, onChange, onBlurSave]);

  return (
    <div
  className={[
    "relative flex flex-col gap-2 py-3 transition-all duration-150 sm:gap-1.5",
    isDragging ? "opacity-30 scale-[0.99]" : "opacity-100 scale-100",
    menuOpen ? "z-50" : "z-0",
  ].join(" ")}
>
      {/* Drop indicator line */}
      {isDragOver && dragOverPosition === "above" && (
        <div className="absolute -top-px left-8 right-0 h-0.5 bg-indigo-500 rounded-full z-10" />
      )}
      {isDragOver && dragOverPosition === "below" && (
        <div className="absolute -bottom-px left-8 right-0 h-0.5 bg-indigo-500 rounded-full z-10" />
      )}

      <div className="pl-9 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Stage {index + 1}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors touch-none select-none"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>

        <EmojiPicker value={stage.emoji} onChange={handleEmojiChange} />

        {/* Name input */}
        <input
          ref={nameInputRef}
          id={inputId}
          value={stage.name}
          onChange={e => onChange(stage.id, { name: e.target.value })}
          onBlur={() => {
            if (!stage._isNew && stage.name.trim())
              onBlurSave(stage.id, { name: stage.name.trim() });
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && stage._isNew) onCommitNew(stage.id);
            if (e.key === "Escape" && stage._isNew) onDelete(stage.id);
          }}
          placeholder="Stage name…"
          autoComplete="off"
          className={[
            "min-w-[12rem] flex-1 basis-[12rem] border rounded-lg bg-white px-3 py-2 text-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300",
            !stage.name ? "border-red-300 ring-1 ring-red-100" : "border-gray-200 hover:border-gray-300",
          ].join(" ")}
        />

        {/* Badges */}
        {stage.isDefault && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 whitespace-nowrap leading-5">
            Default
          </span>
        )}
        {stage.isWon && (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100 whitespace-nowrap leading-5">
            Won
          </span>
        )}

        {/* Saving spinner */}
        {stage._saving && <Loader2 size={14} className="animate-spin text-indigo-400 shrink-0" />}

        {/* New stage actions */}
        {stage._isNew ? (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-1">
            <button
              type="button"
              onClick={() => onCommitNew(stage.id)}
              disabled={!stage.name.trim() || stage._saving}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed sm:flex-none sm:whitespace-nowrap"
            >
              {stage._saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(stage.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 leading-none transition-colors hover:bg-red-50 hover:text-red-500 sm:h-7 sm:w-7 sm:border-0 sm:text-lg"
              aria-label="Cancel"
            >
              ×
            </button>
          </div>
        ) : (
          /* 3-dot menu */
          <div className="relative ml-auto shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(p => !p)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-52 text-sm"
                style={{ animation: "fadeSlideIn 120ms ease" }}
              >
                {!stage.isDefault && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onMenuAction(stage.id, "setDefault"); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    Set as Default stage
                  </button>
                )}
                {!stage.isWon && stage.type === "lifecycle" && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onMenuAction(stage.id, "setWon"); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    Set as Won stage
                  </button>
                )}
                {(stage.isDefault || stage.isWon || stage.type === "lifecycle") && (
                  <div className="my-1 border-t border-gray-100" />
                )}
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(stage.id); }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation error */}
      {!stage.name && (
        <p className="pl-9 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> Stage name is required
        </p>
      )}

      {/* Description toggle */}
      {!stage._showDesc ? (
        <button
          type="button"
          onClick={() => onChange(stage.id, { _showDesc: true })}
          className="pl-9 text-xs text-gray-400 hover:text-indigo-500 text-left flex items-center gap-1 transition-colors w-fit"
        >
          <ChevronDown size={11} /> Add description
        </button>
      ) : (
        <div className="pl-9 flex flex-col gap-1">
          <input
            value={stage.description}
            onChange={e => onChange(stage.id, { description: e.target.value })}
            onBlur={() => {
              if (!stage._isNew) onBlurSave(stage.id, { description: stage.description });
            }}
            placeholder="Optional description…"
            autoComplete="off"
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:border-gray-300 transition-all"
          />
          <button
            type="button"
            onClick={() => onChange(stage.id, { _showDesc: false })}
            className="text-xs text-gray-400 hover:text-indigo-500 text-left flex items-center gap-1 transition-colors w-fit"
          >
            <ChevronUp size={11} /> Hide description
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Drag-and-drop hook ───────────────────────────────────────────────────────

interface DragState {
  draggingId: number | null;
  dragOverId: number | null;
  dragOverPosition: "above" | "below" | null;
}

function useSmoothDnD(
  stages: StageUI[],
  setStages: React.Dispatch<React.SetStateAction<StageUI[]>>,
  onReorderError: () => void,
) {
  const [drag, setDrag] = useState<DragState>({
    draggingId: null,
    dragOverId: null,
    dragOverPosition: null,
  });

  // Track pointer position within drag-over element to infer above/below
  const pointerYRef = useRef(0);
  const dragOverRects = useRef<Map<number, DOMRect>>(new Map());

  const getDragHandleProps = useCallback((id: number): React.HTMLAttributes<HTMLDivElement> => ({
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.effectAllowed = "move";
      // Transparent drag ghost
      const ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
      setDrag(d => ({ ...d, draggingId: id }));
    },
    onDragEnd: () => {
      setDrag(d => {
        const { draggingId, dragOverId, dragOverPosition } = d;
        if (draggingId && dragOverId && draggingId !== dragOverId) {
          setStages(prev => {
            const dragStage = prev.find(s => s.id === draggingId);
            const overStage = prev.find(s => s.id === dragOverId);
            if (!dragStage || !overStage || dragStage.type !== overStage.type) return prev;

            const bucket = [...prev]
              .filter(s => s.type === dragStage.type && !s._isNew)
              .sort((a, b) => a.order - b.order);

            const fi = bucket.findIndex(s => s.id === draggingId);
            const ti = bucket.findIndex(s => s.id === dragOverId);
            if (fi === -1 || ti === -1) return prev;

            const arr = [...bucket];
            const [moved] = arr.splice(fi, 1);
            const insertAt = dragOverPosition === "below" ? ti + (ti > fi ? 0 : 1) : ti - (ti > fi ? 1 : 0);
            arr.splice(Math.max(0, Math.min(insertAt, arr.length)), 0, moved);

            const reordered = arr.map((s, i) => ({ ...s, order: i + 1 }));
            const orderMap = new Map(reordered.map(s => [s.id, s.order]));

           workspaceApi.reorderLifecycleStages({ stages: reordered.map(s => ({ id: s.id, order: s.order })) })


            return prev.map(s => orderMap.has(s.id) ? { ...s, order: orderMap.get(s.id)! } : s);
          });
        }
        return { draggingId: null, dragOverId: null, dragOverPosition: null };
      });
      dragOverRects.current.clear();
    },
  }), [setStages, onReorderError]);

  const getDropZoneProps = useCallback((id: number): React.HTMLAttributes<HTMLDivElement> => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      pointerYRef.current = e.clientY;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragOverRects.current.set(id, rect);
      const midY = rect.top + rect.height / 2;
      const position: "above" | "below" = e.clientY < midY ? "above" : "below";
      setDrag(d => d.dragOverId === id && d.dragOverPosition === position
        ? d
        : { ...d, dragOverId: id, dragOverPosition: position });
    },
    onDragLeave: (e) => {
      const related = e.relatedTarget as Node | null;
      if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
        setDrag(d => d.dragOverId === id ? { ...d, dragOverId: null, dragOverPosition: null } : d);
      }
    },
  }), []);

  return { drag, getDragHandleProps, getDropZoneProps };
}

// ─── StagePanel ───────────────────────────────────────────────────────────────

interface PanelProps {
  title: string;
  subtitle: string;
  icon: string;
  className?: string;
  stages: StageUI[];
  type: StageType;
  onChange: (id: number, patch: Partial<StageUI>) => void;
  onBlurSave: (id: number, patch: Partial<Pick<LifecycleStage, "name" | "description" | "emoji">>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onMenuAction: (id: number, action: "setDefault" | "setWon") => Promise<void>;
  onAddNew: (type: StageType) => void;
  onCommitNew: (id: number) => Promise<void>;
  getDragHandleProps: (id: number) => React.HTMLAttributes<HTMLDivElement>;
  getDropZoneProps: (id: number) => React.HTMLAttributes<HTMLDivElement>;
  drag: DragState;
}

const StagePanel = ({
  title, subtitle, icon, className = "", stages, type,
  onChange, onBlurSave, onDelete, onMenuAction, onAddNew, onCommitNew,
  getDragHandleProps, getDropZoneProps, drag,
}: PanelProps) => (
  <div className={`rounded-2xl border border-gray-200 overflow-visible flex flex-col ${className}`}>
    {/* Panel header */}
    <div className="flex flex-wrap items-start gap-3 border-b border-gray-100 bg-white/60 px-4 pb-3.5 pt-4 sm:px-5">
      <span className="mt-0.5 shrink-0 text-xl">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>
      <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
        {stages.length}
      </span>
    </div>

    {/* Stage rows */}
    <div className="flex-1 divide-y divide-gray-100/80 px-3 sm:px-4">
      {stages.length === 0 && (
        <p className="py-6 text-xs text-center text-gray-400">No stages yet. Add one below.</p>
      )}
      {stages.map((stage, idx) => (
        <div key={stage.id} {...(stage._isNew ? {} : getDropZoneProps(stage.id))}>
          <StageRow
            stage={stage}
            index={idx}
            onChange={onChange}
            onBlurSave={onBlurSave}
            onDelete={onDelete}
            onMenuAction={onMenuAction}
            onCommitNew={onCommitNew}
            dragHandleProps={stage._isNew ? {} : getDragHandleProps(stage.id)}
            isDragging={drag.draggingId === stage.id}
            isDragOver={drag.dragOverId === stage.id && drag.draggingId !== stage.id}
            dragOverPosition={drag.dragOverId === stage.id ? drag.dragOverPosition : null}
          />
        </div>
      ))}
    </div>

    {/* Add button */}
    <div className="border-t border-gray-100 bg-white/60 px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={() => onAddNew(type)}
        className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition-all"
      >
        <Plus size={14} /> Add Stage
      </button>
    </div>
  </div>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const Toggle = ({ enabled, disabled, onToggle }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={onToggle}
    disabled={disabled}
    className={[
      "relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
      enabled ? "bg-indigo-600" : "bg-gray-300",
      disabled ? "opacity-60 cursor-wait" : "cursor-pointer",
    ].join(" ")}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const Lifecycle = () => {
  const [stages, setStages]         = useState<StageUI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [enabled, setEnabled]       = useState(true);
  const [togglingVis, setTogglingVis] = useState(false);
  const { toasts, push }            = useToasts();

  // Stable ref so event handlers can trigger reload without stale closures
  const loadRef = useRef<() => Promise<void>>();

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: LifecycleStage[] = await workspaceApi.getLifecycleStages();
      setStages(data.map(toUI));
    } catch {
      setLoadError("Failed to load lifecycle stages.");
    } finally {
      setLoading(false);
    }
  }, []);

  loadRef.current = load;

  useEffect(() => { load(); }, [load]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const lifecycleStages = stages
    .filter(s => s.type === "lifecycle")
    .sort((a, b) => a.order - b.order);

  const lostStages = stages
    .filter(s => s.type === "lost")
    .sort((a, b) => a.order - b.order);

  // ── Local state change (no API) ───────────────────────────────────────────

  const handleChange = useCallback((id: number, patch: Partial<StageUI>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  // ── Blur-save (name / description / emoji) ────────────────────────────────

  const setSaving = useCallback((id: number, val: boolean) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, _saving: val } : s));
  }, []);

  const handleBlurSave = useCallback(async (
    id: number,
    patch: Partial<Pick<LifecycleStage, "name" | "description" | "emoji">>,
  ) => {
    setSaving(id, true);
    try {
      const updated: LifecycleStage = await workspaceApi.updateLifecycleStage(id, patch);
      setStages(prev => prev.map(s =>
        s.id === id ? { ...toUI(updated), _showDesc: s._showDesc } : s
      ));
    } catch (e: any) {
      push(e?.message ?? "Failed to save");
      loadRef.current?.();
    } finally {
      setSaving(id, false);
    }
  }, [setSaving, push]);

  // ── Add new (local placeholder) ───────────────────────────────────────────

  const handleAddNew = useCallback((type: StageType) => {
    const tempId = -(Date.now());
    setStages(prev => {
      const count = prev.filter(s => s.type === type).length;
      const placeholder: StageUI = {
        id: tempId, workspaceId: 0,
        name: "", description: "", emoji: "⭐",
        type, order: count + 1,
        isDefault: false, isWon: false,
        createdAt: "", updatedAt: "",
        _showDesc: false, _saving: false, _isNew: true,
      };
      return [...prev, placeholder];
    });
  }, []);

  // ── Commit new stage to BE ────────────────────────────────────────────────

  const handleCommitNew = useCallback(async (tempId: number) => {
    const stage = stages.find(s => s.id === tempId);
    if (!stage?.name.trim()) return;

    setSaving(tempId, true);
    try {
      const created: LifecycleStage = await workspaceApi.addLifecycleStage({
        name: stage.name.trim(),
        description: stage.description,
        emoji: stage.emoji,
        type: stage.type,
        order: stage.order,
        isDefault: false,
        isWon: false,
      });
      setStages(prev => prev.map(s => s.id === tempId ? toUI(created) : s));
    } catch (e: any) {
      push(e?.message ?? "Failed to create stage");
      setSaving(tempId, false);
    }
  }, [stages, setSaving, push]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: number) => {
    if (id < 0) {
      setStages(prev => prev.filter(s => s.id !== id));
      return;
    }
    setSaving(id, true);
    try {
      await workspaceApi.deleteLifecycleStage(id);
      setStages(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      push(e?.message ?? "Failed to delete");
      setSaving(id, false);
    }
  }, [setSaving, push]);

  // ── setDefault / setWon ───────────────────────────────────────────────────

  const handleMenuAction = useCallback(async (id: number, action: "setDefault" | "setWon") => {
    // Optimistic update
    setStages(prev => prev.map(s =>
      action === "setDefault"
        ? { ...s, isDefault: s.id === id }
        : { ...s, isWon: s.id === id }
    ));
    try {
      const patch = action === "setDefault" ? { isDefault: true } : { isWon: true };
      await workspaceApi.updateLifecycleStage(id, patch);
      // Re-fetch for server-authoritative state (BE clears other rows)
      const all: LifecycleStage[] = await workspaceApi.getLifecycleStages();
      setStages(prev => {
        const uiMap = new Map(prev.map(s => [s.id, s]));
        return all.map(s => ({ ...toUI(s), _showDesc: uiMap.get(s.id)?._showDesc ?? false }));
      });
    } catch (e: any) {
      push(e?.message ?? "Failed to update");
      loadRef.current?.();
    }
  }, [push]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  const handleReorderError = useCallback(() => {
    push("Reorder failed");
    loadRef.current?.();
  }, [push]);

  const { drag, getDragHandleProps, getDropZoneProps } = useSmoothDnD(stages, setStages, handleReorderError);

  // ── Visibility toggle ─────────────────────────────────────────────────────

  const handleToggleVisibility = useCallback(async () => {
    const next = !enabled;
    setEnabled(next);
    setTogglingVis(true);
    try {
      await workspaceApi.updateVisibility(next);
    } catch {
      setEnabled(!next);
      push("Failed to update visibility");
    } finally {
      setTogglingVis(false);
    }
  }, [enabled, push]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <DataLoader type={"stages"} />
  );

  if (loadError) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="bg-white rounded-2xl border border-red-200 px-8 py-6 flex flex-col items-center gap-3 shadow-sm max-w-xs text-center">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <p className="text-sm text-gray-700 font-medium">{loadError}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Global micro-animation keyframe */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="space-y-4 px-0 py-1 sm:space-y-5 sm:p-6">

        {/* Toast stack */}
        <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:w-auto ${
                t.ok
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
              style={{ animation: "toastIn 200ms ease" }}
            >
              {t.ok
                ? <CheckCircle2 size={14} className="shrink-0" />
                : <AlertCircle size={14} className="shrink-0" />
              }
              {t.message}
            </div>
          ))}
        </div>

        {/* Page header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔄</span>
            <h1 className="text-lg font-semibold text-gray-900">Lifecycle</h1>
          </div>
          <p className="text-sm leading-5 text-gray-500 sm:ml-9">
            Track and manage Contacts through every stage of your sales process
          </p>
        </div>

        {/* Visibility card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Show Lifecycle Stages</p>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              Display Lifecycle Stages in Inbox and Contacts. Disabling only hides the stages — your contact data remains unchanged.
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <Toggle enabled={enabled} disabled={togglingVis} onToggle={handleToggleVisibility} />
          </div>
        </div>

        {/* Section heading */}
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Configure Stages
        </h2>

        {/* Panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <StagePanel
            title="Lifecycle Stages"
            subtitle="Track Contacts through key milestones. A default inbox is created for each lifecycle stage."
            icon="🟡"
            className="bg-white"
            stages={lifecycleStages}
            type="lifecycle"
            onChange={handleChange}
            onBlurSave={handleBlurSave}
            onDelete={handleDelete}
            onMenuAction={handleMenuAction}
            onAddNew={handleAddNew}
            onCommitNew={handleCommitNew}
            getDragHandleProps={getDragHandleProps}
            getDropZoneProps={getDropZoneProps}
            drag={drag}
          />
          <StagePanel
            title="Lost Stages"
            subtitle="Track where Contacts go after exiting the pipeline. No inbox is created for lost stages."
            icon="😞"
            className="bg-orange-50/60"
            stages={lostStages}
            type="lost"
            onChange={handleChange}
            onBlurSave={handleBlurSave}
            onDelete={handleDelete}
            onMenuAction={handleMenuAction}
            onAddNew={handleAddNew}
            onCommitNew={handleCommitNew}
            getDragHandleProps={getDragHandleProps}
            getDropZoneProps={getDropZoneProps}
            drag={drag}
          />
        </div>
      </div>
    </>
  );
};

export default Lifecycle;
