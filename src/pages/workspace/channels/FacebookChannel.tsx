// modules/channels/messenger/FacebookChannel.tsx

import { useState } from 'react';
import {
  Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle,
  MessageSquare, Zap, Lock, ThumbsUp,
} from 'lucide-react';
import type { Channel } from '../types';
import { ChannelApi } from '../../../lib/channelApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

interface FacebookConfig {
  pageAccessToken: string;
  pageId: string;
  appId: string;
  webhookSecret: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRED_FIELDS: {
  key: keyof FacebookConfig;
  label: string;
  placeholder: string;
  hint: string;
  type?: string;
}[] = [
  { key: 'pageAccessToken', label: 'Page Access Token',    placeholder: 'EAAxxxxxxxx…',   hint: 'Long-lived token from Meta Business Suite → Page Settings → Advanced Messaging', type: 'password' },
  { key: 'pageId',          label: 'Page ID',              placeholder: '1234567890',      hint: 'Found in your Facebook Page settings → About section' },
  { key: 'appId',           label: 'App ID',               placeholder: '9876543210',      hint: 'Your Meta App ID from developers.facebook.com/apps' },
  { key: 'webhookSecret',   label: 'Webhook Verify Token', placeholder: 'my_secret_token', hint: 'Secret string you choose — paste the same value into your Meta App webhook settings', type: 'password' },
];

const SETUP_STEPS = [
  { step: 1, title: 'Create a Meta App',             desc: 'Go to developers.facebook.com/apps and create a new app. Choose "Business" as the app type and add the Messenger product.', link: 'https://developers.facebook.com/apps' },
  { step: 2, title: 'Link your Facebook Page',       desc: 'In your Meta App, under Messenger → Settings, link the Facebook Page you want to receive messages from.', link: 'https://developers.facebook.com/docs/messenger-platform/get-started' },
  { step: 3, title: 'Generate a Page Access Token',  desc: 'In Messenger → Settings, generate a page access token for your linked Page. Convert it to a long-lived token for production use.', link: 'https://developers.facebook.com/docs/facebook-login/guides/access-tokens' },
  { step: 4, title: 'Configure your webhook',        desc: 'Set the callback URL to your platform webhook endpoint. Enter your Webhook Verify Token and subscribe to messages, messaging_postbacks, message_reads.', link: null },
  { step: 5, title: 'Submit for permissions review', desc: 'For production use, submit your app for Meta review to get the pages_messaging permission approved.', link: 'https://developers.facebook.com/docs/messenger-platform/app-review' },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const FacebookChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
      <img src="https://cdn.simpleicons.org/messenger" className="w-10 h-10" alt="messenger" />
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">Facebook Messenger</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: 'Messenger Inbox',  desc: 'Unified conversation view' },
          { Icon: Zap,           label: 'Automation',       desc: 'Bots & quick replies' },
          { Icon: ThumbsUp,      label: 'Page Messaging',   desc: 'Reply from your business page' },
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
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements</p>
      <div className="space-y-1">
        {['Facebook Business Page (admin access)', 'Meta Business Suite account', 'Meta Developer App', 'Messaging enabled on your Page'].map((req, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5">
            <span className="text-[10px] font-bold text-gray-300 mt-0.5 shrink-0">·</span>
            <p className="text-[11px] text-gray-500 leading-snug">{req}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-auto">
      <a href="https://developers.facebook.com/docs/messenger-platform" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-700 transition-colors no-underline font-medium">
        <ExternalLink size={11} /> Documentation
      </a>
    </div>
  </div>
);

// ─── Setup Guide (shared) ─────────────────────────────────────────────────────

const SetupGuide = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-900">Setup guide</p>
      <p className="text-[11px] text-gray-400 mt-0.5">Step-by-step configuration</p>
    </div>
    <div className="p-5">
      {SETUP_STEPS.map(({ step, title, desc, link }, i) => (
        <div key={step} className="flex gap-4 relative pb-5 last:pb-0">
          {i < SETUP_STEPS.length - 1 && <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />}
          <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 z-10">{step}</div>
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

// ─── Messenger OAuth Popup Handler (separate component) ───────────────────────

interface MessengerOAuthPopupProps {
  workspaceId: string;
  onSuccess: (channel: Channel) => void;
  onError: (msg: string) => void;
}

export const MessengerOAuthPopup = ({ workspaceId, onSuccess, onError }: MessengerOAuthPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'waiting' | 'exchanging' | 'saving'>('idle');

  const stepLabel = {
    idle:       'Connect with Meta',
    waiting:    'Waiting for login…',
    exchanging: 'Verifying account…',
    saving:     'Setting up pages…',
  }[step];

  const handleConnect = async () => {
    setLoading(true);
    setStep('waiting');

    try {
      // Step 1: Get OAuth URL from BE
      // GET /webhooks/messenger/auth/url?workspaceId=xxx&redirectUri=xxx
      const redirectUri = import.meta.env.VITE_MESSENGER_REDIRECT_URI;
      const { url } = await ChannelApi.getMessengerAuthUrl(workspaceId, redirectUri);

      // Step 2: Open Facebook OAuth popup
      const popup = window.open(url, 'messenger_oauth', 'width=650,height=700,scrollbars=yes');
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Step 3: Wait for code from popup
      const code = await waitForCode(popup);
      setStep('exchanging');

      // Step 4: Exchange code via BE
      // POST /webhooks/messenger/auth/callback
      setStep('saving');
      const result = await ChannelApi.exchangeMessengerCode(code, workspaceId, redirectUri);

      // result.channels = array of pages connected
      if (result.channels?.length) {
        onSuccess(result.channels[0]);
      } else {
        throw new Error('No Facebook Pages found. Make sure you have admin access to at least one Page.');
      }
    } catch (e: any) {
      onError(e?.message ?? 'Messenger connection failed. Please try again.');
    } finally {
      setLoading(false);
      setStep('idle');
    }
  };

  const waitForCode = (popup: Window): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Login timed out. Please try again.'));
      }, 5 * 60 * 1000);

      // Method 1: postMessage from redirect page
      const onMessage = (event: MessageEvent) => {
        console.log({event});
        
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "instagram_oauth" && event.data?.code) {
          cleanup();
          resolve(event.data.code);
        }
        if (event.data?.type === 'MESSENGER_OAUTH_ERROR') {
          cleanup();
          reject(new Error(event.data.error ?? 'OAuth failed'));
        }
      };

      // Method 2: Poll popup URL for code param (fallback — no callback page needed)
      const poll = setInterval(() => {
        try {
          if (popup.closed) {
            cleanup();
            reject(new Error('Login window was closed.'));
            return;
          }
          const popupUrl = popup.location.href;
          if (popupUrl && popupUrl.includes('code=')) {
            const code = new URL(popupUrl).searchParams.get('code');
            if (code) {
              popup.close();
              cleanup();
              resolve(code);
            }
          }
        } catch {
          // Cross-origin (facebook.com) — normal while on FB, keep polling
        }
      }, 500);

      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(poll);
        window.removeEventListener('message', onMessage);
      };

      window.addEventListener('message', onMessage);
    });
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center"
    >
      {loading ? (
        <>
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          {stepLabel}
        </>
      ) : (
        <>
          <img src="https://cdn.simpleicons.org/messenger/ffffff" className="w-3 h-3" />
          Connect with Meta
        </>
      )}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FacebookChannel = ({ connected, onConnect, onDisconnect, workspaceId }: Props) => {
  const [tab, setTab] = useState<'meta' | 'credentials'>('meta');
  const [form, setForm] = useState<FacebookConfig>({
    pageAccessToken: '', pageId: '', appId: '', webhookSecret: '',
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Manual credentials connect ──────────────────────────────────────────

  const handleCredentialsConnect = async () => {
    if (CRED_FIELDS.some(f => !form[f.key])) { setError('All fields are required.'); return; }
    setConnecting(true); setError(null);
    try {
      const channel = await ChannelApi.connectFacebookManual({
        pageAccessToken: form.pageAccessToken,
        pageId:          form.pageId,
        appId:           form.appId,
        webhookSecret:   form.webhookSecret,
        workspaceId,
      });
      onConnect(channel);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to connect. Please check your credentials.');
    } finally {
      setConnecting(false);
    }
  };

  // ── Connected state ──────────────────────────────────────────────────────

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
            {connected.msgs.toLocaleString()} messages sent
          </span>
        </div>

        <SetupGuide />

        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming Messenger messages.</p>
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Facebook Messenger</h1>
        <p className="text-sm text-gray-400 mt-1">Manage Messenger conversations from your Facebook Business Page.</p>
      </div>

      <div className="flex gap-6">
        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { id: 'meta' as const,        label: 'Connect with Meta' },
              { id: 'credentials' as const, label: 'API Credentials'   },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => { setTab(id); setError(null); }}
                className={`px-5 py-3.5 text-xs font-semibold border-none cursor-pointer transition-colors relative bg-transparent
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
                {/* Info */}
                {/* <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">One-click authorization</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Authorize via Meta's official OAuth. We'll automatically retrieve all your Facebook Pages and connect them — no manual token generation needed.
                  </p>
                </div> */}

                {/* Permissions */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions requested</p>
                  <div className="space-y-1.5">
                    {[
                      { perm: 'pages_show_list',        desc: 'List your Facebook Pages' },
                      { perm: 'pages_messaging',        desc: 'Send & receive messages' },
                      { perm: 'pages_read_engagement',  desc: 'Read page engagement' },
                      { perm: 'pages_manage_metadata',  desc: 'Manage webhook subscriptions' },
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

                {/* How it works */}
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-2">How it works</p>
                  <div className="space-y-1">
                    {[
                      'A Facebook login popup will open',
                      'Select which Pages to connect',
                      'We subscribe each Page to your webhook',
                      'All Pages connected automatically',
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-[11px] text-indigo-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <AlertCircle size={12} className="shrink-0" /> {error}
                  </div>
                )}

                {/* The popup component */}
                <div className="pt-2 border-t border-gray-100">
                  <MessengerOAuthPopup
                    workspaceId={workspaceId}
                    onSuccess={onConnect}
                    onError={setError}
                  />
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    A popup will open to Meta's secure authorization page.
                  </p>
                </div>
              </div>
            )}

            {/* ── Manual credentials tab ── */}
            {tab === 'credentials' && (
              <div className="space-y-5">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    <span className="font-semibold">Before you start:</span> Make sure you have a Meta Developer App created and your Facebook Page linked to it. You'll need admin access to the Page.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {CRED_FIELDS.map((field) => {
                    const isPwd = field.type === 'password';
                    const isVisible = showPasswords[field.key];
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-500">{field.label}</label>
                        <div className="relative">
                          <input
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
                  {/* <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Lock size={10} /> Encrypted at rest
                  </p> */}
                  <button
                    onClick={handleCredentialsConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {connecting
                      ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                      : <><MessageSquare size={12} /> Connect Messenger</>}
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
        <a href="https://developers.facebook.com/docs/messenger-platform" target="_blank" rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">View documentation</a>
        {' '}·{' '}
        <a href="mailto:support@yourplatform.com"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">Contact support</a>
      </p>
    </div>
  );
};