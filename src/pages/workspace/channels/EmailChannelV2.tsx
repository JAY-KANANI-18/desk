import { useMemo, useState } from 'react';
import { AlertCircle, CheckSquare, Globe, Lock, Mail, Server, Shield, Sparkles } from 'lucide-react';
import type { Channel } from '../types';
import { ChannelApi } from '../../../lib/channelApi';
import { buildEmailChannelPayload, deriveWorkspaceForwardingEmail, type EmailChannelFormValues } from '../../../lib/emailChannel';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId?: string;
}

const SECURITY_OPTIONS = [
  { value: 'SSL/TLS', label: 'SSL / TLS' },
  { value: 'STARTTLS', label: 'STARTTLS' },
  { value: 'None', label: 'None' },
] as const;

const COMMON_PROVIDERS = [
  { label: 'Gmail', smtpServer: 'smtp.gmail.com', smtpPort: '465', encryption: 'SSL/TLS' as const },
  { label: 'Outlook', smtpServer: 'smtp.office365.com', smtpPort: '587', encryption: 'STARTTLS' as const },
  { label: 'Yahoo', smtpServer: 'smtp.mail.yahoo.com', smtpPort: '465', encryption: 'SSL/TLS' as const },
  { label: 'Zoho', smtpServer: 'smtp.zoho.com', smtpPort: '465', encryption: 'SSL/TLS' as const },
  { label: 'Custom / Other', smtpServer: '', smtpPort: '587', encryption: 'STARTTLS' as const },
];

const DEFAULT_FORM: EmailChannelFormValues = {
  channelName: 'Email',
  emailAddress: '',
  displayName: '',
  username: '',
  password: '',
  smtpServer: '',
  smtpPort: '587',
  encryption: 'STARTTLS',
  forwardingEmail: '',
  forwardingConfirmed: false,
  signatureHtml: '<p>Regards,<br />{{agent_name}}</p>',
  signatureEnabled: true,
};

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
          { Icon: Mail, label: 'Any Provider', desc: 'Gmail, Outlook, Zoho and custom SMTP' },
          { Icon: Server, label: 'SMTP Sending', desc: 'Send directly from your mailbox' },
          { Icon: Shield, label: 'Secure Delivery', desc: 'SSL / TLS and STARTTLS support' },
          { Icon: Globe, label: 'Forwarding Inbox', desc: 'Bring replies into the shared inbox' },
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
  </div>
);

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 transition-colors box-border"
      />
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}

function ForwardingGuideIllustration({ emailAddress, forwardingEmail }: { emailAddress: string; forwardingEmail: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800 mb-4">
        <Sparkles size={15} className="text-indigo-500" />
        Set an auto-forwarding rule in your mailbox
      </div>
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="rounded-xl border border-white bg-white/90 px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Your mailbox</p>
          <p className="text-sm font-semibold text-gray-900">{emailAddress || 'support@company.com'}</p>
          <p className="text-xs text-gray-500 mt-1">Forward new support emails automatically.</p>
        </div>
        <div className="hidden md:flex items-center justify-center text-indigo-400 text-xl">→</div>
        <div className="rounded-xl border border-indigo-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400 mb-1">Forward To</p>
          <p className="text-sm font-semibold text-indigo-900 break-all">{forwardingEmail || 'support-workspace@inbound.yourapp.com'}</p>
          <p className="text-xs text-gray-500 mt-1">This is the inbox forwarding address for the channel.</p>
        </div>
      </div>
    </div>
  );
}

