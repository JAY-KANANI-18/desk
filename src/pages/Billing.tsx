import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard, Download, Pencil, Users, UserRound,
  Loader2, AlertTriangle, Sparkles, Crown, ArrowUp, ArrowDown, Eye,
  RefreshCw, Plus, Minus, Zap, FileText, CheckCircle, Clock, Info,
  ChevronRight,
} from '@/components/ui/icons';
import { workspaceApi } from '../lib/workspaceApi';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/button/IconButton';
import { BaseInput, type BaseInputProps } from '../components/ui/inputs/BaseInput';
import { CenterModal } from '../components/ui/modal';
import { PageLayout } from '../components/ui/PageLayout';
import { Tag } from '../components/ui/Tag';
import { Tooltip } from '../components/ui/Tooltip';

/* ─────────────────────────── types ─────────────────────────── */
type BillingProvider = 'stripe' | 'razorpay';
type PlanKey = 'trial' | 'starter' | 'growth' | 'pro';
type SubStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused' | 'unpaid';

interface AddonPricing {
  extraAgent: { pricePerUnit: number; label: string } | null;
  extraContacts: { pricePerSlab: number; slabSize: number; label: string } | null;
}

interface BillingDetails {
  companyName: string; email: string; phone?: string; taxId?: string;
  addressLine1: string; addressLine2?: string; city: string;
  state: string; postalCode: string; country: string;
}

interface InvoiceItem {
  id: string; dbId?: string; date: string; amount: number;
  amountDue?: number; amountPaid?: number; currency: string;
  status: string; invoiceUrl?: string; invoicePdf?: string;
  type?: 'subscription' | 'addon'; description?: string;
  periodStart?: string; periodEnd?: string;
}

interface BillingResponse {
  subscription: {
    plan: PlanKey; status: SubStatus;
    trialEndAt?: string | null; currentPeriodEnd?: string | null;
    currentPeriodStart?: string | null;
    provider?: BillingProvider | null; providerSubId?: string | null;
    pendingPlan?: string | null; pendingEffectiveAt?: string | null;
    cancelAtPeriodEnd?: boolean;
    lastRefundAmount?: number | null; lastRefundStatus?: string | null;
  } | null;
  plan: { key: PlanKey; name: string };
  limits: { contacts: number; agents: number; messagesPerMonth?: number };
  features?: string[];
  usage: { contacts: number; agents: number; messagesPerMonth: number };
  addonPricing?: AddonPricing | null;
  billingDetails?: BillingDetails | null;
  paymentMethod?: { brand?: string; last4?: string; expMonth?: number; expYear?: number } | null;
}

/* ─────────────────────────── static plan display data ─────────────────────────── */
const PLAN_ORDER: PlanKey[] = ['trial', 'starter', 'growth', 'pro'];

const PLAN_DISPLAY: Record<PlanKey, {
  label: string; price: string; badge: string;
  badgeColor: string; description: string; accentColor: string;
}> = {
  trial:   { label: 'Free',     price: '₹0/mo',     badge: 'Trial',   badgeColor: 'warning',    description: 'Explore with limited access.',   accentColor: '#f59e0b' },
  starter: { label: 'Starter',  price: '₹999/mo',   badge: 'Starter', badgeColor: 'gray',       description: 'For small teams.',               accentColor: '#64748b' },
  growth:  { label: 'Growth',   price: '₹2,999/mo', badge: 'Growth',  badgeColor: 'primary',    description: 'For growing teams.',             accentColor: '#2563eb' },
  pro:     { label: 'Pro',      price: '₹9,999/mo', badge: 'Pro',     badgeColor: 'tag-purple', description: 'Advanced scale and support.',    accentColor: '#7c3aed' },
};

