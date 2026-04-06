import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Zap,
  Globe,
  Plug,
  Loader2,
} from "lucide-react";
import { CHANNEL_TYPE_TO_SLUG } from "./channels/ManageChannelPage";
import { ChannelApi } from "../lib/channelApi";
import { channelConfig } from "./inbox/data";
import { useChannel } from "../context/ChannelContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConnectedChannel {
  id: number;
  name: string;
  type: string;
  identifier: string;
  status: "Connected" | "Error" | "Disconnected";
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

// ─── Connected Channels View ──────────────────────────────────────────────────
const ConnectedChannelsView = ({
  loading,
  channels,
  onConnectNew,
}: {
  loading: boolean;
  channels: ConnectedChannel[];
  onConnectNew: () => void;
}) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleManage = (ch: ConnectedChannel) => {
    // const slug = CHANNEL_TYPE_TO_SLUG[ch.type] ?? 'whatsapp_cloud';
    navigate(`/channel/manage/${ch.type}/${ch.id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto  space-y-5">
      <div className="bg-white overflow-hidden px-3 py-3 ">
        <div className=" flex justify-between px-6 py-4  border-gray-100">
          <div className="flex justify-center items-center gap-4">
            <div>
              <Plug size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Connected Channels
              </h1>
              {/* <p className="text-sm text-gray-500 mt-0.5">
                Discover and connect new messaging channels to your workspace.
              </p> */}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onConnectNew}
              className="group relative px-4 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 transition-all duration-300 overflow-hidden text-sm flex items-center gap-1 bg-indigo-600 text-white"
            >
              <Plus size={14} />
              Add Channel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="animate-spin mr-2" size={18} />
              Loading channels...
            </div>
        ) : (
          <>
            {" "}
            {channels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Globe size={28} className="text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-700">
                  No channels connected yet
                </p>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Connect your first channel to start receiving messages.
                </p>
                <button
                  onClick={onConnectNew}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus size={15} /> Connect a channel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="relative flex flex-col gap-10 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group bg-white"
                  >
                    {/* Header row: name + status + menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <img
                            src={channelConfig[ch.type]?.icon}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {ch.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {channelConfig[ch.type]?.label} · {ch.identifier}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Manage button */}
                    <button
                      onClick={() => handleManage(ch)}
                      className="flex items-center justify-center  gap-1.5 w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-300 transition-colors "
                    >
                      <Settings size={13} />
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Connect new channel CTA */}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const Channels = () => {
  const navigate = useNavigate();
  const {channels,loading} =  useChannel()

  // Pick up newly connected channel coming back from a connect page
  // useEffect(() => {
  //   const state = location.state as {
  //     newChannel?: ConnectedChannel;
  //     disconnectedId?: number;
  //   } | null;
  //   if (state?.newChannel) {
  //     setChannels((prev) => {
  //       const filtered = prev.filter((c) => c.id !== state.newChannel!.id);
  //       return [...filtered, state.newChannel!];
  //     });
  //     window.history.replaceState({}, "");
  //   }
  //   if (state?.disconnectedId) {
  //     setChannels((prev) => prev.filter((c) => c.id !== state.disconnectedId));
  //     window.history.replaceState({}, "");
  //   }
  // }, [location.state]);

  // const handleChannelConnected = (ch: ConnectedChannel) => {
  //   setChannels((prev) => [...prev.filter((c) => c.id !== ch.id), ch]);
  // };
  return (
    <ConnectedChannelsView
      channels={channels}
      loading={loading}
      onConnectNew={() => navigate("/channels/connect")}
    />
  );
};
