import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X, Plus } from 'lucide-react';
import { workspaceApi } from '../api';
import { SectionLoader } from '../components/SectionLoader';
import { SectionError } from '../components/SectionError';
import type { Channel, ChannelType } from '../types';
import { WhatsAppCloudChannel } from '../channels/WhatsAppCloudChannel';
import { FacebookChannel }      from '../channels/FacebookChannel';
import { InstagramChannel }     from '../channels/InstagramChannel';
import { GmailChannel }         from '../channels/GmailChannel';
import { EmailChannel }         from '../channels/EmailChannel';

// ── Channel catalogue ─────────────────────────────────────────────────────────
const CHANNEL_DEFS: {
  type: ChannelType;
  name: string;
  emoji: string;
  description: string;
  color: string;
  bgLight: string;
  border: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    type: 'whatsapp',
    name: 'WhatsApp Cloud API',
    emoji: '💬',
    description: 'Connect your WhatsApp Business number and reach 2B+ users.',
    color: 'text-green-700',
    bgLight: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
  },
  {
    type: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    description: 'Manage Instagram DMs and story replies from your inbox.',
    color: 'text-pink-700',
    bgLight: 'bg-pink-50',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
  },
  {
    type: 'facebook',
    name: 'Facebook Messenger',
    emoji: '💙',
    description: 'Receive and reply to Messenger conversations from your Page.',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  {
    type: 'gmail',
    name: 'Gmail',
    emoji: '📧',
    description: 'Connect Gmail or Google Workspace to manage emails in one place.',
    color: 'text-red-700',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  {
    type: 'email',
    name: 'Email (SMTP/IMAP)',
    emoji: '✉️',
    description: 'Connect any email provider using SMTP for sending and IMAP for receiving.',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
  },
];

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const ChannelModal = ({
  type,
  onClose,
  connected,
  onConnect,
  onDisconnect,
}: {
  type: ChannelType;
  onClose: () => void;
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}) => {
  const def = CHANNEL_DEFS.find(d => d.type === type)!;

  const handleConnect = (channel: Channel) => {
    onConnect(channel);
    // keep modal open to show connected state
  };

  const handleDisconnect = (id: number) => {
    onDisconnect(id);
    onClose();
  };

  const renderContent = () => {
    const props = { connected, onConnect: handleConnect, onDisconnect: handleDisconnect };
    switch (type) {
      case 'whatsapp':  return <WhatsAppCloudChannel {...props} />;
      case 'facebook':  return <FacebookChannel {...props} />;
      case 'instagram': return <InstagramChannel {...props} />;
      case 'gmail':     return <GmailChannel {...props} />;
      case 'email':     return <EmailChannel {...props} />;
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 ${def.bgLight}`}>
          <span className="text-2xl leading-none">{def.emoji}</span>
          <div className="flex-1 min-w-0">
            <h2 className={`text-sm font-bold ${def.color}`}>{def.name}</h2>
            <p className="text-xs text-gray-500 truncate">{def.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// ── Channel card ──────────────────────────────────────────────────────────────
const ChannelCard = ({
  def,
  connected,
  onClickConnect,
  onClickManage,
}: {
  def: typeof CHANNEL_DEFS[number];
  connected: Channel | null;
  onClickConnect: () => void;
  onClickManage: () => void;
}) => {
  const isConnected = !!connected;
  const hasError    = connected?.status === 'Error';

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
        isConnected
          ? `${def.bgLight} ${def.border}`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            isConnected ? 'bg-white/70' : 'bg-gray-50'
          }`}
        >
          {def.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isConnected ? def.color : 'text-gray-800'}`}>
              {def.name}
            </span>
            {isConnected && !hasError && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${def.badgeBg} ${def.badgeText}`}>
                ● Connected
              </span>
            )}
            {hasError && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                ● Error
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
            {isConnected ? connected!.identifier : def.description}
          </p>
        </div>
      </div>

      {/* Stats row (connected only) */}
      {isConnected && !hasError && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{connected!.msgs.toLocaleString()}</span> messages
        </div>
      )}

      {/* Action button */}
      <button
        onClick={isConnected ? onClickManage : onClickConnect}
        className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
          isConnected
            ? hasError
              ? 'bg-red-600 text-white hover:bg-red-700'
              : `bg-white border ${def.border} ${def.color} hover:${def.bgLight}`
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {isConnected ? (hasError ? 'Fix error' : 'Manage') : (
          <span className="flex items-center justify-center gap-1.5">
            <Plus size={12} /> Connect
          </span>
        )}
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const ChannelsSettings = () => {
  const [channels, setChannels]     = useState<Channel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [modalType, setModalType]   = useState<ChannelType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChannels(await workspaceApi.getChannels());
    } catch {
      setError('Failed to load channels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getConnected = (type: ChannelType): Channel | null =>
    channels.find(c => c.channelType === type) ?? null;

  const handleConnect = (channel: Channel) => {
    console.log('__ANIMA_DBG__ handleConnect called', channel);
    setChannels(prev => [
      ...prev.filter(c => c.channelType !== channel.channelType),
      channel,
    ]);
  };

  const handleDisconnect = async (id: number) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    setModalType(null);
    try { await workspaceApi.disconnectChannel(id); } catch { /* silent */ }
  };

  if (loading) return <SectionLoader />;
  if (error && channels.length === 0) return <SectionError message={error} onRetry={load} />;

  const connectedCount = channels.filter(c => c.status === 'Connected').length;
  const hasError       = channels.some(c => c.status === 'Error');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{connectedCount}</span> connected ·{' '}
          <span className="font-semibold text-gray-700">{CHANNEL_DEFS.length}</span> available
        </p>
      </div>

      {/* Error banner */}
      {hasError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            One or more channels have a configuration error. Click <strong>Fix error</strong> to resolve it.
          </p>
        </div>
      )}

      {/* Channel grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHANNEL_DEFS.map(def => (
          <ChannelCard
            key={def.type}
            def={def}
            connected={getConnected(def.type)}
            onClickConnect={() => setModalType(def.type)}
            onClickManage={() => setModalType(def.type)}
          />
        ))}
      </div>

      {/* Modal */}
      {modalType && (
        <ChannelModal
          type={modalType}
          onClose={() => setModalType(null)}
          connected={getConnected(modalType)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
};
