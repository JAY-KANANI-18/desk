import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Check, GitMerge, Mail, Phone, Building2,
  AlertTriangle, Tag as TagIcon, CheckCircle2, Copy,
  Search, Plus, Loader2, Globe, Instagram, MessageCircle,
  AtSign, Pencil,
} from 'lucide-react';
import { channelConfig } from './data';
import type { Conversation, Contact } from './types';
import { contactsApi } from '../../lib/contactApi';
import { useInbox } from '../../context/InboxContext';


// ─── Store ────────────────────────────────────────────────────────────────────
const INITIAL_CONTACTS: any = [
  { id: 1, conversationId: 1, firstName: 'Jay', lastName: 'Kanani', email: 'jay@example.com', phone: '+1 234 567 8900', company: 'Acme Corp', avatar: '', tags: ['VIP', 'Priority'], channel: 'whatsapp', lifecycleStage: 'New Lead' },
  { id: 2, conversationId: 2, firstName: 'Sarah', lastName: 'Miller', email: 'sarah@example.com', phone: '+1 234 567 8901', company: 'TechStart', avatar: '', tags: ['Newsletter'], channel: 'email', lifecycleStage: 'Hot Lead' },
  { id: 3, conversationId: 3, firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', phone: '+1 234 567 8902', company: 'DevCo', avatar: '', tags: ['Enterprise'], channel: 'webchat', lifecycleStage: 'Customer' },
  { id: 4, conversationId: 4, firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com', phone: '+1 234 567 8903', company: 'InnovateLabs', avatar: '', tags: ['Social'], channel: 'instagram', lifecycleStage: 'New Lead' },
  { id: 5, conversationId: 5, firstName: 'Tom', lastName: 'Bradley', email: 'tom@example.com', phone: '+1 234 567 8904', company: 'RetailPlus', avatar: '', tags: ['Returning'], channel: 'email', lifecycleStage: 'Customer' },
];

const ALL_TAGS_POOL = ['VIP', 'Priority', 'Newsletter', 'Enterprise', 'Social', 'Returning', 'Hot', 'Cold', 'Follow-up', 'Demo', 'Trial'];

let _contacts: Contact[] = [...INITIAL_CONTACTS];
const _listeners = new Set<() => void>();


// ─── Channel config ───────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, { icon: React.ReactNode; label: string; bg: string; fg: string }> = {
  whatsapp: { icon: <MessageCircle size={11} />, label: 'WhatsApp', bg: '#22c55e', fg: '#fff' },
  email: { icon: <Mail size={11} />, label: 'Email', bg: '#3b82f6', fg: '#fff' },
  webchat: { icon: <Globe size={11} />, label: 'Web Chat', bg: '#64748b', fg: '#fff' },
  instagram: { icon: <Instagram size={11} />, label: 'Instagram', bg: '#ec4899', fg: '#fff' },
  twitter: { icon: <AtSign size={11} />, label: 'Twitter', bg: '#38bdf8', fg: '#fff' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(first = '', last = '') {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
}

const GRADIENTS = [
  ['#818cf8', '#6366f1'], ['#f472b6', '#ec4899'],
  ['#fb923c', '#f97316'], ['#34d399', '#10b981'],
  ['#38bdf8', '#0ea5e9'],
];

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).catch(() => { });
        setOk(true); setTimeout(() => setOk(false), 1500);
      }}
      className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-[#f0f2f5] transition-all flex-shrink-0"
      title="Copy"
    >
      {ok
        ? <Check size={10} className="text-emerald-500" />
        : <Copy size={10} className="text-[#b8bec9]" />}
    </button>
  );
}

// ─── Single inline-editable row ───────────────────────────────────────────────
interface RowProps {
  fieldKey: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  placeholder?: string;
  type?: string;
  copyable?: boolean;
  warn?: boolean;
  activeField: string | null;
  onActivate: (k: string) => void;
  onDeactivate: () => void;
  onSave: (v: string) => Promise<void>;
}

