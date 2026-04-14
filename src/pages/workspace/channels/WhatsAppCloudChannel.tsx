import { useState } from 'react';
import {
  Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle,
  Zap, Shield, MessageSquare, Users, BarChart3,
  Globe, Lock, Phone, Building2, Key, ChevronRight,
  RefreshCw, Wifi, WifiOff,
} from 'lucide-react';
import type { Channel } from '../types';
import type { WhatsAppConfig } from './types';
import { ChannelApi } from '../../../lib/channelApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

// ─── Sidebar components (unchanged from original) ────────────────────────────

export const WhatsAppSidebarInfo = ({ channel }: { channel: Channel }) => (
  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
    <div className="flex items-center gap-2 mb-2">
      <img src="https://cdn.simpleicons.org/whatsapp/25D366" className="w-10 h-10" />
      <span className="text-xs font-semibold text-emerald-800">WhatsApp Cloud API</span>
      <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
    </div>
    <p className="text-[11px] text-emerald-700 leading-relaxed mb-2.5">
      Reach 2B+ users on the world's most popular messaging platform.
    </p>
    <ul className="space-y-1.5">
      {['2B+ active users worldwide', 'Rich media & interactive messages', 'End-to-end encryption', 'Automated workflows & bots', 'Real-time delivery receipts', 'Broadcast to opted-in contacts'].map(b => (
        <li key={b} className="flex items-start gap-1.5 text-[11px] text-emerald-700">
          <CheckCircle size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />{b}
        </li>
      ))}
    </ul>
    <div className="mt-2.5 pt-2.5 border-t border-emerald-100 space-y-0.5">
      <p className="text-[11px] text-emerald-700 font-semibold">{channel.identifier}</p>
      <p className="text-[10px] text-emerald-500">{channel.msgs.toLocaleString()} messages sent</p>
    </div>
  </div>
);

export const WhatsAppChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <img src="https://cdn.simpleicons.org/whatsapp" className="w-10 h-10" alt="WhatsApp" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">WhatsApp Cloud</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: 'Rich Messaging', desc: 'Images, docs & buttons' },
          { Icon: Zap, label: 'Automation', desc: 'Bots & workflows' },
          { Icon: Users, label: '2B+ Users', desc: 'Largest messaging network' },
          { Icon: Shield, label: 'Encrypted', desc: 'End-to-end secure' },
          { Icon: BarChart3, label: 'Analytics', desc: 'Delivery & read receipts' },
          { Icon: Globe, label: 'Global', desc: '180+ countries' },
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
      <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors no-underline font-medium">
        <ExternalLink size={11} /> Documentation
      </a>
    </div>
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const CRED_FIELDS: { key: keyof WhatsAppConfig; label: string; placeholder: string; hint: string; Icon: any; type?: string }[] = [
  { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '1234567890', hint: 'Meta Business Suite → WhatsApp → API Setup', Icon: Phone },
  { key: 'wabaId', label: 'Business Account ID', placeholder: '9876543210', hint: 'WABA ID from Meta Business Manager', Icon: Building2 },
  { key: 'accessToken', label: 'Permanent Access Token', placeholder: 'EAAxxxxxxxx…', hint: 'Generate via Meta Business Suite System User', Icon: Key, type: 'password' },
  { key: 'webhookSecret', label: 'Webhook Verify Token', placeholder: 'my_secret_token', hint: 'Secret string to verify incoming webhook requests', Icon: Lock },
];

