import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, MessageCircle } from 'lucide-react';
import { WhatsAppCloudChannel } from '../workspace/channels/WhatsAppCloudChannel';
import { FacebookChannel } from '../workspace/channels/FacebookChannel';
import { InstagramChannel } from '../workspace/channels/InstagramChannel';
import { EmailChannel } from '../workspace/channels/EmailChannel';
import { GmailChannel } from '../workspace/channels/GmailChannel';
import { WebsiteChatChannel } from '../workspace/channels/WebsiteChatChannel';
import type { Channel as WsChannel } from '../workspace/types';

// ─── Channel metadata ─────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, {
  name: string;
  description: string;
  icon: string;
  color: string;
  bgClass: string;
  sidebarLayout?: boolean;
  videoTutorial?: string;
  additionalResources?: { label: string; href: string }[];
}> = {
  whatsapp_cloud: {
    name: 'WhatsApp Cloud API',
    description: 'Connect WhatsApp Cloud API and manage your messages easily in one place.',
    icon: '💬',
    color: 'bg-green-500',
    bgClass: 'from-green-50 to-emerald-50',
  },
  facebook: {
    name: 'Facebook Messenger',
    description: 'Connect Facebook Messenger to engage with your customers on the world\'s largest social platform.',
    icon: '💙',
    color: 'bg-blue-600',
    bgClass: 'from-blue-50 to-indigo-50',
  },
  instagram: {
    name: 'Instagram',
    description: 'Connect Instagram to reply to private messages and build strong brand connections.',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    bgClass: 'from-purple-50 to-pink-50',
  },
  email: {
    name: 'Email (SMTP / IMAP)',
    description: 'Connect any email provider using SMTP for sending and IMAP for receiving.',
    icon: '✉️',
    color: 'bg-indigo-500',
    bgClass: 'from-indigo-50 to-purple-50',
  },
  gmail: {
    name: 'Gmail',
    description: 'Connect your Gmail or Google Workspace account to manage emails from your inbox.',
    icon: '📧',
    color: 'bg-red-500',
    bgClass: 'from-red-50 to-orange-50',
  },
  website_chat: {
    name: 'Website Chat',
    description: 'Create and add website chat functionality on your website to engage with visitors and convert prospects into customers through interactive and personalized conversations.',
    icon: '💬',
    color: 'bg-blue-800',
    bgClass: 'from-blue-50 to-indigo-50',
    sidebarLayout: true,
    videoTutorial: '#',
    additionalResources: [
      { label: 'Install Website Chat Widget on WordPress', href: '#' },
      { label: 'Install Website Chat Widget on Shopify', href: '#' },
      { label: 'Install Website Chat Widget on Wix', href: '#' },
    ],
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
  facebook: FacebookChannel,
  instagram: InstagramChannel,
  email: EmailChannel,
  gmail: GmailChannel,
  website_chat: WebsiteChatChannel,
};

// ─── Connected channel shape (mirrors Channels.tsx) ──────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export const ConnectChannelPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  const meta = channelId ? CHANNEL_META[channelId] : null;
  const Component = channelId ? CHANNEL_COMPONENTS[channelId] : null;

  if (!meta || !Component) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔌</div>
          <p className="text-lg font-semibold text-gray-700">Channel not found</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">The channel you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/channels')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
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
      connectedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    navigate('/channels', { state: { newChannel: connected } });
  };

  // ── Sidebar layout (e.g. Website Chat) ────────────────────────────────────
  if (meta.sidebarLayout) {
    return (
      <div className="h-full flex bg-white">
        {/* Left sidebar */}
        <aside className="w-44 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 bg-white">
          {/* Channel identity */}
          <div className="p-5 flex flex-col items-center text-center border-b border-gray-100">
            <div className={`w-16 h-16 ${meta.color} rounded-full flex items-center justify-center mb-3 shadow-sm`}>
              <MessageCircle size={28} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-2">{meta.name}</h2>
            <p className="text-xs text-gray-500 leading-relaxed text-left">{meta.description}</p>
          </div>

          {/* Video tutorial */}
          {meta.videoTutorial && (
            <div className="px-5 py-4 border-b border-gray-100">
              <a
                href={meta.videoTutorial}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <Video size={12} />
                Step-by-Step Video Tutorial
              </a>
            </div>
          )}

          {/* Additional resources */}
          {meta.additionalResources && meta.additionalResources.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-gray-800 mb-2.5">Additional Resources</p>
              <ul className="space-y-2">
                {meta.additionalResources.map(r => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      className="flex items-start gap-1 text-xs text-blue-600 hover:underline leading-relaxed"
                    >
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-white">
          <div className="flex-1 px-8 py-6">
            <Component
              connected={null}
              onConnect={handleConnect}
              onDisconnect={() => navigate('/channels')}
            />
          </div>
          <div className="border-t border-gray-100 py-4 text-center">
            <p className="text-xs text-gray-500">
              Visit our{' '}
              <a href="#" className="text-blue-500 hover:underline">
                Help Center
              </a>
              {' '}if you need step-by-step guidance to connect this Channel.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Default card layout ────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/channels')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={`w-11 h-11 ${meta.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
            {meta.icon}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Connect {meta.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-8 py-2.5">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/channels')} className="hover:text-blue-600 transition-colors">
            Channels
          </button>
          <span>/</span>
          <span className="text-gray-600 font-medium">{meta.name}</span>
        </nav>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto bg-gradient-to-br ${meta.bgClass}`}>
        <div className="max-w-xl mx-auto px-4 py-8">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`h-1.5 w-full ${meta.color}`} />
            <div className="p-6">
              <Component
                connected={null}
                onConnect={handleConnect}
                onDisconnect={() => navigate('/channels')}
              />
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-gray-400 mt-5">
            Need help?{' '}
            <a href="#" className="text-blue-500 hover:underline">
              View documentation
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-500 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
