import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  ExternalLink,
  Globe,
  Lock,
  MessageSquare,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type { Channel } from "../types";
import { ChannelApi } from "../../../lib/channelApi";
import { Button } from "../../../components/ui/button/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { CheckboxInput } from "../../../components/ui/inputs/CheckboxInput";
import { ColorInput } from "../../../components/ui/inputs/ColorInput";
import { CopyInput } from "../../../components/ui/inputs/CopyInput";
import { TagInput } from "../../../components/ui/inputs/TagInput";
import { Tag } from "../../../components/ui/tag/Tag";
import { getChannelIconUrl } from "../../../config/channelMetadata";
import { buildWebsiteChatEmbedCode } from "./websiteChatEmbed";

const CHAT_ICONS = [
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      width="22"
      height="22"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v7A2.5 2.5 0 0 0 5.5 16H7v3l3.5-3H18.5A2.5 2.5 0 0 0 21 13.5v-7z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3v3l4-3h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <rect x="2" y="2" width="20" height="16" rx="4" ry="4" />
      <path d="M8 22l4-4h6a2 2 0 0 0 2-2V6" />
    </svg>
  ),
];

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

interface CreatedWebsiteChannel extends Channel {
  embedCode?: string;
  config?: {
    widgetToken?: string;
    appearance?: {
      agentName?: string;
      primaryColor?: string;
      welcomeMessage?: string;
    };
  };
}

const DEFAULT_AGENT_NAME = "Support";
const DEFAULT_WELCOME_MESSAGE = "Hi! How can we help?";

export const WebsiteChatChannelSidebar = () => (
  <div className="flex h-full flex-col gap-6 p-6">
   
    <div className="h-px bg-gray-100 hidden md:block" />
    <div className='hidden md:block'>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Features
      </p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: "Live Chat", desc: "Real-time visitor messaging" },
          { Icon: Zap, label: "Instant Setup", desc: "One script tag to embed" },
          { Icon: Globe, label: "Any Website", desc: "Works on any platform" },
          { Icon: Shield, label: "Secure", desc: "Token-authenticated sessions" },
          { Icon: BarChart3, label: "History", desc: "Full conversation history" },
        ].map(({ Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
          >
            <Icon size={13} className="shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-700">{label}</p>
              <p className="text-[10px] text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div className="mt-auto">
      <a
        href="https://docs.yourplatform.com/webchat"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[11px] font-medium text-gray-400 no-underline transition-colors hover:text-gray-700"
      >
        <ExternalLink size={11} />
        Documentation
      </a>
    </div>
  </div>
);

export const WebsiteChatChannel = ({
  connected,
  onConnect,
  onDisconnect,
  workspaceId,
}: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [websites, setWebsites] = useState<string[]>([]);
  const [themeColor, setThemeColor] = useState("#4f46e5");
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [embedCode, setEmbedCode] = useState("");
  const [createdChannel, setCreatedChannel] =
    useState<CreatedWebsiteChannel | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    setConnecting(true);
    setError(null);

    try {
      const response = await ChannelApi.createWebchatChannel(workspaceId, {
        name: "Website Chat",
        agentName: DEFAULT_AGENT_NAME,
        welcomeMessage: DEFAULT_WELCOME_MESSAGE,
        primaryColor: themeColor,
        allowedOrigins: websites,
      });

      setCreatedChannel(response);
      setEmbedCode(
        buildWebsiteChatEmbedCode(response, {
          agentName: DEFAULT_AGENT_NAME,
          primaryColor: themeColor,
          welcomeMessage: DEFAULT_WELCOME_MESSAGE,
        }),
      );
      setStep(2);
    } catch (caughtError: any) {
      setError(
        caughtError?.response?.data?.message ??
          caughtError?.message ??
          "Failed to create channel.",
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    if (!confirmed || !createdChannel) {
      return;
    }

    void sendEmail;
    onConnect(createdChannel);
  };

  if (connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Channel active</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {connected.identifier}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-gray-500">
            {connected.msgs?.toLocaleString()} messages
          </span>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Stops all incoming website chat messages.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDisconnect(connected.id)}
            style={{
              color: "var(--color-error)",
              borderColor: "var(--color-error)",
            }}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Connect Website Chat
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Embed a live chat widget on your website. Further customization is
            available after connecting.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="space-y-6 p-6">
            <TagInput
              label="Website(s) where the widget will be added"
              values={websites}
              onChange={setWebsites}
              placeholder="e.g. www.apple.com"
              hint="Press Enter or comma to add each website"
            />

            <ColorInput
              label="Theme Color"
              value={themeColor}
              onChange={setThemeColor}
            />

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">
                Launcher Icon
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {CHAT_ICONS.map((IconMarkup, index) => (
                  <Button
                    key={index}
                    iconOnly
                    radius="full"
                    variant="ghost"
                    aria-label={`Select launcher icon ${index + 1}`}
                    leftIcon={<IconMarkup />}
                    onClick={() => setSelectedIcon(index)}
                    style={{
                      backgroundColor: themeColor,
                      width: "44px",
                      minWidth: "44px",
                      minHeight: "44px",
                      transform: selectedIcon === index ? "scale(1.1)" : undefined,
                      boxShadow:
                        selectedIcon === index
                          ? "0 0 0 3px var(--color-primary-light)"
                          : undefined,
                    }}
                  />
                ))}
                <IconButton
                  icon={<Upload size={15} />}
                  aria-label="Upload custom icon"
                  variant="ghost"
                  size="lg"
                  style={{
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    borderColor: "var(--color-gray-200)",
                    color: "var(--color-gray-400)",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                <AlertCircle size={12} className="shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Lock size={10} />
                Token generated securely on our servers
              </p>
              <Button
                // rightIcon={<ArrowRight size={12} />}
                loading={connecting}
                loadingMode="inline"
                loadingLabel="Creating..."
                disabled={websites.length === 0}
                onClick={() => void handleNext()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Add the Widget Script
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Paste this before the{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">&lt;/body&gt;</code>{" "}
          tag on your website.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 sm:flex-row sm:items-start">
            <code className="flex-1 break-all font-mono text-xs leading-relaxed text-emerald-300">
              {embedCode}
            </code>
            <Button
              size="sm"
              onClick={handleCopy}
              style={
                copied
                  ? {
                      backgroundColor: "var(--color-success)",
                      borderColor: "var(--color-success)",
                      color: "white",
                    }
                  : {
                      backgroundColor: "var(--color-gray-700)",
                      borderColor: "var(--color-gray-700)",
                      color: "var(--color-gray-100)",
                    }
              }
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {createdChannel?.identifier || createdChannel?.config?.widgetToken ? (
            <CopyInput
              label="Widget token"
              value={createdChannel.identifier || createdChannel.config?.widgetToken || ""}
            />
          ) : null}

          <div className="space-y-3 pt-1">
            <CheckboxInput
              checked={sendEmail}
              onChange={setSendEmail}
              label="Send installation instructions to website admin via email."
            />
            <CheckboxInput
              checked={confirmed}
              onChange={setConfirmed}
              label="I have added the script, or informed my website admin to add it."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-2 sm:flex-row sm:items-center">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              leftIcon={<Check size={12} />}
              disabled={!confirmed}
              onClick={handleComplete}
            >
              Complete Setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
