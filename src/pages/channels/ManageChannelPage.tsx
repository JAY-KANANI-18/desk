import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Info,
  Loader,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Wrench,
} from "lucide-react";

import { SettingsNavList } from "../../components/settings/SettingsNavList";
import { SettingsSidebar } from "../../components/settings/SettingsSidebar";
import { BackButton } from "../../components/channels/BackButton";
import { Button } from "../../components/ui/button/Button";
import { DisclosureButton } from "../../components/ui/button/DisclosureButton";
import { IconButton } from "../../components/ui/button/IconButton";
import {
  BaseInput,
  type BaseInputProps,
} from "../../components/ui/inputs/BaseInput";
import { ConfirmDeleteModal } from "../../components/ui/modal";
import { CopyInput } from "../../components/ui/inputs/CopyInput";
import { TextareaInput } from "../../components/ui/inputs/TextareaInput";
import { PageLayout } from "../../components/ui/PageLayout";
import { Tag } from "../../components/ui/tag/Tag";
import { Tooltip } from "../../components/ui/tooltip/Tooltip";
import { useChannel } from "../../context/ChannelContext";
import {
  CHANNEL_TYPE_LABEL_TO_KEY,
  MANAGE_CHANNEL_CONFIG,
  type ManageChannelNavIconKey,
} from "../../config/channelMetadata";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ChannelApi } from "../../lib/channelApi";
import { InstagramConfiguration } from "../workspace/channels/InstagramConfig";
import { InstagramIceBreakersSection } from "../workspace/channels/InstagramIceBreakers";
import { EmailConfiguration } from "../workspace/channels/EmailConfigV2";
import { GmailConfiguration } from "../workspace/channels/GmailConfig";
import { MessengerChatMenuSection } from "../workspace/channels/MessengerChatMenu";
import { MessengerConfiguration } from "../workspace/channels/MessengerConfig";
import { MessengerTemplatesSection } from "../workspace/channels/MessengerTemplates";
import { MetaAutomationSection } from "../workspace/channels/MetaAutomationSection";
import { WhatsAppConfiguration } from "../workspace/channels/WhatsAppCloudConfig";
import { WhatsAppTemplatesSection } from "../workspace/channels/WhatsAppTemplates";
import { WebsiteChatConfiguration } from "../workspace/channels/WebsiteChatConfig";

export interface ConnectedChannel {
  id: number | string;
  name: string;
  type: string;
  identifier: string;
  status: "Connected" | "Error" | "Disconnected";
  icon?: string;
  color?: string;
  msgs?: number;
  connectedAt?: string;
  config?: any;
  credentials?: any;
}

export function useSave() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (fn: () => Promise<any>) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await fn();
      if (result?.success === false) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return { saving, saved, error, save };
}

export const SaveButton = ({
  saving,
  saved,
  error,
  onClick,
  label = "Save Changes",
  disabled = false,
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
    <Button
      onClick={onClick}
      disabled={disabled}
      loading={saving}
      loadingMode="inline"
      loadingLabel="Saving..."
      variant={saved && !saving ? "success" : "primary"}
      size="sm"
      leftIcon={saved && !saving ? <Check size={15} /> : undefined}
    >
      {saved && !saving ? "Saved!" : label}
    </Button>
    {error ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
        <AlertCircle size={13} />
        {error}
      </span>
    ) : null}
    {saved && !error ? (
      <span className="text-xs font-medium text-green-600">
        Changes saved successfully
      </span>
    ) : null}
  </div>
);

export const CopyButton = ({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <IconButton
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className={className}
      aria-label={copied ? "Copied" : "Copy value"}
      variant="ghost"
      icon={
        copied ? (
          <Check size={14} style={{ color: "var(--color-success)" }} />
        ) : (
          <Copy size={14} />
        )
      }
    />
  );
};

