
import { useState } from 'react';
import {
  Eye, EyeOff, AlertCircle, ExternalLink,
  Mail, Server, Lock, User, Globe, Zap, BarChart3, Shield,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Channel } from '../types';
import { ChannelApi } from '../../../lib/channelApi';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

interface EmailConfig {
  // Shared
  email: string;
  password: string;
  // SMTP (outgoing)
  smtpHost: string;
  smtpPort: string;
  smtpSecure: 'ssl' | 'tls' | 'none';
  // IMAP (incoming)
  imapHost: string;
  imapPort: string;
  imapSecure: 'ssl' | 'tls' | 'none';
}

const SECURE_OPTIONS: { value: EmailConfig['smtpSecure']; label: string }[] = [
  { value: 'ssl',  label: 'SSL / TLS'   },
  { value: 'tls',  label: 'STARTTLS'    },
  { value: 'none', label: 'None'        },
];

const COMMON_PROVIDERS = [
  { label: 'Gmail',        smtpHost: 'smtp.gmail.com',      smtpPort: '465', smtpSecure: 'ssl' as const, imapHost: 'imap.gmail.com',      imapPort: '993', imapSecure: 'ssl' as const },
  { label: 'Outlook',      smtpHost: 'smtp.office365.com',  smtpPort: '587', smtpSecure: 'tls' as const, imapHost: 'outlook.office365.com', imapPort: '993', imapSecure: 'ssl' as const },
  { label: 'Yahoo',        smtpHost: 'smtp.mail.yahoo.com', smtpPort: '465', smtpSecure: 'ssl' as const, imapHost: 'imap.mail.yahoo.com', imapPort: '993', imapSecure: 'ssl' as const },
  { label: 'Zoho',         smtpHost: 'smtp.zoho.com',       smtpPort: '465', smtpSecure: 'ssl' as const, imapHost: 'imap.zoho.com',       imapPort: '993', imapSecure: 'ssl' as const },
  { label: 'Custom / Other', smtpHost: '', smtpPort: '', smtpSecure: 'ssl' as const, imapHost: '', imapPort: '', imapSecure: 'ssl' as const },
];

