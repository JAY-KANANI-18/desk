import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, RefreshCw, QrCode, Info,
  Settings, FileText, User, Wrench, ShoppingBag,
  ExternalLink, Trash2, AlertTriangle, ChevronDown,
  MessageSquare, Globe, Mail, Instagram, Facebook,
  MessageCircle, Plus, X, Image, Link2, Send, Menu,
  Loader, AlertCircle,
} from 'lucide-react';

// ─── Import your API helpers ──────────────────────────────────────────────────
import { ChannelApi } from '../../lib/channelApi';
import { EmailConfiguration } from '../workspace/channels/EmailConfig';
import { GmailConfiguration } from '../workspace/channels/gmailConfig';
import { InstagramConfiguration } from '../workspace/channels/InstagramConfig';
import { MessengerConfiguration } from '../workspace/channels/MessengerConfig';
import { WebsiteChatConfiguration } from '../workspace/channels/WebsiteChatConfig';
import { WhatsAppConfiguration } from '../workspace/channels/WhatsAppCloudConfig';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useChannel } from '../../context/ChannelContext';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConnectedChannel {
  id: number;
  name: string;
  type: string;
  identifier: string;
  status: 'Connected' | 'Error' | 'Disconnected';
  icon: string;
  color: string;
  msgs: number;
  connectedAt: string;
  config?: any
}

// ─── Save Status Hook ─────────────────────────────────────────────────────────
// Returns { saving, saved, error, save }
// `save` accepts an async fn — it handles loading/success/error states
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await fn();
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error ?? 'Something went wrong');
      setTimeout(() => setError(null), 4000);
    }
  };

  return { saving, saved, error, save };
}

// ─── Save Button ──────────────────────────────────────────────────────────────
export const SaveButton = ({
  saving, saved, error, onClick, label = 'Save Changes',
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  onClick: () => void;
  label?: string;
}) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onClick}
      disabled={saving}
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {saving ? (
        <><Loader size={14} className="animate-spin" /> Saving…</>
      ) : saved ? (
        <><Check size={15} /> Saved!</>
      ) : (
        label
      )}
    </button>
    {error && (
      <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <AlertCircle size={13} /> {error}
      </span>
    )}
  </div>
);

