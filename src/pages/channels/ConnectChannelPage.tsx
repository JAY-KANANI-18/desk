import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, MessageCircle } from 'lucide-react';
import { WhatsAppCloudChannel, WhatsAppChannelSidebar } from '../workspace/channels/WhatsAppCloudChannel';
import { FacebookChannel, FacebookChannelSidebar } from '../workspace/channels/FacebookChannel';
import { InstagramChannel, InstagramChannelSidebar } from '../workspace/channels/InstagramChannel';
import { EmailChannel, EmailChannelSidebar } from '../workspace/channels/EmailChannelV2';
import { GmailChannel } from '../workspace/channels/GmailChannel';
import { WebsiteChatChannel, WebsiteChatChannelSidebar } from '../workspace/channels/WebsiteChatChannel';
import type { Channel as WsChannel } from '../workspace/types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useChannel } from '../../context/ChannelContext';
import { useState } from 'react';
import { ChannelApi } from '../../lib/channelApi';
import { useIsMobile } from '../../hooks/useIsMobile';

// ─── Channel metadata ─────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, {
  name: string;
  description: string;
  icon: string;
  color: string;
  SidebarContent?: React.ComponentType;
  videoTutorial?: string;
  additionalResources?: { label: string; href: string }[];
}> = {
  whatsapp_cloud: {
    name: 'WhatsApp Cloud API',
    description: 'Connect WhatsApp Cloud API and manage your messages easily in one place.',
    icon: 'whatsapp',
    color: 'bg-emerald-500',
    SidebarContent: WhatsAppChannelSidebar,
  },
  messenger: {
    name: 'Facebook Messenger',
    description: "Connect Facebook Messenger to engage with your customers.",
    icon: 'messenger',
    color: 'bg-blue-600',
    SidebarContent: FacebookChannelSidebar,
  },
  instagram: {
    name: 'Instagram',
    description: 'Connect Instagram to reply to private messages.',
    icon: 'instagram',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    SidebarContent: InstagramChannelSidebar,
  },
  email: {
    name: 'Email (SMTP / IMAP)',
    description: 'Connect any email provider using SMTP for sending and IMAP for receiving.',
    icon: 'maildotru',
    color: 'bg-indigo-500',
    SidebarContent: EmailChannelSidebar,
  },
  gmail: {
    name: 'Gmail',
    description: 'Connect your Gmail or Google Workspace account.',
    icon: 'gmail',
    color: 'bg-red-500',
  },
  website_chat: {
    name: 'Website Chat',
    description: 'Add a chat widget to your website.',
    icon: 'googlechat',
    color: 'bg-blue-800',
    SidebarContent: WebsiteChatChannelSidebar,

  },
  exotel_call: {
    name: 'Exotel Calling',
    description: 'Connect Exotel for inbound and outbound voice calls.',
    icon: 'ringcentral',
    color: 'bg-cyan-600',
  },
  msg91_sms: {
    name: 'MSG91 SMS',
    description: 'Connect MSG91 for transactional and support SMS.',
    icon: 'androidmessages',
    color: 'bg-emerald-600',
  },
};