export const EmailChannel = ({ connected: _connected, onConnect, onDisconnect: _onDisconnect, workspaceId = '' }: Props) => {
  const [form, setForm] = useState<EmailChannelFormValues>({
    ...DEFAULT_FORM,
    forwardingEmail: deriveWorkspaceForwardingEmail(workspaceId),
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [createdChannel, setCreatedChannel] = useState<Channel | null>(null);

  const setField = (key: keyof EmailChannelFormValues) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canCreate = useMemo(
    () => Boolean(workspaceId && form.emailAddress.trim() && form.password.trim() && form.smtpServer.trim() && form.smtpPort.trim()),
    [form, workspaceId],
  );

  const applyPreset = (providerLabel: string) => {
    setSelectedProvider(providerLabel);
    const preset = COMMON_PROVIDERS.find((provider) => provider.label === providerLabel);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      channelName: providerLabel === 'Custom / Other' ? prev.channelName : providerLabel,
      smtpServer: preset.smtpServer,
      smtpPort: preset.smtpPort,
      encryption: preset.encryption,
    }));
  };

  const handleCreateChannel = async () => {
    if (!canCreate) {
      setError('Email address, password, SMTP server and port are required.');
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const channel = await ChannelApi.connectEmailChannel(workspaceId, {
        ...form,
        username: form.username.trim() || form.emailAddress.trim(),
      });
      const forwardingEmail = String(channel?.config?.forwardingEmail ?? channel?.identifier ?? '');
      setCreatedChannel(channel as Channel);
      setForm((prev) => ({ ...prev, forwardingEmail }));
    } catch (e: any) {
      setError(e?.message ?? e?.response?.data?.message ?? 'Failed to connect email channel.');
    } finally {
      setConnecting(false);
    }
  };

  const handleComplete = async () => {
    if (!createdChannel) return;
    try {
      const updated = await ChannelApi.updateEmailChannel(
        String(createdChannel.id),
        buildEmailChannelPayload({ ...form, forwardingConfirmed: true }),
      );
      onConnect((updated ?? createdChannel) as Channel);
    } catch (e: any) {
      setError(e?.message ?? e?.response?.data?.message ?? 'Failed to save forwarding settings.');
    }
  };

  if (createdChannel) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Finish Email Setup</h1>
          <p className="text-sm text-gray-400 mt-1">Forward incoming mail so replies appear in the inbox and your team can answer from one place.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-2">Forwarding email address</p>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="flex-1 text-sm font-medium text-gray-900 break-all">{form.forwardingEmail}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(form.forwardingEmail).catch(() => {})}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Copy
                </button>
              </div>
            </div>

            <ForwardingGuideIllustration emailAddress={form.emailAddress} forwardingEmail={form.forwardingEmail} />

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Mailbox steps</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                <li>Open filters or forwarding in your email provider.</li>
                <li>Create a rule to forward incoming support email to the address above.</li>
                <li>Save the rule, then confirm below.</li>
              </ol>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.forwardingConfirmed}
                onChange={(e) => setField('forwardingConfirmed')(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">I have set up the email forwarding rule.</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">You can edit sender name, forwarding confirmation, and signature later from the manage screen.</p>
              <button
                onClick={handleComplete}
                disabled={!form.forwardingConfirmed}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckSquare size={12} />
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Email</h1>
        <p className="text-sm text-gray-400 mt-1">Connect any mailbox using SMTP for sending, then finish forwarding setup for receiving.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 ">
       

          <div className="h-px bg-gray-100" />

          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Forwarding Inbox</p>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400 mb-1">System-generated forwarding email</p>
              <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2.5">
                <span className="flex-1 break-all text-sm font-semibold text-indigo-900">
                  {form.forwardingEmail || deriveWorkspaceForwardingEmail(workspaceId) || 'Generated after connect'}
                </span>
                {form.forwardingEmail && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(form.forwardingEmail).catch(() => {})}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">Use this address in your mail provider forwarding rule. It is created by the backend and cannot be edited.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Channel name" value={form.channelName} onChange={setField('channelName') as any} placeholder="Support Email" />
            <Field label="Display sender name" value={form.displayName} onChange={setField('displayName') as any} placeholder="Axora Support" />
            <Field label="Email address" value={form.emailAddress} onChange={setField('emailAddress') as any} placeholder="support@company.com" />
            <Field label="Username" value={form.username} onChange={setField('username') as any} placeholder="Defaults to email address" hint="Leave blank to use the email address as SMTP username." />
            <Field label="Password / App password" value={form.password} onChange={setField('password') as any} placeholder="••••••••••••" type="password" />
          </div>

          <div className="h-px bg-gray-100" />

          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SMTP Settings</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Field label="SMTP server" value={form.smtpServer} onChange={setField('smtpServer') as any} placeholder="smtp.gmail.com" />
              </div>
              <Field label="Port" value={form.smtpPort} onChange={setField('smtpPort') as any} placeholder="587" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Security</label>
              <select
                value={form.encryption}
                onChange={(e) => setField('encryption')(e.target.value)}
                className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 focus:border-gray-400 transition-colors"
              >
                {SECURITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

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
              onClick={handleCreateChannel}
              disabled={connecting || !canCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
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
    </div>
  );
};