const SETUP_STEPS = [
  { step: 1, title: 'Create a Meta Business Account', desc: 'Go to business.facebook.com and create or verify your Meta Business Account.', link: 'https://business.facebook.com' },
  { step: 2, title: 'Register your phone number', desc: 'In Meta Business Suite, navigate to WhatsApp → API Setup. Register a new phone number.', link: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' },
  { step: 3, title: 'Configure your webhook', desc: 'Set your webhook URL and enter the Webhook Verify Token below. Subscribe to the "messages" field.', link: null },
  { step: 4, title: 'Generate a permanent access token', desc: 'In Meta Business Suite, create a System User, assign it to your WABA, and generate a never-expiring token.', link: 'https://developers.facebook.com/docs/whatsapp/business-management-api/get-started' },
  { step: 5, title: 'Test your connection', desc: 'Use the Meta API Explorer to send a test message. You should see it arrive within seconds.', link: 'https://developers.facebook.com/tools/explorer' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const WhatsAppCloudChannel = ({ connected, onConnect, onDisconnect, workspaceId }: Props) => {
  const [tab, setTab] = useState<'credentials' | 'meta'>('meta');
  const [form, setForm] = useState<WhatsAppConfig>({ phoneNumberId: '', wabaId: '', accessToken: '', webhookSecret: '' });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [oauthStep, setOauthStep] = useState<'idle' | 'waiting' | 'exchanging' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  // ── Manual credentials connect ──────────────────────────────────────────

  const handleCredentialsConnect = async () => {
    if (CRED_FIELDS.some(f => !form[f.key])) { setError('All fields are required.'); return; }
    setConnecting(true); setError(null);
    try {
      // Uses your BE: POST /webhooks/whatsapp/connect/manual
      const channel = await ChannelApi.whatsappManualConnect(
        form.accessToken,
        form.phoneNumberId,
        form.wabaId,
        form.webhookSecret,
        workspaceId,
      );
      onConnect(channel);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to connect. Please check your credentials.');
    } finally {
      setConnecting(false);
    }
  };

  // ── Facebook OAuth connect ───────────────────────────────────────────────
  //
  // Flow:
  //   1. GET /webhooks/whatsapp/auth/url  → get FB OAuth URL
  //   2. Open popup → user logs in → FB redirects with ?code=xxx
  //   3. Popup calls window.opener.handleOAuthCode(code)
  //   4. POST /webhooks/whatsapp/auth/callback → BE exchanges code, saves channels
  //

  const handleMetaConnect = async () => {
    setConnecting(true);
    setOauthStep('waiting');
    setError(null);

    try {
      // Step 1: Get OAuth URL from BE
      const redirectUri = import.meta.env.VITE_WHATSAPP_REDIRECT_URI;
      const { url } = await ChannelApi.getWhatsAppAuthUrl(workspaceId, redirectUri);

      // Step 2: Open popup
      const popup = window.open(url, 'whatsapp_oauth', 'width=600,height=700,scrollbars=yes');

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Step 3: Wait for popup to send back the code
      const code = await waitForOAuthCode(popup);
      setOauthStep('exchanging');

      // Step 4: Exchange code via BE — POST /webhooks/whatsapp/auth/callback
      setOauthStep('saving');
      const result = await ChannelApi.exchangeWhatsAppCode(code, workspaceId, redirectUri);

      // result.channels is array (one per phone number)
      // Pick first or let user choose — here we pick first
      if (result.channels?.length) {
        onConnect(result.channels[0]);
      } else {
        throw new Error('No WhatsApp phone numbers found in your Meta Business account.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Connection failed. Please try again.');
    } finally {
      setConnecting(false);
      setOauthStep('idle');
    }
  };

  // ── Wait for popup to post back the OAuth code ───────────────────────────

  const waitForOAuthCode = (popup: Window): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Login timed out. Please try again.'));
      }, 5 * 60 * 1000); // 5 min timeout

      // Method 1: postMessage from redirect page
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "instagram_oauth" && event.data?.code) {
          cleanup();
          resolve(event.data.code);
        }
        if (event.data?.type === 'WHATSAPP_OAUTH_ERROR') {
          cleanup();
          reject(new Error(event.data.error ?? 'OAuth failed'));
        }
      };

      // Method 2: Poll popup URL for code param (fallback)
      const pollInterval = setInterval(() => {
        try {
          if (popup.closed) {
            cleanup();
            reject(new Error('Login window was closed.'));
            return;
          }
          const url = popup.location.href;
          if (url.includes('code=')) {
            const code = new URL(url).searchParams.get('code');
            if (code) {
              popup.close();
              cleanup();
              resolve(code);
            }
          }
        } catch {
          // Cross-origin — normal while on facebook.com, ignore
        }
      }, 500);

      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(pollInterval);
        window.removeEventListener('message', onMessage);
      };

      window.addEventListener('message', onMessage);
    });
  };

  // ── OAuth step labels ────────────────────────────────────────────────────

  const oauthStepLabel = {
    idle: 'Connect with Meta',
    waiting: 'Waiting for login…',
    exchanging: 'Verifying credentials…',
    saving: 'Setting up channel…',
  }[oauthStep];

  // ── Connected state ──────────────────────────────────────────────────────

  if (connected) {
    return (
      <div className="space-y-6">
        {/* Status card */}
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

        {/* Video */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Getting started</p>
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ aspectRatio: '16/9' }}>
            <iframe
              src="https://www.youtube.com/embed/CEt_KMMv3V8?rel=0&modestbranding=1"
              title="WhatsApp Cloud API" className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Setup guide */}
        {/* <SetupGuide /> */}

        {/* Disconnect */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming WhatsApp messages.</p>
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

  // ── Not connected ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect WhatsApp</h1>
        <p className="text-sm text-gray-400 mt-1">Integrate WhatsApp Business messaging into your platform.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100">
            {[
              { id: 'meta' as const, label: 'Connect with Meta' },
              { id: 'credentials' as const, label: 'API Credentials' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setTab(id); setError(null); }}
                className={`relative whitespace-nowrap px-5 py-3.5 text-xs font-semibold border-none cursor-pointer transition-colors bg-transparent
                  ${tab === id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                {label}
                {tab === id && <span className="absolute bottom-0 left-5 right-5 h-px bg-gray-900 block" />}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── Meta OAuth tab ── */}
            {tab === 'meta' && (
              <div className="space-y-5">
                {/* Info box */}
                {/* <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">One-click authorization</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Authorize via Meta's official OAuth. We'll automatically detect your WhatsApp Business Account and phone numbers — no manual credentials needed.
                  </p>
                </div> */}

                {/* Permissions */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions requested</p>
                  <div className="space-y-1.5">
                    {[
                      { perm: 'whatsapp_business_management', desc: 'Manage your WABA settings' },
                      { perm: 'whatsapp_business_messaging', desc: 'Send & receive messages' },
                      { perm: 'business_management', desc: 'Access Business account info' },
                    ].map(({ perm, desc }) => (
                      <div key={perm} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="text-[11px] text-gray-600 font-mono">{perm}</code>
                          <p className="text-[10px] text-gray-400">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OAuth flow steps */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-2">How it works</p>
                  <div className="space-y-1">
                    {[
                      'A Meta login popup will open',
                      'Select your Facebook Business account',
                      'We detect your WABA & phone numbers',
                      'Channel is connected automatically',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-[11px] text-indigo-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <AlertCircle size={12} className="shrink-0" /> {error}
                  </div>
                )}

                {/* Connect button */}
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Lock size={10} /> Secured by Meta OAuth
                  </p>
                  <button
                    onClick={handleMetaConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {connecting ? (
                      <>
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        {oauthStepLabel}
                      </>
                    ) : (
                      <>
                        <img src="https://cdn.simpleicons.org/whatsapp/ffffff" className="w-3 h-3" />
                        Connect with Meta
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 text-center">
                  A popup will open to Meta's secure authorization page.
                </p>
              </div>
            )}

            {/* ── Manual credentials tab ── */}
            {tab === 'credentials' && (
              <div className="space-y-5">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    <strong>Advanced:</strong> Use this if you have a System User token from Meta Business Suite.
                    System User tokens never expire — recommended for production.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {CRED_FIELDS.map((field) => {
                    const FIcon = field.Icon;
                    const isPwd = field.type === 'password';
                    const isVisible = showPasswords[field.key];
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">{field.label}</label>
                        <div className="relative">
                          <input
                            autoComplete="new-password"
                            type={isPwd && !isVisible ? 'password' : 'text'}
                            value={form[field.key]}
                            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 placeholder:text-gray-300 focus:border-gray-400 transition-colors pr-9 box-border"
                          />
                          {isPwd && (
                            <button type="button"
                              onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex">
                              {isVisible
                                ? <EyeOff size={13} className="text-gray-300 hover:text-gray-500 transition-colors" />
                                : <Eye size={13} className="text-gray-300 hover:text-gray-500 transition-colors" />}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">{field.hint}</p>
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <AlertCircle size={12} className="shrink-0" /> {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Lock size={10} /> Encrypted at rest
                  </p> */}
                  <button
                    onClick={handleCredentialsConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {connecting
                      ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                      : <><MessageSquare size={12} /> Connect WhatsApp</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Setup guide */}
        {/* <SetupGuide /> */}
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        Need help?{' '}
        <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">View documentation</a>
        {' '}·{' '}
        <a href="mailto:support@axorainfotech.com"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">Contact support</a>
      </p>
    </div>
  );
};

// ─── Setup Guide (shared between connected/not-connected) ─────────────────────

const SetupGuide = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-900">Setup guide</p>
      <p className="text-[11px] text-gray-400 mt-0.5">What to do after connecting</p>
    </div>
    <div className="p-5 space-y-0">
      {SETUP_STEPS.map(({ step, title, desc, link }, i) => (
        <div key={step} className="flex gap-4 relative pb-5 last:pb-0">
          {i < SETUP_STEPS.length - 1 && (
            <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />
          )}
          <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 z-10">
            {step}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 no-underline transition-colors">
                  <ExternalLink size={10} /> Open
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
