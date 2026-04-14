// src/pages/workspace/channels/WhatsAppCloudConfig.tsx
import { useState, useCallback } from 'react';
import {
  Phone, Building2, Hash, Key, Clock, Webhook,
  QrCode, Copy, Check, Eye, EyeOff, ChevronDown, AlertTriangle,
  RefreshCw, Loader,
} from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, SaveButton, useSave, DangerZone } from '../../channels/ManageChannelPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return { copied, copy };
}

function CopyIconButton({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button onClick={copy} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

function InfoPill({ icon: Icon, label, value, copyable = false, mono = false }: {
  icon: React.ElementType; label: string; value: string; copyable?: boolean; mono?: boolean;
}) {
  const { copied, copy } = useCopy(value ?? '');
  return (
      <div className="flex flex-col gap-0.5 min-w-0">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <Icon size={10} />{label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={`max-w-full truncate text-sm text-slate-700 sm:max-w-[180px] ${mono ? 'font-mono' : 'font-medium'}`} title={value}>
          {value || '—'}
        </span>
        {copyable && value && (
          <button onClick={copy} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = 'text', sensitive = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; type?: string; sensitive?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <input
          type={sensitive && !show ? 'password' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        {sensitive && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function UrlField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { copied, copy } = useCopy(value);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
        <span className="flex-1 text-sm text-slate-500 font-mono truncate">{value}</span>
        <button onClick={copy} className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Select field ─────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const WhatsAppConfiguration = ({
  channel, onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();

  const [accessToken,     setAccessToken]     = useState(channel?.config?.accessToken     ?? channel?.credentials?.accessToken     ?? '');
  const [phoneNumberId,   setPhoneNumberId]   = useState(channel?.config?.phoneNumberId   ?? channel?.credentials?.phoneNumberId   ?? '');
  const [wabaId,          setWabaId]          = useState(channel?.config?.wabaId          ?? channel?.credentials?.wabaId          ?? '');
  const [graphApiVersion, setGraphApiVersion] = useState(channel?.config?.graphApiVersion ?? 'v19.0');
  const [tokenExpiry,     setTokenExpiry]     = useState(channel?.config?.tokenExpiry     ?? '');
  const [convWindow,      setConvWindow]      = useState(channel?.config?.conversationwindow ?? '24');
  const [name,      setName]      = useState(channel?.name ?? '');

  const callbackUrl = `${window.location.origin}/webhooks/whatsapp`;
  const verifyToken = `rb_webhook_token_${channel?.id}`;
  const chatLink    = channel?.config?.phoneNumber ? `https://wa.me/${channel.config.phoneNumber}` : '#';

  const handleSave = () =>
    save(() =>
      ChannelApi.updateWhatsAppChannel(String(channel.id), {
        
        accessToken,
        phoneNumberId,
        wabaId,
        graphApiVersion,
        tokenExpiry,
        conversationwindow:  convWindow,
        waba_account_name:   channel?.config?.wabaAccountName,
        verifiedName:        channel?.name,
        veriytoken:          verifyToken,
        metaappname:         channel?.config?.metaappname,
        systemUserName:      channel?.config?.systemUserName,
        name
      })
    );

  return (
    <div className="space-y-6">
      {/* Header info card */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 px-5 py-3.5 border-b border-slate-100 bg-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-200" />
            <span className="text-sm font-semibold text-slate-800">Configuration</span>
          </div>
          {/* <a href={chatLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            <QrCode size={13} />Open chat link
          </a> */}
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoPill icon={Phone}     label="Phone Number"    value={channel?.config?.phoneNumber ?? channel?.identifier}  copyable mono />
          <InfoPill icon={Hash}      label="Phone Number ID" value={channel?.config?.phoneNumberId}  copyable mono />
          <InfoPill icon={Building2}      label="Verified Name" value={channel?.config?.verifiedName}  copyable mono />
          <InfoPill icon={Building2} label="WABA ID"         value={wabaId}         copyable mono />
          <InfoPill icon={Building2} label="WABA Name"    value={channel?.config?.wabaName} />
          {/* <InfoPill icon={Key}       label="Meta App"        value={channel?.config?.metaappname} /> */}
          {/* <InfoPill icon={Key}       label="System User"     value={channel?.config?.systemUserName} /> */}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Webhook size={10} />Callback URL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{callbackUrl}</span>
              <CopyIconButton text={callbackUrl} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Key size={10} />Verify Token
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{verifyToken}</span>
              <CopyIconButton text={verifyToken} />
            </div>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Connection Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Update your WhatsApp credentials when they change.</p>
        <div className="space-y-4">
           <Field label="Channel Name" value={name} onChange={setName}
            placeholder="channel name"
            hint="Name of your channel" />
          {/* <Field label="Access Token" value={accessToken} onChange={setAccessToken}
            placeholder="EAABsbCS0r0AB…"
            hint="Permanent system-user token from Meta Business Manager"
            sensitive /> */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone Number ID" value={phoneNumberId} onChange={setPhoneNumberId}
              placeholder="15551790691" hint="Digits only — from Meta Business Manager" />
            <Field label="WABA ID" value={wabaId} onChange={setWabaId}
              placeholder="987654321098765" hint="WhatsApp Business Account ID" />
          </div> */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Graph API Version" value={graphApiVersion} onChange={setGraphApiVersion}
              options={['v19.0','v18.0','v17.0'].map(v => ({ value: v, label: v }))}
              hint="Keep at latest unless advised otherwise" />
            <SelectField label="Conversation Window" value={convWindow} onChange={setConvWindow}
              options={[{ value: '24', label: '24 hours' }, { value: '72', label: '72 hours' }]}
              hint="How long after last message you can reply freely" />
          </div> */}
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />

      {/* Danger Zone */}
      <DangerZone channelLabel="WhatsApp" channelId={String(channel.id)} onDisconnect={onDisconnect} />
    </div>
  );
};
