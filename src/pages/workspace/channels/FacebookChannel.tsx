import { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Zap,
} from '@/components/ui/icons';
import { ChannelConnectActionButton } from '../../../components/channels/ChannelConnectActionButton';
import { Button } from '../../../components/ui/button/Button';
import { Tag } from '../../../components/ui/tag/Tag';
import { getChannelIconUrl } from '../../../config/channelMetadata';
import { useChannelOAuth } from '../../../hooks/useChannelOAuth';
import {
  ChannelConnectPrerequisites,
  useChannelConnectPrerequisites,
  type ChannelConnectPrerequisite,
} from './ChannelConnectPrerequisites';
import type { Channel } from '../types';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  workspaceId: string;
}

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Create a Meta App',
    desc: 'Go to developers.facebook.com/apps and create a new Business app with Messenger enabled.',
    link: 'https://developers.facebook.com/apps',
  },
  {
    step: 2,
    title: 'Link your Facebook Page',
    desc: 'Connect the Facebook Page you want to use for Messenger conversations.',
    link: 'https://developers.facebook.com/docs/messenger-platform/get-started',
  },
  {
    step: 3,
    title: 'Review messaging permissions',
    desc: 'After connecting, confirm webhook subscriptions and page messaging access in Meta.',
    link: 'https://developers.facebook.com/docs/messenger-platform/app-review',
  },
];

const MESSENGER_PREREQUISITES: ChannelConnectPrerequisite[] = [
  {
    id: 'business-access',
    label: 'I have full access to the Meta Business Portfolio.',
    description: 'Use the Facebook account that manages the business and Page.',
  },
  {
    id: 'page-access',
    label: 'The Facebook Page is ready for Messenger.',
    description: 'You should be an admin or have full Page access.',
  },
  // {
  //   id: 'two-factor',
  //   label: 'Two-factor authentication is enabled on my Facebook account.',
  //   description: 'Meta may block business setup when 2FA is not enabled.',
  // },
  // {
  //   id: 'business-proof',
  //   label: 'Business proof documents are ready if Meta asks.',
  //   description: 'Registration document, bank statement, or service bill works.',
  // },
];

export const FacebookChannelSidebar = () => (
  <div className="flex h-full flex-col gap-6 p-6 pt-0">
    
    <div className="h-px bg-gray-100 hidden md:block" />
    <div className='hidden md:block'>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Features
      </p>
      <div className="space-y-0.5">
        {[
          {
            Icon: MessageSquare,
            label: 'Messenger Inbox',
            desc: 'Unified conversation view',
          },
          { Icon: Zap, label: 'Automation', desc: 'Bots & quick replies' },
          {
            Icon: ThumbsUp,
            label: 'Page Messaging',
            desc: 'Reply from your business page',
          },
        ].map(({ Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
          >
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
        href="https://developers.facebook.com/docs/messenger-platform"
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
      <p className="mt-0.5 text-[11px] text-gray-400">
        Step-by-step configuration
      </p>
    </div>
    <div className="p-5">
      {SETUP_STEPS.map(({ step, title, desc, link }, index) => (
        <div key={step} className="relative flex gap-4 pb-5 last:pb-0">
          {index < SETUP_STEPS.length - 1 ? (
            <div className="absolute bottom-0 left-3.5 top-7 w-px bg-gray-100" />
          ) : null}
          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {step}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 no-underline transition-colors hover:text-gray-700"
                >
                  <ExternalLink size={10} />
                  Open
                </a>
              ) : null}
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface MessengerOAuthPopupProps {
  workspaceId: string;
  onSuccess: (channel: Channel) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const MessengerOAuthPopup = ({
  workspaceId,
  onSuccess,
  onError,
  disabled = false,
}: MessengerOAuthPopupProps) => {
  const { loading, startAuth } = useChannelOAuth({
    provider: 'messenger',
    workspaceId,
    onSuccess,
    onError,
  });

  return (
    <ChannelConnectActionButton
      onClick={() => {
        void startAuth();
      }}
      disabled={disabled || loading}
      fullWidth
      leftIcon={
        !loading ? (
          <img
            src={getChannelIconUrl('facebook', 'ffffff')}
            className="h-3 w-3"
            alt=""
          />
        ) : undefined
      }
      loading={loading}
      loadingMode="inline"
      loadingLabel="Waiting for Facebook..."
    >
      Connect with Facebook
    </ChannelConnectActionButton>
  );
};

export const FacebookChannel = ({
  connected,
  onConnect,
  onDisconnect,
  workspaceId,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const {
    allChecked: prerequisitesReady,
    checkedIds,
    togglePrerequisite,
  } = useChannelConnectPrerequisites(MESSENGER_PREREQUISITES);

  if (connected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Channel active</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {connected.identifier}
            </p>
          </div>
          <div className="shrink-0">
            <Tag label="Connected" size="sm" bgColor="success" />
          </div>
        </div>

        <SetupGuide />

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Stops all incoming Messenger messages.
            </p>
          </div>
          <Button
            onClick={() => onDisconnect(connected.id)}
            variant="danger"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Connect Facebook Messenger
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage Messenger conversations from your Facebook Business Page.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="p-6">
            <div className="space-y-5">
              <ChannelConnectPrerequisites
                items={MESSENGER_PREREQUISITES}
                checkedIds={checkedIds}
                onToggle={togglePrerequisite}
              />

              {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] text-red-500">
                  <AlertCircle size={12} className="shrink-0" />
                  {error}
                </div>
              ) : null}

              <div className="border-t border-gray-100 pt-2">
                <MessengerOAuthPopup
                  workspaceId={workspaceId}
                  onSuccess={onConnect}
                  onError={setError}
                  disabled={!prerequisitesReady}
                />
                <p className="mt-2 text-center text-[10px] text-gray-400">
                  {prerequisitesReady
                    ? "A popup will open to Meta's secure authorization page."
                    : 'Check each item above to enable connection.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Need help?{' '}
        <a
          href="https://developers.facebook.com/docs/messenger-platform"
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
