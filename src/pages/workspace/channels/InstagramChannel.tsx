import { useState } from 'react';
import {
  ExternalLink,
  AlertCircle,
  Image,
  Heart,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import type { Channel } from '../types';
import { useChannelOAuth } from '../../../hooks/useChannelOAuth';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Convert to a Professional account',
    desc: 'Your Instagram account must be a Creator or Business account.',
    link: 'https://help.instagram.com/502981923235522',
  },
  {
    step: 2,
    title: 'Link to a Facebook Page',
    desc: 'Connect your Instagram Professional account to a Facebook Page you administer.',
    link: 'https://help.instagram.com/570895513091465',
  },
  {
    step: 3,
    title: 'Review messaging access',
    desc: 'After connecting, confirm message access and webhook events in your Meta app.',
    link: 'https://developers.facebook.com/docs/messenger-platform/instagram/get-started',
  },
];

export const InstagramChannelSidebar = () => (
  <div className="flex h-full flex-col gap-6 p-6">
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <img src="https://cdn.simpleicons.org/instagram" className="h-10 w-10" alt="Instagram" />
      </div>
      <div>
        <p className="leading-none text-xs font-semibold text-gray-900">Instagram</p>
        <p className="mt-0.5 text-[10px] text-gray-400">Meta Business Platform</p>
      </div>
    </div>
    <div className="h-px bg-gray-100" />
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Features</p>
      <div className="space-y-0.5">
        {[
          { Icon: MessageCircle, label: 'DM Management', desc: 'Reply to direct messages' },
          { Icon: Heart, label: 'Story Replies', desc: 'Engage with story mentions' },
          { Icon: Image, label: 'Rich Media', desc: 'Images, reels & carousels' },
          { Icon: BarChart3, label: 'Insights', desc: 'Message & engagement stats' },
        ].map(({ Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50">
            <Icon size={13} className="shrink-0 text-gray-400" />
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
        href="https://developers.facebook.com/docs/messenger-platform/instagram"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[11px] font-medium text-gray-400 no-underline transition-colors hover:text-gray-700"
      >
        <ExternalLink size={11} />
        Documentation
      </a>
    </div>
  </div>
);

export const SetupGuide = () => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-5 py-4">
      <p className="text-sm font-semibold text-gray-900">Setup guide</p>
      <p className="mt-0.5 text-[11px] text-gray-400">Step-by-step configuration</p>
    </div>
    <div className="p-5">
      {SETUP_STEPS.map(({ step, title, desc, link }, index) => (
        <div key={step} className="relative flex gap-4 pb-5 last:pb-0">
          {index < SETUP_STEPS.length - 1 && <div className="absolute bottom-0 left-3.5 top-7 w-px bg-gray-100" />}
          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {step}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 no-underline transition-colors hover:text-gray-700"
                >
                  <ExternalLink size={10} />
                  Open
                </a>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface InstagramOAuthPopupProps {
  workspaceId: string;
  onSuccess: (channel: Channel) => void;
  onError: (msg: string) => void;
}

export const InstagramOAuthPopup = ({ workspaceId, onSuccess, onError }: InstagramOAuthPopupProps) => {
  const { loading, startAuth } = useChannelOAuth({
    provider: 'instagram',
    workspaceId,
    onSuccess,
    onError,
  });

  const stepLabel = loading ? 'Waiting for login...' : 'Connect with Instagram';

  return (
    <button
      onClick={() => {
        void startAuth();
      }}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-none bg-indigo-600 px-5 py-2.5 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? (
        <>
          <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
          {stepLabel}
        </>
      ) : (
        <>
          <img src="https://cdn.simpleicons.org/instagram/ffffff" className="h-3 w-3" alt="" />
          Connect with Instagram
        </>
      )}
    </button>
  );
};

export const InstagramChannel = ({ connected, onConnect, onDisconnect, workspaceId }: Props) => {
  const [error, setError] = useState<string | null>(null);

  if (connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Channel active</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{connected.identifier}</p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-gray-500">
            {connected.msgs.toLocaleString()} messages sent
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-gray-400">Stops all incoming Instagram messages.</p>
          </div>
          <button
            onClick={() => onDisconnect(connected.id)}
            className="cursor-pointer rounded-lg border border-red-200 bg-transparent px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Connect Instagram</h1>
        <p className="mt-1 text-sm text-gray-400">Reply to DMs and story mentions directly from your inbox.</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="p-6">
            <div className="space-y-5">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">How it works</p>
                <div className="space-y-1">
                  {[
                    'An Instagram login popup will open',
                    'Log in and authorize the permissions',
                    'We detect your Business account automatically',
                    'Channel is connected and ready to use',
                  ].map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-[9px] font-bold text-indigo-700">
                        {index + 1}
                      </span>
                      <span className="text-[11px] text-indigo-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                  <AlertCircle size={12} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="border-t border-gray-100 pt-2">
                <InstagramOAuthPopup workspaceId={workspaceId} onSuccess={onConnect} onError={setError} />
                <p className="mt-2 text-center text-[10px] text-gray-400">
                  A popup will open to Instagram&apos;s secure authorization page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Need help?{' '}
        <a
          href="https://developers.facebook.com/docs/messenger-platform/instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 underline transition-colors hover:text-gray-900"
        >
          View documentation
        </a>
        {' | '}
        <a
          href="mailto:support@axorainfotech.com"
          className="text-gray-600 underline transition-colors hover:text-gray-900"
        >
          Contact support
        </a>
      </p>
    </div>
  );
};
