import { useState, useEffect, useRef } from 'react';
import {
    X, Search, ChevronRight, Check, Send, AlertCircle,
    Image as ImageIcon, Video, FileText, Phone, ExternalLink,
    ChevronLeft, ChevronDown, Play, Reply, MapPin, Package,
    ShoppingCart, Clock, ArrowRight
} from 'lucide-react';
import { ChannelApi } from '../../lib/channelApi';
import { useInbox } from '../../context/InboxContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonType =
    | { kind: 'quick_reply'; label: string }
    | { kind: 'url'; label: string; url: string }
    | { kind: 'phone'; label: string; phone: string }
    | { kind: 'copy_code'; label: string; code: string };

type CarouselCard = {
    image?: string;
    title?: string;
    body: string;
    buttons?: ButtonType[];
};

type TemplateType = 'text' | 'image' | 'video' | 'document' | 'location' | 'carousel' | 'product' | 'limited_time';

export type Template = {
    id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';
    language: string;
    type: TemplateType;
    header?: string;
    body: string;
    footer?: string;
    buttons?: ButtonType[];
    cards?: CarouselCard[];
    mediaUrl?: string;
    expiryLabel?: string;
    expiryTime?: string;
    couponCode?: string;
    variables: { key: string; label: string; description?: string; defaultValue?: string }[];
};

interface TemplateModalProps {
    open: boolean;
    onClose: () => void;
    onUse: (template: Template) => void;
    contextValues?: Record<string, string>;
}

// ─── API Response Types ───────────────────────────────────────────────────────

type ApiTemplateComponent = {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
    text?: string;
    buttons?: { type: string; text: string; url?: string; phone_number?: string }[];
};

type ApiTemplate = {
    id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SERVICE';
    language: string;
    status: string;
    components: ApiTemplateComponent[];
    variables?: string[] | { key: string; label: string; description?: string; defaultValue?: string }[];
};

// ─── API Response Mapper ──────────────────────────────────────────────────────

