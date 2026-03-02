import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { channelApi } from './channelApi';
import { DUMMY_MODE } from '../api';
import type { Channel } from '../types';
import type { WhatsAppConfig, FBAuthResponse } from './types';

// Declare FB SDK global (loaded via script tag in production)
declare const FB: any;

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

// ── Sub-sidebar description (exported for ChannelsSettings) ──────────────────
export const WhatsAppSidebarInfo = ({ channel }: { channel: Channel }) => (
  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm">💬</span>
      <span className="text-xs font-semibold text-green-800">WhatsApp Cloud API</span>
      <span className="ml-auto text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
    </div>
    <p className="text-[11px] text-green-700 leading-relaxed mb-2.5">
      Reach 2B+ users on the world's most popular messaging platform. Send rich media, automate responses, and manage conversations at scale — all from one inbox.
    </p>
    <ul className="space-y-1.5">
      {[
        '2B+ active users worldwide',
        'Rich media & interactive messages',
        'End-to-end encryption',
        'Automated workflows & bots',
        'Real-time delivery receipts',
        'Broadcast to opted-in contacts',
      ].map(b => (
        <li key={b} className="flex items-start gap-1.5 text-[11px] text-green-700">
          <CheckCircle size={11} className="text-green-500 mt-0.5 flex-shrink-0" />
          {b}
        </li>
      ))}
    </ul>
    <div className="mt-2.5 pt-2.5 border-t border-green-200 space-y-0.5">
      <p className="text-[11px] text-green-700 font-semibold">{channel.identifier}</p>
      <p className="text-[10px] text-green-500">{channel.msgs.toLocaleString()} messages sent</p>
    </div>
  </div>
);

// ── FB icon ───────────────────────────────────────────────────────────────────
const FBIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ── Setup steps ───────────────────────────────────────────────────────────────
const SETUP_STEPS = [
  {
    step: 1,
    title: 'Create a Meta Business Account',
    desc: 'Go to business.facebook.com and create or verify your Meta Business Account to access the WhatsApp Business API.',
    link: 'https://business.facebook.com',
  },
  {
    step: 2,
    title: 'Register your phone number',
    desc: 'In Meta Business Suite, navigate to WhatsApp → API Setup and register your WhatsApp Business phone number.',
    link: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
  },
  {
    step: 3,
    title: 'Configure your webhook',
    desc: 'Set your webhook URL to https://app.yourplatform.com/webhooks/whatsapp and enter your Webhook Verify Token from above.',
    link: null,
  },
  {
    step: 4,
    title: 'Generate a permanent access token',
    desc: 'In Meta Business Suite, create a System User and generate a permanent token with whatsapp_business_messaging permission.',
    link: 'https://developers.facebook.com/docs/whatsapp/business-management-api/get-started',
  },
  {
    step: 5,
    title: 'Test your connection',
    desc: 'Send a test message from the Meta API Explorer to verify your setup is working correctly.',
    link: 'https://developers.facebook.com/tools/explorer',
  },
];

// ── Credential fields ─────────────────────────────────────────────────────────
const CRED_FIELDS = [
  { key: 'phoneNumberId', label: 'Phone Number ID',              placeholder: '1234567890',    hint: 'Found in Meta Business Suite → WhatsApp → API Setup' },
  { key: 'wabaId',        label: 'WhatsApp Business Account ID', placeholder: '9876543210',    hint: 'Your WABA ID from Meta Business Manager' },
  { key: 'accessToken',   label: 'Permanent Access Token',       placeholder: 'EAAxxxxxxxx…',  type: 'password', hint: 'Generate a permanent token in Meta Business Suite' },
  { key: 'webhookSecret', label: 'Webhook Verify Token',         placeholder: 'my_secret_token', hint: 'A secret string you choose to verify webhook calls' },
];