export const ReadonlyField = ({
  label,
  value,
  hint,
  extra,
}: {
  label: string;
  value: string;
  hint?: string;
  extra?: ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint ? (
        <Tooltip content={hint}>
          <span className="cursor-help text-gray-400">
            <Info size={13} />
          </span>
        </Tooltip>
      ) : null}
    </div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex-1">
        <CopyInput value={value} />
      </div>
      {extra}
    </div>
  </div>
);

export const EditableField = ({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint ? (
        <Tooltip content={hint}>
          <span className="cursor-help text-gray-400">
            <Info size={13} />
          </span>
        </Tooltip>
      ) : null}
    </div>
    <BaseInput
      type={type as BaseInputProps["type"]}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export const DangerZone = ({
  channelLabel,
  onDisconnect,
  channelId,
}: {
  channelLabel: string;
  onDisconnect: () => void;
  channelId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { saving, error, save } = useSave();

  const handleDisconnect = async () => {
    await save(async () => {
      const result = await ChannelApi.deleteChannel(channelId);
      onDisconnect();
      return result;
    });
  };

  const closeConfirm = () => {
    if (saving) return;
    setConfirmOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border ">
      {/* <DisclosureButton
        onClick={() => setOpen((current) => !current)}
        tone="danger"
        open={open}
        leadingIcon={<AlertTriangle size={16} />}
      >
        Danger Zone
      </DisclosureButton> */}

      {/* {open ? ( */}
      <div className=" bg-white px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Disconnect this channel
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Permanently disconnects this {channelLabel} channel.
            </p>
            {error ? (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            ) : null}
          </div>

          <Button
            onClick={() => setConfirmOpen(true)}
            variant="danger"
            disabled={saving}
          >
            Disconnect
          </Button>
        </div>
      </div>
      {/* ) : null} */}

      <ConfirmDeleteModal
        open={confirmOpen}
        entityName={`${channelLabel} channel`}
        entityType="channel"
        title="Disconnect channel"
        heading={`Disconnect ${channelLabel} channel?`}
        body={
          <div className="space-y-2">
            <p>
              The channel will stop syncing messages and automations that rely
              on it may no longer run.
            </p>
            {error ? <p className="font-medium text-red-600">{error}</p> : null}
          </div>
        }
        confirmLabel="Disconnect channel"
        isDeleting={saving}
        onCancel={closeConfirm}
        onConfirm={handleDisconnect}
      />
    </div>
  );
};

const MANAGE_NAV_ICON_BY_KEY: Record<ManageChannelNavIconKey, ReactNode> = {
  settings: <Settings size={14} />,
  fileText: <FileText size={14} />,
  messageCircle: <MessageCircle size={14} />,
  menu: <Menu size={14} />,
  wrench: <Wrench size={14} />,
};

export const CHANNEL_META: Record<
  string,
  {
    label: string;
    icon: string;
    color: string;
    navItems: { id: string; label: string; icon: ReactNode; badge?: string }[];
    additionalResources: { label: string; href: string }[];
  }
> = Object.fromEntries(
  Object.entries(MANAGE_CHANNEL_CONFIG).map(([key, meta]) => [
    key,
    {
      ...meta,
      navItems: meta.navItems.map((item) => ({
        ...item,
        icon: MANAGE_NAV_ICON_BY_KEY[item.icon],
      })),
    },
  ]),
);

export const CHANNEL_TYPE_TO_SLUG: Record<string, string> =
  CHANNEL_TYPE_LABEL_TO_KEY;

const ProfileSection = ({ channel }: { channel: ConnectedChannel }) => {
  const { saving, saved, error, save } = useSave();
  const [about, setAbout] = useState(
    channel?.config?.about ?? "We provide excellent customer support 24/7.",
  );
  const [website, setWebsite] = useState(channel?.config?.website ?? "");
  const [email, setEmail] = useState(channel?.config?.email ?? "");

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Business Profile
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Update your WhatsApp Business profile information.
        </p>
      </div>

      <div className="space-y-4">
        <BaseInput label="Business Name" value={channel.name} readOnly />
        <TextareaInput
          label="About"
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          rows={3}
        />
        <EditableField
          label="Website"
          value={website}
          onChange={setWebsite}
          placeholder="https://yourcompany.com"
        />
        <EditableField
          label="Support Email"
          value={email}
          onChange={setEmail}
          placeholder="support@yourcompany.com"
        />
      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={() =>
          save(() =>
            ChannelApi.updateWhatsAppChannel(String(channel.id), {
              accessToken: channel.config?.accessToken ?? "",
            }),
          )
        }
        label="Save Profile"
      />
    </div>
  );
};

const TroubleshootSection = ({ channel }: { channel: ConnectedChannel }) => {
  const [running, setRunning] = useState(false);
  const [results] = useState([
    { label: "Webhook Status", value: "Active", ok: true },
    { label: "API Connection", value: "Connected", ok: true },
    { label: "Phone Number Verified", value: "Yes", ok: true },
    { label: "Business Account Status", value: "Active", ok: true },
    {
      label: "Message Delivery",
      value: channel.status === "Connected" ? "Normal" : "Degraded",
      ok: channel.status === "Connected",
    },
  ]);

  const runDiagnostics = async () => {
    setRunning(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    setRunning(false);
  };

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Troubleshoot
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Diagnose and resolve connection issues.
          </p>
        </div>
        <Button
          onClick={() => void runDiagnostics()}
          variant="secondary"
          size="sm"
          leftIcon={!running ? <RefreshCw size={14} /> : undefined}
          loading={running}
          loadingMode="inline"
          loadingLabel="Running..."
        >
          Run diagnostics
        </Button>
      </div>

      <div className="divide-y divide-gray-100 border-y border-gray-100">
        {results.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-3"
          >
            <span className="text-sm text-gray-700">{item.label}</span>
            <Tag
              label={item.value}
              size="sm"
              bgColor={item.ok ? "success" : "error"}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const CatalogSection = () => (
  <div className="space-y-[var(--spacing-lg)]">
    <div>
      <h2 className="text-base font-semibold text-gray-900">
        Meta Product Catalog
      </h2>
      <p className="mt-0.5 text-sm text-gray-500">
        Connect your Meta product catalog to send product messages.
      </p>
    </div>

    <div className="border-y border-gray-100 py-6">
      <ShoppingBag size={20} className="mb-3 text-gray-400" />
      <p className="mb-1 text-sm font-semibold text-gray-900">
        No catalog connected
      </p>
      <p className="mb-4 max-w-xl text-sm text-gray-500">
        Connect your Meta product catalog to enable product messages and
        interactive shopping experiences.
      </p>
      <Button size="sm">Connect Catalog</Button>
    </div>
  </div>
);

const PrivateRepliesSection = () => {
  const [trackMode, setTrackMode] = useState<"all" | "specific">("specific");

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Private Replies
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Automatically send a private message when someone comments on your
          posts.
        </p>
      </div>

      <div className="flex items-start gap-2.5 border-l border-amber-300 pl-3">
        <Info size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-gray-600">
          Private replies use the 24-hour messaging window. The contact must
          comment before you can reply.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "specific"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={trackMode === mode ? "primary" : "secondary"}
            contentAlign="start"
            onClick={() => setTrackMode(mode)}
          >
            {mode === "all"
              ? "All posts, reels, and live stories"
              : "Specific posts and reels only"}
          </Button>
        ))}
      </div>

      {trackMode === "specific" ? (
        <div className="space-y-3">
          <div className="border-y border-dashed border-gray-200 py-6 text-sm text-gray-400">
            No posts added yet
          </div>
          <Button size="sm" leftIcon={<Plus size={15} />}>
            Add post
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const SectionContent = ({
  sectionId,
  channelType,
  channel,
  onDisconnect,
}: {
  sectionId: string;
  channelType: string;
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  if (sectionId === "profile") return <ProfileSection channel={channel} />;
  if (sectionId === "troubleshoot")
    return <TroubleshootSection channel={channel} />;
  if (sectionId === "catalog") return <CatalogSection />;
  if (sectionId === "private_replies") {
    return <MetaAutomationSection channel={channel} mode="private_replies" />;
  }
  if (sectionId === "story_replies") {
    return <MetaAutomationSection channel={channel} mode="story_replies" />;
  }

  if (sectionId === "templates") {
    return channelType === "messenger" ? (
      <MessengerTemplatesSection channel={channel} />
    ) : (
      <WhatsAppTemplatesSection channel={channel} />
    );
  }

  if (sectionId === "icebreakers") {
    return <InstagramIceBreakersSection channel={channel} />;
  }

  if (sectionId === "chat_menu") {
    return <MessengerChatMenuSection channel={channel} />;
  }

  switch (channelType) {
    case "whatsapp":
      return (
        <WhatsAppConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
    case "instagram":
      return (
        <InstagramConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
    case "messenger":
      return (
        <MessengerConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
    case "email":
      return (
        <EmailConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
    case "gmail":
      return (
        <GmailConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
    case "webchat":
      return (
        <WebsiteChatConfiguration
          channel={channel}
          onDisconnect={onDisconnect}
        />
      );
    default:
      return (
        <EmailConfiguration channel={channel} onDisconnect={onDisconnect} />
      );
  }
};

export const ManageChannelPage = () => {
  const { channelType, channelId, sectionId } = useParams<{
    channelType: string;
    channelId: string;
    sectionId?: string;
  }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { channels, loading, refreshing, refreshChannels } = useChannel();
  const channel = channels.find((item) => String(item.id) === channelId);
  const meta = channelType ? CHANNEL_META[channelType] : null;
  const defaultSection = meta?.navItems[0]?.id ?? "configuration";
  const hasValidSection = Boolean(
    sectionId && meta?.navItems.some((item) => item.id === sectionId),
  );
  const activeSection = hasValidSection ? sectionId! : defaultSection;
  const [channelIdentifierCopied, setChannelIdentifierCopied] = useState(false);

  const navSections = useMemo(() => {
    if (!meta || !channelType || !channelId) {
      return [];
    }

    return [
      {
        id: "channel-manage",
        label: "Manage",
        items: meta.navItems.map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          badge: item.badge,
          to: `/channels/manage/${channelType}/${channelId}/${item.id}`,
        })),
      },
    ];
  }, [channelId, channelType, meta]);

  useEffect(() => {
    if (
      loading ||
      refreshing ||
      !meta ||
      !channel ||
      !channelType ||
      !channelId ||
      !defaultSection
    ) {
      return;
    }

    if (!sectionId) {
      if (!isMobile) {
        navigate(
          `/channels/manage/${channelType}/${channelId}/${defaultSection}`,
          {
            replace: true,
          },
        );
      }
      return;
    }

    if (!hasValidSection) {
      navigate(
        `/channels/manage/${channelType}/${channelId}/${defaultSection}`,
        {
          replace: true,
        },
      );
    }
  }, [
    channel,
    channelId,
    channelType,
    defaultSection,
    hasValidSection,
    isMobile,
    loading,
    meta,
    navigate,
    refreshing,
    sectionId,
  ]);

  useEffect(() => {
    setChannelIdentifierCopied(false);
  }, [channelId]);

  if (loading || refreshing) {
    return (
      <div className="flex h-full items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader size={28} className="animate-spin" />
          <span className="text-sm">Loading channel...</span>
        </div>
      </div>
    );
  }

  if (!meta || !channelType || !channel) {
    return (
      <div className="flex h-full items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-xs font-semibold text-gray-400">
            RadioTower
          </div>
          <p className="text-lg font-semibold text-gray-700">
            Channel not found
          </p>
          <p className="mt-1 text-sm text-gray-400">
            This channel may have been disconnected.
          </p>
          <div className="mt-4">
            <Button onClick={() => navigate("/channels")}>
              Back to channels
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (isMobile && sectionId) {
      navigate(`/channels/manage/${channelType}/${channelId}`);
      return;
    }

    navigate("/channels");
  };

  const desktopTitle = channel.name || meta.label;
  const channelIdentifier = String(channelId ?? channel.id ?? "");

  const renderSidebarHeader = () => (
    <div className="space-y-4">
      

      <div className="">
     
        <div className="mt-1 flex items-center gap-1.5">
          <p className="min-w-0 truncate font-mono text-xs text-slate-600 px-4">
            ID: {channelIdentifier}
          </p>
          {channelIdentifier ? (
            <Tooltip
              content={channelIdentifierCopied ? "Copied" : "Copy channel ID"}
            >
              <span className="inline-flex shrink-0">
                <IconButton
                  type="button"
                  aria-label={
                    channelIdentifierCopied ? "Copied" : "Copy channel ID"
                  }
                  icon={
                    channelIdentifierCopied ? (
                      <Check
                        size={11}
                        style={{ color: "var(--color-success)" }}
                      />
                    ) : (
                      <Copy size={11} />
                    )
                  }
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(channelIdentifier)
                      .catch(() => undefined);
                    setChannelIdentifierCopied(true);
                    window.setTimeout(
                      () => setChannelIdentifierCopied(false),
                      1500,
                    );
                  }}
                />
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderSidebarFooter = () => (
    <div className="space-y-4">
      {channel.connectedAt ? (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Connected
          </p>
          <p className="text-xs text-slate-500">{channel.connectedAt}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Resources
        </p>
        <ul className="space-y-2">
          {meta.additionalResources.map((resource) => (
            <li key={resource.label}>
              <a
                className="text-xs font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary)] hover:underline"
                href={resource.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {resource.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <PageLayout
      eyebrow={`Connected Channels /`}
      title={desktopTitle}
      leading={
        <div className="flex items-center gap-3 mr-1">
          <BackButton
            ariaLabel="Back to channels"
            onClick={() => navigate("/channels")}
          />
          <img
            alt={meta.label}
            className="h-10 w-10 object-contain"
            onError={(event) => {
              (event.target as HTMLImageElement).style.display = "none";
            }}
            src={meta.icon}
          />
        </div>
      }
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="mobile-borderless flex h-full min-h-0 flex-col bg-white">
        {isMobile ? (
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <IconButton
                aria-label="Back"
                icon={<ArrowLeft size={18} />}
                onClick={handleBack}
                variant="ghost"
              />
              <img
        alt={meta.label}
        className="h-8 w-8 object-contain"
        onError={(event) => {
          (event.target as HTMLImageElement).style.display = 'none';
        }}
        src={meta.icon}
      />

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {`Connected Channels `}
                </p>
                <h1 className="truncate text-base font-semibold text-slate-900">
                  {channel.name || meta.label}
                </h1>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="hidden md:block md:flex-shrink-0">
            <SettingsSidebar
              footerContent={renderSidebarFooter()}
              headerContent={renderSidebarHeader()}
              sections={navSections}
              title={`${meta.label} settings`}
            />
          </div>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full w-full max-w-6xl flex-col px-[var(--spacing-md)] pb-24 pt-[var(--spacing-md)] md:mx-0 md:px-[var(--spacing-lg)] md:pb-[var(--spacing-lg)] md:pt-[var(--spacing-lg)]">
              {isMobile && !sectionId ? (
                <div className="">
                  <div className="py-4">{renderSidebarHeader()}</div>

                  <div className="py-2">
                    <SettingsNavList sections={navSections} />
                  </div>

                  <div className="py-4">{renderSidebarFooter()}</div>
                </div>
              ) : (
                <SectionContent
                  sectionId={activeSection}
                  channelType={channelType}
                  channel={channel}
                  onDisconnect={() => {
                    void refreshChannels();
                    navigate("/channels");
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </PageLayout>
  );
};
