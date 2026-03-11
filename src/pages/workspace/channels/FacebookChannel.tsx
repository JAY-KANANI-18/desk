import { useState } from 'react';
import {
  Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle,
  MessageSquare, Users, Zap, BarChart3, Globe, Lock,
  ThumbsUp, Share2, Hash, Key,
} from 'lucide-react';
import { DUMMY_MODE } from '../api';
import type { Channel } from '../types';
import type { FBAuthResponse } from './types';
import { ChannelApi } from '../../../lib/channelApi';
import MetaConnectButton from '../../../components/MetaConnectButton';

declare const FB: any;

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

interface FacebookConfig {
  pageAccessToken: string;
  pageId: string;
  appId: string;
  webhookSecret: string;
}

const CRED_FIELDS: { key: keyof FacebookConfig; label: string; placeholder: string; hint: string; type?: string }[] = [
  { key: 'pageAccessToken', label: 'Page Access Token',   placeholder: 'EAAxxxxxxxx…',  hint: 'Long-lived token from Meta Business Suite → Page Settings → Advanced Messaging' , type: 'password' },
  { key: 'pageId',          label: 'Page ID',             placeholder: '1234567890',     hint: 'Found in your Facebook Page settings → About section'                                              },
  { key: 'appId',           label: 'App ID',              placeholder: '9876543210',     hint: 'Your Meta App ID from developers.facebook.com/apps'                                                },
  { key: 'webhookSecret',   label: 'Webhook Verify Token',placeholder: 'my_secret_token',hint: 'Secret string you choose — paste the same value into your Meta App webhook settings' , type: 'password' },
];

const SETUP_STEPS = [
  { step: 1, title: 'Create a Meta App',               desc: 'Go to developers.facebook.com/apps and create a new app. Choose "Business" as the app type and add the Messenger product.',                                              link: 'https://developers.facebook.com/apps'                                    },
  { step: 2, title: 'Link your Facebook Page',         desc: 'In your Meta App, under Messenger → Settings, link the Facebook Page you want to receive messages from. Grant all required permissions.',                                 link: 'https://developers.facebook.com/docs/messenger-platform/get-started'    },
  { step: 3, title: 'Generate a Page Access Token',    desc: 'In Messenger → Settings, generate a page access token for your linked Page. Convert it to a long-lived token using the Graph API for production use.',                    link: 'https://developers.facebook.com/docs/facebook-login/guides/access-tokens' },
  { step: 4, title: 'Configure your webhook',          desc: 'Set the callback URL to your platform webhook endpoint. Enter your Webhook Verify Token and subscribe to messages, messaging_postbacks, and message_reads fields.',        link: null                                                                      },
  { step: 5, title: 'Submit for permissions review',   desc: 'For production use, submit your app for Meta review to get the pages_messaging permission approved. Test mode works with page admins in the meantime.',                   link: 'https://developers.facebook.com/docs/messenger-platform/app-review'     },
];

export const FacebookChannelSidebar = () => (
  <div className="flex flex-col gap-6 p-6 h-full">
    <div className="flex items-center gap-2.5">
   <img
          src="https://cdn.simpleicons.org/messenger"
          className="w-10 h-10"
          alt="messenger"
        />      <div>
        <p className="text-xs font-semibold text-gray-900 leading-none">Facebook Messenger</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageSquare, label: 'Messenger Inbox',  desc: 'Unified conversation view'     },
          { Icon: Zap,           label: 'Automation',       desc: 'Bots & quick replies'          },
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

