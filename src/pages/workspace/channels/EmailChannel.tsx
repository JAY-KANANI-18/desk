import { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  Server,
  Shield,
} from "lucide-react";
import type { Channel } from "../types";
import { Button } from "../../../components/ui/button/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { PasswordInput } from "../../../components/ui/inputs/PasswordInput";
import { BaseSelect } from "../../../components/ui/select/BaseSelect";
import type { SelectOption } from "../../../components/ui/select/shared";
import { getChannelIconUrl } from "../../../config/channelMetadata";

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

interface EmailConfig {
  email: string;
  password: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: "ssl" | "tls" | "none";
  imapHost: string;
  imapPort: string;
  imapSecure: "ssl" | "tls" | "none";
}

const SECURE_OPTIONS: SelectOption[] = [
  { value: "ssl", label: "SSL / TLS" },
  { value: "tls", label: "STARTTLS" },
  { value: "none", label: "None" },
];

export const EmailChannelSidebar = () => (
  <div className="flex h-full flex-col gap-6 p-6">
  

    <div className="h-px bg-gray-100 hidden md:block" />

    <div className='hidden md:block'>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Features
      </p>
      <div className="space-y-0.5">
        {[
          { Icon: Mail, label: "Any Provider", desc: "Gmail, Outlook, Zoho & more" },
          { Icon: Server, label: "SMTP Sending", desc: "Reliable outbound delivery" },
          { Icon: Shield, label: "SSL / TLS", desc: "Encrypted connections" },
          { Icon: Globe, label: "Custom Domain", desc: "Send from your own domain" },
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

    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Quick presets
      </p>
      <div className="space-y-1">
        {[
          "Gmail",
          "Outlook / Office 365",
          "Yahoo Mail",
          "Zoho Mail",
          "Custom SMTP",
        ].map((name) => (
          <div key={name} className="flex items-start gap-2 px-2 py-1.5">
            <span className="mt-0.5 shrink-0 text-[10px] font-bold text-gray-300">
              -
            </span>
            <p className="text-[11px] text-gray-500">{name}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-auto">
      <a
        href="https://docs.yourplatform.com/channels/email"
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

export const EmailChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [form, setForm] = useState<EmailConfig>({
    email: "",
    password: "",
    smtpHost: "",
    smtpPort: "465",
    smtpSecure: "ssl",
    imapHost: "",
    imapPort: "993",
    imapSecure: "ssl",
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof EmailConfig) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleConnect = async () => {
    void onConnect;
    void setConnecting;
    void setError;
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
            {connected.msgs.toLocaleString()} messages sent
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Stops all incoming and outgoing email sync.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Connect Email
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Connect any mailbox using SMTP for sending.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="space-y-6 p-6">
          <div className="h-px bg-gray-100" />

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Credentials
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BaseInput
                type="email"
                label="Email address"
                value={form.email}
                onChange={(event) => setField("email")(event.target.value)}
                placeholder="you@company.com"
                hint="The email address to connect"
              />
              <PasswordInput
                label="Password / App password"
                value={form.password}
                onChange={(event) => setField("password")(event.target.value)}
                placeholder="Enter password"
                hint="Use an app password if 2FA is enabled"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Outgoing mail - SMTP
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <BaseInput
                  label="SMTP host"
                  value={form.smtpHost}
                  onChange={(event) => setField("smtpHost")(event.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <BaseInput
                type="number"
                label="Port"
                value={form.smtpPort}
                onChange={(event) => setField("smtpPort")(event.target.value)}
                placeholder="465"
              />
            </div>
            <BaseSelect
              label="Security"
              value={form.smtpSecure}
              onChange={(value) => setField("smtpSecure")(value)}
              options={SECURE_OPTIONS}
            />
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2">
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Lock size={10} />
              Credentials encrypted at rest
            </p>
            <Button
              leftIcon={<Mail size={12} />}
              loading={connecting}
              loadingMode="inline"
              loadingLabel="Connecting..."
              onClick={() => void handleConnect()}
            >
              Connect Email
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Need help?{" "}
        <a
          href="https://docs.yourplatform.com/channels/email"
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
