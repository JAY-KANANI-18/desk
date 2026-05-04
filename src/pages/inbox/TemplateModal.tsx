import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
    X, Search, ChevronRight, Check, Send, AlertCircle,
    Image as ImageIcon, Video, FileText, Phone, ExternalLink,
    ChevronLeft, ChevronDown, Play, Reply, MapPin, Package,
    ShoppingCart, Clock, ArrowRight
} from '@/components/ui/icons';
import { ChannelApi } from '../../lib/channelApi';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/button/IconButton';
import { ResponsiveModal } from '../../components/ui/modal';
import { BaseInput } from '../../components/ui/inputs/BaseInput';
import { Tag } from '../../components/ui/Tag';
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

const TYPE_ICON: Record<string, ReactNode> = {
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
    const sharedProps = {
        variant: 'unstyled' as const,
        fullWidth: true,
        radius: 'none' as const,
        size: 'xs' as const,
        className: `justify-center py-2 text-[#00a884] ${divider ? 'border-t border-[#e9edef]' : ''}`,
    };
    if (btn.kind === 'quick_reply') return <Button {...sharedProps} leftIcon={<Reply size={12} />}>{btn.label}</Button>;
    if (btn.kind === 'url')         return <Button {...sharedProps} leftIcon={<ExternalLink size={12} />}>{btn.label}</Button>;
    if (btn.kind === 'phone')       return <Button {...sharedProps} leftIcon={<Phone size={12} />}>{btn.label}</Button>;
    if (btn.kind === 'copy_code')   return <Button {...sharedProps} leftIcon={<FileText size={12} />}>{btn.label}</Button>;
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
                                <IconButton
                                    onClick={() => setCardIdx(i => Math.max(0, i - 1))}
                                    disabled={cardIdx === 0}
                                    icon={<ChevronLeft size={13} />}
                                    variant="inherit-ghost"
                                    size="xs"
                                    aria-label="Previous carousel card"
                                />
                                <div className="flex gap-1">
                                    {template.cards.map((_, i) => (
                                        <Button
                                            key={i}
                                            onClick={() => setCardIdx(i)}
                                            variant="unstyled"
                                            size="xs"
                                            iconOnly
                                            aria-label={`Show carousel card ${i + 1}`}
                                            leftIcon={
                                                <span className={`rounded-full transition-all ${i === cardIdx ? 'h-1.5 w-4 bg-[#00a884]' : 'h-1.5 w-1.5 bg-gray-300'}`} />
                                            }
                                        />
                                    ))}
                                </div>
                                <IconButton
                                    onClick={() => setCardIdx(i => Math.min(template.cards!.length - 1, i + 1))}
                                    disabled={cardIdx === template.cards.length - 1}
                                    icon={<ChevronRight size={13} />}
                                    variant="inherit-ghost"
                                    size="xs"
                                    aria-label="Next carousel card"
                                />
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
    const [originalTemplates, setOriginalTemplates]   = useState<ApiTemplate[]>([]);
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

    // Fetch templates from API - re-runs on query/tab change with debounce on search
    const fetchTemplates = (searchQuery: string, tab: typeof activeTab) => {
        const params: Record<string, string> = { status: 'APPROVED' };
        if (tab !== 'all')          params.category = tab;
        if (searchQuery.trim())     params.search   = searchQuery.trim();
        const request =
            selectedChannel?.type === 'messenger'
                ? ChannelApi.listMessengerTemplates(selectedChannel?.id, params)
                : ChannelApi.listWhatsAppTemplates(selectedChannel?.id, params);

        setLoading(true);
        request.then((res: ApiTemplate[]) => {
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

    const modalTitle =
        step === 'list'
            ? selectedChannel?.type === 'messenger'
                ? 'Messenger Message Templates'
                : 'WhatsApp Message Templates'
            : selected?.name ?? 'Message Template';

    const modalSubtitle =
        step === 'list'
            ? `${loading ? '...' : templates.length} approved templates`
            : selected
                ? `${selected.category} · ${selected.language}`
                : undefined;

    const modalHeaderIcon = (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: '#128c7e' }}>
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        </div>
    );

    const modalFooterMeta = step === 'fill' ? (
        <p className="text-[11px]">
            {missing.length > 0
                ? <span className="flex items-center gap-1 text-amber-500"><AlertCircle size={11} />{missing.length} field{missing.length > 1 ? 's' : ''} required</span>
                : <span className="flex items-center gap-1" style={{ color: '#128c7e' }}><Check size={11} /> Ready to send</span>
            }
        </p>
    ) : undefined;

    const secondaryAction = step === 'fill' ? (
        <Button
            variant="secondary"
            onClick={() => setStep('list')}
        >
            Cancel
        </Button>
    ) : undefined;

    const primaryAction = step === 'fill' ? (
        <Button
            onClick={handleUse}
            disabled={missing.length > 0}
            leftIcon={<Send size={12} />}
        >
            Use Template
        </Button>
    ) : undefined;

    const mobileTitle = (
        <div className="flex min-w-0 items-start gap-2">
            {step === 'fill' ? (
                <IconButton
                    icon={<ChevronLeft size={16} />}
                    variant="ghost"
                    size="sm"
                    aria-label="Back to template list"
                    onClick={() => setStep('list')}
                />
            ) : (
                modalHeaderIcon
            )}
            <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-gray-900">
                    {modalTitle}
                </h2>
                {modalSubtitle ? (
                    <p className="mt-1 truncate text-sm text-gray-500">
                        {modalSubtitle}
                    </p>
                ) : null}
            </div>
        </div>
    );

    const mobileFooter = step === 'fill' ? (
        <div className="space-y-3">
            {modalFooterMeta}
            <div className="grid grid-cols-2 gap-2">
                {secondaryAction}
                {primaryAction}
            </div>
        </div>
    ) : undefined;

    if (!open) return null;

    return (
        <ResponsiveModal
            isOpen={open}
            onClose={onClose}
            title={modalTitle}
            mobileTitle={mobileTitle}
            subtitle={modalSubtitle}
            headerIcon={modalHeaderIcon}
            onBack={step === 'fill' ? () => setStep('list') : undefined}
            size="xl"
            width="56rem"
            bodyPadding="none"
            mobileBodyClassName="h-full"
            mobileFooter={mobileFooter}
            footerMeta={modalFooterMeta}
            secondaryAction={secondaryAction}
            primaryAction={primaryAction}
        >
                <div className="hidden items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#128c7e' }}>
                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {step === 'list'
                                ? selectedChannel?.type === 'messenger'
                                    ? 'Messenger Message Templates'
                                    : 'WhatsApp Message Templates'
                                : (
                                <span className="flex items-center gap-1.5">
                                    <IconButton
                                        icon={<ChevronLeft size={15} />}
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Back to template list"
                                        onClick={() => setStep('list')}
                                    />
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
                    <IconButton
                        icon={<X size={15} />}
                        variant="ghost"
                        size="sm"
                        aria-label="Close template modal"
                        onClick={onClose}
                    />
                </div>

                {/* LIST STEP */}
                {step === 'list' && (
                    <div className="flex h-full flex-col overflow-hidden">
                        <div className="px-4 pt-3 pb-2.5 flex-shrink-0 space-y-2 border-b border-gray-50">
                            <BaseInput
                                ref={searchRef}
                                type="search"
                                appearance="toolbar"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search templates by name or type..."
                                leftIcon={<Search size={13} />}
                                rightIcon={
                                    query ? (
                                        <IconButton
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            icon={<X size={11} />}
                                            onClick={() => setQuery('')}
                                            aria-label="Clear template search"
                                        />
                                    ) : undefined
                                }
                            />
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                                {(['all', ...cats] as const).map(c => (
                                    <Button
                                        key={c}
                                        onClick={() => setActiveTab(c as any)}
                                        variant={activeTab === c ? 'success' : 'secondary'}
                                        size="xs"
                                        radius="full"
                                    >
                                        {c === 'all' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {loading ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#128c7e] rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Loading templates...</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-gray-400">
                                    <Search size={28} className="mb-2 opacity-30" />
                                    <p className="text-sm">No templates found</p>
                                    {query ? (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => setQuery('')}
                                        >
                                            Clear search
                                        </Button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {templates.map(template => (
                                        <Button
                                            key={template.id}
                                            onClick={() => pick(template)}
                                            variant="select-card"
                                            fullWidth
                                            contentAlign="start"
                                            preserveChildLayout
                                            radius="lg"
                                            className="group items-start whitespace-normal text-left hover:shadow-md"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#e8f5e9] flex items-center justify-center text-gray-500 group-hover:text-[#128c7e] transition-colors flex-shrink-0">
                                                    {TYPE_ICON[template.type]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                        <span className="text-[12.5px] font-semibold text-gray-800">{template.name}</span>
                                                        <Tag label={template.category} size="sm" bgColor="gray" />
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 truncate leading-snug">
                                                        {template.body?.replace(/\{\{[^}]+\}\}/g, '...')}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                        <Tag label={template.type} size="sm" bgColor="gray" />
                                                        {template.variables.length > 0 && (
                                                            <Tag label={`${template.variables.length} var${template.variables.length > 1 ? 's' : ''}`} size="sm" bgColor="tag-purple" />
                                                        )}
                                                        {template.buttons && template.buttons.length > 0 && (
                                                            <Tag label={`${template.buttons.length} btn${template.buttons.length > 1 ? 's' : ''}`} size="sm" bgColor="success" />
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={13} className="text-gray-300 group-hover:text-[#128c7e] flex-shrink-0 mt-1 transition-colors" />
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FILL STEP */}
                {step === 'fill' && selected && (
                    <div className="flex h-full overflow-hidden">
                        {/* Left: variables */}
                        <div className="flex flex-col w-full sm:w-[46%] border-r border-gray-100 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                                    <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                        {TYPE_ICON[selected.type]}
                                    </div>
                                    <p className="text-[11px] text-gray-500 capitalize flex-1">{selected.type} · {selected.language}</p>
                                    <Tag label={selected.category} size="sm" bgColor="gray" />
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
                                                    <BaseInput
                                                        type="text"
                                                        value={varValues[key] ?? ''}
                                                        onChange={e => setVarValues(p => ({ ...p, [key]: e.target.value }))}
                                                        placeholder={def?.description ?? `Enter ${def?.label ?? key}...`}
                                                        error={empty ? 'Required field' : undefined}
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

                                <div className="space-y-2 sm:hidden">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#25d366]" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Preview</p>
                                    </div>
                                    <WhatsAppPreview template={selected} values={varValues} />
                                </div>
                            </div>

                            <div className="hidden border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white flex-shrink-0">
                                <p className="text-[11px]">
                                    {missing.length > 0
                                        ? <span className="flex items-center gap-1 text-amber-500"><AlertCircle size={11} />{missing.length} field{missing.length > 1 ? 's' : ''} required</span>
                                        : <span className="flex items-center gap-1" style={{ color: '#128c7e' }}><Check size={11} /> Ready to send</span>
                                    }
                                </p>
                                <Button
                                    onClick={handleUse}
                                    disabled={missing.length > 0}
                                    leftIcon={<Send size={12} />}
                                >
                                    Use Template
                                </Button>
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
        </ResponsiveModal>
    );
}
