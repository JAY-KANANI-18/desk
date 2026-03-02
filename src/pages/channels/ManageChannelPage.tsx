import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, RefreshCw, QrCode, Info,
  Settings, FileText, User, Wrench, ShoppingBag,
  ExternalLink, Trash2, AlertTriangle, ChevronDown,
  MessageSquare, Globe, Mail, Instagram, Facebook,
  MessageCircle, Plus, X, Image, Link2, Send, Menu,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConnectedChannel {
  id: number;
  name: string;
  type: string;
  identifier: string;
  status: 'Connected' | 'Error' | 'Disconnected';
  icon: string;
  color: string;
  msgs: number;
  connectedAt: string;
}

// ─── Channel meta ─────────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, {
  label: string;
  icon: string;
  color: string;
  navItems: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
  additionalResources: { label: string; href: string }[];
}> = {
  whatsapp_cloud: {
    label: 'WhatsApp Cloud API',
    icon: '💬',
    color: 'bg-green-500',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'templates',     label: 'Templates',     icon: <FileText size={14} /> },
      { id: 'profile',       label: 'Profile',       icon: <User size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
      { id: 'catalog',       label: 'Meta Product Catalog', icon: <ShoppingBag size={14} /> },
    ],
    additionalResources: [
      { label: 'Benefits of migrating to Axodesk Business Platform (API)', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  facebook: {
    label: 'Facebook Messenger',
    icon: '💙',
    color: 'bg-blue-600',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'templates',     label: 'Templates',     icon: <FileText size={14} /> },
      { id: 'private_replies', label: 'Private Replies', icon: <MessageCircle size={14} /> },
      { id: 'chat_menu',     label: 'Chat Menu',     icon: <Menu size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'About Facebook Message Templates', href: '#' },
      { label: 'About Private Replies', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  instagram: {
    label: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    navItems: [
      { id: 'configuration',   label: 'Configuration',   icon: <Settings size={14} /> },
      { id: 'private_replies', label: 'Private Replies', icon: <MessageCircle size={14} />, badge: 'New' },
      { id: 'troubleshoot',    label: 'Troubleshoot',    icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Instagram Messaging API documentation', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  email: {
    label: 'Email (SMTP / IMAP)',
    icon: '✉️',
    color: 'bg-indigo-500',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Email channel setup guide', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  gmail: {
    label: 'Gmail',
    icon: '📧',
    color: 'bg-red-500',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Gmail channel setup guide', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  website_chat: {
    label: 'Website Chat',
    icon: '💬',
    color: 'bg-blue-800',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Install Website Chat Widget on WordPress', href: '#' },
      { label: 'Install Website Chat Widget on Shopify', href: '#' },
      { label: 'Install Website Chat Widget on Wix', href: '#' },
    ],
  },
};

// ─── Type → slug map ──────────────────────────────────────────────────────────
export const CHANNEL_TYPE_TO_SLUG: Record<string, string> = {
  'WhatsApp Business Platform (API)': 'whatsapp_cloud',
  'WhatsApp Cloud API':               'whatsapp_cloud',
  'Facebook Messenger':               'facebook',
  'Instagram':                        'instagram',
  'Email':                            'email',
  'Email (SMTP/IMAP)':                'email',
  'Gmail':                            'gmail',
  'Website Chat':                     'website_chat',
};

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyButton = ({ value, className = '' }: { value: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

// ─── Read-only field with copy ────────────────────────────────────────────────
const ReadonlyField = ({
  label,
  value,
  hint,
  extra,
}: {
  label: string;
  value: string;
  hint?: string;
  extra?: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info size={13} className="text-gray-400" />
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        <span className="flex-1 text-sm text-gray-700 font-mono truncate">{value}</span>
        <CopyButton value={value} />
      </div>
      {extra}
    </div>
  </div>
);

// ─── Editable field ───────────────────────────────────────────────────────────
const EditableField = ({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info size={13} className="text-gray-400" />
        </span>
      )}
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    />
  </div>
);

// ─── WhatsApp Configuration Section ──────────────────────────────────────────
const WhatsAppConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  const [channelName, setChannelName] = useState(channel.name);
  const [saved, setSaved] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const chatLink = `https://wa.me/${channel.identifier.replace(/\D/g, '')}`;
  const callbackUrl = 'https://app.yourplatform.com/webhooks/whatsapp/cloud';
  const verifyToken = 'rb_webhook_token_' + channel.id;
  const phoneNumber = channel.identifier.replace(/\D/g, '');
  const wabaName = 'Test WhatsApp Business Account';
  const verifiedName = channel.name;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Configure WhatsApp Cloud API</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage Channel information and settings.</p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <ReadonlyField
          label="Chat Link"
          value={chatLink}
          hint="Direct link customers can use to start a WhatsApp conversation with you"
          extra={
            <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap px-2">
              <QrCode size={14} />
              Generate QR code
            </button>
          }
        />

        <EditableField
          label="Channel Name"
          value={channelName}
          onChange={setChannelName}
          hint="Display name for this channel in your workspace"
          placeholder="e.g. WhatsApp Cloud API (3)"
        />

        <ReadonlyField
          label="WhatsApp Phone Number"
          value={phoneNumber || '15551790691'}
          hint="The phone number registered with WhatsApp Business API"
        />

        <ReadonlyField
          label="WhatsApp Business Account Name"
          value={wabaName}
          hint="Your WhatsApp Business Account name from Meta Business Manager"
        />

        <ReadonlyField
          label="Verified Name"
          value={verifiedName}
          hint="The verified display name for your WhatsApp Business account"
        />

        <ReadonlyField
          label="Callback URL"
          value={callbackUrl}
          hint="Set this URL as your webhook endpoint in Meta Business Manager"
        />

        <ReadonlyField
          label="Verify Token"
          value={verifyToken}
          hint="Use this token when configuring your webhook in Meta Business Manager"
        />
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {saved ? (
            <><Check size={15} /> Saved!</>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDangerZone(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">Danger Zone</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-red-400 transition-transform ${showDangerZone ? 'rotate-180' : ''}`}
          />
        </button>
        {showDangerZone && (
          <div className="px-5 py-4 bg-white border-t border-red-100 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Disconnect this channel</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  This will permanently disconnect your WhatsApp number from this workspace. All message history will be preserved but no new messages will be received.
                </p>
              </div>
              {!confirmDisconnect ? (
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="flex-shrink-0 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDisconnect}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Templates Section ────────────────────────────────────────────────────────
const TemplatesSection = () => {
  const templates = [
    { id: 1, name: 'welcome_message', category: 'UTILITY', status: 'APPROVED', language: 'en' },
    { id: 2, name: 'order_confirmation', category: 'UTILITY', status: 'APPROVED', language: 'en' },
    { id: 3, name: 'appointment_reminder', category: 'UTILITY', status: 'PENDING', language: 'en' },
    { id: 4, name: 'promotional_offer', category: 'MARKETING', status: 'APPROVED', language: 'en' },
    { id: 5, name: 'support_followup', category: 'UTILITY', status: 'REJECTED', language: 'en' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your approved WhatsApp message templates.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Template
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{t.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{t.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{t.language}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                    t.status === 'PENDING'  ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Profile Section ──────────────────────────────────────────────────────────
const ProfileSection = ({ channel }: { channel: ConnectedChannel }) => {
  const [about, setAbout] = useState('We provide excellent customer support 24/7.');
  const [website, setWebsite] = useState('https://yourcompany.com');
  const [email, setEmail] = useState('support@yourcompany.com');
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update your WhatsApp Business profile information.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
          <input
            value={channel.name}
            readOnly
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
          <textarea
            value={about}
            onChange={e => setAbout(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <EditableField label="Website" value={website} onChange={setWebsite} placeholder="https://yourcompany.com" />
        <EditableField label="Email" value={email} onChange={setEmail} placeholder="support@yourcompany.com" />
      </div>
      <button
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        {saved ? <><Check size={15} /> Saved!</> : 'Save Profile'}
      </button>
    </div>
  );
};

// ─── Troubleshoot Section ─────────────────────────────────────────────────────
const TroubleshootSection = ({ channel }: { channel: ConnectedChannel }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Troubleshoot</h2>
      <p className="text-sm text-gray-500 mt-0.5">Diagnose and resolve connection issues.</p>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Webhook Status', value: 'Active', ok: true },
        { label: 'API Connection', value: 'Connected', ok: true },
        { label: 'Phone Number Verified', value: 'Yes', ok: true },
        { label: 'Business Account Status', value: 'Active', ok: true },
        { label: 'Message Delivery', value: channel.status === 'Connected' ? 'Normal' : 'Degraded', ok: channel.status === 'Connected' },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <span className="text-sm text-gray-700">{item.label}</span>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
            {item.value}
          </span>
        </div>
      ))}
    </div>
    <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
      <RefreshCw size={14} /> Run diagnostics
    </button>
  </div>
);

// ─── Meta Product Catalog Section ─────────────────────────────────────────────
const CatalogSection = () => (
  <div className="space-y-5">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Meta Product Catalog</h2>
      <p className="text-sm text-gray-500 mt-0.5">Connect your Meta product catalog to send product messages.</p>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <ShoppingBag size={22} className="text-blue-600" />
      </div>
      <p className="text-sm font-semibold text-blue-900 mb-1">No catalog connected</p>
      <p className="text-xs text-blue-700 mb-4">Connect your Meta product catalog to enable product messages and shopping features.</p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
        Connect Catalog
      </button>
    </div>
  </div>
);

// ─── Private Replies Section (Instagram) ─────────────────────────────────────
interface PrivateReplyPost {
  id: string;
  url: string;
  label: string;
  replyMessage: string;
  keywords: string;
  replyToAll: boolean;
}

const AddPostModal = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (post: PrivateReplyPost) => void;
}) => {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [keywords, setKeywords] = useState('');
  const [replyToAll, setReplyToAll] = useState(true);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!url.trim()) { setError('Post URL is required.'); return; }
    if (!replyMessage.trim()) { setError('Reply message is required.'); return; }
    onAdd({
      id: Date.now().toString(),
      url: url.trim(),
      label: label.trim() || url.trim(),
      replyMessage: replyMessage.trim(),
      keywords: keywords.trim(),
      replyToAll,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Add Post</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure auto-reply for a specific Instagram post or reel</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertTriangle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Post URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                placeholder="https://www.instagram.com/p/..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Label (optional)</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Summer Campaign Post"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reply to comments
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={replyToAll}
                  onChange={() => setReplyToAll(true)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">All comments</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!replyToAll}
                  onChange={() => setReplyToAll(false)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">Specific keywords</span>
              </label>
            </div>
          </div>

          {!replyToAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords</label>
              <input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. price, info, details (comma-separated)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Reply will be sent when a comment contains any of these keywords.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Private reply message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={replyMessage}
              onChange={e => { setReplyMessage(e.target.value); setError(''); }}
              placeholder="Hi! Thanks for your comment. Here's more info..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">This message will be sent as a private DM to anyone who comments.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Send size={13} />
            Add Post
          </button>
        </div>
      </div>
    </div>
  );
};

const PrivateRepliesSection = () => {
  const [trackMode, setTrackMode] = useState<'all' | 'specific'>('specific');
  const [posts, setPosts] = useState<PrivateReplyPost[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PrivateReplyPost | null>(null);

  const handleAddPost = (post: PrivateReplyPost) => {
    setPosts(prev => [...prev, post]);
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Private Replies</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Automatically send a private message to anyone who comments on your Instagram post.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 leading-relaxed">
          Anyone who comments will become a Contact on Axodesk{' '}
          <strong>once they reply to your message.</strong>
        </p>
      </div>

      {/* Track comments on */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Track comments on</p>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setTrackMode('all')}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                trackMode === 'all'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300 group-hover:border-blue-400'
              }`}
            >
              {trackMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm text-gray-700">All posts, reels, and live stories</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setTrackMode('specific')}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                trackMode === 'specific'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300 group-hover:border-blue-400'
              }`}
            >
              {trackMode === 'specific' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm text-gray-700">Specific posts and reels</span>
          </label>
        </div>
      </div>

      {/* Specific posts list */}
      {trackMode === 'specific' && (
        <div className="space-y-3">
          {/* Post cards */}
          {posts.length > 0 && (
            <div className="space-y-2">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image size={18} className="text-purple-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.label}</p>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {post.url}
                    </a>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {post.replyToAll ? 'All comments' : `Keywords: ${post.keywords}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-1 italic">
                      "{post.replyMessage}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add post button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Add post
          </button>

          {posts.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Add specific posts or reels to track comments and send auto-replies.
            </p>
          )}
        </div>
      )}

      {/* All mode info */}
      {trackMode === 'all' && (
        <div className="px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-start gap-3">
            <MessageCircle size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Tracking all posts, reels, and live stories</p>
              <p className="text-xs text-gray-500 mt-0.5">
                A private reply will be sent to anyone who comments on any of your Instagram content.
                Configure the default reply message below.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default reply message</label>
              <textarea
                placeholder="Hi! Thanks for your comment. Here's more info..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Check size={13} />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddModal && (
        <AddPostModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPost}
        />
      )}
    </div>
  );
};

// ─── Chat Menu Section (Facebook Messenger) ──────────────────────────────────
interface ChatMenuButton {
  id: string;
  name: string;
  type: 'payload' | 'url';
  value: string;
}

const ChatMenuSection = () => {
  const [allowUserInput, setAllowUserInput] = useState(true);
  const [buttons, setButtons] = useState<ChatMenuButton[]>([
    { id: '1', name: '', type: 'payload', value: '' },
    { id: '2', name: '', type: 'url',     value: '' },
  ]);
  const [saved, setSaved] = useState(false);

  const addButton = () => {
    setButtons(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', type: 'payload', value: '' },
    ]);
  };

  const removeButton = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const updateButton = (id: string, field: keyof ChatMenuButton, val: string) => {
    setButtons(prev =>
      prev.map(b => b.id === id ? { ...b, [field]: val } : b)
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Chat Menu</h2>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
          Facebook Messenger allows the creation of a persistent menu next to the chat. Create chat
          menu to facilitate your audience to discover more content, visit websites, etc.{' '}
          <a href="#" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>

      {/* Allow User Input */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
        <div
          onClick={() => setAllowUserInput(v => !v)}
          className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
            allowUserInput
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
        >
          {allowUserInput && <Check size={10} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-sm text-gray-700 font-medium">Allow User Input</span>
      </label>

      {/* Button rows */}
      <div className="space-y-3">
        {buttons.map((btn, idx) => (
          <div key={btn.id} className="flex items-start gap-3">
            {/* Button Name */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Button Name</label>
              <input
                value={btn.name}
                onChange={e => updateButton(btn.id, 'name', e.target.value)}
                placeholder="Enter Button Name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Payload / URL */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500">
                  {btn.type === 'payload' ? 'Payload' : 'URL'}
                </label>
                {/* Type toggle */}
                <button
                  onClick={() => updateButton(btn.id, 'type', btn.type === 'payload' ? 'url' : 'payload')}
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-medium leading-none"
                  title="Switch type"
                >
                  Switch to {btn.type === 'payload' ? 'URL' : 'Payload'}
                </button>
              </div>
              <input
                value={btn.value}
                onChange={e => updateButton(btn.id, 'value', e.target.value)}
                placeholder={
                  btn.type === 'payload'
                    ? 'Enter Payload Value'
                    : 'Enter a valid URL. E.g. (https://axodesk.com)'
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Delete */}
            <div className="pt-6">
              <button
                onClick={() => removeButton(btn.id)}
                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                title="Remove button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={addButton}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <Plus size={15} />
        Add Button
      </button>

      {/* Save */}
      <div className="pt-1">
        <button
          onClick={handleSave}
          disabled={buttons.length === 0}
          className="px-5 py-2.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saved ? <><Check size={14} className="text-green-600" /> Saved!</> : 'Save Menu'}
        </button>
      </div>
    </div>
  );
};

// ─── Generic Configuration (non-WhatsApp) ────────────────────────────────────
const GenericConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  const [name, setName] = useState(channel.name);
  const [saved, setSaved] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Configure {channel.type}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage channel information and settings.</p>
      </div>
      <div className="space-y-4">
        <EditableField label="Channel Name" value={name} onChange={setName} />
        <ReadonlyField label="Identifier" value={channel.identifier} />
        <ReadonlyField
          label="Callback URL"
          value={`https://app.yourplatform.com/webhooks/${channel.type.toLowerCase().replace(/\s+/g, '-')}`}
        />
      </div>
      <button
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
      </button>
      <div className="border border-red-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" /> Danger Zone
            </p>
            <p className="text-xs text-gray-500 mt-1">Disconnect this channel from your workspace.</p>
          </div>
          {!confirmDisconnect ? (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="flex-shrink-0 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmDisconnect(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium">Cancel</button>
              <button onClick={onDisconnect} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Confirm</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Section renderer ─────────────────────────────────────────────────────────
const SectionContent = ({
  sectionId,
  channelType,
  channel,
  onDisconnect,
}: {
  sectionId: string;
  channelType: string;
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  if (sectionId === 'templates')       return <TemplatesSection />;
  if (sectionId === 'profile')         return <ProfileSection channel={channel} />;
  if (sectionId === 'troubleshoot')    return <TroubleshootSection channel={channel} />;
  if (sectionId === 'catalog')         return <CatalogSection />;
  if (sectionId === 'private_replies') return <PrivateRepliesSection />;
  if (sectionId === 'chat_menu')       return <ChatMenuSection />;

  // configuration (default)
  if (channelType === 'whatsapp_cloud') {
    return <WhatsAppConfiguration channel={channel} onDisconnect={onDisconnect} />;
  }
  return <GenericConfiguration channel={channel} onDisconnect={onDisconnect} />;
};

// ─── Channel icon component ───────────────────────────────────────────────────
const ChannelIcon = ({ channelType, size = 'md' }: { channelType: string; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-8 h-8 text-base' : 'w-11 h-11 text-2xl';
  const meta = CHANNEL_META[channelType];
  if (!meta) return null;
  return (
    <div className={`${cls} ${meta.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
      {meta.icon}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ManageChannelPage = () => {
  const { channelType, channelId } = useParams<{ channelType: string; channelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('configuration');

  // Channel data passed via location state
  const channel = (location.state as { channel?: ConnectedChannel } | null)?.channel;

  const meta = channelType ? CHANNEL_META[channelType] : null;

  // Fallback if no meta or channel
  if (!meta || !channelType) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔌</div>
          <p className="text-lg font-semibold text-gray-700">Channel not found</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">The channel you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/channels')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Back to channels
          </button>
        </div>
      </div>
    );
  }

  // Build a mock channel if none was passed via state
  const resolvedChannel: ConnectedChannel = channel ?? {
    id: 1,
    name: meta.label,
    type: meta.label,
    identifier: channelType === 'whatsapp_cloud' ? '+1 555 179 0691' : 'channel@example.com',
    status: 'Connected',
    icon: meta.icon,
    color: meta.color,
    msgs: 1243,
    connectedAt: 'Jan 12, 2025',
  };

  const handleDisconnect = () => {
    navigate('/channels', { state: { disconnectedId: resolvedChannel.id } });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/channels')}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/channels')} className="hover:text-blue-600 transition-colors">
            Channels
          </button>
          <span>/</span>
          <span className="text-gray-700 font-medium">{meta.label}</span>
        </nav>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Channel identity */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5 mb-2">
              <ChannelIcon channelType={channelType} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{resolvedChannel.name}</p>
                <p className="text-xs text-gray-400">ID: {channelId ?? resolvedChannel.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                resolvedChannel.status === 'Connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${resolvedChannel.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                {resolvedChannel.status}
              </span>
              <button
                title="Refresh connection"
                className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-2 py-3 flex-1">
            {meta.navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                  activeSection === item.id
                    ? 'text-blue-600 font-medium bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={activeSection === item.id ? 'text-blue-500' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Migrate button */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button className="w-full px-3 py-2 border border-blue-300 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors">
              Migrate to Axodesk.com
            </button>
          </div>

          {/* Connected by */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Connected by</p>
            <p className="text-xs text-gray-700 font-medium">Nirmala Kanani</p>
            <p className="text-xs text-gray-400">(ID: 1034185)</p>
          </div>

          {/* Additional Resources */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Additional Resources</p>
            <ul className="space-y-1.5">
              {meta.additionalResources.map(r => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    className="flex items-start gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline leading-relaxed"
                  >
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            <SectionContent
              sectionId={activeSection}
              channelType={channelType}
              channel={resolvedChannel}
              onDisconnect={handleDisconnect}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
