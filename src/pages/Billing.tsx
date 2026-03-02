import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Download,
  CheckCircle,
  X,
  MapPin,
  Pencil,
  BarChart3,
  Shield,
} from 'lucide-react';

/* ── Mock data ── */
const invoices = [
  { id: 1, date: 'Jan 2026', amount: '$99.00', status: 'Paid' },
  { id: 2, date: 'Dec 2025', amount: '$99.00', status: 'Paid' },
  { id: 3, date: 'Nov 2025', amount: '$99.00', status: 'Paid' },
];

interface PaymentCard {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
  brand: string;
  last4: string;
}

interface BillingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface UsageItem {
  label: string;
  current: number;
  limit: number;
  unit: string;
  color: string;
}

const INITIAL_CARD: PaymentCard = {
  name: 'John Doe',
  number: '',
  expiry: '12/2026',
  cvc: '',
  brand: 'Visa',
  last4: '4242',
};

const INITIAL_ADDRESS: BillingAddress = {
  name: 'John Doe',
  line1: '123 Main Street',
  line2: 'Suite 400',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  country: 'United States',
};

const USAGE_DATA: UsageItem[] = [
  { label: 'Conversations', current: 6842, limit: 10000, unit: 'conversations', color: 'bg-blue-500' },
  { label: 'Team Members', current: 7, limit: 10, unit: 'seats', color: 'bg-green-500' },
  { label: 'Storage', current: 3.2, limit: 10, unit: 'GB', color: 'bg-purple-500' },
  { label: 'API Calls', current: 42500, limit: 100000, unit: 'calls', color: 'bg-amber-500' },
];

/* ── Helpers ── */
function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function formatNumber(n: number) {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

/* ── Payment Method Modal ── */
function PaymentMethodModal({
  card,
  onSave,
  onClose,
}: {
  card: PaymentCard;
  onSave: (c: PaymentCard) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: card.name,
    number: '',
    expiry: '',
    cvc: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const valid =
    form.name.trim().length > 1 &&
    form.number.replace(/\s/g, '').length >= 15 &&
    /^\d{2}\/\d{2,4}$/.test(form.expiry) &&
    form.cvc.length >= 3;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const digits = form.number.replace(/\s/g, '');
    onSave({
      ...form,
      brand: digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Card',
      last4: digits.slice(-4),
      expiry: form.expiry,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Update Payment Method</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Card preview */}
          <div className="relative h-44 rounded-xl bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-5 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-7 rounded bg-amber-400/80" />
              <span className="text-xs font-medium tracking-wider opacity-70">
                {form.number.replace(/\s/g, '').startsWith('4')
                  ? 'VISA'
                  : form.number.replace(/\s/g, '').startsWith('5')
                  ? 'MASTERCARD'
                  : 'CARD'}
              </span>
            </div>
            <p className="font-mono text-lg tracking-widest mb-4">
              {form.number || '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between text-xs">
              <div>
                <p className="opacity-50 text-[10px] mb-0.5">CARDHOLDER</p>
                <p className="font-medium tracking-wide">{form.name || '—'}</p>
              </div>
              <div>
                <p className="opacity-50 text-[10px] mb-0.5">EXPIRES</p>
                <p className="font-medium">{form.expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              value={form.number}
              onChange={(e) => set('number', formatCardNumber(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                value={form.expiry}
                onChange={(e) => set('expiry', formatExpiry(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <input
                value={form.cvc}
                onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <Shield size={14} />
            <span>Your payment info is encrypted and secure.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Billing Address Section ── */
function BillingAddressSection() {
  const [address, setAddress] = useState<BillingAddress>(INITIAL_ADDRESS);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BillingAddress>(INITIAL_ADDRESS);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof BillingAddress, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setAddress(form);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setForm(address);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-500" />
          <h3 className="text-lg font-semibold">Billing Address</h3>
        </div>
        {!editing && (
          <button
            onClick={() => { setForm(address); setEditing(true); }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-0.5">
          <p className="font-medium text-gray-900">{address.name}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} {address.zip}
          </p>
          <p>{address.country}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              value={form.line1}
              onChange={(e) => set('line1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              value={form.line2}
              onChange={(e) => set('line2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Apt, suite, etc. (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
              <input
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
                <option>Australia</option>
                <option>India</option>
                <option>Brazil</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.line1 || !form.city || !form.zip}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Usage Section ── */
function UsageSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-gray-500" />
          <h2 className="text-lg font-semibold">Current Usage</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">Resets Mar 1, 2026</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {USAGE_DATA.map((item) => {
          const pct = Math.min((item.current / item.limit) * 100, 100);
          const isHigh = pct >= 80;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className={`text-sm font-semibold ${isHigh ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatNumber(item.current)}
                  <span className="text-gray-400 font-normal"> / {formatNumber(item.limit)} {item.unit}</span>
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isHigh ? 'bg-red-500' : item.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {isHigh && (
                <p className="text-xs text-red-500 font-medium">
                  {pct >= 100 ? 'Limit reached — upgrade to continue' : 'Approaching limit'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Billing Page ── */
export const Billing = () => {
  const navigate = useNavigate();
  const [card, setCard] = useState<PaymentCard>(INITIAL_CARD);
  const [showCardModal, setShowCardModal] = useState(false);

  const handleCardSave = (c: PaymentCard) => {
    setCard(c);
    setShowCardModal(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Billing &amp; Subscription</h1>

        {/* Plan + Payment Method */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Growth Plan</h2>
                <p className="text-gray-600">Your trial ends in 4 days</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">$99</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {['Unlimited conversations', '10 team members', 'Advanced workflows', 'Priority support'].map(
                (f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <span>{f}</span>
                  </div>
                )
              )}
            </div>

            <button
              onClick={() => navigate('/billing/plans')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Upgrade Now
            </button>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
              <CreditCard size={24} />
              <div>
                <p className="font-medium">
                  {card.brand} •••• {card.last4}
                </p>
                <p className="text-sm text-gray-600">Expires {card.expiry}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCardModal(true)}
              className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Update Payment Method
            </button>

            {/* Billing Address inline */}
            <div className="mt-auto pt-5 border-t border-gray-100 mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Billing Address</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {INITIAL_ADDRESS.line1}, {INITIAL_ADDRESS.city}, {INITIAL_ADDRESS.state} {INITIAL_ADDRESS.zip}
              </p>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="mb-6">
          <UsageSection />
        </div>

        {/* Billing Address (full) */}
        <div className="mb-6">
          <BillingAddressSection />
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Billing History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-4 text-sm">{invoice.date}</td>
                    <td className="py-4 text-sm font-medium">{invoice.amount}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto">
                        <Download size={16} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showCardModal && (
        <PaymentMethodModal card={card} onSave={handleCardSave} onClose={() => setShowCardModal(false)} />
      )}
    </div>
  );
};
