import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Settings, Globe, Plug, Loader2 } from "lucide-react";
import { ChannelApi } from "../lib/channelApi";
import { channelConfig } from "./inbox/data";
import { ListPagination } from "../components/ui/ListPagination";
import { useIsMobile } from "../hooks/useIsMobile";
import { useMobileHeaderActions } from "../components/mobileHeaderActions";

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

export interface CatalogChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  category: string;
}

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
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);


  const handleManage = (ch: ConnectedChannel) => {
    navigate(`/channels/manage/${ch.type}/${ch.id}`);
  };

  useMobileHeaderActions(
    isMobile
      ? {
          actions: [
            {
              id: "channels-search",
              label: "Search channels",
              icon: <Search size={17} />,
              active: mobileSearchOpen || Boolean(search),
              onClick: () => setMobileSearchOpen((value) => !value),
            },
            {
              id: "channels-add",
              label: "Add channel",
              icon: <Plus size={18} />,
              onClick: onConnectNew,
            },
          ],
          panel: mobileSearchOpen ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                autoFocus
                className="h-10 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search channels..."
                type="text"
                value={search}
              />
            </div>
          ) : null,
        }
      : {},
    [isMobile, mobileSearchOpen, search],
  );

  return (
    <div className="mobile-borderless min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="px-4 py-4 md:px-6">
        <div className="hidden items-start gap-3 md:flex">
          <div className="pt-1 text-slate-700">
            <Plug size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
              Connected Channels
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage every connected inbox and entry point from one place.
            </p>
          </div>
        </div>

        <div className="mt-4 hidden grid-cols-1 gap-3 md:flex md:flex-wrap md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search channels..."
              className="w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 md:border md:border-gray-300 md:bg-white"
            />
          </div>

          <div className="flex w-full justify-end md:w-auto">
            <button
              onClick={onConnectNew}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 md:w-auto"
            >
              <Plus size={14} />
              Add Channel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Loading channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <Globe size={28} className="text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700">
              No channels connected yet
            </p>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Connect your first channel to start receiving messages.
            </p>
            <button
              onClick={onConnectNew}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={15} /> Connect a channel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((ch) => (
              <article
                key={ch.id}
                role="button"
                tabIndex={0}
                onClick={() => handleManage(ch)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleManage(ch);
                  }
                }}
                className={`cursor-pointer rounded-[24px] bg-white p-4 transition-all hover:bg-slate-50 md:border md:border-gray-200 md:hover:border-gray-300 md:hover:shadow-sm ${
                  isMobile ? "space-y-4" : "space-y-5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 md:border md:border-gray-100">
                    <img
                      src={channelConfig[ch.type]?.icon}
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 md:text-base">
                      {ch.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {channelConfig[ch.type]?.label} · {ch.identifier}
                    </p>
                    {/* <div
                      className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        ch.status === "Connected"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : ch.status === "Error"
                            ? "border border-amber-200 bg-amber-50 text-amber-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ch.status}
                    </div> */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl  p-3 text-xs text-slate-500">
                  {/* <div>
                    <p>Messages</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {ch.msgs}
                    </p>
                  </div>
                  <div>
                    <p>Connected</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {ch.connectedAt}
                    </p>
                  </div> */}
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleManage(ch);
                  }}
                  className="hidden w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-600 hover:text-white md:flex"
                >
                  <Settings size={14} />
                  Manage
                </button>
              </article>
            ))}
          </div>
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
    </div>
  );
};

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
  const code: string | null = null;
  const error: string | null = null;
  return;

  if (code) {
    void code;

    // 🔥 Call your API here
          const redirectUri =  import.meta.env.VITE_INSTAGRAM_REDIRECT_URI;

    ChannelApi.exchangeInstagramCode(code, redirectUri)
      .then(res => {
        // onSuccess(res.channel);
      })
      .catch(err => {
        // onError(err.message);
      });
  }

  if (error) {
    void error;
    // onError(error);
  }
}, []);

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
