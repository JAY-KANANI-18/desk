// modules/channels/instagram/InstagramChannel.tsx

import { useState } from 'react';
import {
  Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle,
  Image, Heart, MessageCircle, BarChart3, Lock,
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

interface InstagramConfig {
  pageAccessToken: string;
  instagramAccountId: string;
  pageId: string;
  webhookSecret: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRED_FIELDS: {
  key: keyof InstagramConfig;
  label: string;
  placeholder: string;
  hint: string;
  type?: string;
}[] = [
  { key: 'pageAccessToken', label: 'Page Access Token', placeholder: 'EAAxxxxxxxx…', hint: 'Long-lived token from your linked Facebook Page', type: 'password' },
  { key: 'instagramAccountId', label: 'Instagram Business Account ID', placeholder: '1234567890', hint: 'Meta Business Suite → Instagram → Account settings' },
  { key: 'pageId', label: 'Facebook Page ID', placeholder: '9876543210', hint: 'The Page ID linked to your Instagram Professional account' },
  { key: 'webhookSecret', label: 'Webhook Verify Token', placeholder: 'my_secret_token', hint: 'A secret string you choose — enter same in Meta App webhook config', type: 'password' },
];

const SETUP_STEPS = [
  { step: 1, title: 'Convert to a Professional account', desc: 'Your Instagram account must be a Creator or Business account. Go to Instagram Settings → Account → Switch to Professional account.', link: 'https://help.instagram.com/502981923235522' },
  { step: 2, title: 'Link to a Facebook Page', desc: 'Connect your Instagram Professional account to a Facebook Page you administer via Instagram Settings → Account → Linked accounts.', link: 'https://help.instagram.com/570895513091465' },
  { step: 3, title: 'Create a Meta Developer App', desc: 'Go to developers.facebook.com/apps, create a new Business app, add the Instagram product, and link your Facebook Page.', link: 'https://developers.facebook.com/apps' },
  { step: 4, title: 'Enable Instagram Messaging', desc: 'In your Meta App → Instagram → Settings, enable "Access to Messages". Requires Live mode or test users.', link: 'https://developers.facebook.com/docs/messenger-platform/instagram/get-started' },
  { step: 5, title: 'Generate a Page Access Token', desc: 'In Graph API Explorer, select your Page and generate a long-lived token with instagram_manage_messages permission.', link: 'https://developers.facebook.com/tools/explorer' },
  { step: 6, title: 'Configure your webhook', desc: 'Set callback URL to your platform webhook endpoint. Subscribe to instagram field. Enter your Webhook Verify Token.', link: null },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const InstagramChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <img src="https://cdn.simpleicons.org/instagram" className="w-10 h-10" alt="Instagram" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">Instagram</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageCircle, label: 'DM Management', desc: 'Reply to direct messages' },
          { Icon: Heart, label: 'Story Replies', desc: 'Engage with story mentions' },
          { Icon: Image, label: 'Rich Media', desc: 'Images, reels & carousels' },
          { Icon: BarChart3, label: 'Insights', desc: 'Message & engagement stats' },
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
    {/* <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements</p>
      <div className="space-y-1">
        {['Instagram Professional account', 'Linked Facebook Page (admin)', 'Meta Developer App', 'Messaging permissions enabled'].map((req, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5">
            <span className="text-[10px] font-bold text-gray-300 mt-0.5 shrink-0">·</span>
            <p className="text-[11px] text-gray-500 leading-snug">{req}</p>
          </div>
        ))}
      </div>
    </div> */}
    <div className="mt-auto">
      <a href="https://developers.facebook.com/docs/messenger-platform/instagram" target="_blank" rel="noopener noreferrer"
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

// ─── Instagram OAuth Popup Handler (separate component) ───────────────────────

interface InstagramOAuthPopupProps {
  workspaceId: string;
  onSuccess: (channel: Channel) => void;
  onError: (msg: string) => void;
}

export const InstagramOAuthPopup = ({ workspaceId, onSuccess, onError }: InstagramOAuthPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'waiting' | 'exchanging' | 'saving'>('idle');

  const stepLabel = {
    idle: 'Connect with Instagram',
    waiting: 'Waiting for login…',
    exchanging: 'Verifying account…',
    saving: 'Setting up channel…',
  }[step];

  const handleConnect = async () => {
    setLoading(true);
    setStep('waiting');

    try {
      // Step 1: Get OAuth URL from BE
      // GET /webhooks/instagram/auth/url?workspaceId=xxx&redirectUri=xxx
      const redirectUri =  import.meta.env.VITE_INSTAGRAM_REDIRECT_URI;
      const { url } = await ChannelApi.getInstagramAuthUrl(workspaceId, redirectUri);

      // Step 2: Open Instagram OAuth popup
      const popup = window.open(url, 'instagram_oauth', 'width=600,height=700,scrollbars=yes');
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Step 3: Wait for code from popup
      const code = await waitForCode(popup);
      setStep('exchanging');

      // Step 4: Exchange code via BE
      // POST /webhooks/instagram/auth/callback
      setStep('saving');
      const result = await ChannelApi.exchangeInstagramCode(code, workspaceId, redirectUri);

      onSuccess(result.channel);
    } catch (e: any) {
      onError(e?.message ?? 'Instagram connection failed. Please try again.');
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

      // Method 1: postMessage (works when redirect page sends window.opener.postMessage)
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "instagram_oauth" && event.data?.code) {
          cleanup();
          resolve(event.data.code);
        }
        if (event.data?.type === 'INSTAGRAM_OAUTH_ERROR') {
          cleanup();
          reject(new Error(event.data.error ?? 'OAuth failed'));
        }
      };

      // Method 2: Poll popup URL for code param (fallback — works without a callback page)
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
          // Cross-origin (instagram.com) — normal, just keep polling
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
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center"
    >
      {loading ? (
        <>
          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          {stepLabel}
        </>
      ) : (
        <>
          <img src="https://cdn.simpleicons.org/instagram/ffffff" className="w-3 h-3" />
          Connect with Instagram
        </>
      )}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const InstagramChannel = ({ connected, onConnect, onDisconnect, workspaceId }: Props) => {
  const [tab, setTab] = useState<'meta' | 'credentials'>('meta');
  const [form, setForm] = useState<InstagramConfig>({
    pageAccessToken: '', instagramAccountId: '', pageId: '', webhookSecret: '',
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Manual credentials connect ──────────────────────────────────────────

  const handleCredentialsConnect = async () => {
    if (CRED_FIELDS.some(f => !form[f.key])) { setError('All fields are required.'); return; }
    setConnecting(true); setError(null);
    try {
      const channel = await ChannelApi.connectInstagramManual({
        pageAccessToken: form.pageAccessToken,
        instagramAccountId: form.instagramAccountId,
        pageId: form.pageId,
        webhookSecret: form.webhookSecret,
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

        {/* <SetupGuide /> */}

        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming Instagram messages.</p>
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Instagram</h1>
        <p className="text-sm text-gray-400 mt-1">Reply to DMs and story mentions directly from your inbox.</p>
      </div>

      <div className="flex gap-6">
        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { id: 'meta' as const, label: 'Connect with Instagram' },
              { id: 'credentials' as const, label: 'API Credentials' },
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

            {/* ── Instagram OAuth tab ── */}
            {tab === 'meta' && (
              <div className="space-y-5">
                {/* Info */}
                {/* <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">One-click authorization</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Authorize via Instagram's official OAuth. We'll automatically connect your Instagram Business account — no manual IDs needed.
                  </p>
                </div> */}

                {/* Permissions */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions requested</p>
                  <div className="space-y-1.5">
                    {[
                      { perm: 'instagram_business_basic', desc: 'Read profile & account info' },
                      { perm: 'instagram_business_manage_messages', desc: 'Send & receive DMs' },
                      { perm: 'instagram_business_manage_comments', desc: 'Manage post comments' },
                      { perm: 'instagram_business_content_publish', desc: 'Publish content' },
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
                      'An Instagram login popup will open',
                      'Log in and authorize the permissions',
                      'We detect your Business account automatically',
                      'Channel is connected and ready to use',
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
                  <InstagramOAuthPopup
                    workspaceId={workspaceId}
                    onSuccess={onConnect}
                    onError={setError}
                  />
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    A popup will open to Instagram's secure authorization page.
                  </p>
                </div>
              </div>
            )}

            {/* ── Manual credentials tab ── */}
            {tab === 'credentials' && (
              <div className="space-y-5">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    <span className="font-semibold">Before you start:</span> You need an Instagram Professional account linked to a Facebook Page, plus a Meta Developer App with Instagram messaging enabled.
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
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {connecting
                      ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                      : <><MessageCircle size={12} /> Connect Instagram</>}
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
        <a href="https://developers.facebook.com/docs/messenger-platform/instagram" target="_blank" rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">View documentation</a>
        {' '}·{' '}
        <a href="mailto:support@axorainfotech.com"
          className="text-gray-600 hover:text-gray-900 underline transition-colors">Contact support</a>
      </p>
    </div>
  );
};