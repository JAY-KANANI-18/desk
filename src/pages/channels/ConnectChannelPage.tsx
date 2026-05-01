import { useState, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, MessageCircle, Video } from "lucide-react";
import { Button } from "../../components/ui/button/Button";
import { BackButton } from "../../components/channels/BackButton";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput } from "../../components/ui/inputs/BaseInput";
import { PasswordInput } from "../../components/ui/inputs/PasswordInput";
import { PageLayout } from "../../components/ui/PageLayout";
import { useChannel } from "../../context/ChannelContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ChannelApi } from "../../lib/channelApi";
import {
  getChannelDefinitionByConnectSlug,
  type ChannelRegistryItem,
} from "./channelRegistry";
import { FacebookChannel } from "../workspace/channels/FacebookChannel";
import { GmailChannel } from "../workspace/channels/GmailChannel";
import { InstagramChannel } from "../workspace/channels/InstagramChannel";
import { EmailChannel } from "../workspace/channels/EmailChannelV2";
import type { Channel as WsChannel } from "../workspace/types";
import { WhatsAppCloudChannel } from "../workspace/channels/WhatsAppCloudChannel";
import { WebsiteChatChannel } from "../workspace/channels/WebsiteChatChannel";

type SetupProps = {
  connected: WsChannel | null;
  onConnect: (channel: WsChannel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
};

const ExotelCallChannel = ({ onConnect, workspaceId }: SetupProps) => {
  const [name, setName] = useState("Exotel Calling");
  const [callerId, setCallerId] = useState("");
  const [sid, setSid] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const channel = await ChannelApi.connectExotel({
        workspaceId,
        name,
        callerId,
        sid,
        apiKey,
        apiToken,
      });
      onConnect(channel as any);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to connect Exotel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">Exotel setup</h2>
      <BaseInput
        label="Channel name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Channel name"
      />
      <BaseInput
        label="Caller ID"
        value={callerId}
        onChange={(event) => setCallerId(event.target.value)}
        placeholder="Caller ID"
      />
      <BaseInput
        label="Exotel SID"
        value={sid}
        onChange={(event) => setSid(event.target.value)}
        placeholder="Exotel SID"
      />
      <BaseInput
        label="API Key"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder="API Key"
      />
      <PasswordInput
        label="API Token"
        value={apiToken}
        onChange={(event) => setApiToken(event.target.value)}
        placeholder="API Token"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button
        onClick={() => void handleConnect()}
        disabled={!callerId || !sid || !apiKey || !apiToken}
        loading={loading}
        loadingMode="inline"
        loadingLabel="Connecting..."
      >
        Connect Exotel
      </Button>
    </div>
  );
};

const Msg91SmsChannel = ({ onConnect, workspaceId }: SetupProps) => {
  const [name, setName] = useState("MSG91 SMS");
  const [senderId, setSenderId] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [route, setRoute] = useState("4");
  const [dltTemplateId, setDltTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const channel = await ChannelApi.connectMsg91({
        workspaceId,
        name,
        senderId,
        authKey,
        route,
        dltTemplateId: dltTemplateId || undefined,
      });
      onConnect(channel as any);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to connect MSG91");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">MSG91 setup</h2>
      <BaseInput
        label="Channel name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Channel name"
      />
      <BaseInput
        label="Sender ID"
        value={senderId}
        onChange={(event) => setSenderId(event.target.value)}
        placeholder="Sender ID"
      />
      <PasswordInput
        label="Auth Key"
        value={authKey}
        onChange={(event) => setAuthKey(event.target.value)}
        placeholder="Auth Key"
      />
      <BaseInput
        label="Route"
        value={route}
        onChange={(event) => setRoute(event.target.value)}
        placeholder="Route (default 4)"
      />
      <BaseInput
        label="DLT Template ID"
        value={dltTemplateId}
        onChange={(event) => setDltTemplateId(event.target.value)}
        placeholder="DLT Template ID (optional)"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button
        onClick={() => void handleConnect()}
        disabled={!senderId || !authKey}
        loading={loading}
        loadingMode="inline"
        loadingLabel="Connecting..."
      >
        Connect MSG91
      </Button>
    </div>
  );
};

