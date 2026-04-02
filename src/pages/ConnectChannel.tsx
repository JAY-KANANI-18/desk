import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, ExternalLink, Plug } from "lucide-react";

interface CatalogChannel {
  id: string;
  name: string;
  description: string;
  icon: string; // image url
  color?: string;
  badge?: string;
  badgeColor?: string;
  category: string;
}

// ─── Slug map: catalog ID → connect page slug ─────────────────────────────────
const CHANNEL_CONNECT_SLUGS: Record<string, string> = {
  whatsapp: "whatsapp_cloud",
  "whatsapp-cloud": "whatsapp_cloud",
  messenger: "messenger",
  instagram: "instagram",
  email: "email",
  gmail: "gmail",
  website_chat: "website_chat",
};

const CATALOG_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "business", name: "Business Messaging" },
  { id: "calls", name: "Calls" },
  { id: "sms", name: "SMS" },
  { id: "email", name: "Email" },
  { id: "livechat", name: "Live Chat" },
];

const CATALOG_CHANNELS: CatalogChannel[] = [
  // {
  //   id: 'whatsapp',
  //   name: 'WhatsApp Business Platform (API)',
  //   description: 'Connect WhatsApp Business API via Facebook to enable seamless customer messaging at scale.',
  //   icon: 'https://cdn.simpleicons.org/whatsapp',
  //   badge: 'Popular',
  //   badgeColor: 'bg-green-100 text-green-700',
  //   category: 'business'
  // },

  {
    id: "whatsapp-cloud",
    name: "WhatsApp Cloud API",
    description:
      "Connect WhatsApp Cloud API and manage your messages easily in one place.",
    icon: "https://cdn.simpleicons.org/whatsapp",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    category: "business",
  },
  {
    id: "instagram",
    name: "Instagram",
    description:
      "Connect Instagram to reply to private messages and build strong brand connections.",
    icon: "https://cdn.simpleicons.org/instagram",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    category: "business",
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    description:
      "Connect Facebook Messenger to engage with your customers on the world's largest social platform.",
    icon: "https://cdn.simpleicons.org/messenger",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    category: "business",
  },
  {
    id: "email",
    name: "Email (SMTP / IMAP)",
    description:
      "Connect any email provider using SMTP for sending and IMAP for receiving.",
    icon: "https://cdn.simpleicons.org/maildotru",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    category: "email",
  },

  {
    id: "website_chat",
    name: "Website Chat",
    description:
      "Create and add website chat functionality on your website to engage with visitors and convert prospects into customers.",
    icon: "https://cdn.simpleicons.org/googlechat",
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-700",
    category: "livechat",
  },

  // {
  //   id: 'tiktok',
  //   name: 'TikTok',
  //   description: 'Connect TikTok Business Messaging to engage with a whole new audience from TikTok.',
  //   icon: 'https://cdn.simpleicons.org/tiktok',
  //   badge: 'Beta',
  //   badgeColor: 'bg-indigo-100 text-indigo-700',
  //   category: 'business'
  // },

  // {
  //   id: 'telegram',
  //   name: 'Telegram',
  //   description: 'Connect Telegram Bot to provide real-time support when customers reach out.',
  //   icon: 'https://cdn.simpleicons.org/telegram',
  //   category: 'business'
  // },

  // {
  //   id: 'viber',
  //   name: 'Viber',
  //   description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
  //   icon: 'https://cdn.simpleicons.org/viber',
  //   category: 'business'
  // },

  // {
  //   id: 'line',
  //   name: 'LINE',
  //   description: 'Connect LINE Official Account to provide timely support to your customers.',
  //   icon: 'https://cdn.simpleicons.org/line',
  //   category: 'business'
  // },

  // {
  //   id: 'wechat',
  //   name: 'WeChat',
  //   description: 'Connect WeChat Service Account for customer engagement and brand communication.',
  //   icon: 'https://cdn.simpleicons.org/wechat',
  //   category: 'business'
  // },

  // {
  //   id: 'gmail',
  //   name: 'Gmail',
  //   description: 'Connect your Gmail or Google Workspace account to manage emails from your inbox.',
  //   icon: 'https://cdn.simpleicons.org/gmail',
  //   badge: 'Popular',
  //   badgeColor: 'bg-green-100 text-green-700',
  //   category: 'email'
  // },

  // {
  //   id: 'sms',
  //   name: 'SMS / MMS',
  //   description: 'Send and receive SMS and MMS messages directly from your workspace.',
  //   icon: 'https://cdn.simpleicons.org/androidmessages',
  //   category: 'sms'
  // },

  // {
  //   id: 'livechat',
  //   name: 'Live Chat Widget',
  //   description: 'Add a live chat widget to your website and engage visitors in real time.',
  //   icon: 'https://cdn.simpleicons.org/livechat',
  //   badge: 'Popular',
  //   badgeColor: 'bg-green-100 text-green-700',
  //   category: 'livechat'
  // },

  // {
  //   id: 'calls',
  //   name: 'Voice Calls',
  //   description: 'Make and receive voice calls directly from your workspace with full call management.',
  //   icon: 'https://cdn.simpleicons.org/call',
  //   category: 'calls'
  // },

  // {
  //   id: 'custom',
  //   name: 'Custom Channel',
  //   description: 'Connect any channel not natively available to expand your communication reach.',
  //   icon: 'https://cdn.simpleicons.org/webhook',
  //   category: 'business'
  // }
];

