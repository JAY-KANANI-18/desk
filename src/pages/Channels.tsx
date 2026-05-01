import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Globe,
  Loader2,
  RadioTower,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { ChannelApi } from "../lib/channelApi";
import { channelConfig } from "./inbox/data";
import { ListPagination } from "../components/ui/ListPagination";
import { PageLayout } from "../components/ui/PageLayout";
import { useIsMobile } from "../hooks/useIsMobile";
import { useMobileHeaderActions } from "../components/mobileHeaderActions";
import { ChannelBadgeStack } from "../components/channels/ChannelBadges";
import { Button } from "../components/ui/button/Button";
import { FloatingActionButton } from "../components/ui/FloatingActionButton";
import { BaseInput } from "../components/ui/inputs";

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
  showDesktopChrome = true,
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
  showDesktopChrome?: boolean;
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleManage = (channel: ConnectedChannel) => {
    navigate(`/channels/manage/${channel.type}/${channel.id}`);
  };

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <BaseInput
              type="search"
              appearance="toolbar"
              leftIcon={<Search size={15} />}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search channels..."
              aria-label="Search channels"
            />
          ),
        }
      : {},
    [isMobile, search],
  );

  return (
    <div className="mobile-borderless min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="px-4 py-4 md:px-6">
        {showDesktopChrome ? (
          <>
            <div className="hidden items-start gap-3 md:flex">
              <div className="pt-1 text-slate-700">
                <RadioTower size={20} />
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
              <div className="w-full md:max-w-sm">
                <BaseInput
                  type="search"
                  appearance="toolbar"
                  leftIcon={<Search size={15} />}
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search channels..."
                  aria-label="Search channels"
                />
              </div>

              <div className="flex w-full justify-end md:ml-auto md:w-auto">
                <Button onClick={onConnectNew} leftIcon={<Plus size={14} />}>
                  Add Channel
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Loading channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <RadioTower size={28} className="text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700">
              No channels connected yet
            </p>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Connect your first channel to start receiving messages.
            </p>
            <ChannelBadgeStack className="mb-4" />
            <Button onClick={onConnectNew} leftIcon={<Plus size={15} />}>
              Connect a channel
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                onClick={() => handleManage(channel)}
                variant="select-card"
                size="lg"
                radius="lg"
                fullWidth
                contentAlign="start"
                preserveChildLayout
                className="relative"
              >
                <div
                  className={` w-full text-left ${isMobile ? "" : "space-y-5"}`}
                >
                

                  <div className="flex  gap-3 items-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 md:border md:border-gray-100">
                      <img
                        src={channelConfig[channel.type]?.icon}
                        className={
                          !isMobile ? "h-10 w-10 object-contain" : "h-8 w-8"
                        }
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 md:text-base">
                        {channel.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {channelConfig[channel.type]?.label} ·{" "}
                        {channel.identifier}
                      </p>
                    </div>
                      {isMobile ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none  inset-y-0 flex items-center text-slate-300"
                    >
                      <ChevronRight size={16} />
                    </span>
                  ) : null}
                  </div>

                  <div
                    className={
                      isMobile
                        ? "hidden"
                        : "grid grid-cols-2 gap-3 rounded-2xl p-3 text-xs text-slate-500"
                    }
                  />

                  <span className="hidden items-center gap-1.5 text-xs font-medium text-gray-700 md:inline-flex">
                    <Settings size={14} />
                    Manage
                  </span>
                </div>
              </Button>
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
  const isMobile = useIsMobile();
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
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadChannels();

    return () => {
      active = false;
    };
  }, [page, search]);

  const desktopToolbar = isMobile ? undefined : (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full md:max-w-sm">
        <BaseInput
          type="search"
          appearance="toolbar"
          leftIcon={<Search size={15} />}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search channels..."
          aria-label="Search channels"
        />
      </div>

      <div className="flex w-full justify-end md:ml-auto md:w-auto">
        <Button
          onClick={() => navigate("/channels/connect")}
          leftIcon={<Plus size={14} />}
        >
          Add Channel
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Connected Channels"
      toolbar={desktopToolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <ConnectedChannelsView
        channels={channels}
        loading={loading}
        search={searchDraft}
        onSearchChange={setSearchDraft}
        pagination={pagination}
        onPageChange={setPage}
        onConnectNew={() => navigate("/channels/connect")}
        showDesktopChrome={false}
      />
      <FloatingActionButton
        label="Add channel"
        icon={<Plus size={24} />}
        onClick={() => navigate("/channels/connect")}
      />
    </PageLayout>
  );
};
