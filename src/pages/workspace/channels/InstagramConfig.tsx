// src/pages/workspace/channels/InstagramConfig.tsx
import { useState } from 'react';
import { Eye, EyeOff, Hash, Key, Webhook, Copy, Check, Instagram } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, SaveButton, useSave, DangerZone, ReadonlyField } from '../../channels/ManageChannelPage';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),1800); };
  return { copied, copy };
}

function Field({ label, value, onChange, placeholder, hint, sensitive = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; sensitive?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <input type={sensitive && !show ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
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

export const InstagramConfiguration = ({
  channel, onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const [accessToken, setAccessToken] = useState(channel?.config?.accessToken ?? channel?.credentials?.accessToken ?? '');
  const [pageId,      setPageId]      = useState(channel?.config?.pageId ?? channel?.identifier ?? '');

  const callbackUrl = `${window.location.origin}/webhooks/instagram`;
  const verifyToken = `rb_ig_webhook_${channel?.id}`;
  const { copied: cbCopied, copy: copyCb } = useCopy(callbackUrl);
  const { copied: vtCopied, copy: copyVt } = useCopy(verifyToken);

  const handleSave = () =>
    save(() => ChannelApi.updateInstagramChannel(String(channel.id), { accessToken, pageId }));

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-white">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow shadow-pink-200" />
          <span className="text-sm font-semibold text-slate-800">Configuration</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Instagram size={14} className="text-pink-500" />
            <span className="text-xs text-slate-500">{channel?.identifier}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Page ID</span>
            <span className="text-sm font-mono text-slate-700">{pageId || '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Handle</span>
            <span className="text-sm font-medium text-slate-700">@{channel?.config?.handle ?? channel?.name ?? '—'}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Webhook size={10}/>Callback URL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{callbackUrl}</span>
              <button onClick={copyCb} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
                {cbCopied ? <Check size={11} className="text-emerald-500"/> : <Copy size={11}/>}
              </button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Key size={10}/>Verify Token
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{verifyToken}</span>
              <button onClick={copyVt} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
                {vtCopied ? <Check size={11} className="text-emerald-500"/> : <Copy size={11}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <Instagram size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-800">
          Instagram messaging requires your Facebook Page to be connected to an Instagram Professional account and the <strong>instagram_manage_messages</strong> permission must be granted.
        </p>
      </div>

      {/* Connection fields */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Connection Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Update your Instagram Page credentials.</p>
        <div className="space-y-4">
          <Field label="Page Access Token" value={accessToken} onChange={setAccessToken}
            placeholder="EAABsbCS0r0AB…"
            hint="Page access token from Meta for Developers — must have instagram_manage_messages scope"
            sensitive />
          <Field label="Page ID" value={pageId} onChange={setPageId}
            placeholder="123456789012345"
            hint="The Facebook Page ID connected to your Instagram account" />
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />
      <DangerZone channelLabel="Instagram" channelId={String(channel.id)} onDisconnect={onDisconnect} />
    </div>
  );
};