const AVAILABLE_PLANS: Array<{
  key: Exclude<PlanKey, 'trial'>; name: string; price: string;
  includedAgents: number; includedContacts: number; popular?: boolean;
  features: string[]; extraAgentPrice: string | null; extraContactsPrice: string;
}> = [
  {
    key: 'starter', name: 'Starter', price: '₹999/mo',
    includedAgents: 2, includedContacts: 1000,
    extraAgentPrice: '₹299/extra agent/mo', extraContactsPrice: '₹149/1,000 contacts',
    features: ['2 agents included', '1,000 contacts included', '2 channels', 'Email support'],
  },
  {
    key: 'growth', name: 'Growth', price: '₹2,999/mo',
    includedAgents: 5, includedContacts: 10000, popular: true,
    extraAgentPrice: '₹249/extra agent/mo', extraContactsPrice: '₹99/1,000 contacts',
    features: ['5 agents included', '10,000 contacts included', 'All channels', 'Priority support', 'Analytics'],
  },
  {
    key: 'pro', name: 'Pro', price: '₹9,999/mo',
    includedAgents: 999, includedContacts: 100000,
    extraAgentPrice: null, extraContactsPrice: '₹49/1,000 contacts',
    features: ['Unlimited agents', '100K contacts included', 'Custom integrations', 'Dedicated support', 'SLA'],
  },
];

