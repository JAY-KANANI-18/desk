import { useState } from 'react';
import {
  Info,
  ShieldCheck,
  Lock,
  LayoutGrid,
  CreditCard,
  ExternalLink,
  Building2,
  Globe,
  Clock,
  Languages,
  Upload,
  Users,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionId =
  | 'account-info'
  | 'admin-settings'
  | 'security'
  | 'workspaces'
  | 'whatsapp-fees'
  | 'billing-usage';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ElementType;
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Account',
    items: [
      { id: 'account-info',    label: 'Account info',    icon: Info },
      { id: 'admin-settings',  label: 'Admin settings',  icon: ShieldCheck },
      { id: 'security',        label: 'Security',        icon: Lock },
      { id: 'workspaces',      label: 'Workspaces',      icon: LayoutGrid },
    ],
  },
  {
    label: 'Billing',
    items: [
      { id: 'whatsapp-fees',   label: 'WhatsApp fees',   icon: WhatsAppIcon },
      { id: 'billing-usage',   label: 'Billing & usage', icon: CreditCard },
    ],
  },
];

// ─── WhatsApp SVG icon ────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Section: Account Info ────────────────────────────────────────────────────
function AccountInfoSection() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Account info</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organization's basic information.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Organization logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              A
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <Upload size={15} />
              Upload logo
            </button>
          </div>
        </div>

        {/* Org name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Building2 size={14} className="inline mr-1.5 text-gray-400" />
            Organization name
          </label>
          <input
            type="text"
            defaultValue="AXORA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Globe size={14} className="inline mr-1.5 text-gray-400" />
            Website
          </label>
          <input
            type="url"
            defaultValue="https://axora.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Clock size={14} className="inline mr-1.5 text-gray-400" />
            Timezone
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>(UTC-08:00) Pacific Time</option>
            <option>(UTC-05:00) Eastern Time</option>
            <option>(UTC+00:00) UTC</option>
            <option>(UTC+01:00) Central European Time</option>
            <option>(UTC+05:30) India Standard Time</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Languages size={14} className="inline mr-1.5 text-gray-400" />
            Default language
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Arabic</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Save changes
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Admin Settings ──────────────────────────────────────────────────
function AdminSettingsSection() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Admin settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure organization-wide admin preferences.</p>
      </div>

      <div className="space-y-5 max-w-2xl">
        {[
          { label: 'Allow agents to delete messages', desc: 'Agents can delete their own sent messages.' },
          { label: 'Allow agents to edit messages', desc: 'Agents can edit messages after sending.' },
          { label: 'Require conversation closing note', desc: 'Agents must add a note before closing a conversation.' },
          { label: 'Auto-assign on reply', desc: 'Automatically assign a conversation to the agent who replies.' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────
function SecuritySection() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Security</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage authentication and access security settings.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* 2FA */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Two-factor authentication (2FA)</p>
            <p className="text-xs text-gray-500 mt-0.5">Require all members to enable 2FA on their accounts.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        {/* Session timeout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Session timeout</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Never</option>
            <option>1 hour</option>
            <option>8 hours</option>
            <option>24 hours</option>
            <option>7 days</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Automatically log out inactive users after this period.</p>
        </div>

        {/* Password policy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum password length</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              defaultValue="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Workspaces ──────────────────────────────────────────────────────
const MOCK_WORKSPACES = [
  { id: 1, name: 'My New Workspace', members: 3, plan: 'Growth' },
  { id: 2, name: 'Support Team',     members: 7, plan: 'Growth' },
];

function WorkspacesSection() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Workspaces</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage all workspaces under your organization.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={15} />
          New workspace
        </button>
      </div>

      <div className="space-y-3 max-w-2xl">
        {MOCK_WORKSPACES.map((ws) => (
          <div key={ws.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm">
                {ws.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{ws.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={11} />
                  {ws.members} members · {ws.plan}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ws.plan}</span>
              <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: WhatsApp Fees ───────────────────────────────────────────────────
function WhatsAppFeesSection() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center gap-2">
        <WhatsAppIcon size={20} className="text-gray-700" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">WhatsApp fees</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage WABA balance associated with the phone number of the channel belongs to.
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        {/* Credit card with X icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-gray-300">
              <rect x="4" y="14" width="56" height="36" rx="6" stroke="currentColor" strokeWidth="3" fill="none" />
              <line x1="4" y1="26" x2="60" y2="26" stroke="currentColor" strokeWidth="3" />
              <rect x="10" y="34" width="12" height="6" rx="2" fill="currentColor" />
              <circle cx="48" cy="44" r="10" fill="white" stroke="currentColor" strokeWidth="2.5" />
              <line x1="43" y1="39" x2="53" y2="49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="53" y1="39" x2="43" y2="49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-800 mb-1">No WhatsApp Channel connected</h3>
        <p className="text-sm text-gray-500 mb-5">
          Connect a WhatsApp Channel to view and manage your fees.
        </p>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Connect WhatsApp Channel
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Section: Billing & Usage ─────────────────────────────────────────────────
const INVOICES = [
  { id: 1, date: 'Jan 2026', amount: '$99.00', status: 'Paid' },
  { id: 2, date: 'Dec 2025', amount: '$99.00', status: 'Paid' },
  { id: 3, date: 'Nov 2025', amount: '$99.00', status: 'Paid' },
];

function BillingUsageSection() {
  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Billing & usage</h2>
        <p className="text-sm text-gray-500 mt-0.5">View your plan, usage, and billing history.</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Current plan */}
        <div className="border border-gray-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Current plan</p>
            <p className="text-lg font-semibold text-gray-900">Growth</p>
            <p className="text-sm text-gray-500 mt-0.5">Trial ends in 4 days</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">$99</p>
            <p className="text-xs text-gray-500">per month</p>
            <button className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
              Upgrade now
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">Monthly Active Contacts (MACs)</p>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>1 used</span>
            <span>1,000 limit</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0.1%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Resets on Feb 1, 2026</p>
        </div>

        {/* Payment method */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Payment method</p>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
            <CreditCard size={20} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/2026</p>
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:underline">Update payment method</button>
        </div>

        {/* Billing history */}
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">Billing history</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 text-sm text-gray-700">{inv.date}</td>
                  <td className="py-3 text-sm font-medium text-gray-800">{inv.amount}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle size={12} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline ml-auto">
                      <Download size={12} />
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
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────
function SectionContent({ id }: { id: SectionId }) {
  switch (id) {
    case 'account-info':   return <AccountInfoSection />;
    case 'admin-settings': return <AdminSettingsSection />;
    case 'security':       return <SecuritySection />;
    case 'workspaces':     return <WorkspacesSection />;
    case 'whatsapp-fees':  return <WhatsAppFeesSection />;
    case 'billing-usage':  return <BillingUsageSection />;
    default:               return null;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const Organization = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('whatsapp-fees');

  return (
    <div className="h-full flex overflow-hidden bg-white">
      {/* Left sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 overflow-y-auto py-5 px-3">
        <h1 className="text-sm font-semibold text-gray-900 px-2 mb-4">Organization settings</h1>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <SectionContent id={activeSection} />
      </main>
    </div>
  );
};
