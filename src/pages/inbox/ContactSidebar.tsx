import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Pencil, X, Check, GitMerge, Mail, Phone, Building2,
  Plus, AlertTriangle, ChevronDown, Tag as TagIcon, User,
  CheckCircle2,
} from 'lucide-react';
import { channelConfig } from './data';
import type { Conversation, Contact } from './types';

// ─── Lifecycle config ────────────────────────────────────────────────────────

const LIFECYCLE_STAGES = ['New Lead', 'Hot Lead', 'Payment', 'Customer'];

const LIFECYCLE_COLORS: Record<string, { bg: string; text: string }> = {
  'New Lead': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'Hot Lead': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Payment':  { bg: 'bg-green-100',  text: 'text-green-700'  },
  'Customer': { bg: 'bg-purple-100', text: 'text-purple-700' },
};

// ─── Module-level contacts store ─────────────────────────────────────────────

const INITIAL_CONTACTS: Contact[] = [
  { id: 1, conversationId: 1, name: 'Jay Kanani',   email: 'jay@example.com',   phone: '+1 234 567 8900', company: 'Acme Corp',    lifecycleStage: 'New Lead', tags: ['VIP', 'Priority'], avatar: 'JK', channel: 'whatsapp'    },
  { id: 2, conversationId: 2, name: 'Sarah Miller', email: 'sarah@example.com', phone: '+1 234 567 8901', company: 'TechStart',    lifecycleStage: 'Hot Lead', tags: ['Newsletter'],      avatar: 'SM', channel: 'email'       },
  { id: 3, conversationId: 3, name: 'Mike Johnson', email: 'mike@example.com',  phone: '+1 234 567 8902', company: 'DevCo',        lifecycleStage: 'Customer', tags: ['Enterprise'],      avatar: 'MJ', channel: 'websitechat' },
  { id: 4, conversationId: 4, name: 'Priya Sharma', email: 'priya@example.com', phone: '+1 234 567 8903', company: 'InnovateLabs', lifecycleStage: 'New Lead', tags: ['Social'],          avatar: 'PS', channel: 'instagram'   },
  { id: 5, conversationId: 5, name: 'Tom Bradley',  email: 'tom@example.com',   phone: '+1 234 567 8904', company: 'RetailPlus',   lifecycleStage: 'Customer', tags: ['Returning'],       avatar: 'TB', channel: 'email'       },
];

let _contacts: Contact[] = [...INITIAL_CONTACTS];
const _listeners = new Set<() => void>();

function useContactsStore() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const update = () => forceUpdate(n => n + 1);
    _listeners.add(update);
    return () => { _listeners.delete(update); };
  }, []);
  const updateContacts = useCallback((contacts: Contact[]) => {
    _contacts = contacts;
    _listeners.forEach(l => l());
  }, []);
  return { contacts: _contacts, updateContacts };
}

// ─── Merge Modal ─────────────────────────────────────────────────────────────

interface MergeField {
  key: keyof Contact;
  label: string;
  isTags?: boolean;
}

const MERGE_FIELDS: MergeField[] = [
  { key: 'name',           label: 'Name'            },
  { key: 'email',          label: 'Email'           },
  { key: 'phone',          label: 'Phone'           },
  { key: 'company',        label: 'Company'         },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'tags',           label: 'Tags', isTags: true },
];

interface MergeModalProps {
  current: Contact;
  duplicate: Contact;
  conflictField: 'email' | 'phone';
  onMerge: (merged: Contact) => void;
  onCancel: () => void;
}