/* ─────────────────────────── helpers ─────────────────────────── */
function fmt(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function pct(cur: number, lim: number) { return lim ? Math.min(Math.round((cur / lim) * 100), 100) : 0; }
function isUpgrade(a: PlanKey, b: string) { return PLAN_ORDER.indexOf(b as PlanKey) > PLAN_ORDER.indexOf(a); }

const statusTagColors: Record<string, string> = {
  active: 'success',
  trialing: 'warning',
  past_due: 'error',
  cancelled: 'gray',
  expired: 'gray',
  paused: 'tag-orange',
  unpaid: 'error',
};

function openExternalUrl(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function UsageBar({ title, icon, current, limit, unit, extra, onAddExtra }: {
  title: string; icon: React.ReactNode; current: number; limit: number;
  unit: string; extra?: string | null; onAddExtra?: () => void;
}) {
  const p = pct(current, limit);
  const high = p >= 80;
  const over = current > limit;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-400">{limit.toLocaleString()} included</p>
          </div>
        </div>
        <Tag label={`${p}%`} size="sm" bgColor={over ? 'error' : high ? 'warning' : 'success'} />
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold ${over ? 'text-red-600' : 'text-gray-900'}`}>{current.toLocaleString()}</span>
        <span className="text-xs text-gray-400">of {limit.toLocaleString()} {unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : high ? 'bg-amber-400' : 'bg-gradient-to-r from-[var(--color-primary-light)]0 to-[var(--color-primary-hover)]'}`}
          style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
      {over ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-700">Exceeded by {(current - limit).toLocaleString()} {unit}</p>
            {extra && <p className="text-xs text-red-400 mt-0.5">{extra}</p>}
          </div>
          {onAddExtra && (
            <Button
              onClick={onAddExtra}
              variant="danger"
              
              leftIcon={<Plus size={11} />}
            >
              Add More
            </Button>
          )}
        </div>
      ) : high && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-amber-600 font-medium">Approaching limit</p>
          {onAddExtra && (
            <Button
              onClick={onAddExtra}
              variant="link"
              size="xs"
              rightIcon={<ChevronRight size={12} />}
            >
              Add more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Invoice Preview Modal ─────────────────────────── */
function InvoiceModal({ invoice, onClose, onPay, paying }: {
  invoice: InvoiceItem; onClose: () => void; onPay: () => void; paying: boolean;
}) {
  const unpaid = invoice.status !== 'paid';
  const invoiceDownloadUrl = invoice.invoicePdf || invoice.invoiceUrl;
  const rows = [
    ['Date', fmtDate(invoice.date)],
    ['Description', invoice.description || (invoice.type === 'addon' ? 'Add-on charge' : 'Subscription')],
    ['Total', fmt(invoice.amount, invoice.currency)],
    ...(invoice.amountPaid != null && invoice.amountPaid > 0 ? [['Paid', fmt(invoice.amountPaid, invoice.currency)]] : []),
    ...(unpaid && invoice.amountDue != null ? [['Due', fmt(invoice.amountDue, invoice.currency)]] : []),
    ...(invoice.periodStart ? [['Period', `${fmtDate(invoice.periodStart)} – ${fmtDate(invoice.periodEnd)}`]] : []),
  ];

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      size="sm"
      title={invoice.type === 'addon' ? 'Add-on Invoice' : 'Subscription Invoice'}
      subtitle={<span className="font-mono">{invoice.id}</span>}
      headerIcon={
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.type === 'addon' ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--color-primary-light)]'}`}>
          <FileText size={18} className={invoice.type === 'addon' ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'} />
        </div>
      }
      secondaryAction={
        invoiceDownloadUrl ? (
          <Button
            onClick={() => openExternalUrl(invoiceDownloadUrl)}
            variant="secondary"
           
            leftIcon={<Download size={14} />}
          >
            Download PDF
          </Button>
        ) : (
          <Button
            disabled
            variant="secondary"
           
            leftIcon={<Download size={14} />}
          >
            No PDF
          </Button>
        )
      }
      primaryAction={
        unpaid ? (
          <Button
            onClick={onPay}
            loading={paying}
            loadingMode="inline"
            loadingLabel="Processing..."
        
            leftIcon={<CreditCard size={14} />}
          >
            Pay Now
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-0">
        {rows.map(([label, value]) => (
          <div key={label as string} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
            <span className="text-sm font-semibold text-gray-800">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Status</span>
          <Tag
            label={invoice.status}
            size="sm"
            bgColor={!unpaid ? 'success' : 'error'}
            icon={!unpaid ? <CheckCircle size={11} /> : <Clock size={11} />}
          />
        </div>
      </div>
    </CenterModal>
  );
}

/* ─────────────────────────── Addon Modal ─────────────────────────── */
function AddonModal({ type, addonPricing, onClose, onSave, saving }: {
  type: 'extra_agents' | 'extra_contacts';
  addonPricing: AddonPricing;
  onClose: () => void;
  onSave: (type: string, quantity: number) => void;
  saving: boolean;
}) {
  const [qty, setQty] = useState(1);
  const isAgents = type === 'extra_agents';
  const pricing = isAgents ? addonPricing.extraAgent : addonPricing.extraContacts;
  if (!pricing) return null;

  const pricePerUnit = isAgents ? (pricing as any).pricePerUnit : (pricing as any).pricePerSlab;
  const slabSize = !isAgents ? (pricing as any).slabSize : 1;
  const totalUnits = qty * slabSize;
  const totalCost = qty * pricePerUnit;
  const primaryLabel = saving
    ? 'Creating invoice...'
    : isAgents
      ? `Add ${qty} Agent${qty > 1 ? 's' : ''} - ${fmt(totalCost)}/mo`
      : `Add ${totalUnits.toLocaleString()} Contacts - ${fmt(totalCost)}/mo`;

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      size="sm"
      title={isAgents ? 'Add Extra Agents' : 'Add Extra Contacts'}
      subtitle={isAgents ? `${fmt(pricePerUnit)}/agent/month` : `${fmt(pricePerUnit)} per ${slabSize.toLocaleString()} contacts/month`}
      primaryAction={
        <Button
          onClick={() => onSave(type, qty)}
          loading={saving}
          loadingMode="inline"
          loadingLabel="Creating invoice..."
          variant="dark"
       
          leftIcon={<Zap size={14} />}
        >
          {primaryLabel}
        </Button>
      }
    >
      <div className="bg-[var(--color-primary-light)] rounded-xl p-3 mb-5 flex gap-2">
        <Info size={13} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--color-primary)]">
          {isAgents
            ? 'Charged as a separate invoice on the same billing date as your subscription.'
            : `Added in slabs of ${slabSize.toLocaleString()} contacts. Charged as a separate invoice on your next billing date.`}
        </p>
      </div>

      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        {isAgents ? 'Number of Extra Agents' : `Contact Slabs (${slabSize.toLocaleString()} each)`}
      </p>

      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 mb-4">
        <IconButton
          onClick={() => setQty(q => Math.max(1, q - 1))}
          icon={<Minus size={16} />}
          variant="secondary"
       
          aria-label="Decrease quantity"
        />
        <div className="text-center">
          <span className="text-4xl font-bold text-gray-900">{qty}</span>
          <p className="text-xs text-gray-400 mt-1">
            {isAgents ? `agent${qty > 1 ? 's' : ''}` : `× ${slabSize.toLocaleString()} = ${totalUnits.toLocaleString()} contacts`}
          </p>
        </div>
        <IconButton
          onClick={() => setQty(q => q + 1)}
          icon={<Plus size={16} />}
          variant="secondary"
     
          aria-label="Increase quantity"
        />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">{qty} × {fmt(pricePerUnit)}</span>
          <span className="font-bold text-gray-900">{fmt(totalCost)}/mo</span>
        </div>
        <p className="text-xs text-gray-400">Charged as a separate invoice, same billing date</p>
      </div>
    </CenterModal>
  );
}

/* ─────────────────────────── Billing Details Modal ─────────────────────────── */
function BillingDetailsModal({ initial, onClose, onSave, loading }: {
  initial: BillingDetails; onClose: () => void;
  onSave: (data: BillingDetails) => void; loading: boolean;
}) {
  const [form, setForm] = useState<BillingDetails>(initial);
  const set = (k: keyof BillingDetails, v: string) => setForm(p => ({ ...p, [k]: v }));
  const valid = Boolean(form.companyName && form.email && form.addressLine1 && form.city && form.state && form.postalCode);

  const rows: Array<Array<{ label: string; key: keyof BillingDetails; type?: BaseInputProps['type'] }>> = [
    [{ label: 'Company Name', key: 'companyName' }, { label: 'Billing Email', key: 'email', type: 'email' }],
    [{ label: 'Phone', key: 'phone', type: 'tel' }, { label: 'Tax ID / GSTIN', key: 'taxId' }],
    [{ label: 'Address Line 1', key: 'addressLine1' }, { label: 'Address Line 2', key: 'addressLine2' }],
    [{ label: 'City', key: 'city' }, { label: 'State', key: 'state' }],
    [{ label: 'Postal Code', key: 'postalCode' }, { label: 'Country', key: 'country' }],
  ];

  return (
    <CenterModal
      isOpen
      onClose={onClose}
      size="lg"
      title="Billing Details"
      subtitle="Used on invoices and tax documents"
      secondaryAction={
        <Button onClick={onClose} variant="secondary" size="md" radius="lg">
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          disabled={!valid}
          loading={loading}
          loadingMode="inline"
          loadingLabel="Saving..."
          onClick={() => onSave(form)}
          size="md"
          radius="lg"
        >
          Save Details
        </Button>
      }
    >
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="grid md:grid-cols-2 gap-4">
            {row.map(({ label, key, type }) => (
              <BaseInput
                key={key}
                label={label}
                labelVariant="sidebar"
                type={type}
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
              />
            ))}
          </div>
        ))}
      </div>
    </CenterModal>
  );
}

/* ─────────────────────────── MAIN ─────────────────────────── */
export const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  const [editingBilling, setEditingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<BillingProvider>('razorpay');

  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);
  const [payingInvoice, setPayingInvoice] = useState('');

  const [addonModal, setAddonModal] = useState<'extra_agents' | 'extra_contacts' | null>(null);
  const [savingAddon, setSavingAddon] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [billingRes, invoicesRes] = await Promise.all([
        workspaceApi.getBilling(),
        workspaceApi.getInvoices(),
      ]);
      setBilling(billingRes);
      setInvoices(invoicesRes?.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sub = billing?.subscription;
  const currentPlan = billing?.plan?.key || 'trial';
  const currentDisplay = PLAN_DISPLAY[currentPlan];
  const addonPricing = billing?.addonPricing;

  const trialDaysLeft = useMemo(() => {
    if (!sub?.trialEndAt) return null;
    const diff = Math.ceil((new Date(sub.trialEndAt).getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [sub?.trialEndAt]);

  const pendingPlan = sub?.pendingPlan as PlanKey | null;
  const isPendingUpgrade = pendingPlan ? isUpgrade(currentPlan, pendingPlan) : false;
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');

  const handleUpgrade = async (plan: Exclude<PlanKey, 'trial'>) => {
    try {
      setCheckoutLoading(plan);
      const res = await workspaceApi.createCheckout({ plan, provider: selectedProvider });
      if (res.provider === 'stripe' && res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
      if (res.provider === 'razorpay') {
        if (res.requiresReauth && res.shortUrl) { window.open(res.shortUrl, '_blank'); return; }
        const RZ = (window as any).Razorpay;
        if (!RZ) { alert('Razorpay SDK not loaded'); return; }
        new RZ({ key: res.key, subscription_id: res.subscriptionId, name: 'AxoDesk', description: `${plan} Plan`, handler: () => load(), theme: { color: '#2563eb' } }).open();
      }
    } catch (err: any) { alert(err?.response?.data?.message || 'Checkout failed'); }
    finally { setCheckoutLoading(''); }
  };

  const handlePayInvoice = async (invoice: InvoiceItem) => {
    try {
      setPayingInvoice(invoice.id);
      const res = await workspaceApi.payInvoice(invoice.id);
      if (res.razorpayOrderId) {
        const RZ = (window as any).Razorpay;
        new RZ({ key: res.key, order_id: res.razorpayOrderId, name: 'AxoDesk', description: invoice.description || 'Invoice', handler: () => { load(); setPreviewInvoice(null); }, theme: { color: '#2563eb' } }).open();
      } else if (res.invoiceUrl) {
        window.open(res.invoiceUrl, '_blank');
      } else { await load(); setPreviewInvoice(null); }
    } catch (err: any) { alert(err?.response?.data?.message || 'Payment failed'); }
    finally { setPayingInvoice(''); }
  };

  const handleAddon = async (type: string, quantity: number) => {
    try {
      setSavingAddon(true);
      const res = await workspaceApi.addAddon({ type, quantity });
      console.log({res});
      
      setAddonModal(null);
      if (res.razorpayOrderId) {
        const RZ = (window as any).Razorpay;
        new RZ({ key: res.key, order_id: res.razorpayOrderId, name: 'AxoDesk', description: res.description, handler: () => load(), theme: { color: '#2563eb' } }).open();
      } else { await load(); }
    } catch (err: any) {
        console.log({err});
        
      alert(err?.response?.data?.message || 'Failed to add addon'); }
    finally { setSavingAddon(false); }
  };

  const handleSaveBilling = async (payload: BillingDetails) => {
    try {
      setSavingBilling(true);
      await workspaceApi.updateBillingDetails(payload);
      setEditingBilling(false);
      await load();
    } catch (err: any) { alert(err?.response?.data?.message || 'Save failed'); }
    finally { setSavingBilling(false); }
  };

  if (loading) return (
    <div className="h-full bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={24} />
        <p className="text-sm font-medium">Loading billing…</p>
      </div>
    </div>
  );

  const billingDetails: BillingDetails = billing?.billingDetails || {
    companyName: '', email: '', phone: '', taxId: '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India',
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8f9fc] md:overflow-hidden">
      <PageLayout
        title="Billing"
        subtitle="Manage plan, add-ons, invoices and usage."
        className="bg-[#f8f9fc]"
        contentClassName="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 lg:px-8"
        actions={
          <Tooltip content="Refresh billing">
            <IconButton
              onClick={load}
              icon={<RefreshCw size={15} />}
              variant="secondary"
              size="md"
              radius="lg"
              aria-label="Refresh billing"
            />
          </Tooltip>
        }
      >
      <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between md:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage plan, add-ons, invoices and usage.</p>
          </div>
          <IconButton
            onClick={load}
            icon={<RefreshCw size={15} />}
            variant="secondary"
            size="md"
            radius="lg"
            aria-label="Refresh billing"
          />
        </div>

        {/* ── Banners ── */}
        {sub?.status === 'trialing' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Trial active {trialDaysLeft !== null ? `— ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left` : ''}</p>
              <p className="text-xs text-amber-600 mt-0.5">Upgrade to keep your workspace running after the trial ends.</p>
            </div>
          </div>
        )}

        {sub?.status === 'past_due' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Payment overdue</p>
              <p className="text-xs text-red-600 mt-0.5">Your last payment failed. Settle the invoice below to restore access.</p>
            </div>
          </div>
        )}

        {pendingPlan && (
          <div className={`rounded-2xl p-4 border flex items-start gap-3 ${isPendingUpgrade ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)]' : 'bg-amber-50 border-amber-200'}`}>
            {isPendingUpgrade
              ? <ArrowUp size={15} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
              : <ArrowDown size={15} className="text-amber-500 mt-0.5 shrink-0" />}
            <div>
              <p className={`font-semibold text-sm ${isPendingUpgrade ? 'text-[var(--color-primary)]' : 'text-amber-800'}`}>
                {isPendingUpgrade ? 'Upgrade' : 'Downgrade'} to <span className="capitalize">{PLAN_DISPLAY[pendingPlan]?.badge}</span> scheduled
              </p>
              <p className={`text-xs mt-0.5 ${isPendingUpgrade ? 'text-[var(--color-primary)]' : 'text-amber-600'}`}>
                {sub?.pendingEffectiveAt === 'now'
                  ? 'Taking effect immediately after confirmation.'
                  : `Takes effect at end of billing cycle (${fmtDate(sub?.currentPeriodEnd)}).`}
              </p>
            </div>
          </div>
        )}

        {sub?.lastRefundAmount && sub.lastRefundStatus && (
          <div className={`rounded-2xl p-4 border flex items-start gap-3 ${sub.lastRefundStatus === 'processed' ? 'bg-emerald-50 border-emerald-200' : 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)]'}`}>
            <CheckCircle size={15} className={`mt-0.5 shrink-0 ${sub.lastRefundStatus === 'processed' ? 'text-emerald-500' : 'text-[var(--color-primary)]'}`} />
            <div>
              <p className={`font-semibold text-sm ${sub.lastRefundStatus === 'processed' ? 'text-emerald-800' : 'text-[var(--color-primary)]'}`}>
                Refund {sub.lastRefundStatus === 'processed' ? 'processed' : 'initiated'}: {fmt(sub.lastRefundAmount, 'INR')}
              </p>
              <p className={`text-xs mt-0.5 ${sub.lastRefundStatus === 'processed' ? 'text-emerald-600' : 'text-[var(--color-primary)]'}`}>
                {sub.lastRefundStatus === 'processed' ? 'Credited to your original payment method.' : 'Will be credited within 5–7 business days.'}
              </p>
            </div>
          </div>
        )}

        {unpaidInvoices.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-red-500" />
              <p className="text-sm font-semibold text-red-800">{unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-2">
              {unpaidInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-red-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{fmt(inv.amount, inv.currency)}</p>
                    <p className="text-xs text-gray-400">{fmtDate(inv.date)} · {inv.description || 'Invoice'}</p>
                  </div>
                  <Button
                    onClick={() => handlePayInvoice(inv)}
                    loading={payingInvoice === inv.id}
                    loadingMode="inline"
                    loadingLabel="Paying..."
                    variant="danger"
                    size="xs"
                    radius="lg"
                    leftIcon={<CreditCard size={11} />}
                  >
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Current Plan Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${currentDisplay.accentColor}18` }}>
                <Crown size={20} style={{ color: currentDisplay.accentColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{billing?.plan.name} Plan</h2>
                <p className="text-sm text-gray-400 mt-0.5">{currentDisplay.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Tag label={currentDisplay.badge} size="sm" bgColor={currentDisplay.badgeColor} />
                  {sub?.status && <Tag label={sub.status} size="sm" bgColor={statusTagColors[sub.status] || 'gray'} />}
                  {sub?.cancelAtPeriodEnd && <Tag label="Cancels at period end" size="sm" bgColor="tag-orange" />}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-2xl font-bold text-gray-900">{currentDisplay.price}</p>
              <p className="text-xs text-gray-400 mt-1">Renews {fmtDate(sub?.currentPeriodEnd || sub?.trialEndAt)}</p>
            </div>
          </div>

          {currentPlan !== 'trial' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-2xl">
              {[
                ['Included Agents', billing?.limits.agents?.toLocaleString()],
                ['Included Contacts', billing?.limits.contacts?.toLocaleString()],
                ['Billing Period', `Until ${fmtDate(sub?.currentPeriodEnd)}`],
                ['Provider', sub?.provider?.toUpperCase() || '—'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Pay via</p>
              <div className="flex gap-2">
                {(['razorpay', 'stripe'] as BillingProvider[]).map(p => (
                  <Button
                    key={p}
                    onClick={() => setSelectedProvider(p)}
                    variant={selectedProvider === p ? 'dark' : 'secondary'}
                    size="xs"
                    radius="lg"
                    aria-pressed={selectedProvider === p}
                  >
                    {p === 'razorpay' ? 'Razorpay' : 'Stripe'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PLANS.filter(p => p.key !== currentPlan).map(plan => {
                const up = isUpgrade(currentPlan, plan.key);
                return (
                  <Button
                    key={plan.key}
                    onClick={() => handleUpgrade(plan.key)}
                    loading={checkoutLoading === plan.key}
                    loadingMode="inline"
                    loadingLabel="Opening..."
                    variant={up ? 'primary' : 'secondary'}
                    size="sm"
                    radius="lg"
                    leftIcon={up ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                  >
                    {up ? 'Upgrade' : 'Downgrade'} to {plan.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Usage ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UsageBar
            title="Agents" icon={<UserRound size={16} />}
            current={billing?.usage.agents || 0} limit={billing?.limits.agents || 1} unit="agents"
            extra={addonPricing?.extraAgent ? `${fmt(addonPricing.extraAgent.pricePerUnit)}/extra agent/mo` : null}
            onAddExtra={addonPricing?.extraAgent ? () => setAddonModal('extra_agents') : undefined}
          />
          <UsageBar
            title="Contacts" icon={<Users size={16} />}
            current={billing?.usage.contacts || 0} limit={billing?.limits.contacts || 1} unit="contacts"
            extra={addonPricing?.extraContacts ? `${fmt(addonPricing.extraContacts.pricePerSlab)} per ${addonPricing.extraContacts.slabSize.toLocaleString()} contacts` : null}
            onAddExtra={addonPricing?.extraContacts ? () => setAddonModal('extra_contacts') : undefined}
          />
        </div>

        {/* ── Add-on CTAs ── */}
        {currentPlan !== 'trial' && addonPricing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addonPricing.extraAgent && (
              <Button
                onClick={() => setAddonModal('extra_agents')}
                variant="select-card"
                size="lg"
                radius="lg"
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <div className="flex w-full items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                    <UserRound size={16} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Add Extra Agents</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{addonPricing.extraAgent.label} · separate invoice</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              </Button>
            )}
            {addonPricing.extraContacts && (
              <Button
                onClick={() => setAddonModal('extra_contacts')}
                variant="select-card"
                size="lg"
                radius="lg"
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <div className="flex w-full items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                    <Users size={16} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Add Extra Contacts</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{addonPricing.extraContacts.label} · separate invoice</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              </Button>
            )}
          </div>
        )}

        {/* ── Plans Comparison ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-5">All Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_PLANS.map(plan => {
              const isCurrent = currentPlan === plan.key;
              const up = isUpgrade(currentPlan, plan.key);
              return (
                <div key={plan.key} className={`rounded-2xl border p-5 relative transition-all ${isCurrent ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200 hover:border-gray-300'}`}>
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-2.5 left-4">
                      <Tag label="POPULAR" size="sm" bgColor="tag-purple" />
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-4">
                      <Tag label="CURRENT" size="sm" bgColor="primary" />
                    </div>
                  )}
                  <p className="font-bold text-gray-900 text-base">{plan.name}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{plan.price}</p>
                  <p className="text-xs text-gray-400 mb-4">base plan · billed monthly</p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle size={11} className="text-emerald-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Add-on pricing</p>
                    {plan.extraAgentPrice
                      ? <p className="text-xs text-gray-500">+{plan.extraAgentPrice}</p>
                      : <p className="text-xs text-gray-400 italic">Agents unlimited on this plan</p>}
                    <p className="text-xs text-gray-500">+{plan.extraContactsPrice}</p>
                  </div>
                  <Button
                    disabled={isCurrent}
                    loading={checkoutLoading === plan.key}
                    loadingMode="inline"
                    loadingLabel="Opening..."
                    onClick={() => handleUpgrade(plan.key)}
                    variant={isCurrent ? 'soft-primary' : up ? 'primary' : 'soft'}
                    size="sm"
                    radius="lg"
                    fullWidth
                    leftIcon={!isCurrent ? (up ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : undefined}
                  >
                    {isCurrent ? 'Current Plan' : up ? 'Upgrade' : 'Downgrade'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Billing Details ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Billing Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Used on invoices and tax documents</p>
            </div>
            <Button
              onClick={() => setEditingBilling(true)}
              variant="soft-primary"
              size="xs"
              radius="lg"
              leftIcon={<Pencil size={12} />}
            >
              Edit
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[['Company', billingDetails.companyName], ['Email', billingDetails.email], ['Phone', billingDetails.phone], ['Tax ID', billingDetails.taxId], ['City', billingDetails.city], ['State', billingDetails.state]].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">{label}</p>
                <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Invoices ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">Invoice History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Subscription charges and add-on invoices — both shown separately</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice', 'Date', 'Description', 'Amount', 'Type', 'Status', ''].map((h, i) => (
                    <th key={i} className={`py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No invoices yet</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 text-xs font-mono text-gray-400 pr-2">{inv.id.slice(0, 14)}…</td>
                    <td className="py-3.5 text-sm text-gray-600 whitespace-nowrap">{fmtDate(inv.date)}</td>
                    <td className="py-3.5 text-sm text-gray-700 max-w-[160px] truncate">{inv.description || '—'}</td>
                    <td className="py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">{fmt(inv.amount, inv.currency)}</td>
                    <td className="py-3.5">
                      <Tag
                        label={inv.type === 'addon' ? 'Add-on' : 'Subscription'}
                        size="sm"
                        bgColor={inv.type === 'addon' ? 'tag-purple' : 'primary'}
                      />
                    </td>
                    <td className="py-3.5">
                      <Tag
                        label={inv.status}
                        size="sm"
                        bgColor={inv.status === 'paid' ? 'success' : 'error'}
                      />
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip content="Preview">
                          <IconButton
                            onClick={() => setPreviewInvoice(inv)}
                            icon={<Eye size={14} />}
                            variant="ghost"
                            size="xs"
                            radius="lg"
                            aria-label="Preview invoice"
                          />
                        </Tooltip>
                        {(inv.invoiceUrl || inv.invoicePdf) && (
                          <Tooltip content="Download">
                            <IconButton
                              onClick={() => openExternalUrl(inv.invoicePdf || inv.invoiceUrl)}
                              icon={<Download size={14} />}
                              variant="ghost"
                              size="xs"
                              radius="lg"
                              aria-label="Download invoice"
                            />
                          </Tooltip>
                        )}
                        {inv.status !== 'paid' && (
                          <Button
                            onClick={() => handlePayInvoice(inv)}
                            loading={payingInvoice === inv.id}
                            loadingMode="inline"
                            loadingLabel="Paying..."
                            variant="danger"
                            size="xs"
                            radius="lg"
                            leftIcon={<CreditCard size={11} />}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      </PageLayout>

      {/* ── Modals ── */}
      {previewInvoice && (
        <InvoiceModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)}
          onPay={() => handlePayInvoice(previewInvoice)} paying={payingInvoice === previewInvoice.id} />
      )}
      {addonModal && addonPricing && (
        <AddonModal type={addonModal} addonPricing={addonPricing}
          onClose={() => setAddonModal(null)} onSave={handleAddon} saving={savingAddon} />
      )}
      {editingBilling && (
        <BillingDetailsModal initial={billingDetails} onClose={() => setEditingBilling(false)}
          onSave={handleSaveBilling} loading={savingBilling} />
      )}
    </div>
  );
};
