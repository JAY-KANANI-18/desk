import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, ChevronRight } from "lucide-react";
import { BackButton } from "../components/channels/BackButton";
import { Button } from "../components/ui/button/Button";
import { BaseInput } from "../components/ui/inputs/BaseInput";
import { PageLayout } from "../components/ui/PageLayout";
import { Tag } from "../components/ui/Tag";
import {
  CHANNEL_CONNECT_SLUGS,
  getCatalogChannels,
} from "./channels/channelRegistry";

const CATALOG_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "business", name: "Business Messaging" },
  { id: "calls", name: "Calls" },
  { id: "sms", name: "SMS" },
  { id: "email", name: "Email" },
  { id: "livechat", name: "Live Chat" },
];

export const ChannelCatalogView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const catalogChannels = getCatalogChannels();

  const filteredChannels = catalogChannels.filter((channel) => {
    const matchesCategory =
      selectedCategory === "all" || channel.category === selectedCategory;
    const matchesSearch = channel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleConnect = (channelId: string) => {
    const slug = CHANNEL_CONNECT_SLUGS[channelId];

    if (!slug) return;
    navigate(`/channels/connect/${slug}`);
  };

  const desktopToolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATALOG_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
                            variant="tab"
                selected={selectedCategory === category.id}

                      radius="none"
          
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="w-full lg:max-w-xs">
        <BaseInput
          type="search"
          appearance="toolbar"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Channels"
      title="Channel catalog"
      leading={
        <BackButton
          ariaLabel="Back to channels"
          onClick={() => navigate("/channels")}
        />
      }
      toolbar={desktopToolbar}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-base font-medium text-gray-600">
                No channels found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Try a different search or category.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-gray-400">
                {filteredChannels.length} channel
                {filteredChannels.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredChannels.map((channel) => {
                  return (
                    <Button
                      key={channel.catalogId}
                      onClick={() => handleConnect(channel.catalogId)}
                      variant="select-card"
                      size="lg"
                      radius="lg"
                      fullWidth
                      contentAlign="start"
                      preserveChildLayout
                    >
                      <div className="relative flex min-h-[184px] w-full flex-col text-left">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-slate-300 md:hidden"
                        >
                          <ChevronRight size={16} />
                        </span>

                        {channel.badge ? (
                          <span className="absolute right-0 top-0">
                            <Tag label={channel.badge} size="sm" bgColor="primary" />
                          </span>
                        ) : null}

                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                          <img
                            src={channel.icon}
                            className="h-10 w-10 object-contain"
                          />
                        </div>

                        <h3 className="mb-1 pr-12 text-sm font-semibold text-gray-900">
                          {channel.name}
                        </h3>

                        <p className="line-clamp-3 flex-1 text-xs text-gray-500">
                          {channel.description}
                        </p>

                        <span className="mt-5 hidden items-center justify-end gap-1.5 text-xs font-medium text-indigo-600 md:flex">
                          Connect
                          <ExternalLink size={13} />
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
