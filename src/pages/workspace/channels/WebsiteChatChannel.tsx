import { useState, useRef } from 'react';
import {
  Copy, Check, Upload, X, ChevronDown,
  AlertCircle, Lock, Globe, Zap, Shield,
  MessageSquare, BarChart3, ExternalLink,
} from 'lucide-react';
import type { Channel } from '../types';
import { ChannelApi } from '../../../lib/channelApi';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const WebsiteChatChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
       <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <img src="https://cdn.simpleicons.org/googlechat" className="w-10 h-10" alt="Website Chat" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">Website Chat</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Embeddable live chat widget</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: 'Live Chat',      desc: 'Real-time visitor messaging' },
          { Icon: Zap,           label: 'Instant Setup',  desc: 'One script tag to embed' },
          { Icon: Globe,         label: 'Any Website',    desc: 'Works on any platform' },
          { Icon: Shield,        label: 'Secure',         desc: 'Token-authenticated sessions' },
          { Icon: BarChart3,     label: 'History',        desc: 'Full conversation history' },
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
    <div className="mt-auto">
      <a
      
        href="https://docs.yourplatform.com/webchat"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors no-underline font-medium"
      >
        <ExternalLink size={11} /> Documentation
      </a>
    </div>
  </div>
);

// ─── Chat icon SVGs ───────────────────────────────────────────────────────────

