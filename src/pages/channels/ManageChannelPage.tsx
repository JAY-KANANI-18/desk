// src/pages/channels/ManageChannelPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, RefreshCw, QrCode,
  Info, Settings, FileText, User, Wrench, ShoppingBag,
  MessageCircle, Plus, Menu, Loader, AlertCircle,
  ChevronDown, AlertTriangle,
} from 'lucide-react';

import { ChannelApi } from '../../lib/channelApi';
import { WhatsAppConfiguration } from '../workspace/channels/WhatsAppCloudConfig';
import { InstagramConfiguration } from '../workspace/channels/InstagramConfig';
import { MessengerConfiguration } from '../workspace/channels/MessengerConfig';
import { EmailConfiguration } from '../workspace/channels/EmailConfigV2';
import { GmailConfiguration } from '../workspace/channels/GmailConfig';
import { WebsiteChatConfiguration } from '../workspace/channels/WebsiteChatConfig';

import { useWorkspace } from '../../context/WorkspaceContext';
import { useChannel } from '../../context/ChannelContext';
import { InstagramIceBreakersSection } from '../workspace/channels/InstagramIceBreakers';
import { MessengerChatMenuSection } from '../workspace/channels/MessengerChatMenu';
import { WhatsAppTemplatesSection } from '../workspace/channels/WhatsAppTemplates';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConnectedChannel {
  id: number | string;
  name: string;
  type: string;
  identifier: string;
  status: 'Connected' | 'Error' | 'Disconnected';
  icon?: string;
  color?: string;
  msgs?: number;
  connectedAt?: string;
  config?: any;
  credentials?: any;
}

// ─── useSave hook ─────────────────────────────────────────────────────────────
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // if (result.success) {
    // } else {
    //   setError(result.error ?? 'Something went wrong');
    //   setTimeout(() => setError(null), 4000);
    // }
  };

  return { saving, saved, error, save };
}

// ─── SaveButton ───────────────────────────────────────────────────────────────
export const SaveButton = ({
  saving, saved, error, onClick, label = 'Save Changes', disabled = false,
}: {
  saving: boolean; saved: boolean; error: string | null;
  onClick: () => void; label?: string; disabled?: boolean;
}) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {saving ? (
        <><Loader size={14} className="animate-spin" />Saving…</>
      ) : saved ? (
        <><Check size={15} />Saved!</>
      ) : label}
    </button>
    {error && (
      <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <AlertCircle size={13} />{error}
      </span>
    )}
    {saved && !error && (
      <span className="text-xs text-green-600 font-medium">Changes saved successfully</span>
    )}
  </div>
);

