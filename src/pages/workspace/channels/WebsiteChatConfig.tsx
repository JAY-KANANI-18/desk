// src/pages/workspace/channels/WebsiteChatConfig.tsx
import { useState } from 'react';
import { Copy, Check, Code2, Palette, MessageSquare } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, SaveButton, useSave, DangerZone } from '../../channels/ManageChannelPage';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return { copied, copy };
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const WebsiteChatConfiguration = ({
  channel, onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const cfg = channel?.config ?? {};

  const [welcomeMessage, setWelcomeMessage] = useState(cfg.welcomeMessage ?? 'Hi there! How can we help you today?');
  const [awayMessage,    setAwayMessage]    = useState(cfg.awayMessage ?? "We're away right now but will reply soon.");
  const [primaryColor,   setPrimaryColor]   = useState(cfg.primaryColor ?? '#2563eb');
  const [operatorName,   setOperatorName]   = useState(cfg.operatorName ?? '');
  const [position,       setPosition]       = useState<'bottom-right' | 'bottom-left'>(cfg.position ?? 'bottom-right');

  const scriptTag = `<script src="${window.location.origin}/widget.js" data-channel-id="${channel.id}" defer></script>`;
  const { copied, copy } = useCopy(scriptTag);

  return (
    <div className="space-y-6">
      {/* Embed script */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-white">
          <Code2 size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800">Embed Script</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 mb-3">Add this script to the <code className="bg-slate-100 px-1 rounded text-xs">&lt;head&gt;</code> of every page where you want the chat widget to appear.</p>
          <div className="bg-slate-900 rounded-xl p-4 flex items-start gap-3">
            <code className="flex-1 text-xs text-emerald-300 font-mono break-all leading-relaxed">{scriptTag}</code>
            <button onClick={copy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {copied ? <><Check size={12}/>Copied</> : <><Copy size={12}/>Copy</>}
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Palette size={14} className="text-slate-500" />Appearance
        </h2>
        <p className="text-xs text-slate-400 mb-4">Customize how the widget looks on your website.</p>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-1" />
              <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Widget Position</label>
            <div className="flex gap-3">
              {(['bottom-right', 'bottom-left'] as const).map(pos => (
                <label key={pos} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setPosition(pos)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${position === pos ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                    {position === pos && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-gray-700 capitalize">{pos.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <MessageSquare size={14} className="text-slate-500" />Messages
        </h2>
        <p className="text-xs text-slate-400 mb-4">Set the messages visitors see in the widget.</p>
        <div className="space-y-4">
          <Field label="Operator Display Name" value={operatorName} onChange={setOperatorName}
            placeholder="Support Team" hint="Shown in the chat widget header" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Welcome Message</label>
            <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Away Message</label>
            <textarea value={awayMessage} onChange={e => setAwayMessage(e.target.value)} rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
            <p className="text-xs text-slate-400">Shown when no agents are online</p>
          </div>
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error}
        onClick={() => save(() => ChannelApi.updateWebsiteChatChannel(String(channel.id), { welcomeMessage, awayMessage, primaryColor, operatorName, position }))} />
      <DangerZone channelLabel="Website Chat" channelId={String(channel.id)} onDisconnect={onDisconnect} />
    </div>
  );
};