const CHANNEL_COMPONENTS: Record<string, ComponentType<SetupProps>> = {
  whatsapp_cloud: WhatsAppCloudChannel,
  messenger: FacebookChannel,
  instagram: InstagramChannel,
  email: EmailChannel,
  gmail: GmailChannel,
  website_chat: WebsiteChatChannel,
  exotel_call: ExotelCallChannel,
  msg91_sms: Msg91SmsChannel,
};

const GenericSidebar = ({ meta }: { meta: ChannelRegistryItem }) => (
  <div className="flex h-full flex-col gap-6 p-6">
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
        <img
          alt={meta.name}
          className="h-10 w-10 object-contain"
          src={meta.icon}
        />
      </div>
      <p className="text-sm font-bold text-gray-900">{meta.name}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
        {meta.description}
      </p>
    </div>

    <div className="h-px bg-gray-100" />

    {meta.videoTutorial ? (
      <a
        href={meta.videoTutorial}
        className="flex items-center gap-2 text-[11px] font-medium text-indigo-600 no-underline hover:underline"
      >
        <Video size={12} />
        Step-by-step video tutorial
      </a>
    ) : null}

    {meta.additionalResources?.length ? (
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Resources
        </p>
        <ul className="space-y-1.5">
          {meta.additionalResources.map((resource) => (
            <li key={resource.label}>
              <a
                href={resource.href}
                className="flex items-start gap-1.5 text-[11px] leading-relaxed text-indigo-600 no-underline hover:underline"
              >
                <span className="mt-0.5 shrink-0 text-gray-300">-</span>
                {resource.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

export const ConnectChannelPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { activeWorkspace } = useWorkspace();
  const { refreshChannels } = useChannel();

  const meta = getChannelDefinitionByConnectSlug(channelId);
  const Component = channelId ? CHANNEL_COMPONENTS[channelId] : null;

  if (!meta || !Component) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <MessageCircle size={28} className="text-gray-500" />
          </div>
          <p className="text-base font-semibold text-gray-700">
            Channel not found
          </p>
          <p className="mb-5 mt-1 text-sm text-gray-400">
            The channel you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => navigate("/channels")}>
            Back to channels
          </Button>
        </div>
      </div>
    );
  }

  const handleConnect = async (_channel: WsChannel) => {
    await refreshChannels();
    navigate("/channels");
  };

  const SidebarContent = meta.SidebarContent;
  const renderSidebarPanel = () =>
    SidebarContent ? <SidebarContent  /> : <GenericSidebar meta={meta} />;

  return (
    <PageLayout
      eyebrow="Channels / Connect"
      title={meta.name}
      leading={
        <div className="flex items-center gap-3">
        <BackButton
          ariaLabel="Back to channel catalog"
          onClick={() => navigate("/channels/connect")}
        />

         <img
            alt={meta.name}
            className="h-10 w-10 object-contain"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = "none";
            }}
            src={meta.icon}
          />
        </div>
      }
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-slate-50 px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col overflow-hidden bg-white">
        {isMobile ? (
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex items-start gap-3">
              <BackButton
                ariaLabel="Back to contacts"
                onClick={() => navigate("/channels/connect")}
                size="sm"
              />
              <img
            alt={meta.name}
            className="h-10 w-10 object-contain"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = "none";
            }}
            src={meta.icon}
          />

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Channels / Connect
                </p>
                <h1 className="truncate text-base font-semibold text-gray-900">
                  {meta.name}
                </h1>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-gray-100 bg-white md:block">
            {renderSidebarPanel()}
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto ">
            <div className="w-full px-[var(--spacing-md)] pb-24 pt-[var(--spacing-md)] md:mx-0 md:px-[var(--spacing-lg)] md:pb-[var(--spacing-lg)] md:pt-[var(--spacing-lg)]">
              {isMobile && null}

              <Component
                workspaceId={activeWorkspace?.id ?? ""}
                connected={null}
                onConnect={handleConnect}
                onDisconnect={() => navigate("/channels")}
              />
            </div>
          </main>
        </div>
      </div>
    </PageLayout>
  );
};
