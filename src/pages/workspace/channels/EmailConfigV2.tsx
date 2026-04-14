import { useMemo, useState } from 'react';
import { CheckCircle, Loader, Mail, Server, Signature, UserRound, XCircle } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { buildEmailChannelFormValues, buildEmailChannelPayload } from '../../../lib/emailChannel';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';

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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

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
  const [encryption, setEncryption] = useState(initial.encryption);
  const [forwardingConfirmed, setForwardingConfirmed] = useState(initial.forwardingConfirmed);
  const [signatureEnabled, setSignatureEnabled] = useState(initial.signatureEnabled);
  const [signatureHtml, setSignatureHtml] = useState(initial.signatureHtml);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await ChannelApi.testEmailConnection(String(channel.id));
    setTesting(false);
    setTestResult({
      ok: Boolean(result?.success),
      msg: result?.success ? 'Connection successful.' : result?.error ?? 'Connection failed.',
    });
    setTimeout(() => setTestResult(null), 4000);
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 px-5 py-3.5 border-b border-slate-100 bg-white sm:flex-row sm:items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow shadow-indigo-200" />
          <span className="text-sm font-semibold text-slate-800">Email Channel</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:ml-auto">
            <Mail size={13} className="text-indigo-500" />
            <span className="break-all">{emailAddress || channel?.identifier}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Channel Name', value: channelName || '—' },
            { label: 'Forwarding Email', value: initial.forwardingEmail || '—' },
            { label: 'Forwarding Enabled', value: forwardingConfirmed ? 'Enabled' : 'Disabled' },
            { label: 'Display Sender Name', value: displayName || '—' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</span>
              <span className="text-sm font-mono text-slate-700 truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Channel Name" value={channelName} onChange={setChannelName} placeholder="Support Email" />
          <Field label="Display Sender Name" value={displayName} onChange={setDisplayName} placeholder="Axora Support" />
          <Field label="From Email Address" value={emailAddress} onChange={setEmailAddress} placeholder="support@company.com" type="email" />
          <Field label="SMTP Username" value={username} onChange={setUsername} placeholder="Defaults to email address" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">SMTP Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Field label="SMTP Server" value={smtpServer} onChange={setSmtpServer} placeholder="smtp.mailgun.org" />
          </div>
          <Field label="Port" value={smtpPort} onChange={setSmtpPort} placeholder="587" type="number" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Encryption</label>
            <select
              value={encryption}
              onChange={(e) => setEncryption(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              <option value="STARTTLS">STARTTLS (587)</option>
              <option value="SSL/TLS">SSL/TLS (465)</option>
              <option value="None">None</option>
            </select>
          </div>
          <Field label="Password / App Password" value={password} onChange={setPassword} placeholder="••••••••••••" type="password" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Forwarding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Forwarding Email</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              <span className="flex-1 break-all font-mono">{initial.forwardingEmail || '—'}</span>
              {initial.forwardingEmail && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(initial.forwardingEmail).catch(() => {})}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Copy
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">Set this forwarding address in your mail provider. It is generated by the system and cannot be changed here.</p>
          </div>
          <label className="mt-0 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 md:mt-6">
            <input
              type="checkbox"
              checked={forwardingConfirmed}
              onChange={(e) => setForwardingConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Forwarding rule is enabled</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Signature</h2>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={signatureEnabled}
            onChange={(e) => setSignatureEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Use this signature when sending email</span>
        </label>
        <textarea
          value={signatureHtml}
          onChange={(e) => setSignatureHtml(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          placeholder={'<p>Regards,<br />{{agent_name}}</p>'}
        />
        <p className="text-xs text-slate-400">
          Variables like <code>{'{{agent_name}}'}</code> and <code>{'{{contact_name}}'}</code> are supported when the email is sent.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          onClick={handleTest}
          disabled={testing || !smtpServer || !emailAddress}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? <Loader size={14} className="animate-spin" /> : <Server size={14} />}
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult && (
          <span className={`flex items-center gap-1.5 text-xs font-medium ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {testResult.msg}
          </span>
        )}
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />
      <DangerZone channelLabel="Email" channelId={String(channel.id)} onDisconnect={onDisconnect} />
    </div>
  );
};
