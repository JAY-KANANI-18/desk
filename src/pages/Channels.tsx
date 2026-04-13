import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Settings,
  Globe,
  Plug,
  Loader2,
} from "lucide-react";
import { ChannelApi } from "../lib/channelApi";
import { channelConfig } from "./inbox/data";
import { ListPagination } from "../components/ui/ListPagination";

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
  search,
  onSearchChange,
  pagination,
  onPageChange,
  onConnectNew,
}: {
  loading: boolean;
  channels: ConnectedChannel[];
  search: string;
  onSearchChange: (value: string) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onConnectNew: () => void;
}) => {
  const navigate = useNavigate();

  const handleManage = (ch: ConnectedChannel) => {
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
        <div className="px-6 pb-2">
          <div className="relative max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search channels..."
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          itemLabel="channels"
          onPageChange={onPageChange}
        />
      </div>

      {/* Connect new channel CTA */}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const Channels = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let active = true;

    async function loadChannels() {
      setLoading(true);
      try {
        const response = await ChannelApi.listChannels({
          page,
          limit: pagination.limit,
          search: search || undefined,
        });
        if (!active) return;
        setChannels(Array.isArray(response?.items) ? response.items : []);
        setPagination(
          response?.pagination ?? {
            total: Array.isArray(response?.items) ? response.items.length : 0,
            page,
            limit: pagination.limit,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadChannels();

    return () => {
      active = false;
    };
  }, [page, search]);

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
      search={searchDraft}
      onSearchChange={setSearchDraft}
      pagination={pagination}
      onPageChange={setPage}
      onConnectNew={() => navigate("/channels/connect")}
    />
  );
};