// ─── Component map ────────────────────────────────────────────────────────────
type SetupProps = {
  connected: WsChannel | null;
  onConnect: (ch: WsChannel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
};

const ExotelCallChannel: React.FC<SetupProps> = ({ onConnect, workspaceId }) => {
  const [name, setName] = useState('Exotel Calling');
  const [callerId, setCallerId] = useState('');
  const [sid, setSid] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const ch = await ChannelApi.connectExotel({
        workspaceId,
        name,
        callerId,
        sid,
        apiKey,
        apiToken,
      });
      onConnect(ch as any);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to connect Exotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-900">Exotel setup</h2>
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Channel name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Caller ID" value={callerId} onChange={(e) => setCallerId(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Exotel SID" value={sid} onChange={(e) => setSid(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="API Token" value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={handleConnect} disabled={loading || !callerId || !sid || !apiKey || !apiToken} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50">
        {loading ? 'Connecting...' : 'Connect Exotel'}
      </button>
    </div>
  );
};

const Msg91SmsChannel: React.FC<SetupProps> = ({ onConnect, workspaceId }) => {
  const [name, setName] = useState('MSG91 SMS');
  const [senderId, setSenderId] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [route, setRoute] = useState('4');
  const [dltTemplateId, setDltTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const ch = await ChannelApi.connectMsg91({
        workspaceId,
        name,
        senderId,
        authKey,
        route,
        dltTemplateId: dltTemplateId || undefined,
      });
      onConnect(ch as any);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to connect MSG91');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-900">MSG91 setup</h2>
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Channel name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Sender ID" value={senderId} onChange={(e) => setSenderId(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Auth Key" value={authKey} onChange={(e) => setAuthKey(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Route (default 4)" value={route} onChange={(e) => setRoute(e.target.value)} />
      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DLT Template ID (optional)" value={dltTemplateId} onChange={(e) => setDltTemplateId(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={handleConnect} disabled={loading || !senderId || !authKey} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50">
        {loading ? 'Connecting...' : 'Connect MSG91'}
      </button>
    </div>
  );
};

const CHANNEL_COMPONENTS: Record<string, React.ComponentType<SetupProps>> = {
  whatsapp_cloud: WhatsAppCloudChannel,
  messenger: FacebookChannel,
  instagram: InstagramChannel,
  email: EmailChannel,
  gmail: GmailChannel,
  website_chat: WebsiteChatChannel,
  exotel_call: ExotelCallChannel,
  msg91_sms: Msg91SmsChannel,
};

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
}

// ─── Generic sidebar (Website Chat, Gmail, etc.) ──────────────────────────────
const GenericSidebar = ({ meta }: { meta: (typeof CHANNEL_META)[string] }) => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex flex-col items-center text-center">
      <div className={`w-14 h-14 ${meta.color} rounded-2xl flex items-center justify-center text-2xl mb-3`}>
        <MessageCircle size={24} className="text-white" />
      </div>
      <p className="text-sm font-bold text-gray-900">{meta.name}</p>
      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{meta.description}</p>
    </div>

    <div className="h-px bg-gray-100" />

    {meta.videoTutorial && (
      <a href={meta.videoTutorial} className="flex items-center gap-2 text-[11px] text-indigo-600 hover:underline no-underline font-medium">
        <Video size={12} /> Step-by-step video tutorial
      </a>
    )}

    {meta.additionalResources && meta.additionalResources.length > 0 && (
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Resources</p>
        <ul className="space-y-1.5">
          {meta.additionalResources.map(r => (
            <li key={r.label}>
              <a href={r.href} className="flex items-start gap-1.5 text-[11px] text-indigo-600 hover:underline no-underline leading-relaxed">
                <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export const ConnectChannelPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { activeWorkspace } = useWorkspace();
  const { refreshChannels } = useChannel();
 
  const meta = channelId ? CHANNEL_META[channelId] : null;
  const Component = channelId ? CHANNEL_COMPONENTS[channelId] : null;

  if (!meta || !Component) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔌</div>
          <p className="text-base font-semibold text-gray-700">Channel not found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">The channel you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/channels')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors border-none cursor-pointer"
          >
            Back to channels
          </button>
        </div>
      </div>
    );
  }

  const handleConnect = async (_wsChannel: WsChannel) => {
    await refreshChannels();
    navigate('/channels');
  };

  const SidebarContent = meta.SidebarContent;
  const renderSidebarPanel = () =>
    SidebarContent ? <SidebarContent /> : <GenericSidebar meta={meta} />;

  return (
    <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="border-b border-gray-100 bg-white px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-start gap-3 md:items-center">
          <button
            onClick={() => navigate('/channels/connect')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 md:hidden">
              Channel Setup
            </p>
            <h1 className="truncate text-base font-semibold text-gray-900 md:text-lg">
              Connect {meta.name}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-1.5 border-b border-gray-100 bg-white px-6 py-2 md:flex">
        <button
          onClick={() => navigate('/channels/connect')}
          className="border-none bg-transparent p-0 text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-700"
          type="button"
        >
          Channels
        </button>
        <span className="text-[11px] text-gray-300">/</span>
        <span className="text-[11px] font-medium text-gray-600">{meta.name}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-gray-100 bg-white md:block">
          {renderSidebarPanel()}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
            {isMobile ? (
              <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {renderSidebarPanel()}
              </div>
            ) : null}

            <Component
              workspaceId={activeWorkspace?.id ?? ''}
              connected={null}
              onConnect={handleConnect}
              onDisconnect={() => navigate('/channels')}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
