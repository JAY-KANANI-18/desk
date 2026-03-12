// src/pages/workspace/channels/EmailConfig.tsx
import { useState } from 'react';
import { Eye, EyeOff, Mail, Server, Lock, User, Loader, CheckCircle, XCircle, Info } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, SaveButton, useSave, DangerZone } from '../../channels/ManageChannelPage';

function Field({ label, value, onChange, placeholder, hint, sensitive = false, type = 'text', readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; hint?: string; sensitive?: boolean; type?: string; readOnly?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={sensitive && !show ? 'password' : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'bg-white'}`}
        />
        {sensitive && (
          <button type="button" onClick={() => setShow(s=>!s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const EmailConfiguration = ({
  channel, onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const cfg = channel?.config ?? {};

  const [smtpserver,   setSmtpserver]   = useState(cfg.smtpserver   ?? '');
  const [smtpport,     setSmtpport]     = useState(String(cfg.smtpport ?? '587'));
  const [encryption,   setEncryption]   = useState(cfg.encryption   ?? 'STARTTLS');
  const [emailaddress, setEmailaddress] = useState(cfg.emailaddress ?? channel?.identifier ?? '');
  const [password,     setPassword]     = useState(cfg.password     ?? '');
  const [displayname,  setDisplayname]  = useState(cfg.displayname  ?? '');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await ChannelApi.testEmailConnection(String(channel.id));
    setTesting(false);
    setTestResult({ ok: r.success, msg: r.success ? 'Connection successful!' : (r.error ?? 'Connection failed') });
    setTimeout(() => setTestResult(null), 4000);
  };

  const handleSave = () =>
    save(() => ChannelApi.updateEmailChannel(String(channel.id), {
      smtpserver, smtpport: Number(smtpport), encryption,
      emailaddress, password, displayname,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-white">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow shadow-indigo-200" />
          <span className="text-sm font-semibold text-slate-800">Configuration</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Mail size={13} className="text-indigo-500" />
            <span>{emailaddress || channel?.identifier}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 px-5 py-4">
          {[
            { label: 'SMTP Server', value: smtpserver || '—' },
            { label: 'Port',        value: smtpport || '—' },
            { label: 'Encryption',  value: encryption || '—' },
            { label: 'From Address',value: emailaddress || '—' },
            { label: 'Display Name',value: displayname || '—' },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{item.label}</span>
              <span className="text-sm font-mono text-slate-700 truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SMTP fields */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">SMTP Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Configure your outbound email server (SMTP).</p>
        <div className="space-y-4">
          <Field label="From Email Address" value={emailaddress} onChange={setEmailaddress}
            placeholder="support@company.com" type="email" />
          <Field label="Display Name" value={displayname} onChange={setDisplayname}
            placeholder="Your Company Support"
            hint="Name shown to recipients in the From field" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Field label="SMTP Server" value={smtpserver} onChange={setSmtpserver}
                placeholder="smtp.mailgun.org" />
            </div>
            <Field label="Port" value={smtpport} onChange={setSmtpport} placeholder="587" type="number" />
          </div>
          <SelectField label="Encryption" value={encryption} onChange={setEncryption}
            options={[
              { value: 'STARTTLS', label: 'STARTTLS (port 587)' },
              { value: 'SSL/TLS',  label: 'SSL/TLS (port 465)' },
              { value: 'None',     label: 'None (not recommended)' },
            ]}
            hint="Use STARTTLS or SSL/TLS for security" />
          <Field label="Password / API Key" value={password} onChange={setPassword}
            placeholder="••••••••••••••••"
            hint="SMTP password or API key for authentication"
            sensitive />
        </div>
      </div>

      {/* Test + Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleTest} disabled={testing || !smtpserver || !emailaddress}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {testing ? <Loader size={14} className="animate-spin" /> : <Server size={14} />}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        {testResult && (
          <span className={`flex items-center gap-1.5 text-xs font-medium ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {testResult.msg}
          </span>
        )}
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />
      <DangerZone channelLabel="Email" onDisconnect={onDisconnect} />
    </div>
  );
};