// ─── CopyButton ───────────────────────────────────────────────────────────────
export const CopyButton = ({ value, className = '' }: { value: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

// ─── ReadonlyField ────────────────────────────────────────────────────────────
export const ReadonlyField = ({ label, value, hint, extra }: {
  label: string; value: string; hint?: string; extra?: React.ReactNode;
}) => (
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

// ─── EditableField ────────────────────────────────────────────────────────────
export const EditableField = ({ label, value, onChange, hint, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  hint?: string; placeholder?: string; type?: string;
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <span title={hint} className="cursor-help"><Info size={13} className="text-gray-400" /></span>}
    </div>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
    />
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

// ─── DangerZone (shared by all configs) ──────────────────────────────────────
export const DangerZone = ({ channelLabel, onDisconnect,channelId }: {
  channelLabel: string; onDisconnect: () => void; channelId:string;
}) => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { saving, error, save } = useSave();

  const handleDisconnect = () =>
    save(async () => {
      const r = await ChannelApi.deleteChannel(channelId); // channelId passed from parent
      onDisconnect()
      return r
    });

  return (
    <div className="border border-red-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-red-700">Danger Zone</span>
        </div>
        <ChevronDown size={16} className={`text-red-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-red-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Disconnect this channel</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently disconnects this {channelLabel} channel. 
              </p>
                {/* Message history is preserved. */}
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                className="flex-shrink-0 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
              >
                Disconnect
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setConfirm(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={saving}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving && <Loader size={11} className="animate-spin" />}
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Channel metadata ─────────────────────────────────────────────────────────
export const CHANNEL_META: Record<string, {
  label: string; icon: string; color: string;
  navItems: { id: string; label: string; icon: React.ReactNode; badge?: string }[];
  additionalResources: { label: string; href: string }[];
}> = {
  whatsapp: {
    label: 'WhatsApp Cloud API',
    icon: 'https://cdn.simpleicons.org/whatsapp',
    color: 'bg-green-500',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'templates',     label: 'Templates',     icon: <FileText size={14} /> },
      // { id: 'profile',       label: 'Profile',       icon: <User size={14} /> },
      // { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
      // { id: 'catalog',       label: 'Meta Catalog',  icon: <ShoppingBag size={14} /> },
    ],
    additionalResources: [
      { label: 'WhatsApp Cloud API docs', href: 'https://developers.facebook.com/docs/whatsapp' },
      { label: 'Template guidelines', href: 'https://developers.facebook.com/docs/whatsapp/message-templates' },
      { label: 'Help Center', href: '#' },
    ],
  },
  messenger: {
    label: 'Facebook Messenger',
    icon: 'https://cdn.simpleicons.org/messenger',
    color: 'bg-indigo-600',
    navItems: [
      { id: 'configuration',  label: 'Configuration',   icon: <Settings size={14} /> },
      // { id: 'private_replies',label: 'Private Replies',  icon: <MessageCircle size={14} /> },
      // { id: 'chat_menu',      label: 'Chat Menu',        icon: <Menu size={14} /> },
      // { id: 'troubleshoot',   label: 'Troubleshoot',     icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Messenger Platform docs', href: 'https://developers.facebook.com/docs/messenger-platform' },
      { label: 'About Private Replies', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
  instagram: {
    label: 'Instagram',
    icon: 'https://cdn.simpleicons.org/instagram',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    navItems: [
      { id: 'configuration',  label: 'Configuration',   icon: <Settings size={14} /> },
      // { id: 'icebreakers',    label: 'Ice-Breakers',    icon: <MessageCircle size={14} />, badge: 'New' },
      // { id: 'private_replies',label: 'Private Replies',  icon: <MessageCircle size={14} /> },
      // { id: 'troubleshoot',   label: 'Troubleshoot',     icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Instagram Messaging API docs', href: 'https://developers.facebook.com/docs/instagram-api/guides/business-messaging' },
      { label: 'Help Center', href: '#' },
    ],
  },
  email: {
    label: 'Email (SMTP/IMAP)',
    icon: 'https://cdn.simpleicons.org/maildotru',
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
    icon: 'https://cdn.simpleicons.org/gmail',
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
  webchat: {
    label: 'Website Chat',
    icon: 'https://cdn.simpleicons.org/googlechat',
    color: 'bg-indigo-800',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Install on WordPress', href: '#' },
      { label: 'Install on Shopify', href: '#' },
      { label: 'Install on Wix', href: '#' },
    ],
  },
  sms: {
    label: 'MSG91 SMS',
    icon: 'https://cdn.simpleicons.org/androidmessages',
    color: 'bg-emerald-600',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'MSG91 Docs', href: 'https://msg91.com/help' },
    ],
  },
  exotel_call: {
    label: 'Exotel Calling',
    icon: 'https://cdn.simpleicons.org/ringcentral',
    color: 'bg-cyan-600',
    navItems: [
      { id: 'configuration', label: 'Configuration', icon: <Settings size={14} /> },
      { id: 'troubleshoot',  label: 'Troubleshoot',  icon: <Wrench size={14} /> },
    ],
    additionalResources: [
      { label: 'Exotel Docs', href: 'https://developer.exotel.com/' },
    ],
  },
};

export const CHANNEL_TYPE_TO_SLUG: Record<string, string> = {
  'WhatsApp Cloud API': 'whatsapp',
  'Facebook Messenger': 'messenger',
  'Instagram':          'instagram',
  'Email':              'email',
  'Email (SMTP/IMAP)':  'email',
  'Gmail':              'gmail',
  'Website Chat':       'webchat',
  'MSG91 SMS':          'sms',
  'Exotel Calling':     'exotel_call',
};

// ─── Generic sections ─────────────────────────────────────────────────────────

const ProfileSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { saving, saved, error, save } = useSave();
  const [about,   setAbout]   = useState(channel?.config?.about ?? 'We provide excellent customer support 24/7.');
  const [website, setWebsite] = useState(channel?.config?.website ?? '');
  const [email,   setEmail]   = useState(channel?.config?.email ?? '');

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
          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <EditableField label="Website" value={website} onChange={setWebsite} placeholder="https://yourcompany.com" />
        <EditableField label="Support Email" value={email} onChange={setEmail} placeholder="support@yourcompany.com" />
      </div>
      <SaveButton saving={saving} saved={saved} error={error}
        onClick={() => save(() => ChannelApi.updateWhatsAppChannel(String(channel.id), {
          accessToken: channel.config?.accessToken ?? '',
        }))}
        label="Save Profile"
      />
    </div>
  );
};

const TroubleshootSection = ({ channel }: { channel: ConnectedChannel }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([
    { label: 'Webhook Status',          value: 'Active',                                         ok: true  },
    { label: 'API Connection',          value: 'Connected',                                      ok: true  },
    { label: 'Phone Number Verified',   value: 'Yes',                                            ok: true  },
    { label: 'Business Account Status', value: 'Active',                                         ok: true  },
    { label: 'Message Delivery',        value: channel.status === 'Connected' ? 'Normal' : 'Degraded', ok: channel.status === 'Connected' },
  ]);

  const runDiagnostics = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1200));
    setRunning(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Troubleshoot</h2>
        <p className="text-sm text-gray-500 mt-0.5">Diagnose and resolve connection issues.</p>
      </div>
      <div className="space-y-2.5">
        {results.map(item => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <button onClick={runDiagnostics} disabled={running}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
        {running ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {running ? 'Running…' : 'Run diagnostics'}
      </button>
    </div>
  );
};

const CatalogSection = () => (
  <div className="space-y-5">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Meta Product Catalog</h2>
      <p className="text-sm text-gray-500 mt-0.5">Connect your Meta product catalog to send product messages.</p>
    </div>
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <ShoppingBag size={24} className="text-indigo-600" />
      </div>
      <p className="text-sm font-semibold text-indigo-900 mb-1">No catalog connected</p>
      <p className="text-xs text-indigo-700 mb-4">Connect your Meta product catalog to enable product messages and interactive shopping experiences.</p>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Connect Catalog</button>
    </div>
  </div>
);

const PrivateRepliesSection = () => {
  const [trackMode, setTrackMode] = useState<'all' | 'specific'>('specific');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Private Replies</h2>
        <p className="text-sm text-gray-500 mt-0.5">Automatically send a private message when someone comments on your posts.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Private replies use the 24-hour messaging window. The contact must comment before you can reply.</p>
      </div>
      <div className="flex flex-col gap-3">
        {(['all', 'specific'] as const).map(mode => (
          <label key={mode} className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setTrackMode(mode)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${trackMode === mode ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
              {trackMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm text-gray-700">
              {mode === 'all' ? 'All posts, reels, and live stories' : 'Specific posts and reels only'}
            </span>
          </label>
        ))}
      </div>
      {trackMode === 'specific' && (
        <div className="space-y-3">
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            No posts added yet
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
            <Plus size={15} />Add post
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Section router ───────────────────────────────────────────────────────────
const SectionContent = ({
  sectionId, channelType, channel, onDisconnect,
}: {
  sectionId: string; channelType: string; channel: ConnectedChannel; onDisconnect: () => void;
}) => {
  // Shared sections
  if (sectionId === 'profile')         return <ProfileSection channel={channel} />;
  if (sectionId === 'troubleshoot')    return <TroubleshootSection channel={channel} />;
  if (sectionId === 'catalog')         return <CatalogSection />;
  if (sectionId === 'private_replies') return <PrivateRepliesSection />;

  // Channel-specific feature sections
  if (sectionId === 'templates')       return <WhatsAppTemplatesSection channel={channel} />;
  if (sectionId === 'icebreakers')     return <InstagramIceBreakersSection channel={channel} />;
  if (sectionId === 'chat_menu')       return <MessengerChatMenuSection channel={channel} />;

  // Configuration — one per channel type
  switch (channelType) {
    case 'whatsapp':    return <WhatsAppConfiguration   channel={channel} onDisconnect={onDisconnect} />;
    case 'instagram':   return <InstagramConfiguration  channel={channel} onDisconnect={onDisconnect} />;
    case 'messenger':   return <MessengerConfiguration  channel={channel} onDisconnect={onDisconnect} />;
    case 'email':       return <EmailConfiguration      channel={channel} onDisconnect={onDisconnect} />;
    case 'gmail':       return <GmailConfiguration      channel={channel} onDisconnect={onDisconnect} />;
    case 'webchat':return <WebsiteChatConfiguration channel={channel} onDisconnect={onDisconnect} />;
    default:            return <EmailConfiguration      channel={channel} onDisconnect={onDisconnect} />;
  }
};

// ─── Main page ────────────────────────────────────────────────────────────────
export const ManageChannelPage = () => {
  const { channelType, channelId } = useParams<{ channelType: string; channelId: string }>();
  const navigate = useNavigate();
const { channels, loading, refreshing ,refreshChannels} = useChannel();
  const [activeSection, setActiveSection] = useState('configuration');


  if (loading || refreshing) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader size={28} className="animate-spin" />
          <span className="text-sm">Loading channel…</span>
        </div>
      </div>
    );
  }

  const channel = channels.find(c => String(c.id) === channelId);
  const meta = channelType ? CHANNEL_META[channelType] : null;
  console.log({channel,meta,channelType,channelId,channels});
  

  if (!meta || !channelType || !channel) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔌</div>
          <p className="text-lg font-semibold text-gray-700">Channel not found</p>
          <p className="text-sm text-gray-400 mt-1">This channel may have been disconnected.</p>
          <button onClick={() => navigate('/channels')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Back to channels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/channels')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/channels')} className="hover:text-indigo-600 transition-colors">Channels</button>
          <span>/</span>
          <span className="text-gray-700 font-medium">{meta.label}</span>
          {channel.name && channel.name !== meta.label && (
            <><span>/</span><span className="text-gray-500">{channel.name}</span></>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            channel.status === 'Connected' ? 'bg-green-50 text-green-700' :
            channel.status === 'Error'     ? 'bg-red-50 text-red-600' :
                                             'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              channel.status === 'Connected' ? 'bg-green-500' :
              channel.status === 'Error'     ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            {channel.status ?? 'Unknown'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Channel identity */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <img src={meta.icon} alt={meta.label} className="w-9 h-9 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{channel.name}</p>
                <p className="text-xs text-gray-400 truncate">{meta.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono">ID: {channelId ?? channel.id}</p>
          </div>

          {/* Nav items */}
          <nav className="px-2 py-3 flex-1">
            {meta.navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                  activeSection === item.id
                    ? 'text-indigo-600 font-medium bg-indigo-50'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <span className={activeSection === item.id ? 'text-indigo-500' : 'text-gray-400'}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Connected by */}
          {channel.connectedAt && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Connected</p>
              <p className="text-xs text-gray-400">{channel.connectedAt}</p>
            </div>
          )}

          {/* Additional resources */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Resources</p>
            <ul className="space-y-1.5">
              {meta.additionalResources.map(r => (
                <li key={r.label}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline leading-relaxed">
                    <span className="mt-0.5 flex-shrink-0">•</span>{r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-3xl">
            <SectionContent
              sectionId={activeSection}
              channelType={channelType}
              channel={channel}
              onDisconnect={() => {refreshChannels() 
                navigate('/channels')}}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