// ─── Channel meta ─────────────────────────────────────────────────────────────
const
  CHANNEL_META: Record<string, {
    label: string;
    icon: string;
    color: string;
    navItems: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
    additionalResources: { label: string; href: string }[];
  }> = {
    whatsapp: {
      label: 'WhatsApp Cloud API',
      icon: 'https://cdn.simpleicons.org/whatsapp',
      color: 'bg-green-500',
      navItems: [
        { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
        { id: 'templates', label: 'Templates', icon: <FileText size={14} /> },
        { id: 'profile', label: 'Profile', icon: <User size={14} /> },
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
        { id: 'catalog', label: 'Meta Product Catalog', icon: <ShoppingBag size={14} /> },
      ],
      additionalResources: [
        { label: 'Benefits of migrating to Axodesk Business Platform (API)', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    messenger: {
      label: 'Facebook Messenger',
      icon: 'https://cdn.simpleicons.org/messenger',
      color: 'bg-blue-600',
      navItems: [
        { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
        { id: 'templates', label: 'Templates', icon: <FileText size={14} /> },
        { id: 'private_replies', label: 'Private Replies', icon: <MessageCircle size={14} /> },
        { id: 'chat_menu', label: 'Chat Menu', icon: <Menu size={14} /> },
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
      ],
      additionalResources: [
        { label: 'About Facebook Message Templates', href: '#' },
        { label: 'About Private Replies', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    instagram: {
      label: 'Instagram',
      icon: 'https://cdn.simpleicons.org/instagram',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      navItems: [
        { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
        { id: 'private_replies', label: 'Private Replies', icon: <MessageCircle size={14} />, badge: 'New' },
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
      ],
      additionalResources: [
        { label: 'Instagram Messaging API documentation', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    email: {
      label: 'Email (SMTP / IMAP)',
      icon: 'https://cdn.simpleicons.org/email',
      color: 'bg-indigo-500',
      navItems: [
        { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
      ],
      additionalResources: [
        { label: 'Email channel setup guide', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    gmail: {
      label: 'Gmail',
      icon: 'https://cdn.simpleicons.org/gmail',
      color: 'bg-red-500',
      navItems: [
        { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
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
        { id: 'troubleshoot', label: 'Troubleshoot', icon: <Wrench size={14} /> },
      ],
      additionalResources: [
        { label: 'Install Website Chat Widget on WordPress', href: '#' },
        { label: 'Install Website Chat Widget on Shopify', href: '#' },
        { label: 'Install Website Chat Widget on Wix', href: '#' },
      ],
    },
  };

export const CHANNEL_TYPE_TO_SLUG: Record<string, string> = {
  // 'WhatsApp Business Platform (API)': 'whatsapp_cloud',
  'WhatsApp Cloud API': 'whatsapp',
  'Facebook Messenger': 'messenger',
  'Instagram': 'instagram',
  'Email': 'email',
  'Email (SMTP/IMAP)': 'email',
  'Gmail': 'gmail',
  'Website Chat': 'website_chat',
};



// ─── CopyButton ───────────────────────────────────────────────────────────────
export const CopyButton = ({ value, className = '' }: { value: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

export const ReadonlyField = ({ label, value, hint, extra }: { label: string; value: string; hint?: string; extra?: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <span title={hint} className="cursor-help"><Info size={13} className="text-gray-400" /></span>}
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

export const EditableField = ({ label, value, onChange, hint, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string;
}) => (
  <div>
    <div className="flex  items-center gap-1.5 mb-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <span title={hint} className="cursor-help"><Info size={13} className="text-gray-400" /></span>}
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP CONFIGURATION  →  PUT /channels/whatsapp/:channelId
// Fields sent: accessToken, phoneNumber, wabaId, waba_account_name,
//              verifiedName, veriytoken, graphApiVersion, metaappname,
//              systemUserName, tokenExpiry, conversationwindow
// ─────────────────────────────────────────────────────────────────────────────







// ─── All remaining sections (unchanged) ──────────────────────────────────────
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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Template</button>
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
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{t.category}</span></td>
                <td className="px-4 py-3 text-gray-600 text-xs">{t.language}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === 'APPROVED' ? 'bg-green-50 text-green-700' : t.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
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

const ProfileSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { saving, saved, error, save } = useSave();
  const [about, setAbout] = useState('We provide excellent customer support 24/7.');
  const [website, setWebsite] = useState('https://yourcompany.com');
  const [email, setEmail] = useState('support@yourcompany.com');

  // Profile updates go to the same whatsapp endpoint — or add a dedicated /profile endpoint
  const handleSave = () =>
    save(() =>
      ChannelApi.updateWhatsAppChannel(String(channel.id), { accessToken: '' }) // extend as needed
    );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update your WhatsApp Business profile information.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
          <input value={channel.name} readOnly className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <EditableField label="Website" value={website} onChange={setWebsite} placeholder="https://yourcompany.com" />
        <EditableField label="Email" value={email} onChange={setEmail} placeholder="support@yourcompany.com" />
      </div>
      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} label="Save Profile" />
    </div>
  );
};

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
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
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
      <p className="text-xs text-blue-700 mb-4">Connect your Meta product catalog to enable product messages.</p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Connect Catalog</button>
    </div>
  </div>
);

// Private Replies & Chat Menu sections unchanged (no API call needed for now)
const PrivateRepliesSection = () => {
  const [trackMode, setTrackMode] = useState<'all' | 'specific'>('specific');
  const [posts, setPosts] = useState<any[]>([]);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Private Replies</h2>
        <p className="text-sm text-gray-500 mt-0.5">Automatically send a private message to anyone who comments on your post.</p>
      </div>
      <div className="flex items-center gap-6">
        {(['all', 'specific'] as const).map(mode => (
          <label key={mode} className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => setTrackMode(mode)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${trackMode === mode ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
              {trackMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm text-gray-700">{mode === 'all' ? 'All posts, reels, and live stories' : 'Specific posts and reels'}</span>
          </label>
        ))}
      </div>
      {trackMode === 'specific' && (
        <button onClick={() => { }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Plus size={15} /> Add post
        </button>
      )}
    </div>
  );
};

const ChatMenuSection = () => {
  const { saving, saved, error, save } = useSave();
  const [buttons, setButtons] = useState([{ id: '1', name: '', type: 'payload', value: '' }]);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Chat Menu</h2>
        <p className="text-sm text-gray-500 mt-0.5">Persistent menu for Facebook Messenger.</p>
      </div>
      <button onClick={() => setButtons(p => [...p, { id: Date.now().toString(), name: '', type: 'payload', value: '' }])}
        className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
        <Plus size={15} /> Add Button
      </button>
      <SaveButton saving={saving} saved={saved} error={error} onClick={() => save(async () => ({ success: true }))} label="Save Menu" />
    </div>
  );
};

// ─── Section renderer — now routes to channel-specific config ─────────────────
const SectionContent = ({
  sectionId, channelType, channel, onDisconnect,
}: {
  sectionId: string; channelType: string; channel: ConnectedChannel; onDisconnect: () => void;
}) => {
  if (sectionId === 'templates') return <TemplatesSection />;
  if (sectionId === 'profile') return <ProfileSection channel={channel} />;
  if (sectionId === 'troubleshoot') return <TroubleshootSection channel={channel} />;
  if (sectionId === 'catalog') return <CatalogSection />;
  if (sectionId === 'private_replies') return <PrivateRepliesSection />;
  if (sectionId === 'chat_menu') return <ChatMenuSection />;

  // Configuration — pick the right form per channel type
  switch (channelType) {
    case 'whatsapp': return <WhatsAppConfiguration channel={channel} onDisconnect={onDisconnect} />;
    case 'instagram': return <InstagramConfiguration channel={channel} onDisconnect={onDisconnect} />;
    case 'messenger': return <MessengerConfiguration channel={channel} onDisconnect={onDisconnect} />;
    case 'email': return <EmailConfiguration channel={channel} onDisconnect={onDisconnect} />;
    case 'gmail': return <GmailConfiguration channel={channel} onDisconnect={onDisconnect} />;
    case 'website_chat': return <WebsiteChatConfiguration channel={channel} onDisconnect={onDisconnect} />;
    default: return <WhatsAppConfiguration channel={channel} onDisconnect={onDisconnect} />;
  }
};

// ─── Channel icon ─────────────────────────────────────────────────────────────
const ChannelIcon = ({ channelType, size = 'md' }: { channelType: string; size?: 'sm' | 'md' }) => {
  const meta = CHANNEL_META[channelType];
  if (!meta) return null;
  return (
    <div className={`  rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <img src={meta.icon} alt={`${meta.label} icon`} className="w-10 h-10" />
    </div>
  );
};

// ─── Main Page (unchanged structure) ─────────────────────────────────────────
export const ManageChannelPage = () => {
  const { channelType, channelId } = useParams<{ channelType: string; channelId: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('configuration');
  // const [channel, setChannel] = useState(null);
  // const [meta, setMeta] = useState(null);


  // if(!channels || channels?.length === 0) {
  //   return null; // or a loading spinner if channels are being fetched
  // }




  const handleDisconnect = () => navigate('/channels');

  // useEffect(() => {
  //   console.log({ channels });
  //   const channel = channels?.find(c => String(c.id) === channelId);
  //   const meta: any = channelType ? CHANNEL_META[channelType] : null;
  //   setChannel(channel);
  //   setMeta(meta);
  // }, [channels, channelId, channelType]
  // )
const { channels } = useChannel()

if (!channels?.length) {
  return <div>Loading...</div>
}

const channel = channels.find(c => String(c.id) === channelId)
const meta = channelType ? CHANNEL_META[channelType] : null


  if (!meta || !channelType) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔌</div>
          <p className="text-lg font-semibold text-gray-700">Channel not found</p>
          <button onClick={() => navigate('/channels')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Back to channels
          </button>
        </div>
      </div>
    );
  }

  // const resolvedChannel: ConnectedChannel = channel ?? {
  //   id: 1,
  //   name: meta.label,
  //   type: meta.label,
  //   identifier: channelType === 'whatsapp' ? '+1 555 179 0691' : 'channel@example.com',
  //   status: 'Connected',
  //   icon: meta.icon,
  //   color: meta.color,
  //   msgs: 1243,
  //   connectedAt: 'Jan 12, 2025',
  // };



  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/channels')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/channels')} className="hover:text-blue-600 transition-colors">Channels</button>
          <span>/</span>
          <span className="text-gray-700 font-medium">{meta?.label}</span>
        </nav>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5 mb-2">
              <ChannelIcon channelType={channelType} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{channel?.name}</p>
              </div>
            </div>
            <p className="text-xs my-3 text-gray-400">ID: {channelId ?? channel?.id}</p>

          </div>

          <nav className="px-2 py-3 flex-1">
            {meta.navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${activeSection === item.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <span className={activeSection === item.id ? 'text-blue-500' : 'text-gray-400'}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded leading-none">{item.badge}</span>}
              </button>
            ))}
          </nav>


          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-1">Connected by</p>
            <p className="text-xs text-gray-700 font-medium">Nirmala Kanani</p>
            <p className="text-xs text-gray-400">(ID: 1034185)</p>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Additional Resources</p>
            <ul className="space-y-1.5">
              {meta.additionalResources.map(r => (
                <li key={r.label}>
                  <a href={r.href} className="flex items-start gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline leading-relaxed">
                    <span className="mt-0.5 flex-shrink-0">•</span>{r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="  px-8 py-8">
            <SectionContent
              sectionId={activeSection}
              channelType={channelType}
              channel={channel}
              onDisconnect={handleDisconnect}
            />
          </div>
        </main>
      </div>
    </div>
  );
};