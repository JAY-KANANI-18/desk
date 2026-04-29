import { useState, type ComponentType } from "react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle,
  ExternalLink,
  Globe,
  Key,
  Lock,
  MessageSquare,
  Phone,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import type { Channel } from "../types";
import type { WhatsAppConfig } from "./types";
import { ChannelApi } from "../../../lib/channelApi";
import { ChannelConnectActionButton } from "../../../components/channels/ChannelConnectActionButton";
import { Button } from "../../../components/ui/button/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { PasswordInput } from "../../../components/ui/inputs/PasswordInput";
import { Tag } from "../../../components/ui/tag/Tag";
import { getChannelIconUrl } from "../../../config/channelMetadata";
import { useChannelOAuth } from "../../../hooks/useChannelOAuth";

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

interface CredentialField {
  key: keyof WhatsAppConfig;
  label: string;
  placeholder: string;
  hint: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  type?: "password";
}

const CRED_FIELDS: CredentialField[] = [
  {
    key: "phoneNumberId",
    label: "Phone Number ID",
    placeholder: "1234567890",
    hint: "Meta Business Suite -> WhatsApp -> API Setup",
    Icon: Phone,
  },
  {
    key: "wabaId",
    label: "Business Account ID",
    placeholder: "9876543210",
    hint: "WABA ID from Meta Business Manager",
    Icon: Building2,
  },
  {
    key: "accessToken",
    label: "Permanent Access Token",
    placeholder: "EAAxxxxxxxx...",
    hint: "Generate via Meta Business Suite System User",
    Icon: Key,
    type: "password",
  },
  {
    key: "webhookSecret",
    label: "Webhook Verify Token",
    placeholder: "my_secret_token",
    hint: "Secret string to verify incoming webhook requests",
    Icon: Lock,
  },
];

const SETUP_STEPS = [
  {
    step: 1,
    title: "Create a Meta Business Account",
    desc: "Go to business.facebook.com and create or verify your Meta Business Account.",
    link: "https://business.facebook.com",
  },
  {
    step: 2,
    title: "Register your phone number",
    desc: "In Meta Business Suite, navigate to WhatsApp -> API Setup. Register a new phone number.",
    link: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
  },
  {
    step: 3,
    title: "Configure your webhook",
    desc: 'Set your webhook URL and enter the Webhook Verify Token below. Subscribe to the "messages" field.',
    link: null,
  },
  {
    step: 4,
    title: "Generate a permanent access token",
    desc: "In Meta Business Suite, create a System User, assign it to your WABA, and generate a never-expiring token.",
    link: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started",
  },
  {
    step: 5,
    title: "Test your connection",
    desc: "Use the Meta API Explorer to send a test message. You should see it arrive within seconds.",
    link: "https://developers.facebook.com/tools/explorer",
  },
];

export const WhatsAppSidebarInfo = ({ channel }: { channel: Channel }) => (
  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
    <div className="mb-2 flex items-center gap-2">
      <img
        src={getChannelIconUrl("whatsapp", "25D366")}
        className="h-10 w-10"
        alt="WhatsApp"
      />
      <span className="text-xs font-semibold text-emerald-800">
        WhatsApp Cloud API
      </span>
      <div className="ml-auto">
        <Tag label="Active" bgColor="success" size="sm" />
      </div>
    </div>
    <p className="mb-2.5 text-[11px] leading-relaxed text-emerald-700">
      Reach 2B+ users on the world's most popular messaging platform.
    </p>
    <ul className="space-y-1.5">
      {[
        "2B+ active users worldwide",
        "Rich media & interactive messages",
        "End-to-end encryption",
        "Automated workflows & bots",
        "Real-time delivery receipts",
        "Broadcast to opted-in contacts",
      ].map((benefit) => (
        <li key={benefit} className="flex items-start gap-1.5 text-[11px] text-emerald-700">
          <CheckCircle size={11} className="mt-0.5 shrink-0 text-emerald-500" />
          {benefit}
        </li>
      ))}
    </ul>
    <div className="mt-2.5 space-y-0.5 border-t border-emerald-100 pt-2.5">
      <p className="text-[11px] font-semibold text-emerald-700">
        {channel.identifier}
      </p>
      <p className="text-[10px] text-emerald-500">
        {channel.msgs.toLocaleString()} messages sent
      </p>
    </div>
  </div>
);

export const WhatsAppChannelSidebar = () => (
  <div className="flex h-full flex-col gap-6 p-6  ">
    <div className="flex items-center gap-2.5 ">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <img
          src={getChannelIconUrl("whatsapp")}
          className="h-10 w-10"
          alt="WhatsApp"
        />
      </div>
      <div>
        <p className="leading-none text-xs font-semibold text-gray-900">
          WhatsApp Cloud
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100 hidden md:block" />
    <div className='hidden md:block'>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Features
      </p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: "Rich Messaging", desc: "Images, docs & buttons" },
          { Icon: Zap, label: "Automation", desc: "Bots & workflows" },
          { Icon: Users, label: "2B+ Users", desc: "Largest messaging network" },
          { Icon: Shield, label: "Encrypted", desc: "End-to-end secure" },
          { Icon: BarChart3, label: "Analytics", desc: "Delivery & read receipts" },
          { Icon: Globe, label: "Global", desc: "180+ countries" },
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
        href="https://developers.facebook.com/docs/whatsapp/cloud-api"
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

