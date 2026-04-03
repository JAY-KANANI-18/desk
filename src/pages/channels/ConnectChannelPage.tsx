import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, MessageCircle } from 'lucide-react';
import { WhatsAppCloudChannel, WhatsAppChannelSidebar } from '../workspace/channels/WhatsAppCloudChannel';
import { FacebookChannel, FacebookChannelSidebar } from '../workspace/channels/FacebookChannel';
import { InstagramChannel, InstagramChannelSidebar } from '../workspace/channels/InstagramChannel';
import { EmailChannel, EmailChannelSidebar } from '../workspace/channels/EmailChannel';
import { GmailChannel } from '../workspace/channels/GmailChannel';
import { WebsiteChatChannel, WebsiteChatChannelSidebar } from '../workspace/channels/WebsiteChatChannel';
import type { Channel as WsChannel } from '../workspace/types';
import { useWorkspace } from '../../context/WorkspaceContext';

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
};

// ─── Component map ────────────────────────────────────────────────────────────
type SetupProps = {
  connected: WsChannel | null;
  onConnect: (ch: WsChannel) => void;
  onDisconnect: (id: number) => void;
};

const CHANNEL_COMPONENTS: Record<string, React.ComponentType<SetupProps>> = {
  whatsapp_cloud: WhatsAppCloudChannel,
  messenger: FacebookChannel,
  instagram: InstagramChannel,
  email: EmailChannel,
  gmail: GmailChannel,
  website_chat: WebsiteChatChannel,
};

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
  const {activeWorkspace} = useWorkspace();

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

  const handleConnect = (wsChannel: WsChannel) => {
    const connected: ConnectedChannel = {
      id: wsChannel.id,
      name: wsChannel.name,
      type: meta.name,
      identifier: wsChannel.identifier,
      status: wsChannel.status as 'Connected' | 'Error' | 'Disconnected',
      icon: wsChannel.icon,
      color: wsChannel.color,
      msgs: wsChannel.msgs,
      connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    navigate('/channels', { state: { newChannel: connected } });
  };

  const SidebarContent = meta.SidebarContent;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
  <button
  onClick={() => navigate('/channels/connect')}
  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer"
>
  <ArrowLeft size={15} />
  <span className="font-medium">Back</span>
</button>
        {/* <div className={`w-8 h-8 ${meta.color} rounded-lg flex items-center justify-center shrink-0`}>
          <img
            src={`https://cdn.simpleicons.org/${meta.icon}/white`}
            className="w-4 h-4"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-none">Connect {meta.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{meta.description}</p>
        </div> */}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => navigate('/channels/connect')}
          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors border-none bg-transparent cursor-pointer p-0 font-medium"
        >
          Channels
        </button>
        <span className="text-gray-300 text-[11px]">/</span>
        <span className="text-[11px] font-medium text-gray-600">{meta.name}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-100 overflow-y-auto shrink-0 bg-white">
          {SidebarContent ? <SidebarContent /> : <GenericSidebar meta={meta} />}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 ">
            <Component
              workspaceId={activeWorkspace?.id ?? ''}
              connected={null}
              onConnect={handleConnect}
              onDisconnect={() => navigate('/channels')}
            />
          </div>
          <div className="border-t border-gray-100 py-4 text-center">
            <p className="text-[11px] text-gray-400">
              Visit our{' '}
              <a href="#" className="text-gray-600 hover:text-gray-900 underline transition-colors">Help Center</a>
              {' '}if you need step-by-step guidance.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};