function FieldRow({
  fieldKey, label, icon, value, placeholder = 'Not set', type = 'text',
  copyable, warn, activeField, onActivate, onDeactivate, onSave,
}: RowProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = activeField === fieldKey;
  const isBlocked = activeField !== null && !isActive;

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (isActive) setTimeout(() => inputRef.current?.focus(), 20); }, [isActive]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) { onDeactivate(); return; }
    setSaving(true); setErr('');
    try { await onSave(trimmed); onDeactivate(); }
    catch (e: any) { setErr(e?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className={`transition-opacity ${isBlocked ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'}`}>
      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-[#c8cdd8]">{icon}</span>}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#b0b8c8]">{label}</span>
        {warn && <span className="text-[9px] text-amber-400 font-semibold ml-1">duplicate</span>}
      </div>

      {isActive ? (
        /* Edit mode */
        <div className="space-y-1.5 pb-1">
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') { setDraft(value); onDeactivate(); }
            }}
            className={`w-full text-[13px] px-3 py-2 rounded-lg border focus:outline-none transition-all placeholder:text-[#c8cdd8] text-[#1c2030] ${warn
                ? 'border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-200'
                : 'border-[#e0e4ed] bg-[#fafbfc] focus:ring-2 focus:ring-[#1c2030]/15 focus:border-[#1c2030]'
              }`}
            placeholder={placeholder}
          />
          {err && <p className="text-[11px] text-red-500 px-0.5">{err}</p>}
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2030] text-white text-[11px] font-semibold rounded-lg hover:bg-[#2e3450] active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Save
            </button>
            <button
              onClick={() => { setDraft(value); onDeactivate(); }}
              className="flex items-center gap-1 px-3 py-1.5 text-[#7a8394] text-[11px] rounded-lg hover:bg-[#f0f2f7] transition-all"
            >
              <X size={10} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View mode — click anywhere on row to edit */
        <div
          className="group/row flex items-center justify-between gap-1 cursor-pointer py-0.5"
          onClick={() => onActivate(fieldKey)}
        >
          <span className={`text-[13px] leading-snug truncate ${value ? 'text-[#1c2030]' : 'text-[#c8cdd8] italic font-normal'}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
            {copyable && value && <CopyBtn value={value} />}
            <span className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-[#f0f2f5] transition-all">
              <Pencil size={10} className="text-[#b8bec9]" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tag search menu ──────────────────────────────────────────────────────────
function TagMenu({
  existingTags, allTags, onAdd, onClose,
}: { existingTags: string[]; allTags: string[]; onAdd: (t: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const results = allTags.filter(t => !existingTags?.includes(t) && t.toLowerCase().includes(q.toLowerCase()));
  const canCreate = q.trim() &&
    !allTags.some(t => t.toLowerCase() === q.trim().toLowerCase()) &&
    !existingTags.some(t => t.toLowerCase() === q.trim().toLowerCase());

  return (
    <div
      ref={ref}
      className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl border border-[#e4e8f0] z-50 overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(28,32,48,0.12)' }}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#f0f2f8]">
        <Search size={12} className="text-[#c0c6d4] flex-shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && canCreate) onAdd(q.trim());
            if (e.key === 'Enter' && results.length === 1) onAdd(results[0]);
          }}
          placeholder="Search or create…"
          className="flex-1 text-[12px] bg-transparent focus:outline-none text-[#1c2030] placeholder:text-[#c0c6d4]"
        />
      </div>

      {/* Results */}
      <div className="max-h-36 overflow-y-auto py-1">
        {results.map(tag => (
          <button
            key={tag}
            onClick={() => onAdd(tag)}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f6f7fb] text-left transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d0d5e0] flex-shrink-0" />
            <span className="text-[12px] text-[#1c2030]">{tag}</span>
          </button>
        ))}

        {canCreate && (
          <button
            onClick={() => onAdd(q.trim())}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f0f2f8] text-left transition-colors"
          >
            <Plus size={11} className="text-[#6b7491] flex-shrink-0" />
            <span className="text-[12px] text-[#6b7491]">
              Create tag <span className="font-semibold text-[#1c2030]">"{q.trim()}"</span>
            </span>
          </button>
        )}

        {results.length === 0 && !canCreate && (
          <p className="text-center py-5 text-[11px] text-[#c0c6d4]">No tags found</p>
        )}
      </div>
    </div>
  );
}

// ─── Merge Modal ──────────────────────────────────────────────────────────────
const MERGE_FIELDS = [
  { key: 'firstName' as keyof Contact, label: 'First Name' },
  { key: 'lastName' as keyof Contact, label: 'Last Name' },
  { key: 'email' as keyof Contact, label: 'Email' },
  { key: 'phone' as keyof Contact, label: 'Phone' },
  { key: 'company' as keyof Contact, label: 'Company' },
  { key: 'tags' as keyof Contact, label: 'Tags', isTags: true },
];

function MergeModal({
  current, duplicate, conflictField, onMerge, onCancel, loading,
}: {
  current: Contact; duplicate: Contact; conflictField: 'email' | 'phone';
  onMerge: (m: Contact) => void; onCancel: () => void; loading?: boolean;
}) {
  const [sel, setSel] = useState<Record<string, 'current' | 'duplicate'>>(() => {
    const r: Record<string, 'current' | 'duplicate'> = {};
    MERGE_FIELDS.forEach(f => { r[f.key as string] = 'current'; });
    return r;
  });
  const [mergeTags, setMergeTags] = useState(true);

  const doMerge = () => {
    const merged: Contact = { ...current };
    MERGE_FIELDS.forEach(f => {
      if (f.isTags) {
        merged.tags = mergeTags
          ? [...new Set([...(current.tags || []), ...(duplicate.tags || [])])]
          : sel[f.key as string] === 'current' ? current.tags : duplicate.tags;
      } else {
        (merged as any)[f.key] = sel[f.key as string] === 'current'
          ? (current as any)[f.key] : (duplicate as any)[f.key];
      }
    });
    onMerge(merged);
  };

  const renderVal = (c: Contact, f: typeof MERGE_FIELDS[0]) => {
    if (f.isTags) {
      const t = (c.tags || []);
      return t.length
        ? <div className="flex flex-wrap gap-1">{t.map(x => <span key={x} className="px-2 py-0.5 bg-[#f0f2f7] text-[#5a6280] text-[10px] rounded-md font-medium">{x}</span>)}</div>
        : <span className="text-[#c0c6d4] text-[11px] italic">No tags</span>;
    }
    const v = (c as any)[f.key];
    return v
      ? <span className="text-[12px] text-[#1c2030]">{v}</span>
      : <span className="text-[#c0c6d4] text-[11px] italic">—</span>;
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col border border-[#e4e8f0]"
        style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f2f8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1c2030' }}>
              <GitMerge size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[#1c2030] text-[13px]">Merge Contacts</h2>
              <p className="text-[11px] text-[#8a92a6] mt-0.5">Duplicate <b>{conflictField}</b> detected — choose values to keep</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[#f0f2f7] text-[#a0a8b8] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Column heads */}
        <div className="grid grid-cols-[88px_1fr_1fr] gap-2 px-5 py-3 bg-[#fafbfd] border-b border-[#f0f2f8]">
          <div />
          {[{
            c: current, g: [
              GRADIENTS[2][0], GRADIENTS[2][1]]
          }, { c: duplicate, g: [GRADIENTS[3][0], GRADIENTS[3][1]] }].map(({ c, g }, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
                {initials(c.firstName ?? '', c.lastName ?? '')}
              </div>
              <span className="text-[11px] font-semibold text-[#1c2030] truncate">{c.firstName} {c.lastName}</span>
            </div>
          ))}
        </div>

        {/* Fields */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#f6f7fb]">
          {MERGE_FIELDS.map(field => (
            <div key={field.key as string} className="grid grid-cols-[88px_1fr_1fr] gap-2 px-5 py-3 items-start">
              <div className="pt-1.5 space-y-0.5">
                <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#a8b0c0]">{field.label}</span>
                {field.key === conflictField && <p className="text-[9px] text-amber-500 font-semibold">⚠ conflict</p>}
              </div>
              {(['current', 'duplicate'] as const).map((side, idx) => {
                const c = side === 'current' ? current : duplicate;
                const chosen = field.isTags ? (!mergeTags && sel[field.key as string] === side) : sel[field.key as string] === side;
                const dimmed = field.isTags && mergeTags;
                return (
                  <div
                    key={side}
                    onClick={() => { if (field.isTags) setMergeTags(false); setSel(p => ({ ...p, [field.key as string]: side })); }}
                    className={`p-2.5 rounded-xl cursor-pointer border-2 transition-all select-none ${dimmed ? 'border-[#f0f2f8] opacity-40' :
                        chosen
                          ? (idx === 0 ? 'border-[#1c2030] bg-[#f6f7fb]' : 'border-amber-400 bg-amber-50')
                          : 'border-[#edf0f8] hover:border-[#d5d9e8]'
                      }`}
                  >
                    {renderVal(c, field)}
                  </div>
                );
              })}
              {field.isTags && (
                <div className="col-start-2 col-span-2 -mt-1">
                  <label
                    onClick={() => setMergeTags(true)}
                    className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border-2 transition-all ${mergeTags ? 'border-[#1c2030] bg-[#f6f7fb]' : 'border-[#edf0f8] hover:border-[#d5d9e8]'
                      }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${mergeTags ? 'border-[#1c2030] bg-[#1c2030]' : 'border-[#c8cdd8]'
                      }`}>
                      {mergeTags && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[11px] text-[#5a6280] font-medium">Merge all tags from both</span>
                    {mergeTags && (
                      <div className="ml-auto flex flex-wrap gap-1">
                        {[...new Set([...(current.tags || []), ...(duplicate.tags || [])])].map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-[#1c2030] text-white text-[9px] rounded-md font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#f0f2f8] bg-[#fafbfd] rounded-b-2xl">
          <p className="text-[11px] text-[#b0b8c8]">Duplicate contact will be removed.</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-[12px] text-[#5a6280] border border-[#dde2ee] rounded-lg hover:bg-white transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={doMerge}
              disabled={loading}
              className="px-4 py-2 text-[12px] text-white rounded-lg flex items-center gap-1.5 font-semibold transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
              style={{ background: '#1c2030' }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}
              Merge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ContactSidebar ───────────────────────────────────────────────────────────
function getDefault(conv: any): any {
  const parts = (conv?.name ?? '').split(' ');
  return {
    id: conv?.id, conversationId: conv?.id,
    firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '',
    email: '', phone: '', company: '', avatar: '',
    tags: [], avatar: conv?.avatar, channel: conv?.channel,
    name: conv?.name, lifecycleStage: conv?.tag,
  };
}

export function ContactSidebar({ selectedConversation , contactDetails }: { selectedConversation: Conversation, contactDetails: Contact | null }) {




  const [activeField, setActiveField] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Contact | null>(null);
  const [conflictField, setConflictField] = useState<'email' | 'phone'>('email');
  const [showMerge, setShowMerge] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  const {refreshContact} =   useInbox()

  useEffect(() => {
    console.log({ selectedConversation ,contactDetails})
  }, [selectedConversation,contactDetails])




  useEffect(() => {
      setActiveField(null); setDuplicate(null); setShowMerge(false); setShowTagMenu(false);

  }, [selectedConversation?.id]);

  const flash = () => { setFlashSaved(true); setTimeout(() => setFlashSaved(false), 1800); };

  const checkDup = useCallback((field: 'email' | 'phone', value: string) => {
      // Check for duplicates based on email or phone
  }, [selectedConversation?.id]);

  const persist = async (updates: Partial<Contact>) => {
    const merged = { ...contactDetails, ...updates };
    let saved = merged;
    try {
       saved = await contactsApi.updateContact(contactDetails?.id, {firstName: merged.firstName, lastName: merged.lastName,email: merged.email,phone: merged.phone,company: merged.company}) 
       refreshContact()
       } catch { }
    flash();
  };

  const handleMerge = async (merged: Contact) => {
    setMergeLoading(true);
    let saved = merged;
    try { saved = await contactsApi.MergeContacts(contactDetails?.id, duplicate!.id, merged); } catch { }
   
    setShowMerge(false); setDuplicate(null); setMergeLoading(false); flash();
  };

  const addTag = async (tag: string) => {
    if (contactDetails?.tags?.includes(tag)) return;
    await persist({ tags: [...(contactDetails?.tags || []), tag] });
    setShowTagMenu(false);
  };

  const removeTag = async (tag: string) => {
  await persist({
    tags: (contactDetails?.tags || []).filter(t => t !== tag),
  });
};

  const ch = CHANNEL_META['email'];
  const allTags = [...new Set([...ALL_TAGS_POOL, ..._contacts.flatMap(c => c.tags || [])])];

  const fp = { activeField, onActivate: setActiveField, onDeactivate: () => setActiveField(null) };

  return (
    <>
      <div
        className="hidden xl:flex flex-col w-[248px] bg-white border-l overflow-y-auto flex-shrink-0"
        style={{ borderColor: '#edf0f8', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {/* ── Hero area ── */}
        <div className="relative flex flex-col items-center pt-8 pb-5 px-5">
          {/* Saved toast */}
          {flashSaved && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg animate-pulse">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-semibold">Saved</span>
            </div>
          )}

          {/* Avatar */}
          <div className="relative mb-3.5">
            {contactDetails?.avatarUrl ? (
              <img
                src={contactDetails?.avatarUrl}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                alt=""
                className="w-[50px] h-[50px] rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-700"
              >
                {initials(contactDetails?.firstName ?? '', contactDetails?.lastName ?? '')}
              </div>
            )}
            
          </div>

          {/* Name */}
          <p className="font-semibold text-[15px] text-[#1c2030] text-center leading-tight">
            {[contactDetails?.firstName, contactDetails?.lastName].filter(Boolean).join(' ') || 'Unnamed'}
          </p>
          {/* Sub info */}
          <p className="text-[11px] text-[#b0b8c8] mt-1 text-center truncate w-full px-2">
            {contactDetails?.email || contactDetails?.phone || <span className="italic">No contact info</span>}
          </p>
        </div>

        {/* ── Duplicate banner ── */}
        {duplicate && (
          <div className="mx-4 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-700">
              <b>{duplicate.firstName} {duplicate.lastName}</b> has the same {conflictField}.{' '}
              <button className="underline font-bold" onClick={() => setShowMerge(true)}>Merge</button>
            </p>
          </div>
        )}

        {/* ── Fields ── */}
        <div className="px-4 pt-1 pb-3 space-y-3.5">
          <FieldRow {...fp} fieldKey="firstName" label="First Name" value={contactDetails?.firstName ?? ''} placeholder="First name" onSave={v => persist({ firstName: v })} />
          <FieldRow {...fp} fieldKey="lastName" label="Last Name" value={contactDetails?.lastName ?? ''} placeholder="Last name" onSave={v => persist({ lastName: v })} />
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[#f0f2f8]" />

        <div className="px-4 py-3 space-y-3.5">
          <FieldRow {...fp} fieldKey="email" label="Email" icon={<Mail size={10} />} value={contactDetails?.email ?? ''} placeholder="email@example.com" type="email" copyable warn={!!duplicate && conflictField === 'email'} onSave={async v => { checkDup('email', v); await persist({ email: v }); }} />
          <FieldRow {...fp} fieldKey="phone" label="Phone" icon={<Phone size={10} />} value={contactDetails?.phone ?? ''} placeholder="+1 234 567 8900" type="tel" copyable warn={!!duplicate && conflictField === 'phone'} onSave={async v => { checkDup('phone', v); await persist({ phone: v }); }} />
          <FieldRow {...fp} fieldKey="company" label="Company" icon={<Building2 size={10} />} value={contactDetails?.company ?? ''} placeholder="Company name" copyable onSave={v => persist({ company: v })} />
          {/* <FieldRow {...fp} fieldKey="avatar" label="Avatar URL" icon={<Globe size={10} />} value={contactDetails?.avatar ?? ''} placeholder="https://…" type="url" copyable onSave={v => persist({ avatar: v })} /> */}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[#f0f2f8]" />

        {/* ── Tags ── */}
        {/* <div className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <TagIcon size={10} className="text-[#c0c6d4]" />
            <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#b0b8c8]">Tags</span>
          </div>

          {contactDetails?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {contactDetails?.tags?.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 pl-2.5 pr-1.5 py-[5px] rounded-lg text-[11px] font-medium text-[#505878] bg-[#f0f2f8] group/chip"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-[#c0c6d4] hover:text-red-400 transition-colors leading-none"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowTagMenu(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${showTagMenu
                  ? 'bg-[#1c2030] text-white border-[#1c2030]'
                  : 'text-[#6b7491] border-[#dde2ee] bg-white hover:border-[#1c2030] hover:text-[#1c2030]'
                }`}
            >
              <Plus size={11} />
              Add tag
            </button>

            {showTagMenu && (
              <TagMenu
                existingTags={contactDetails?.tags}
                allTags={allTags}
                onAdd={addTag}
                onClose={() => setShowTagMenu(false)}
              />
            )}
          </div>
        </div> */}

        {/* ── Footer: channel ── */}
        <div className="mt-auto px-4 py-3 border-t border-[#f0f2f8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-[22px] h-[22px] rounded-md flex items-center justify-center"
                style={{ background: ch.bg }}
              >
                <span style={{ color: ch.fg }}>{ch.icon}</span>
              </div>
              <span className="text-[11px] text-[#8a92a6]">{ch.label}</span>
            </div>
            <span className="text-[10px] font-mono text-[#c0c6d4]">#{selectedConversation?.id}</span>
          </div>
        </div>
      </div>

      {/* Merge modal */}
      {showMerge && duplicate && (
        <MergeModal
          current={contactDetails}
          duplicate={duplicate}
          conflictField={conflictField}
          onMerge={handleMerge}
          onCancel={() => setShowMerge(false)}
          loading={mergeLoading}
        />
      )}
    </>
  );
}