import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  Globe,
  Lock,
  Mail,
  Server,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { CopyInput } from '../../../components/ui/inputs/CopyInput';
import { PasswordInput } from '../../../components/ui/inputs/PasswordInput';
import { BaseSelect } from '../../../components/ui/select/BaseSelect';
import type { SelectOption } from '../../../components/ui/select/shared';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import { ChannelApi } from '../../../lib/channelApi';
import {
  buildEmailChannelPayload,
  deriveWorkspaceForwardingEmail,
  type EmailChannelFormValues,
} from '../../../lib/emailChannel';
import type { Channel } from '../types';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId?: string;
}

const SECURITY_OPTIONS: SelectOption[] = [
  { value: 'SSL/TLS', label: 'SSL / TLS' },
  { value: 'STARTTLS', label: 'STARTTLS' },
  { value: 'None', label: 'None' },
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
  <div className="flex h-full flex-col gap-6 p-6">
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0">
        <img
          src="https://cdn.simpleicons.org/maildotru"
          className="h-10 w-10"
          alt="Email"
        />
      </div>
      <div>
        <p className="leading-none text-xs font-semibold text-gray-900">
          Email (SMTP / IMAP)
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400">Any email provider</p>
      </div>
    </div>

    <div className="h-px bg-gray-100" />

    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Features
      </p>
      <div className="space-y-0.5">
        {[
          {
            Icon: Mail,
            label: 'Any Provider',
            desc: 'Gmail, Outlook, Zoho and custom SMTP',
          },
          {
            Icon: Server,
            label: 'SMTP Sending',
            desc: 'Send directly from your mailbox',
          },
          {
            Icon: Shield,
            label: 'Secure Delivery',
            desc: 'SSL / TLS and STARTTLS support',
          },
          {
            Icon: Globe,
            label: 'Forwarding Inbox',
            desc: 'Bring replies into the shared inbox',
          },
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
  </div>
);

function ForwardingGuideIllustration({
  emailAddress,
  forwardingEmail,
}: {
  emailAddress: string;
  forwardingEmail: string;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-indigo-800">
        <Sparkles size={15} className="text-indigo-500" />
        Set an auto-forwarding rule in your mailbox
      </div>
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-white bg-white/90 px-4 py-4 shadow-sm">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Your mailbox
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {emailAddress || 'support@company.com'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Forward new support emails automatically.
          </p>
        </div>
        <div className="hidden items-center justify-center text-xl text-indigo-400 md:flex">
          to
        </div>
        <div className="rounded-xl border border-indigo-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-400">
            Forward To
          </p>
          <p className="break-all text-sm font-semibold text-indigo-900">
            {forwardingEmail || 'support-workspace@inbound.yourapp.com'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            This is the inbox forwarding address for the channel.
          </p>
        </div>
      </div>
    </div>
  );
}

export const EmailChannel = ({
  connected: _connected,
  onConnect,
  onDisconnect: _onDisconnect,
  workspaceId = '',
}: Props) => {
  const [form, setForm] = useState<EmailChannelFormValues>({
    ...DEFAULT_FORM,
    forwardingEmail: deriveWorkspaceForwardingEmail(workspaceId),
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdChannel, setCreatedChannel] = useState<Channel | null>(null);

  const setField =
    (key: keyof EmailChannelFormValues) => (value: string | boolean) =>
      setForm((current) => ({ ...current, [key]: value }));

  const canCreate = useMemo(
    () =>
      Boolean(
        workspaceId &&
          form.emailAddress.trim() &&
          form.password.trim() &&
          form.smtpServer.trim() &&
          form.smtpPort.trim(),
      ),
    [form, workspaceId],
  );

  const handleCreateChannel = async () => {
    if (!canCreate) {
      setError(
        'Email address, password, SMTP server and port are required.',
      );
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const channel = await ChannelApi.connectEmailChannel(workspaceId, {
        ...form,
        username: form.username.trim() || form.emailAddress.trim(),
      });
      const forwardingEmail = String(
        channel?.config?.forwardingEmail ?? channel?.identifier ?? '',
      );
      setCreatedChannel(channel as Channel);
      setForm((current) => ({ ...current, forwardingEmail }));
    } catch (err: any) {
      setError(
        err?.message ??
          err?.response?.data?.message ??
          'Failed to connect email channel.',
      );
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
    } catch (err: any) {
      setError(
        err?.message ??
          err?.response?.data?.message ??
          'Failed to save forwarding settings.',
      );
    }
  };

  if (createdChannel) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Finish Email Setup
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Forward incoming mail so replies appear in the inbox and your team
            can answer from one place.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="space-y-5 p-6">
            <CopyInput
              label="Forwarding email address"
              value={form.forwardingEmail}
              hint="Use this forwarding address in your mailbox rule."
              disabled={!form.forwardingEmail}
            />

            <ForwardingGuideIllustration
              emailAddress={form.emailAddress}
              forwardingEmail={form.forwardingEmail}
            />

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="mb-2 text-sm font-semibold text-gray-800">
                Mailbox steps
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
                <li>Open filters or forwarding in your email provider.</li>
                <li>
                  Create a rule to forward incoming support email to the address
                  above.
                </li>
                <li>Save the rule, then confirm below.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <ToggleSwitch
                checked={form.forwardingConfirmed}
                onChange={(checked) => setField('forwardingConfirmed')(checked)}
                label="I have set up the email forwarding rule."
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                <AlertCircle size={12} className="shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2">
              <p className="text-[11px] text-gray-400">
                You can edit sender name, forwarding confirmation, and
                signature later from the manage screen.
              </p>
              <Button
                onClick={() => void handleComplete()}
                disabled={!form.forwardingConfirmed}
                leftIcon={<CheckSquare size={12} />}
              >
                Complete
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
          Connect Email
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Connect any mailbox using SMTP for sending, then finish forwarding
          setup for receiving.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Forwarding Inbox
            </p>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
              <CopyInput
                label="System-generated forwarding email"
                value={
                  form.forwardingEmail ||
                  deriveWorkspaceForwardingEmail(workspaceId) ||
                  'Generated after connect'
                }
                hint="Use this address in your mail provider forwarding rule. It is created by the backend and cannot be edited."
                disabled={
                  !form.forwardingEmail &&
                  !deriveWorkspaceForwardingEmail(workspaceId)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BaseInput
              label="Channel name"
              value={form.channelName}
              onChange={(event) => setField('channelName')(event.target.value)}
              placeholder="Support Email"
            />
            <BaseInput
              label="Display sender name"
              value={form.displayName}
              onChange={(event) => setField('displayName')(event.target.value)}
              placeholder="Axora Support"
            />
            <BaseInput
              type="email"
              label="Email address"
              value={form.emailAddress}
              onChange={(event) => setField('emailAddress')(event.target.value)}
              placeholder="support@company.com"
            />
            <BaseInput
              label="Username"
              value={form.username}
              onChange={(event) => setField('username')(event.target.value)}
              placeholder="Defaults to email address"
              hint="Leave blank to use the email address as SMTP username."
            />
            <PasswordInput
              label="Password / App password"
              value={form.password}
              onChange={(event) => setField('password')(event.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              SMTP Settings
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <BaseInput
                  label="SMTP server"
                  value={form.smtpServer}
                  onChange={(event) => setField('smtpServer')(event.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <BaseInput
                type="number"
                label="Port"
                value={form.smtpPort}
                onChange={(event) => setField('smtpPort')(event.target.value)}
                placeholder="587"
              />
            </div>
            <BaseSelect
              label="Security"
              value={form.encryption}
              onChange={(value) => setField('encryption')(value)}
              options={SECURITY_OPTIONS}
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
              onClick={() => void handleCreateChannel()}
              disabled={!canCreate}
              leftIcon={!connecting ? <Mail size={12} /> : undefined}
              loading={connecting}
              loadingMode="inline"
              loadingLabel="Connecting..."
            >
              Connect Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
