import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ArrowLeft, Plus, Settings, AlertCircle, CheckCircle2,
  XCircle, MoreVertical, Trash2, RefreshCw, ExternalLink,
  MessageSquare, Zap, Globe,
} from 'lucide-react';
import { CHANNEL_TYPE_TO_SLUG } from './channels/ManageChannelPage';
import { ChannelApi } from '../lib/channelApi';

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
    // const slug = CHANNEL_TYPE_TO_SLUG[ch.type] ?? 'whatsapp_cloud';
    navigate(`/channel/manage/${ch.type}/${ch.id}`)
  };


  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {channels.map(ch => (
              <div
                key={ch.id}
                className="relative flex flex-col gap-10 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group bg-white"
              >
                {/* Header row: name + status + menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <img
                        src={`https://cdn.simpleicons.org/${ch.type.toLowerCase().replace(/\s+/g, '')}`}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{ch.type} · {ch.identifier}</p>
                    </div>
                  </div>

                </div>



                {/* Manage button */}
                <button
                  onClick={() => handleManage(ch)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors "
                >
                  <Settings size={13} />
                  Manage
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect new channel CTA */}

    </div>
  );
};



// ─── Main Export ──────────────────────────────────────────────────────────────
export const Channels = () => {
  const location = useLocation();
  const [channels, setChannels] = useState<ConnectedChannel[]>(CONNECTED_CHANNELS);
  const navigate = useNavigate();

  useEffect(() => {


    ChannelApi.getChannels().then(chs => {
      console.log({ chs });

      setChannels(chs);
    });

  }, []);


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

  return (
    <ConnectedChannelsView
      channels={channels}
      setChannels={setChannels}
      onConnectNew={() => navigate('/channels/connect')}
    />
  )
}