// ── Main component ────────────────────────────────────────────────────────────
export const WhatsAppCloudChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [tab, setTab] = useState<'credentials' | 'meta'>('credentials');
  const [form, setForm] = useState<WhatsAppConfig>({ phoneNumberId: '', wabaId: '', accessToken: '', webhookSecret: '' });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Credentials connect ──────────────────────────────────────────────────
  const handleCredentialsConnect = async () => {
    if (!form.phoneNumberId || !form.wabaId || !form.accessToken || !form.webhookSecret) {
      setError('All fields are required.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const channel = await channelApi.connectWhatsApp(form);
      onConnect(channel);
    } catch {
      setError('Failed to connect. Please check your credentials and try again.');
    } finally {
      setConnecting(false);
    }
  };

  // ── FB.login connect ─────────────────────────────────────────────────────
  const handleFBLogin = () => {
    setConnecting(true);
    setError(null);

    const doConnect = async (auth: FBAuthResponse) => {
      try {
        const channel = await channelApi.connectWhatsAppViaFB(auth);
        onConnect(channel);
      } catch {
        setError('Failed to connect. Please try again.');
      } finally {
        setConnecting(false);
      }
    };

    if (DUMMY_MODE) {
      setTimeout(() => doConnect({ accessToken: 'mock_token', userID: 'mock_user' }), 1500);
      return;
    }

    FB.login(
      (response: any) => {
        if (response.authResponse) {
          doConnect(response.authResponse);
        } else {
          setError('Facebook login was cancelled or failed.');
          setConnecting(false);
        }
      },
      { scope: 'whatsapp_business_management,whatsapp_business_messaging,pages_show_list' },
    );
  };

  // ── Connected state ──────────────────────────────────────────────────────
  if (connected) {
    return (
      <div className="space-y-5">
        {/* Channel header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">💬</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">WhatsApp Cloud API</h3>
            <p className="text-xs text-gray-500">{connected.identifier}</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
            ● Connected
          </span>
        </div>

        {/* Video */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-base">📹</span> Getting started with WhatsApp Cloud API
          </h4>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-black" style={{ aspectRatio: '16/9' }}>
            <iframe
              src="https://www.youtube.com/embed/CEt_KMMv3V8?rel=0&modestbranding=1"
              title="WhatsApp Cloud API Setup Guide"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Setup steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Setup guide</h4>
          <div className="space-y-5">
            {SETUP_STEPS.map(({ step, title, desc, link }) => (
              <div key={step} className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disconnect */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Disconnect channel</p>
            <p className="text-xs text-red-600 mt-0.5">This will stop receiving messages from WhatsApp.</p>
          </div>
          <button
            onClick={() => onDisconnect(connected.id)}
            className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── Connect form ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-800 mb-1">WhatsApp Cloud API</p>
        <p className="text-xs text-green-700 leading-relaxed">
          Connect your WhatsApp Business number via Meta Cloud API. You'll need a Meta Business Account and a registered WhatsApp Business phone number.
        </p>
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-green-700 underline mt-2 hover:text-green-900"
        >
          View setup documentation <ExternalLink size={11} />
        </a>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => { setTab('credentials'); setError(null); }}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'credentials' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          API Credentials
        </button>
        <button
          onClick={() => { setTab('meta'); setError(null); }}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'meta' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Connect via Meta
        </button>
      </div>

      {tab === 'credentials' && (
        <div className="space-y-3">
          {CRED_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                  value={form[field.key as keyof WhatsAppConfig]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-9"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {field.hint && <p className="text-[11px] text-gray-400 mt-1">{field.hint}</p>}
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}
          <button
            onClick={handleCredentialsConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {connecting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
              : <>💬 Connect WhatsApp Cloud API</>}
          </button>
        </div>
      )}

      {tab === 'meta' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Required permissions</p>
            <div className="space-y-1.5">
              {['whatsapp_business_management', 'whatsapp_business_messaging', 'pages_show_list'].map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{p}</code>
                </div>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}
          <button
            onClick={handleFBLogin}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#1877F2] text-white rounded-xl font-semibold text-sm hover:bg-[#166FE5] transition-colors disabled:opacity-60 shadow-sm"
          >
            {connecting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
              : <><FBIcon />Continue with Facebook</>}
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            You'll authorize access to your WhatsApp Business account via Meta.
          </p>
        </div>
      )}
    </div>
  );
};