function mapApiTemplate(api: ApiTemplate): Template {
    const get = (type: ApiTemplateComponent['type']) =>
        api.components.find(c => c.type === type);

    const headerComp = get('HEADER');
    const bodyComp   = get('BODY');
    const footerComp = get('FOOTER');
    const btnComp    = get('BUTTONS');

    const formatMap: Record<string, TemplateType> = {
        IMAGE: 'image', VIDEO: 'video', DOCUMENT: 'document', LOCATION: 'location',
    };
    const type: TemplateType = headerComp?.format
        ? (formatMap[headerComp.format] ?? 'text')
        : 'text';

    const buttons: ButtonType[] = (btnComp?.buttons ?? []).map(b => {
        if (b.type === 'QUICK_REPLY')   return { kind: 'quick_reply', label: b.text };
        if (b.type === 'URL')           return { kind: 'url', label: b.text, url: b.url ?? '' };
        if (b.type === 'PHONE_NUMBER')  return { kind: 'phone', label: b.text, phone: b.phone_number ?? '' };
        return { kind: 'quick_reply', label: b.text };
    });

    const bodyText = bodyComp?.text ?? '';
    const keys = [...new Set([...bodyText.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
    const variables = Array.isArray(api.variables)
        ? api.variables.map((entry: any) =>
            typeof entry === 'string'
                ? { key: entry, label: entry }
                : entry,
          )
        : keys.map(k => ({ key: k, label: k }));

    return {
        id:       api.id,
        name:     api.name, //.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: api.category,
        language: api.language,
        type,
        header:   headerComp?.format === 'TEXT' ? headerComp.text : undefined,
        body:     bodyText,
        footer:   footerComp?.text,
        buttons:  buttons.length > 0 ? buttons : undefined,
        variables,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderTpl(text: string, vals: Record<string, string>) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] || `{{${k}}}`);
}
function extractKeys(text: string): string[] {
    return [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
}
function allKeys(t: Template): string[] {
    const srcs = [t.header, t.body, t.footer, t.couponCode,
    ...(t.cards?.map(c => c.body) || [])].filter(Boolean) as string[];
    return [...new Set(srcs.flatMap(s => extractKeys(s)))];
}

const CAT_COLOR: Record<string, string> = {
    MARKETING:      'bg-orange-50 text-orange-600 border-orange-200',
    UTILITY:        'bg-blue-50 text-blue-600 border-blue-200',
    AUTHENTICATION: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    SERVICE:        'bg-violet-50 text-violet-600 border-violet-200',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
    text:         <FileText size={13} />,
    image:        <ImageIcon size={13} />,
    video:        <Video size={13} />,
    document:     <FileText size={13} />,
    location:     <MapPin size={13} />,
    carousel:     <Package size={13} />,
    product:      <ShoppingCart size={13} />,
    limited_time: <Clock size={13} />,
};

// ─── WhatsApp Button ──────────────────────────────────────────────────────────

function WaBtn({ btn, divider = true }: { btn: ButtonType; divider?: boolean }) {
    const cls = `flex items-center justify-center gap-1.5 w-full py-2 text-[#00a884] text-[12.5px] font-medium ${divider ? 'border-t border-[#e9edef]' : ''}`;
    if (btn.kind === 'quick_reply') return <button className={cls}><Reply size={12} />{btn.label}</button>;
    if (btn.kind === 'url')         return <button className={cls}><ExternalLink size={12} />{btn.label}</button>;
    if (btn.kind === 'phone')       return <button className={cls}><Phone size={12} />{btn.label}</button>;
    if (btn.kind === 'copy_code')   return <button className={cls}><FileText size={12} />{btn.label}</button>;
    return null;
}

// ─── WhatsApp Preview Bubble ──────────────────────────────────────────────────

function WhatsAppPreview({ template, values }: { template: Template; values: Record<string, string> }) {
    const [cardIdx, setCardIdx] = useState(0);
    const r = (s?: string) => s ? renderTpl(s, values) : '';

    return (
        <div
            className="rounded-2xl overflow-hidden shadow-inner"
            style={{
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23e5ddd5'/%3E%3Cpath d='M0 30 Q15 15 30 30 Q45 45 60 30' stroke='%23d4c5b4' stroke-width='1' fill='none' opacity='0.4'/%3E%3C/svg%3E")`,
                minHeight: 280,
            }}
        >
            {/* WA top bar */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#128c7e' }}>
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#075e54' }}>
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">B</div>
                </div>
                <div className="flex-1">
                    <p className="text-white text-[12px] font-semibold leading-none">Business</p>
                    <p className="text-white/70 text-[9px] mt-0.5">online</p>
                </div>
                <Video size={14} className="text-white/80" />
                <Phone size={13} className="text-white/80" />
            </div>

            {/* Chat body */}
            <div className="px-3 py-4 flex flex-col gap-1.5">

                {/* CAROUSEL */}
                {template.type === 'carousel' && template.cards && (
                    <>
                        <div className="max-w-[85%] bg-white rounded-[14px] rounded-bl-[4px] shadow-sm px-3 py-2 mb-1">
                            <p className="text-[12.5px] text-[#303030] leading-snug whitespace-pre-wrap">{r(template.body)}</p>
                            <p className="text-[10px] text-[#8a8a8a] text-right mt-1">now ✓✓</p>
                        </div>
                        <div className="bg-white rounded-[14px] overflow-hidden shadow-sm" style={{ width: 230 }}>
                            <div className="overflow-hidden">
                                <div
                                    className="flex transition-transform duration-300 ease-in-out"
                                    style={{ transform: `translateX(-${cardIdx * 230}px)`, width: `${template.cards.length * 230}px` }}
                                >
                                    {template.cards.map((card, i) => (
                                        <div key={i} style={{ width: 230, flexShrink: 0 }}>
                                            {card.image && <img src={card.image} alt="" className="w-full object-cover" style={{ height: 130 }} />}
                                            <div className="px-3 py-2">
                                                {card.title && <p className="text-[12px] font-bold text-[#303030]">{card.title}</p>}
                                                <p className="text-[11.5px] text-[#606060] mt-0.5 leading-snug">{card.body}</p>
                                            </div>
                                            {card.buttons?.map((b, bi) => <WaBtn key={bi} btn={b} />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-3 py-2 border-t border-[#e9edef]">
                                <button onClick={() => setCardIdx(i => Math.max(0, i - 1))} disabled={cardIdx === 0}
                                    className="p-0.5 disabled:opacity-30 text-[#8a8a8a] hover:text-[#303030]">
                                    <ChevronLeft size={13} />
                                </button>
                                <div className="flex gap-1">
                                    {template.cards.map((_, i) => (
                                        <div key={i} onClick={() => setCardIdx(i)}
                                            className={`rounded-full cursor-pointer transition-all ${i === cardIdx ? 'w-4 h-1.5 bg-[#00a884]' : 'w-1.5 h-1.5 bg-gray-300'}`} />
                                    ))}
                                </div>
                                <button onClick={() => setCardIdx(i => Math.min(template.cards!.length - 1, i + 1))}
                                    disabled={cardIdx === template.cards.length - 1}
                                    className="p-0.5 disabled:opacity-30 text-[#8a8a8a] hover:text-[#303030]">
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ALL OTHER TYPES */}
                {template.type !== 'carousel' && (
                    <div className="max-w-[88%] bg-white rounded-[14px] rounded-bl-[4px] shadow-sm overflow-hidden">

                        {/* IMAGE */}
                        {template.type === 'image' && (
                            template.mediaUrl
                                ? <img src={template.mediaUrl} alt="" className="w-full object-cover" style={{ maxHeight: 170 }} />
                                : <div className="w-full h-32 bg-[#f0f4f8] flex flex-col items-center justify-center gap-1">
                                    <ImageIcon size={24} className="text-gray-400" /><span className="text-[10px] text-gray-400">Image</span>
                                </div>
                        )}

                        {/* VIDEO */}
                        {template.type === 'video' && (
                            <div className="relative cursor-pointer">
                                {template.mediaUrl
                                    ? <img src={template.mediaUrl} alt="" className="w-full object-cover" style={{ maxHeight: 170 }} />
                                    : <div className="w-full h-32 bg-gray-900 flex items-center justify-center"><Video size={24} className="text-white/50" /></div>
                                }
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center">
                                        <Play size={18} className="text-white ml-0.5" fill="white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">0:42</div>
                            </div>
                        )}

                        {/* DOCUMENT */}
                        {template.type === 'document' && (
                            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f0f4f8] border-b border-[#e9edef]">
                                <div className="w-9 h-11 bg-white rounded border border-gray-200 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 shadow-sm">
                                    <FileText size={16} className="text-[#e53935]" />
                                    <span className="text-[8px] font-bold text-[#e53935]">PDF</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11.5px] font-semibold text-[#303030] truncate">
                                        {template.header ? r(template.header) : 'document.pdf'}
                                    </p>
                                    <p className="text-[10px] text-[#8a8a8a]">PDF · 124 KB · 1 page</p>
                                </div>
                                <ArrowRight size={13} className="text-[#8a8a8a] flex-shrink-0" />
                            </div>
                        )}

                        {/* LOCATION */}
                        {template.type === 'location' && (
                            <div className="relative" style={{ height: 110 }}>
                                <svg viewBox="0 0 230 110" className="w-full h-full" style={{ background: '#aad3b3' }}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <line key={`h${i}`} x1="0" y1={i * 20} x2="230" y2={i * 20} stroke="#8fc99a" strokeWidth="0.5" />
                                    ))}
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="110" stroke="#8fc99a" strokeWidth="0.5" />
                                    ))}
                                    <rect x="40" y="20" width="60" height="12" rx="2" fill="#f5f5f5" />
                                    <rect x="130" y="50" width="40" height="12" rx="2" fill="#f5f5f5" />
                                    <rect x="60" y="70" width="80" height="12" rx="2" fill="#f5f5f5" />
                                    <circle cx="115" cy="52" r="12" fill="white" opacity="0.8" />
                                    <circle cx="115" cy="52" r="6" fill="#ea4335" />
                                    <circle cx="115" cy="65" r="2" fill="#ea4335" opacity="0.4" />
                                </svg>
                            </div>
                        )}

                        {/* LIMITED TIME — timer bar */}
                        {template.type === 'limited_time' && template.expiryTime && (
                            <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(90deg, #ff6b35, #f7c59f)' }}>
                                <Clock size={13} className="text-white flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-white text-[9px] font-medium leading-none">{template.expiryLabel || 'Offer expires in'}</p>
                                    <p className="text-white font-bold text-[15px] font-mono leading-tight">{template.expiryTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/70 text-[8px]">hrs · min · sec</p>
                                </div>
                            </div>
                        )}

                        {/* Text header */}
                        {template.header && !['image', 'video', 'document', 'location'].includes(template.type) && (
                            <div className="px-3 pt-2.5 pb-0.5">
                                <p className="text-[13px] font-bold text-[#303030] leading-snug">{r(template.header)}</p>
                            </div>
                        )}

                        {/* Body */}
                        <div className={`px-3 ${template.header && !['image', 'video', 'document', 'location'].includes(template.type) ? 'pt-1' : 'pt-2.5'} pb-1`}>
                            <p className="text-[12.5px] text-[#303030] leading-snug whitespace-pre-wrap">{r(template.body)}</p>
                        </div>

                        {/* Coupon code */}
                        {template.type === 'limited_time' && template.couponCode && (
                            <div className="mx-3 mb-2 mt-1 border-2 border-dashed border-[#ff6b35]/40 rounded-lg px-3 py-1.5 bg-orange-50 flex items-center justify-between">
                                <span className="text-[13px] font-bold text-[#ff6b35] font-mono tracking-widest">{r(template.couponCode)}</span>
                                <span className="text-[9px] text-[#ff6b35] bg-orange-100 px-1.5 py-0.5 rounded-full">TAP TO COPY</span>
                            </div>
                        )}

                        {/* Footer */}
                        {template.footer && (
                            <div className="px-3 pb-1.5">
                                <p className="text-[10.5px] text-[#8a8a8a] leading-snug">{r(template.footer)}</p>
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="px-3 pb-2 flex justify-end">
                            <span className="text-[10px] text-[#8a8a8a]">now ✓✓</span>
                        </div>

                        {/* Buttons */}
                        {template.buttons?.map((btn, i) => <WaBtn key={i} btn={btn} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function TemplateModal({ open, onClose, onUse, contextValues = {} }: TemplateModalProps) {
    const [query, setQuery]           = useState('');
    const [selected, setSelected]     = useState<Template | null>(null);
    const [varValues, setVarValues]   = useState<Record<string, string>>({});
    const [step, setStep]             = useState<'list' | 'fill'>('list');
    const [activeTab, setActiveTab]   = useState<'all' | Template['category']>('all');
    const [templates, setTemplates]   = useState<Template[]>([]);
    const [originalTemplates, setOriginalTemplates]   = useState<Template[]>([]);
    const [loading, setLoading]       = useState(false);
    const searchRef                   = useRef<HTMLInputElement>(null);

    const { selectedChannel } = useInbox();

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelected(null);
            setVarValues({});
            setStep('list');
            setActiveTab('all');
            setTimeout(() => searchRef.current?.focus(), 80);
        }
    }, [open]);

    const cats: Template['category'][] = ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE'];

    // Fetch templates from API — re-runs on query/tab change with debounce on search
    const fetchTemplates = (searchQuery: string, tab: typeof activeTab) => {
        const params: Record<string, string> = { status: 'APPROVED' };
        if (tab !== 'all')          params.category = tab;
        if (searchQuery.trim())     params.search   = searchQuery.trim();

        setLoading(true);
        ChannelApi.listWhatsAppTemplates(selectedChannel?.id, params)
            .then((res: ApiTemplate[]) => {
                setOriginalTemplates(res);
                setTemplates(res.map(mapApiTemplate));
            })
            .catch(() => setTemplates([]))
            .finally(() => setLoading(false));
    };

    // Debounce search input; fire immediately on tab change
    useEffect(() => {
        if (!open) return;
        const delay = query ? 300 : 0;
        const timer = setTimeout(() => fetchTemplates(query, activeTab), delay);
        return () => clearTimeout(timer);
    }, [open, selectedChannel, query, activeTab]);

    const pick = (t: Template) => {
        setSelected(t);
        const init: Record<string, string> = {};
        allKeys(t).forEach(k => {
            const def = t.variables.find(v => v.key === k);
            init[k] = contextValues[k] ?? def?.defaultValue ?? '';
        });
        setVarValues(init);
        setStep('fill');
    };

    const missing = selected ? allKeys(selected).filter(k => !varValues[k]?.trim()) : [];

    const handleUse = () => {
        if (!selected || missing.length > 0) return;
        onUse({...(originalTemplates.find(t => t.id === selected.id) || {}), name: selected?.name, language: selected.language, variables: varValues});
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative w-full sm:max-w-4xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{ height: 'min(94vh, 720px)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#128c7e' }}>
                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {step === 'list' ? 'WhatsApp Message Templates' : (
                                <span className="flex items-center gap-1.5">
                                    <button onClick={() => setStep('list')} className="text-gray-400 hover:text-gray-700 transition-colors">
                                        <ChevronLeft size={16} />
                                    </button>
                                    {selected?.name}
                                </span>
                            )}
                        </h2>
                        <p className="text-[11px] text-gray-400">
                            {step === 'list'
                                ? `${loading ? '…' : templates.length} approved templates`
                                : `${selected?.category} · ${selected?.language}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* LIST STEP */}
                {step === 'list' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-4 pt-3 pb-2.5 flex-shrink-0 space-y-2 border-b border-gray-50">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                <Search size={13} className="text-gray-400 flex-shrink-0" />
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search templates by name or type…"
                                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')}>
                                        <X size={11} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                                {(['all', ...cats] as const).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveTab(c as any)}
                                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                            activeTab === c
                                                ? 'text-white border-transparent'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                        style={activeTab === c ? { background: '#128c7e', borderColor: '#128c7e' } : {}}
                                    >
                                        {c === 'all' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {loading ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#128c7e] rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Loading templates…</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <Search size={28} className="mb-2 opacity-30" />
                                    <p className="text-sm">No templates found</p>
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="mt-2 text-[12px] text-[#128c7e] hover:underline"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {templates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => pick(template)}
                                            className="text-left border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#e8f5e9] flex items-center justify-center text-gray-500 group-hover:text-[#128c7e] transition-colors flex-shrink-0">
                                                    {TYPE_ICON[template.type]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                        <span className="text-[12.5px] font-semibold text-gray-800">{template.name}</span>
                                                        <span className={`text-[8.5px] font-bold border px-1.5 py-0.5 rounded-full uppercase tracking-wide ${CAT_COLOR[template.category]}`}>
                                                            {template.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 truncate leading-snug">
                                                        {template.body?.replace(/\{\{[^}]+\}\}/g, '…')}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                        <span className="text-[10px] text-gray-500 capitalize bg-gray-100 px-1.5 py-0.5 rounded-md">{template.type}</span>
                                                        {template.variables.length > 0 && (
                                                            <span className="text-[10px] text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">
                                                                {template.variables.length} var{template.variables.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {template.buttons && template.buttons.length > 0 && (
                                                            <span className="text-[10px] bg-[#e8f5e9] border border-[#c8e6c9] px-1.5 py-0.5 rounded-md" style={{ color: '#128c7e' }}>
                                                                {template.buttons.length} btn{template.buttons.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={13} className="text-gray-300 group-hover:text-[#128c7e] flex-shrink-0 mt-1 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FILL STEP */}
                {step === 'fill' && selected && (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left: variables */}
                        <div className="flex flex-col w-full sm:w-[46%] border-r border-gray-100 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                                    <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                        {TYPE_ICON[selected.type]}
                                    </div>
                                    <p className="text-[11px] text-gray-500 capitalize flex-1">{selected.type} · {selected.language}</p>
                                    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase ${CAT_COLOR[selected.category]}`}>
                                        {selected.category}
                                    </span>
                                </div>

                                {allKeys(selected).length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personalize Message</p>
                                        {allKeys(selected).map(key => {
                                            const def = selected.variables.find(v => v.key === key);
                                            const empty = !varValues[key]?.trim();
                                            return (
                                                <div key={key}>
                                                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 mb-1.5">
                                                        <code className="bg-[#e8f5e9] text-[#128c7e] border border-[#c8e6c9] px-1.5 py-0.5 rounded text-[9.5px] font-mono">{`{{${key}}}`}</code>
                                                        <span>{def?.label ?? key}</span>
                                                        {empty && <span className="ml-auto text-[9.5px] text-red-400 font-medium">required</span>}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={varValues[key] ?? ''}
                                                        onChange={e => setVarValues(p => ({ ...p, [key]: e.target.value }))}
                                                        placeholder={def?.description ?? `Enter ${def?.label ?? key}…`}
                                                        className={`w-full px-3 py-2 rounded-xl text-[12.5px] border transition-all focus:outline-none focus:ring-2 ${
                                                            empty
                                                                ? 'border-red-200 bg-red-50/30 focus:ring-red-300/30 placeholder-red-300'
                                                                : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-[#128c7e]/50 focus:ring-[#128c7e]/20'
                                                        }`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 rounded-xl border" style={{ background: '#e8f5e9', borderColor: '#c8e6c9' }}>
                                        <Check size={13} style={{ color: '#128c7e' }} />
                                        <p className="text-[12px] font-medium" style={{ color: '#128c7e' }}>No variables — ready to send!</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white flex-shrink-0">
                                <p className="text-[11px]">
                                    {missing.length > 0
                                        ? <span className="flex items-center gap-1 text-amber-500"><AlertCircle size={11} />{missing.length} field{missing.length > 1 ? 's' : ''} required</span>
                                        : <span className="flex items-center gap-1" style={{ color: '#128c7e' }}><Check size={11} /> Ready to send</span>
                                    }
                                </p>
                                <button
                                    onClick={handleUse}
                                    disabled={missing.length > 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all active:scale-95"
                                    style={missing.length === 0
                                        ? { background: '#128c7e', color: 'white' }
                                        : { background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                                    }
                                >
                                    <Send size={12} />
                                    Use Template
                                </button>
                            </div>
                        </div>

                        {/* Right: WhatsApp preview */}
                        <div className="hidden sm:flex flex-col flex-1 overflow-hidden bg-gray-50">
                            <div className="px-4 pt-3 pb-2 flex-shrink-0 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#25d366]" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</p>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 pb-4">
                                <WhatsAppPreview template={selected} values={varValues} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