const CHAT_ICONS = [
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v7A2.5 2.5 0 0 0 5.5 16H7v3l3.5-3H18.5A2.5 2.5 0 0 0 21 13.5v-7z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <path d="M20 2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3v3l4-3h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
      <rect x="2" y="2" width="20" height="16" rx="4" ry="4" />
      <path d="M8 22l4-4h6a2 2 0 0 0 2-2V6" />
    </svg>
  ),
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const WebsiteChatChannel = ({ connected, onConnect, onDisconnect, workspaceId }: Props) => {
  const [step, setStep]               = useState<1 | 2>(1);

  // Step 1
  const [websites, setWebsites]       = useState<string[]>([]);
  const [websiteInput, setInput]      = useState('');
  const [showDropdown, setDropdown]   = useState(false);
  const [themeColor, setColor]        = useState('#4f46e5');
  const [selectedIcon, setIcon]       = useState(0);
  const colorRef                      = useRef<HTMLInputElement>(null);

  // Step 2 — populated from API response
  const [embedCode, setEmbedCode]     = useState('');
  const [createdChannel, setCreated]  = useState<any>(null);
  const [copied, setCopied]           = useState(false);
  const [confirmed, setConfirmed]     = useState(false);
  const [sendEmail, setSendEmail]     = useState(false);

  // Async state
  const [connecting, setConnecting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Website tag helpers ───────────────────────────────────────────────────

  const addWebsite = (val: string) => {
    const trimmed = val.trim().replace(/,+$/, '');
    if (trimmed && !websites.includes(trimmed))
      setWebsites(p => [...p, trimmed]);
    setInput('');
    setDropdown(false);
  };

  const removeWebsite = (w: string) =>
    setWebsites(p => p.filter(x => x !== w));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addWebsite(websiteInput);
    } else if (e.key === 'Backspace' && !websiteInput && websites.length) {
      setWebsites(p => p.slice(0, -1));
    }
  };

  // ── Step 1 → 2: hit backend, get real token + embed code ─────────────────

  const handleNext = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await ChannelApi.createWebchatChannel(workspaceId, {
        name: 'Website Chat',
        welcomeMessage: 'Hi! How can we help?',
        primaryColor: themeColor,
        allowedOrigins: websites,
      });
      // res.data matches your BE response: { id, config: { widgetToken }, embedCode, ... }
      setCreated(res);
      setEmbedCode(res.embedCode);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create channel.');
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Complete: pass real channel object to parent ──────────────────────────

  const handleComplete = () => {
    if (!confirmed || !createdChannel) return;
    onConnect(createdChannel); // same shape as WhatsApp — raw API response
  };

  // ── Connected state ───────────────────────────────────────────────────────

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
            {connected.msgs?.toLocaleString()} messages
          </span>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming website chat messages.</p>
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

  // ── Step 1: Configure ─────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Website Chat</h1>
          <p className="text-sm text-gray-400 mt-1">
            Embed a live chat widget on your website. Further customization is available after connecting.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">

            {/* Websites */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">
                Website(s) where the widget will be added
              </label>
              <div
                className="relative border border-gray-200 rounded-lg bg-white min-h-[40px] flex flex-wrap items-center gap-1.5 px-3 py-2 cursor-text focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                onClick={() => setDropdown(true)}
              >
                {websites.map(w => (
                  <span key={w} className="flex items-center gap-1 bg-blue-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-200">
                    {w}
                    <button
                      onClick={e => { e.stopPropagation(); removeWebsite(w); }}
                      className="hover:text-blue-900 bg-transparent border-none cursor-pointer p-0"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={websiteInput}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setDropdown(true)}
                  onBlur={() => setTimeout(() => setDropdown(false), 150)}
                  placeholder={websites.length === 0 ? 'e.g. www.apple.com' : ''}
                  className="flex-1 min-w-0 text-[13px] text-gray-700 placeholder:text-gray-300 outline-none bg-transparent sm:min-w-[180px]"
                />
                <ChevronDown size={14} className="text-gray-300 shrink-0 ml-auto" />
              </div>
              {showDropdown && websiteInput && (
                <div className="border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden">
                  <button
                    onMouseDown={e => { e.preventDefault(); addWebsite(websiteInput); }}
                    className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 bg-transparent border-none cursor-pointer"
                  >
                    Add "<span className="font-medium">{websiteInput}</span>"
                  </button>
                </div>
              )}
              <p className="text-[10px] text-gray-400">Press Enter or comma to add each website</p>
            </div>

            {/* Theme color */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Theme Color</label>
              <div
                className="flex items-center gap-3 border border-gray-200 rounded-lg bg-white px-4 py-2.5 cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => colorRef.current?.click()}
              >
                <div className="w-5 h-5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: themeColor }} />
                <span className="text-[13px] font-mono text-gray-700 flex-1">{themeColor.toUpperCase()}</span>
                <input
                  ref={colorRef}
                  type="color"
                  value={themeColor}
                  onChange={e => setColor(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">Launcher Icon</label>
              <div className="flex flex-wrap items-center gap-2.5">
                {CHAT_ICONS.map((IconFn, i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border-none cursor-pointer ${
                      selectedIcon === i ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: themeColor }}
                  >
                    <IconFn />
                  </button>
                ))}
                <button className="w-11 h-11 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-indigo-400 hover:text-indigo-400 transition-colors bg-transparent cursor-pointer">
                  <Upload size={15} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Lock size={10} /> Token generated securely on our servers
              </p>
              <button
                onClick={handleNext}
                disabled={websites.length === 0 || connecting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600   text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : (
                  <><MessageSquare size={12} /> Next</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Embed script ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add the Widget Script</h1>
        <p className="text-sm text-gray-400 mt-1">
          Paste this before the <code className="bg-gray-100 px-1 rounded text-xs">&lt;/body&gt;</code> tag on your website.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-5">

          {/* Embed code block */}
          <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 sm:flex-row sm:items-start">
            <code className="flex-1 text-xs text-emerald-300 font-mono break-all leading-relaxed">
              {embedCode}
            </code>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer ${
                copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {copied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
            </button>
          </div>

          {/* Token display */}
          {createdChannel?.config?.widgetToken && (
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>Widget token:</span>
              <code className="font-mono text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                {createdChannel.config.widgetToken}
              </code>
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="mt-0.5 accent-indigo-600"
              />
              <span className="text-[12px] text-gray-600">
                Send installation instructions to website admin via email.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-indigo-600"
              />
              <span className="text-[12px] text-gray-600">
                I have added the script, or informed my website admin to add it.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-2 sm:flex-row sm:items-center">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 text-[12px] font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors bg-transparent cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!confirmed}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600  text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={12} /> Complete Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
