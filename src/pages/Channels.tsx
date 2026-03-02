import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ArrowLeft, Plus, Settings, AlertCircle, CheckCircle2,
  XCircle, MoreVertical, Trash2, RefreshCw, ExternalLink,
  MessageSquare, Zap, Globe,
} from 'lucide-react';
import { CHANNEL_TYPE_TO_SLUG } from './channels/ManageChannelPage';

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

interface CatalogChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  category: string;
}

// ─── Slug map: catalog ID → connect page slug ─────────────────────────────────
const CHANNEL_CONNECT_SLUGS: Record<string, string> = {
  'whatsapp':       'whatsapp_cloud',
  'whatsapp-cloud': 'whatsapp_cloud',
  'facebook':       'facebook',
  'instagram':      'instagram',
  'email':          'email',
  'gmail':          'gmail',
  'website_chat':   'website_chat',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CONNECTED_CHANNELS: ConnectedChannel[] = [
  {
    id: 1,
    name: 'WhatsApp Business',
    type: 'WhatsApp Business Platform (API)',
    identifier: '+1 555 0100',
    status: 'Connected',
    icon: '💬',
    color: 'bg-green-500',
    msgs: 1243,
    connectedAt: 'Jan 12, 2025',
  },
  {
    id: 2,
    name: 'Instagram DM',
    type: 'Instagram',
    identifier: '@mycompany',
    status: 'Connected',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    msgs: 432,
    connectedAt: 'Feb 3, 2025',
  },
  {
    id: 3,
    name: 'Facebook Messenger',
    type: 'Facebook Messenger',
    identifier: 'My Company Page',
    status: 'Connected',
    icon: '💬',
    color: 'bg-blue-500',
    msgs: 287,
    connectedAt: 'Feb 14, 2025',
  },
  {
    id: 4,
    name: 'Email (SMTP)',
    type: 'Email',
    identifier: 'support@company.com',
    status: 'Error',
    icon: '✉️',
    color: 'bg-purple-500',
    msgs: 0,
    connectedAt: 'Mar 1, 2025',
  },
];

const CATALOG_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'business', name: 'Business Messaging' },
  { id: 'calls', name: 'Calls' },
  { id: 'sms', name: 'SMS' },
  { id: 'email', name: 'Email' },
  { id: 'livechat', name: 'Live Chat' },
];

const CATALOG_CHANNELS: CatalogChannel[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Platform (API)',
    description: 'Connect WhatsApp Business API via Facebook to enable seamless customer messaging at scale.',
    icon: '💬',
    color: 'bg-green-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'business',
  },
  {
    id: 'whatsapp-cloud',
    name: 'WhatsApp Cloud API',
    description: 'Connect WhatsApp Cloud API and manage your messages easily in one place.',
    icon: '💬',
    color: 'bg-green-500',
    category: 'business',
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect Facebook Messenger to engage with your customers on the world\'s largest social platform.',
    icon: '💬',
    color: 'bg-blue-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'business',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram to reply to private messages and build strong brand connections.',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'business',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect TikTok Business Messaging to engage with a whole new audience from TikTok.',
    icon: '🎵',
    color: 'bg-black',
    badge: 'Beta',
    badgeColor: 'bg-blue-100 text-blue-700',
    category: 'business',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Connect Telegram Bot to provide real-time support when customers reach out.',
    icon: '✈️',
    color: 'bg-blue-400',
    category: 'business',
  },
  {
    id: 'viber',
    name: 'Viber',
    description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
    icon: '💜',
    color: 'bg-purple-500',
    category: 'business',
  },
  {
    id: 'line',
    name: 'LINE',
    description: 'Connect LINE Official Account to provide timely support to your customers.',
    icon: '💚',
    color: 'bg-green-400',
    category: 'business',
  },
  {
    id: 'wechat',
    name: 'WeChat',
    description: 'Connect WeChat Service Account for customer engagement and brand communication.',
    icon: '💬',
    color: 'bg-green-600',
    category: 'business',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail or Google Workspace account to manage emails from your inbox.',
    icon: '📧',
    color: 'bg-red-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'email',
  },
  {
    id: 'email',
    name: 'Email (SMTP / IMAP)',
    description: 'Connect any email provider using SMTP for sending and IMAP for receiving.',
    icon: '✉️',
    color: 'bg-purple-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'email',
  },
  {
    id: 'sms',
    name: 'SMS / MMS',
    description: 'Send and receive SMS and MMS messages directly from your workspace.',
    icon: '📱',
    color: 'bg-orange-500',
    category: 'sms',
  },
  {
    id: 'livechat',
    name: 'Live Chat Widget',
    description: 'Add a live chat widget to your website and engage visitors in real time.',
    icon: '💬',
    color: 'bg-indigo-500',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'livechat',
  },
  {
    id: 'website_chat',
    name: 'Website Chat',
    description: 'Create and add website chat functionality on your website to engage with visitors and convert prospects into customers through interactive and personalized conversations.',
    icon: '💬',
    color: 'bg-blue-800',
    badge: 'Popular',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'livechat',
  },
  {
    id: 'calls',
    name: 'Voice Calls',
    description: 'Make and receive voice calls directly from your workspace with full call management.',
    icon: '📞',
    color: 'bg-teal-500',
    category: 'calls',
  },
  {
    id: 'custom',
    name: 'Custom Channel',
    description: 'Connect any channel not natively available to expand your communication reach.',
    icon: '🔗',
    color: 'bg-orange-500',
    category: 'business',
  },
];