export const WhatsAppCloudChannel = ({
  connected,
  onConnect,
  onDisconnect,
  workspaceId,
}: Props) => {
  const [tab] = useState<"credentials" | "meta">("meta");
  const [form, setForm] = useState<WhatsAppConfig>({
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    webhookSecret: "",
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loading: oauthLoading, startAuth } = useChannelOAuth({
    provider: "whatsapp",
    workspaceId,
    onSuccess: onConnect,
    onError: setError,
  });

  const handleCredentialsConnect = async () => {
    if (CRED_FIELDS.some((field) => !form[field.key])) {
      setError("All fields are required.");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const channel = await ChannelApi.whatsappManualConnect(
        form.accessToken,
        form.phoneNumberId,
        form.wabaId,
        form.webhookSecret,
        workspaceId,
      );
      onConnect(channel);
    } catch (caughtError: any) {
      setError(caughtError?.message ?? "Failed to connect. Please check your credentials.");
    } finally {
      setConnecting(false);
    }
  };

  const oauthStepLabel = oauthLoading ? "Waiting for Meta..." : "Connect with Meta";

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
            {connected.msgs.toLocaleString()} messages sent
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-500">Getting started</p>
          <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-black"
            style={{ aspectRatio: "16/9" }}
          >
            <iframe
              src="https://www.youtube.com/embed/CEt_KMMv3V8?rel=0&modestbranding=1"
              title="WhatsApp Cloud API"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Stops all incoming WhatsApp messages.
            </p>
          </div>
          <Button
            variant="secondary"
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

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Connect WhatsApp
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Integrate WhatsApp Business messaging into your platform.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--spacing-md)]">
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-[var(--spacing-lg)]">
            {tab === "meta" ? (
              <div className="space-y-[var(--spacing-lg)]">
                <div className="grid gap-[var(--spacing-md)] lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] lg:items-start">
             

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-[var(--spacing-md)]">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                      How it works
                    </p>
                    <div className="space-y-1">
                      {[
                        "A Meta login popup will open",
                        "Select your Facebook Business account",
                        "We detect your WABA & phone numbers",
                        "Channel is connected automatically",
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-[var(--spacing-sm)]">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-[9px] font-bold text-indigo-700">
                            {index + 1}
                          </span>
                          <span className="text-[11px] text-indigo-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                    <AlertCircle size={12} className="shrink-0" />
                    {error}
                  </div>
                ) : null}
                    <ChannelConnectActionButton
                      leftIcon={
                        <img
                          src={getChannelIconUrl("whatsapp", "ffffff")}
                          className="h-3 w-3"
                          alt=""
                        />
                      }
                      className="w-full sm:w-auto"
                      loading={oauthLoading}
                      loadingMode="inline"
                      loadingLabel={oauthStepLabel}
                      onClick={() => {
                        void startAuth();
                      }}
                    >
                      Connect with Meta
                    </ChannelConnectActionButton>

               

                <p className="text-center text-[10px] text-gray-400">
                  A popup will open to Meta&apos;s secure authorization page.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    <strong>Advanced:</strong> Use this if you have a System User token from
                    Meta Business Suite. System User tokens never expire and are recommended
                    for production.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {CRED_FIELDS.map((field) => {
                    const icon = <field.Icon size={14} className="text-gray-400" />;
                    const value = form[field.key];

                    return field.type === "password" ? (
                      <PasswordInput
                        key={field.key}
                        label={field.label}
                        value={value}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        hint={field.hint}
                        leftIcon={icon}
                      />
                    ) : (
                      <BaseInput
                        key={field.key}
                        label={field.label}
                        value={value}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        hint={field.hint}
                        leftIcon={icon}
                      />
                    );
                  })}
                </div>

                {error ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                    <AlertCircle size={12} className="shrink-0" />
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    leftIcon={<MessageSquare size={12} />}
                    loading={connecting}
                    loadingMode="inline"
                    loadingLabel="Connecting..."
                    onClick={() => void handleCredentialsConnect()}
                  >
                    Connect WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Need help?{" "}
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 underline transition-colors hover:text-gray-900"
        >
          View documentation
        </a>{" "}
        |{" "}
        <a
          href="mailto:support@axorainfotech.com"
          className="text-gray-600 underline transition-colors hover:text-gray-900"
        >
          Contact support
        </a>
      </p>
    </div>
  );
};

export const SetupGuide = () => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-5 py-4">
      <p className="text-sm font-semibold text-gray-900">Setup guide</p>
      <p className="mt-0.5 text-[11px] text-gray-400">What to do after connecting</p>
    </div>
    <div className="space-y-0 p-5">
      {SETUP_STEPS.map(({ step, title, desc, link }, index) => (
        <div key={step} className="relative flex gap-4 pb-5 last:pb-0">
          {index < SETUP_STEPS.length - 1 ? (
            <div className="absolute bottom-0 left-3.5 top-7 w-px bg-gray-100" />
          ) : null}
          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {step}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 no-underline transition-colors hover:text-gray-700"
                >
                  <ExternalLink size={10} />
                  Open
                </a>
              ) : null}
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