// ─── Sidebar panel ────────────────────────────────────────────────────────────
export const EmailChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <img src="https://cdn.simpleicons.org/maildotru" className="w-10 h-10" alt="Email" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">Email (SMTP / IMAP)</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Any email provider</p>
      </div>
    </div>

    <div className="h-px bg-gray-100" />

    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: Mail,     label: 'Any Provider',    desc: 'Gmail, Outlook, Zoho & more'  },
          { Icon: Server,   label: 'SMTP Sending',    desc: 'Reliable outbound delivery'   },
          // { Icon: Zap,      label: 'IMAP Receiving',  desc: 'Real-time inbox sync'         },
          { Icon: Shield,   label: 'SSL / TLS',       desc: 'Encrypted connections'        },
          // { Icon: BarChart3,label: 'Tracking',        desc: 'Opens, clicks & bounces'      },
          { Icon: Globe,    label: 'Custom Domain',   desc: 'Send from your own domain'    },
        ].map(({ Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Icon size={13} className="text-gray-400 shrink-0" />
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
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick presets</p>
      <div className="space-y-1">
        {['Gmail', 'Outlook / Office 365', 'Yahoo Mail', 'Zoho Mail', 'Custom SMTP'].map((name, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5">
            <span className="text-[10px] font-bold text-gray-300 mt-0.5 shrink-0">·</span>
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
        className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors no-underline font-medium"
      >
        <ExternalLink size={11} />
        Documentation
      </a>
    </div>
  </div>
);

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, placeholder, type = 'text', hint, password, shown, onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  password?: boolean;
  shown?: boolean;
  onToggle?: () => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold text-gray-500">{label}</label>
    <div className="relative">
      <input
        autoComplete="new-password"
        type={password && !shown ? 'password' : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 transition-colors pr-9 box-border"
      />
      {password && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex"
        >
          {shown
            ? <EyeOff size={13} className="text-indigo-600 hover:text-indigo-500 transition-colors" />
            : <Eye    size={13} className="text-indigo-600 hover:text-indigo-500 transition-colors" />}
        </button>
      )}
    </div>
    {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
  </div>
);

// ─── Select component ─────────────────────────────────────────────────────────
const Select = ({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold text-gray-500">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 focus:border-gray-400 transition-colors appearance-none cursor-pointer box-border"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const EmailChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [form, setForm] = useState<EmailConfig>({
    email: '', password: '',
    smtpHost: '', smtpPort: '465', smtpSecure: 'ssl',
    imapHost: '', imapPort: '993', imapSecure: 'ssl',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');

  const set = (key: keyof EmailConfig) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  // ── Provider preset ────────────────────────────────────────────────────────
  const applyPreset = (providerLabel: string) => {
    setSelectedProvider(providerLabel);
    const preset = COMMON_PROVIDERS.find(p => p.label === providerLabel);
    if (preset) {
      setForm(f => ({
        ...f,
        smtpHost:   preset.smtpHost,
        smtpPort:   preset.smtpPort,
        smtpSecure: preset.smtpSecure,
        imapHost:   preset.imapHost,
        imapPort:   preset.imapPort,
        imapSecure: preset.imapSecure,
      }));
    }
  };

  // ── Connect ────────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    // if (!form.email || !form.password || !form.smtpHost || !form.smtpPort || !form.imapHost || !form.imapPort) {
    //   setError('All fields are required.');
    //   return;
    // }
    // setConnecting(true);
    // setError(null);
    // try {
    //   const channel = await ChannelApi.connectEmail({
    //     email:      form.email,
    //     password:   form.password,
    //     smtpHost:   form.smtpHost,
    //     smtpPort:   Number(form.smtpPort),
    //     smtpSecure: form.smtpSecure,
    //     imapHost:   form.imapHost,
    //     imapPort:   Number(form.imapPort),
    //     imapSecure: form.imapSecure,
    //   });
    //   onConnect(channel);
    // } catch (e: any) {
    //   setError(e?.message ?? 'Failed to connect. Please check your credentials and try again.');
    // } finally {
    //   setConnecting(false);
    // }
  };

  // ── Connected state ────────────────────────────────────────────────────────
  if (connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Channel active</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{connected.identifier}</p>
          </div>
          <span className="text-[11px] text-gray-500 font-medium shrink-0">
            {connected.msgs.toLocaleString()} messages sent
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming and outgoing email sync.</p>
          </div>
          <button
            onClick={() => onDisconnect(connected.id)}
            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors bg-transparent cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── Connect form ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Email</h1>
        <p className="text-sm text-gray-400 mt-1">
          Connect any mailbox using SMTP for sending .
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">

          {/* Provider presets */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-2">Email provider</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_PROVIDERS.map(({ label }) => (
                <button
                  key={label}
                  onClick={() => applyPreset(label)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer
                    ${selectedProvider === label
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-indigo-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Credentials */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Email address"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                hint="The email address to connect"
              />
              <Field
                label="Password / App password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••••••"
                password
                shown={showPassword}
                onToggle={() => setShowPassword(v => !v)}
                hint="Use an app password if 2FA is enabled"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* SMTP */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Outgoing mail — SMTP
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field
                  label="SMTP host"
                  value={form.smtpHost}
                  onChange={set('smtpHost')}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <Field
                label="Port"
                value={form.smtpPort}
                onChange={set('smtpPort')}
                placeholder="465"
              />
            </div>
            <Select
              label="Security"
              value={form.smtpSecure}
              onChange={set('smtpSecure')}
              options={SECURE_OPTIONS}
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* IMAP */}
          {/* <div className="space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Incoming mail — IMAP
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field
                  label="IMAP host"
                  value={form.imapHost}
                  onChange={set('imapHost')}
                  placeholder="imap.gmail.com"
                />
              </div>
              <Field
                label="Port"
                value={form.imapPort}
                onChange={set('imapPort')}
                placeholder="993"
              />
            </div>
            <Select
              label="Security"
              value={form.imapSecure}
              onChange={set('imapSecure')}
              options={SECURE_OPTIONS}
            />
          </div> */}

          {error && (
            <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-3">
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Lock size={10} /> Credentials encrypted at rest
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Mail size={12} />
                  Connect Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        Need help?{' '}
        <a
          href="https://docs.yourplatform.com/channels/email"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 underline transition-colors"
        >
          View documentation
        </a>
        {' '}·{' '}
        <a href="mailto:support@yourplatform.com" className="text-gray-600 hover:text-gray-900 underline transition-colors">
          Contact support
        </a>
      </p>
    </div>
  );
};