// ─── Connected Channels View ──────────────────────────────────────────────────
const ConnectedChannelsView = ({
  channels,
  setChannels,
  onConnectNew,
}: {
  channels: ConnectedChannel[];
  setChannels: React.Dispatch<React.SetStateAction<ConnectedChannel[]>>;
  onConnectNew: () => void;
}) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleManage = (ch: ConnectedChannel) => {
    const slug = CHANNEL_TYPE_TO_SLUG[ch.type] ?? 'whatsapp_cloud';
    navigate(`/channel/manage/${slug}/${ch.id}`, { state: { channel: ch } });
  };

  const errorChannels = channels.filter(c => c.status === 'Error');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Channels</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your connected messaging channels and add new ones.
            </p>
          </div>
          <button
            onClick={onConnectNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Connect new channel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5">
        {errorChannels.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {errorChannels.length} channel{errorChannels.length > 1 ? 's have' : ' has'} a connection error
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {errorChannels.map(c => c.name).join(', ')} — check credentials and reconnect.
              </p>
            </div>
            <button
              onClick={() => setManagingChannel(errorChannels[0])}
              className="text-xs text-amber-700 underline font-medium whitespace-nowrap"
            >
              Fix now →
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Connected', value: channels.filter(c => c.status === 'Connected').length, icon: <CheckCircle2 size={18} className="text-green-500" />, bg: 'bg-green-50' },
            { label: 'With errors', value: channels.filter(c => c.status === 'Error').length, icon: <XCircle size={18} className="text-red-500" />, bg: 'bg-red-50' },
            { label: 'Total messages', value: channels.reduce((s, c) => s + c.msgs, 0).toLocaleString(), icon: <MessageSquare size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Total channels', value: channels.length, icon: <Zap size={18} className="text-purple-500" />, bg: 'bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Connected channels</h2>
          </div>

          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Globe size={28} className="text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-700">No channels connected yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Connect your first channel to start receiving messages.</p>
              <button
                onClick={onConnectNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={15} /> Connect a channel
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {channels.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-11 h-11 ${ch.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                    {ch.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ch.name}</p>
                    <p className="text-xs text-gray-500 truncate">{ch.type} · {ch.identifier}</p>
                  </div>
                  <div className="hidden md:block text-right mr-2">
                    <p className="text-sm font-semibold text-gray-800">{ch.msgs.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">messages</p>
                  </div>
                  <div className="hidden lg:block text-right mr-2">
                    <p className="text-xs text-gray-500">Since {ch.connectedAt}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    ch.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {ch.status === 'Connected' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                    {ch.status}
                  </span>
                  <button
                    onClick={() => handleManage(ch)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Settings size={13} />
                    Manage
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === ch.id ? null : ch.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openMenuId === ch.id && (
                      <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                        <button
                          onClick={() => { handleManage(ch); setOpenMenuId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={14} /> Settings
                        </button>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <ExternalLink size={14} /> View details
                        </button>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <RefreshCw size={14} /> Reconnect
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => {
                            setChannels(prev => prev.filter(c => c.id !== ch.id));
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          onClick={onConnectNew}
          className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
        >
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Plus size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">Connect a new channel</p>
            <p className="text-xs text-gray-500">WhatsApp, Instagram, Email, Live Chat and more</p>
          </div>
        </div>
      </div>

      {openMenuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
};

// ─── Channel Catalog View ─────────────────────────────────────────────────────
const ChannelCatalogView = ({
  onBack,
  onChannelConnected,
}: {
  onBack: () => void;
  onChannelConnected: (ch: ConnectedChannel) => void;
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const filteredChannels = CATALOG_CHANNELS.filter(ch => {
    const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory;
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (ch: CatalogChannel) => {
    const slug = CHANNEL_CONNECT_SLUGS[ch.id];
    if (slug) {
      // Navigate to dedicated connect page
      navigate(`/channel/connect/${slug}`);
      return;
    }
    // Simulate for channels without a dedicated page
    setConnecting(ch.id);
    setTimeout(() => {
      setConnected(prev => new Set([...prev, ch.id]));
      setConnecting(null);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>🌐</span> Channel Catalog
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Discover and connect new messaging channels to your workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 md:px-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {CATALOG_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-4 px-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative pb-2 md:pb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search channels…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-base font-medium text-gray-600">No channels found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {filteredChannels.length} channel{filteredChannels.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map(ch => {
                const isConnected = connected.has(ch.id);
                const isConnecting = connecting === ch.id;
                const hasDedicatedPage = !!CHANNEL_CONNECT_SLUGS[ch.id];
                return (
                  <div
                    key={ch.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all relative flex flex-col"
                  >
                    {ch.badge && (
                      <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                    )}
                    <div className={`w-12 h-12 ${ch.color} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm`}>
                      {ch.icon}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1 pr-12">{ch.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3 flex-1">{ch.description}</p>
                    <button
                      onClick={() => !isConnected && handleConnect(ch)}
                      disabled={isConnecting}
                      className={`w-full mt-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isConnected
                          ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                          : isConnecting
                          ? 'bg-blue-50 text-blue-500 border border-blue-200 cursor-wait'
                          : hasDedicatedPage
                          ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                          : 'border border-gray-300 text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                      }`}
                    >
                      {isConnected
                        ? '✓ Connected'
                        : isConnecting
                        ? 'Connecting…'
                        : hasDedicatedPage
                        ? <><span>Connect</span> <ExternalLink size={13} /></>
                        : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const Channels = () => {
  const location = useLocation();
  const [view, setView] = useState<'channels' | 'catalog'>('channels');
  const [channels, setChannels] = useState<ConnectedChannel[]>(CONNECTED_CHANNELS);

  // Pick up newly connected channel coming back from a connect page
  useEffect(() => {
    const state = location.state as { newChannel?: ConnectedChannel; disconnectedId?: number } | null;
    if (state?.newChannel) {
      setChannels(prev => {
        const filtered = prev.filter(c => c.id !== state.newChannel!.id);
        return [...filtered, state.newChannel!];
      });
      window.history.replaceState({}, '');
    }
    if (state?.disconnectedId) {
      setChannels(prev => prev.filter(c => c.id !== state.disconnectedId));
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleChannelConnected = (ch: ConnectedChannel) => {
    setChannels(prev => [...prev.filter(c => c.id !== ch.id), ch]);
  };

  return view === 'channels'
    ? (
      <ConnectedChannelsView
        channels={channels}
        setChannels={setChannels}
        onConnectNew={() => setView('catalog')}
      />
    )
    : (
      <ChannelCatalogView
        onBack={() => setView('channels')}
        onChannelConnected={handleChannelConnected}
      />
    );
};