function MergeModal({ current, duplicate, conflictField, onMerge, onCancel }: MergeModalProps) {
  const [selections, setSelections] = useState<Record<string, 'current' | 'duplicate'>>(() => {
    const init: Record<string, 'current' | 'duplicate'> = {};
    MERGE_FIELDS.forEach(f => { init[f.key] = 'current'; });
    return init;
  });
  const [mergeTags, setMergeTags] = useState(true);

  const handleMerge = () => {
    const merged: Contact = { ...current };
    MERGE_FIELDS.forEach(f => {
      if (f.isTags) {
        merged.tags = mergeTags
          ? [...new Set([...(current.tags || []), ...(duplicate.tags || [])])]
          : (selections[f.key] === 'current' ? current.tags : duplicate.tags);
      } else {
        (merged as any)[f.key] = selections[f.key] === 'current'
          ? (current as any)[f.key]
          : (duplicate as any)[f.key];
      }
    });
    onMerge(merged);
  };

  const renderValue = (contact: Contact, field: MergeField) => {
    if (field.isTags) {
      const tags = contact.tags || [];
      return tags.length > 0
        ? (
          <div className="flex flex-wrap gap-1">
            {tags.map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{t}</span>
            ))}
          </div>
        )
        : <span className="text-gray-400 text-xs italic">No tags</span>;
    }
    const val = (contact as any)[field.key];
    if (!val) return <span className="text-gray-400 text-xs italic">—</span>;
    if (field.key === 'lifecycleStage') {
      const lc = LIFECYCLE_COLORS[val] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lc.bg} ${lc.text}`}>{val}</span>;
    }
    return <span className="text-sm text-gray-800 break-all">{val}</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <GitMerge size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Merge Contacts</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Duplicate {conflictField} detected — choose which values to keep
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_1fr] gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div />
          <div className="text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Current Contact</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{current.avatar}</div>
              <span className="text-sm font-semibold text-gray-800 truncate">{current.name}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Duplicate Contact</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{duplicate.avatar}</div>
              <span className="text-sm font-semibold text-gray-800 truncate">{duplicate.name}</span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {MERGE_FIELDS.map(field => {
            const currentVal = (current as any)[field.key];
            const dupVal = (duplicate as any)[field.key];
            const isSame = JSON.stringify(currentVal) === JSON.stringify(dupVal);
            const isConflict = field.key === conflictField;

            return (
              <div key={field.key} className="grid grid-cols-[120px_1fr_1fr] gap-3 px-6 py-3">
                <div className="flex flex-col justify-center gap-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{field.label}</span>
                  {isSame && <span className="text-[10px] text-gray-400 italic">identical</span>}
                  {isConflict && <span className="text-[10px] text-red-500 font-medium">⚠ conflict</span>}
                </div>

                {/* Current value */}
                <div
                  onClick={() => {
                    if (field.isTags) setMergeTags(false);
                    setSelections(prev => ({ ...prev, [field.key]: 'current' }));
                  }}
                  className={`flex items-start gap-2 p-2.5 rounded-xl cursor-pointer border-2 transition-all ${
                    field.isTags && mergeTags
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : selections[field.key] === 'current'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    readOnly
                    checked={field.isTags ? (!mergeTags && selections[field.key] === 'current') : selections[field.key] === 'current'}
                    className="accent-blue-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">{renderValue(current, field)}</div>
                </div>

                {/* Duplicate value */}
                <div
                  onClick={() => {
                    if (field.isTags) setMergeTags(false);
                    setSelections(prev => ({ ...prev, [field.key]: 'duplicate' }));
                  }}
                  className={`flex items-start gap-2 p-2.5 rounded-xl cursor-pointer border-2 transition-all ${
                    field.isTags && mergeTags
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : selections[field.key] === 'duplicate'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    readOnly
                    checked={field.isTags ? (!mergeTags && selections[field.key] === 'duplicate') : selections[field.key] === 'duplicate'}
                    className="accent-orange-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">{renderValue(duplicate, field)}</div>
                </div>

                {/* Tags: merge-both option */}
                {field.isTags && (
                  <div className="col-start-2 col-span-2 -mt-1">
                    <label
                      className={`flex items-center gap-2 cursor-pointer px-2.5 py-2 rounded-xl border-2 transition-all ${
                        mergeTags ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setMergeTags(true)}
                    >
                      <input
                        type="radio"
                        readOnly
                        checked={mergeTags}
                        className="accent-violet-600 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-700 font-medium">Merge tags from both contacts</span>
                      {mergeTags && (
                        <div className="ml-auto flex flex-wrap gap-1">
                          {[...new Set([...(current.tags || []), ...(duplicate.tags || [])])].map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500">The duplicate contact will be removed after merging.</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              className="px-4 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 font-medium"
            >
              <GitMerge size={15} />
              Merge Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ContactSidebar ──────────────────────────────────────────────────────

interface ContactSidebarProps {
  selectedConversation: Conversation;
}

function getDefaultContact(conv: Conversation): Contact {
  return {
    id: conv.id,
    conversationId: conv.id,
    name: conv.name,
    email: '',
    phone: '',
    company: '',
    lifecycleStage: conv.tag,
    tags: [],
    avatar: conv.avatar,
    channel: conv.channel,
  };
}

export function ContactSidebar({ selectedConversation }: ContactSidebarProps) {
  const ch = channelConfig[selectedConversation.channel] ?? channelConfig['email'];
  const { contacts, updateContacts } = useContactsStore();

  const getContact = useCallback(() =>
    _contacts.find(c => c.conversationId === selectedConversation.id) ?? getDefaultContact(selectedConversation),
  [selectedConversation]);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Contact>(getContact);
  const [duplicate, setDuplicate] = useState<Contact | null>(null);
  const [conflictField, setConflictField] = useState<'email' | 'phone'>('email');
  const [showMerge, setShowMerge] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const lifecycleRef = useRef<HTMLDivElement>(null);

  // Reset when conversation changes
  useEffect(() => {
    setForm(getContact());
    setIsEditing(false);
    setDuplicate(null);
    setShowMerge(false);
    setShowTagInput(false);
    setNewTag('');
  }, [selectedConversation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close lifecycle dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (lifecycleRef.current && !lifecycleRef.current.contains(e.target as Node)) {
        setShowLifecycle(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const checkDuplicate = useCallback((field: 'email' | 'phone', value: string) => {
    if (!value.trim()) { setDuplicate(null); return; }
    const dup = _contacts.find(c =>
      c.conversationId !== selectedConversation.id &&
      c[field]?.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (dup) {
      setDuplicate(dup);
      setConflictField(field);
    } else {
      setDuplicate(null);
    }
  }, [selectedConversation.id]);

  const handleSave = () => {
    if (duplicate) {
      setShowMerge(true);
      return;
    }
    const exists = _contacts.find(c => c.conversationId === selectedConversation.id);
    const updated = exists
      ? _contacts.map(c => c.conversationId === selectedConversation.id ? form : c)
      : [..._contacts, form];
    updateContacts(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleMerge = (merged: Contact) => {
    const updated = _contacts
      .filter(c => c.conversationId !== duplicate!.conversationId)
      .map(c => c.conversationId === selectedConversation.id
        ? { ...merged, conversationId: selectedConversation.id, id: c.id }
        : c
      );
    updateContacts(updated);
    setForm({ ...merged, conversationId: selectedConversation.id });
    setShowMerge(false);
    setDuplicate(null);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCancel = () => {
    setForm(getContact());
    setIsEditing(false);
    setDuplicate(null);
    setShowTagInput(false);
    setNewTag('');
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const contact = getContact();
  const lc = LIFECYCLE_COLORS[contact.lifecycleStage] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  const formLc = LIFECYCLE_COLORS[form.lifecycleStage] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <>
      <div className="hidden xl:flex flex-col w-60 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Details</span>
          {!isEditing ? (
            <button
              onClick={() => { setForm(getContact()); setIsEditing(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil size={13} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCancel}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cancel"
              >
                <X size={15} />
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  duplicate
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={duplicate ? 'Duplicate found — click to merge' : 'Save changes'}
              >
                {duplicate ? <><GitMerge size={13} />Merge</> : <><Check size={13} />Save</>}
              </button>
            </div>
          )}
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <CheckCircle2 size={13} className="flex-shrink-0" />
            Contact saved successfully
          </div>
        )}

        {/* Duplicate warning */}
        {isEditing && duplicate && (
          <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-700">Duplicate {conflictField} found</p>
              <p className="text-xs text-orange-600 mt-0.5">
                <span className="font-medium">{duplicate.name}</span> has the same {conflictField}.
                Click <span className="font-semibold">Merge</span> to combine both contacts.
              </p>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center pt-5 pb-4 px-5">
          <div className="relative mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
              {contact.avatar}
            </div>
            {/* <span className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white ${ch.bg}`}>
              <span className="scale-150">{ch.icon}</span>
            </span> */}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="text-center font-semibold text-lg w-full border-b-2 border-blue-400 focus:outline-none bg-transparent pb-0.5 mb-1"
            />
          ) : (
            <h3 className="font-semibold text-lg text-center">{contact.name}</h3>
          )}

          <p className="text-xs text-gray-400 mb-2">Contact</p>
          {/* <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${ch.bg}`}>
            {ch.icon}{ch.label}
          </span> */}
        </div>

        {/* Fields */}
        <div className="px-5 pb-6 space-y-4">

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              <Mail size={11} />Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                onBlur={e => checkDuplicate('email', e.target.value)}
                placeholder="email@example.com"
                className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  duplicate && conflictField === 'email'
                    ? 'border-orange-400 focus:ring-orange-300 bg-orange-50'
                    : 'border-gray-300 focus:ring-blue-400'
                }`}
              />
            ) : (
              <p className="text-sm text-gray-800">{contact.email || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              <Phone size={11} />Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                onBlur={e => checkDuplicate('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  duplicate && conflictField === 'phone'
                    ? 'border-orange-400 focus:ring-orange-300 bg-orange-50'
                    : 'border-gray-300 focus:ring-blue-400'
                }`}
              />
            ) : (
              <p className="text-sm text-gray-800">{contact.phone || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              <Building2 size={11} />Company
            </label>
            {isEditing ? (
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company name"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-sm text-gray-800">{contact.company || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>

          {/* Lifecycle Stage */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              <User size={11} />Lifecycle Stage
            </label>
            {isEditing ? (
              <div className="relative" ref={lifecycleRef}>
                <button
                  type="button"
                  onClick={() => setShowLifecycle(!showLifecycle)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formLc.bg} ${formLc.text}`}>
                    {form.lifecycleStage || 'Select stage'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${showLifecycle ? 'rotate-180' : ''}`} />
                </button>
                {showLifecycle && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {LIFECYCLE_STAGES.map(stage => {
                      const slc = LIFECYCLE_COLORS[stage] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                      return (
                        <button
                          key={stage}
                          onClick={() => { setForm(prev => ({ ...prev, lifecycleStage: stage })); setShowLifecycle(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors ${form.lifecycleStage === stage ? 'bg-gray-50' : ''}`}
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${slc.bg} ${slc.text}`}>{stage}</span>
                          {form.lifecycleStage === stage && <Check size={13} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${lc.bg} ${lc.text}`}>
                {contact.lifecycleStage}
              </span>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              <TagIcon size={11} />Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(isEditing ? form.tags : contact.tags).map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    isEditing ? 'bg-gray-100 text-gray-700 pr-1' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tag}
                  {isEditing && (
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}

              {isEditing && (
                showTagInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={tagInputRef}
                      autoFocus
                      type="text"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                        if (e.key === 'Escape') { setShowTagInput(false); setNewTag(''); }
                      }}
                      onBlur={addTag}
                      placeholder="Tag name"
                      className="w-24 text-xs px-2 py-1 border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                  >
                    <Plus size={11} />Add tag
                  </button>
                )
              )}

              {!isEditing && contact.tags.length === 0 && (
                <span className="text-xs text-gray-400 italic">No tags</span>
              )}
            </div>
          </div>

          {/* Conversations count (view only) */}
          {!isEditing && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Conversation ID</span>
                <span className="font-mono text-gray-700">#{selectedConversation.id}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Merge Modal */}
      {showMerge && duplicate && (
        <MergeModal
          current={form}
          duplicate={duplicate}
          conflictField={conflictField}
          onMerge={handleMerge}
          onCancel={() => setShowMerge(false)}
        />
      )}
    </>
  );
}