// ─── Channel Catalog View ─────────────────────────────────────────────────────
export const ChannelCatalogView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const filteredChannels = CATALOG_CHANNELS.filter((ch) => {
    const matchesCategory =
      selectedCategory === "all" || ch.category === selectedCategory;
    const matchesSearch = ch.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (chId: string) => {
    const slug = CHANNEL_CONNECT_SLUGS[chId];
    if (slug) {
      // Navigate to dedicated connect page
      navigate(`/channel/connect/${slug}`);
      return;
    }
    // Simulate for channels without a dedicated page
    setConnecting(chId);
    setTimeout(() => {
      setConnected((prev) => new Set([...prev, chId]));
      setConnecting(null);
    }, 1200);
  };

  const handleBack = () => {
    navigate("/channels");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex justify-center items-center gap-4">
            <div>
              <Plug size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Channel Catalog
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Discover and connect new messaging channels to your workspace.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bg-white border-b border-gray-200 px-6 md:px-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {CATALOG_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-4 px-3 border-b-2 text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.id
                  ? 'border-indigo-600 text-indigo-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative pb-2 md:pb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search channels…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>
      </div> */}

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-base font-medium text-gray-600">
              No channels found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different search or category.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {filteredChannels.length} channel
              {filteredChannels.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map((ch) => {
                const isConnecting = connecting === ch.id;
                return (
                  <div
                    key={ch.id}
                    className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all relative flex flex-col"
                  >
                    {ch.badge && (
                      <span
                        className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium ${ch.badgeColor}`}
                      >
                        {ch.badge}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl  flex items-center justify-center mb-3 ">
                      <img src={ch.icon} className="w-10 h-10 object-contain" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1 pr-12">
                      {ch.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 flex-1">
                      {ch.description}
                    </p>
                    <div className=" flex  justify-end transition mt-5">
                      <button
                        onClick={() => handleConnect(ch.id)}
                        disabled={isConnecting}
                        className={`group relative px-4 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 transition-all duration-300 overflow-hidden
    ${
      isConnecting
        ? "border-indigo-300 bg-indigo-50 text-indigo-500 cursor-not-allowed"
        : "border-gray-300 bg-indigo-600 text-white  hover:border-white  hover:shadow-[0_2px_12px_rgba(59,130,246,0.15)] active:scale-[0.98]"
    }`}
                      >
                        {isConnecting ? (
                          <>
                            <svg
                              className="animate-spin"
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            <span>Connecting…</span>
                          </>
                        ) : (
                          <>
                            <span>Connect</span>
                            <ExternalLink
                              size={13}
                              className="transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