export const FacebookChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [tab, setTab]                     = useState<'credentials' | 'meta'>('credentials');
  const [form, setForm]                   = useState<FacebookConfig>({ pageAccessToken: '', pageId: '', appId: '', webhookSecret: '' });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleCredentialsConnect = async () => {
    if (CRED_FIELDS.some(f => !form[f.key])) { setError('All fields are required.'); return; }
    setConnecting(true); setError(null);
    try {
      const channel = await ChannelApi.connectFacebookManual({
        pageAccessToken: form.pageAccessToken,
        pageId:          form.pageId,
        appId:           form.appId,
        webhookSecret:   form.webhookSecret,
      });
      onConnect(channel);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to connect. Please check your credentials and try again.');
    } finally { setConnecting(false); }
  };

  const handleFBLogin = () => {
    setConnecting(true); setError(null);
    const doConnect = async (auth: FBAuthResponse) => {
      try { const channel = await ChannelApi.connectFacebookViaFB(auth); onConnect(channel); }
      catch (e: any) { setError(e?.message ?? 'Failed to connect. Please try again.'); }
      finally { setConnecting(false); }
    };
    if (DUMMY_MODE) { setTimeout(() => doConnect({ accessToken: 'mock_token', userID: 'mock_user' }), 1500); return; }
    FB.login((response: any) => {
      if (response.authResponse) doConnect(response.authResponse);
      else { setError('Facebook login was cancelled or failed.'); setConnecting(false); }
    }, { scope: 'pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata' });
  };

  if (connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Channel active</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{connected.identifier}</p>
          </div>
          <span className="text-[11px] text-gray-500 font-medium shrink-0">{connected.msgs.toLocaleString()} messages sent</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Setup guide</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Complete your Messenger configuration</p>
          </div>
          <div className="p-5">
            {SETUP_STEPS.map(({ step, title, desc, link }, i) => (
              <div key={step} className="flex gap-4 relative pb-5 last:pb-0">
                {i < SETUP_STEPS.length - 1 && <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />}
                <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 z-10">{step}</div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-800">{title}</p>
                    {link && <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 no-underline transition-colors"><ExternalLink size={10} /> Open</a>}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="text-xs text-gray-400 mt-0.5">Stops all incoming Messenger messages.</p>
          </div>
          <button onClick={() => onDisconnect(connected.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors bg-transparent cursor-pointer">Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Facebook Messenger</h1>
        <p className="text-sm text-gray-400 mt-1">Manage Messenger conversations from your Facebook Business Page.</p>
      </div>
   < div className="flex gap-6">
  
      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[{ id: 'credentials' as const, label: 'API Credentials' }, { id: 'meta' as const, label: 'Connect with Meta' }].map(({ id, label }) => (
            <button key={id} onClick={() => { setTab(id); setError(null); }}
              className={`px-5 py-3.5 text-xs font-semibold border-none cursor-pointer transition-colors relative bg-transparent
                ${tab === id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              {label}
              {tab === id && <span className="absolute bottom-0 left-5 right-5 h-px bg-gray-900 block" />}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'credentials' && (
            <div className="space-y-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  <span className="font-semibold">Before you start:</span> Make sure you have a Meta Developer App created and your Facebook Page linked to it. You'll need admin access to the Page.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {CRED_FIELDS.map((field) => {
                  const isPwd = field.type === 'password'; const isVisible = showPasswords[field.key];
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500">{field.label}</label>
                      <div className="relative">
                        <input type={isPwd && !isVisible ? 'password' : 'text'} value={form[field.key]}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                          className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2.5 outline-none bg-white text-gray-900 placeholder:text-gray-300 focus:border-gray-400 transition-colors pr-9 box-border" />
                        {isPwd && (
                          <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex">
                            {isVisible ? <EyeOff size={13} className="text-gray-300 hover:text-gray-500 transition-colors" /> : <Eye size={13} className="text-gray-300 hover:text-gray-500 transition-colors" />}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{field.hint}</p>
                    </div>
                  );
                })}
              </div>
              {error && <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"><AlertCircle size={12} className="shrink-0" /> {error}</div>}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
                <p className="flex items-center gap-1.5 text-[11px] text-gray-400"><Lock size={10} /> Encrypted at rest</p>
                <button onClick={handleCredentialsConnect} disabled={connecting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {connecting ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</> : <><MessageSquare size={12} /> Connect Messenger</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">One-click authorization</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">Authorize via Meta's official OAuth. You'll select which Facebook Page to connect during the flow — no manual token generation needed.</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions requested</p>
                <div className="space-y-1.5">
                  {['pages_show_list', 'pages_messaging', 'pages_read_engagement', 'pages_manage_metadata'].map(p => (
                    <div key={p} className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0" /><code className="text-[11px] text-gray-600 font-mono">{p}</code></div>
                  ))}
                </div>
              </div>
              {error && <div className="flex items-center gap-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5"><AlertCircle size={12} className="shrink-0" /> {error}</div>}
              <MetaConnectButton channel="facebook" onSuccess={(auth: FBAuthResponse) => {
                setConnecting(true); setError(null);
                ChannelApi.connectFacebookViaFB(auth).then(onConnect).catch((e: any) => setError(e?.message ?? 'Failed to connect.')).finally(() => setConnecting(false));
              }} />
              <p className="text-[10px] text-gray-400 text-center">You'll be redirected to Meta's secure authorization page.</p>
            </div>
          )}
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Setup guide</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Step-by-step configuration for API Credentials method</p>
        </div>
        <div className="p-5">
          {SETUP_STEPS.map(({ step, title, desc, link }, i) => (
            <div key={step} className="flex gap-4 relative pb-5 last:pb-0">
              {i < SETUP_STEPS.length - 1 && <div className="absolute left-3.5 top-7 bottom-0 w-px bg-gray-100" />}
              <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 z-10">{step}</div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-800">{title}</p>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 no-underline transition-colors"><ExternalLink size={10} /> Open</a>}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        Need help?{' '}<a href="https://developers.facebook.com/docs/messenger-platform" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 underline transition-colors">View documentation</a>{' '}·{' '}<a href="mailto:support@yourplatform.com" className="text-gray-600 hover:text-gray-900 underline transition-colors">Contact support</a>
      </p>
    </div>
  );
};