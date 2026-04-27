import { useMemo, useState } from 'react';
import { CheckCircle, Mail, Server, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { CopyInput } from '../../../components/ui/inputs/CopyInput';
import { PasswordInput } from '../../../components/ui/inputs/PasswordInput';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { BaseSelect } from '../../../components/ui/select/BaseSelect';
import type { SelectOption } from '../../../components/ui/select/shared';
import { ToggleSwitch } from '../../../components/ui/toggle/ToggleSwitch';
import { ChannelApi } from '../../../lib/channelApi';
import {
  buildEmailChannelFormValues,
  buildEmailChannelPayload,
  type EmailSecurityMode,
} from '../../../lib/emailChannel';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';

const encryptionOptions: SelectOption[] = [
  { value: 'STARTTLS', label: 'STARTTLS (587)' },
  { value: 'SSL/TLS', label: 'SSL/TLS (465)' },
  { value: 'None', label: 'None' },
];

export const EmailConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const initial = useMemo(() => buildEmailChannelFormValues(channel), [channel]);

  const [channelName, setChannelName] = useState(initial.channelName);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [emailAddress, setEmailAddress] = useState(initial.emailAddress);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState(initial.password);
  const [smtpServer, setSmtpServer] = useState(initial.smtpServer);
  const [smtpPort, setSmtpPort] = useState(initial.smtpPort);
  const [encryption, setEncryption] = useState<EmailSecurityMode>(initial.encryption);
  const [forwardingConfirmed, setForwardingConfirmed] = useState(
    initial.forwardingConfirmed,
  );
  const [signatureEnabled, setSignatureEnabled] = useState(
    initial.signatureEnabled,
  );
  const [signatureHtml, setSignatureHtml] = useState(initial.signatureHtml);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await ChannelApi.testEmailConnection(String(channel.id));
    setTesting(false);
    setTestResult({
      ok: Boolean(result?.success),
      msg: result?.success
        ? 'Connection successful.'
        : result?.error ?? 'Connection failed.',
    });
    window.setTimeout(() => setTestResult(null), 4000);
  };

  const handleSave = () =>
    save(() =>
      ChannelApi.updateEmailChannel(
        String(channel.id),
        buildEmailChannelPayload({
          channelName,
          displayName,
          emailAddress,
          username,
          password,
          smtpServer,
          smtpPort,
          encryption,
          forwardingEmail: initial.forwardingEmail,
          forwardingConfirmed,
          signatureHtml,
          signatureEnabled,
        }),
      ),
    );

  const summaryItems = [
    { label: 'Channel Name', value: channelName || '-' },
    { label: 'Forwarding Email', value: initial.forwardingEmail || '-' },
    {
      label: 'Forwarding Enabled',
      value: forwardingConfirmed ? 'Enabled' : 'Disabled',
    },
    { label: 'Display Sender Name', value: displayName || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow shadow-indigo-200" />
          <span className="text-sm font-semibold text-slate-800">Email Channel</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:ml-auto">
            <Mail size={13} className="text-indigo-500" />
            <span className="break-all">{emailAddress || channel?.identifier}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {item.label}
              </span>
              <span className="truncate font-mono text-sm text-slate-700">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Identity</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            label="Channel Name"
            value={channelName}
            onChange={(event) => setChannelName(event.target.value)}
            placeholder="Support Email"
          />
          <BaseInput
            label="Display Sender Name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Axora Support"
          />
          <BaseInput
            type="email"
            label="From Email Address"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            placeholder="support@company.com"
          />
          <BaseInput
            label="SMTP Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Defaults to email address"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">SMTP Settings</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <BaseInput
              label="SMTP Server"
              value={smtpServer}
              onChange={(event) => setSmtpServer(event.target.value)}
              placeholder="smtp.mailgun.org"
            />
          </div>
          <BaseInput
            type="number"
            label="Port"
            value={smtpPort}
            onChange={(event) => setSmtpPort(event.target.value)}
            placeholder="587"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseSelect
            label="Encryption"
            value={encryption}
            onChange={(value) => setEncryption(value as EmailSecurityMode)}
            options={encryptionOptions}
          />
          <PasswordInput
            label="Password / App Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your SMTP password"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Forwarding</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CopyInput
            label="Forwarding Email"
            value={initial.forwardingEmail || '-'}
            hint="Set this forwarding address in your mail provider. It is generated by the system and cannot be changed here."
            disabled={!initial.forwardingEmail}
          />
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 md:mt-6">
            <ToggleSwitch
              checked={forwardingConfirmed}
              onChange={setForwardingConfirmed}
              label="Forwarding rule is enabled"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Signature</h2>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <ToggleSwitch
            checked={signatureEnabled}
            onChange={setSignatureEnabled}
            label="Use this signature when sending email"
          />
        </div>
        <TextareaInput
          label="Signature HTML"
          value={signatureHtml}
          onChange={(event) => setSignatureHtml(event.target.value)}
          rows={6}
          autoResize
          placeholder="<p>Regards,<br />{{agent_name}}</p>"
        />
        <p className="text-xs text-slate-400">
          Variables like <code>{'{{agent_name}}'}</code> and{' '}
          <code>{'{{contact_name}}'}</code> are supported when the email is sent.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button
          variant="secondary"
          leftIcon={!testing ? <Server size={14} /> : undefined}
          onClick={() => void handleTest()}
          disabled={!smtpServer || !emailAddress}
          loading={testing}
          loadingMode="inline"
          loadingLabel="Testing..."
        >
          Test Connection
        </Button>
        {testResult ? (
          <span
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{
              color: testResult.ok
                ? 'var(--color-success)'
                : 'var(--color-error)',
            }}
          >
            {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {testResult.msg}
          </span>
        ) : null}
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />
      <DangerZone
        channelLabel="Email"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
