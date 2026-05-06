import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  Zap,
} from '@/components/ui/icons';
import { ChannelConnectActionButton } from '../../../components/channels/ChannelConnectActionButton';
import { Button } from '../../../components/ui/button/Button';
import { CheckboxInput } from '../../../components/ui/inputs/CheckboxInput';
import { Tag } from '../../../components/ui/tag/Tag';
import { getChannelIconUrl } from '../../../config/channelMetadata';
import {
  useChannelOAuth,
  type OAuthBrowserCallbackPayload,
} from '../../../hooks/useChannelOAuth';
import {
  ChannelApi,
  type MessengerPageOption,
} from '../../../lib/channelApi';
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function MessengerPageLabel({ page }: { page: MessengerPageOption }) {
  const fallbackInitial = page.name.trim().charAt(0).toUpperCase() || 'P';

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
        {page.pictureUrl ? (
          <img
            src={page.pictureUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          fallbackInitial
        )}
      </span>
      <span className="min-w-0 truncate">{page.name}</span>
    </span>
  );
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const [pages, setPages] = useState<MessengerPageOption[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const handledMobileReturnRef = useRef(false);

  const selectedIdSet = useMemo(
    () => new Set(selectedPageIds),
    [selectedPageIds],
  );
  const allPagesSelected =
    pages.length > 0 && selectedPageIds.length === pages.length;

  const resetSelection = useCallback(() => {
    setPages([]);
    setSelectionId(null);
    setSelectedPageIds([]);
  }, []);

  const handleBrowserCallback = useCallback(async (
    payload: OAuthBrowserCallbackPayload,
  ) => {
    if (!payload.code || !payload.state) {
      throw new Error('Facebook did not return a valid authorization code.');
    }

    setPagesLoading(true);
    onError('');

    try {
      const response = await ChannelApi.getMessengerPages(
        payload.code,
        payload.state,
      );
      setPages(response.pages);
      setSelectionId(response.selectionId);
      setSelectedPageIds([]);
      toast.success(
        `Found ${response.pages.length} Facebook Page${response.pages.length === 1 ? '' : 's'}`,
      );
    } catch (error) {
      resetSelection();
      const message = getErrorMessage(
        error,
        'Failed to load Facebook Pages.',
      );
      toast.error(message);
      onError(message);
    } finally {
      setPagesLoading(false);
    }
  }, [onError, resetSelection]);

  const clearOAuthReturnParams = useCallback(() => {
    const params = new URLSearchParams(location.search);
    [
      'oauthProvider',
      'oauthStatus',
      'code',
      'state',
      'error',
    ].forEach((key) => params.delete(key));

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (handledMobileReturnRef.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    if (params.get('oauthProvider') !== 'messenger') {
      return;
    }

    handledMobileReturnRef.current = true;
    const status = params.get('oauthStatus');
    const code = params.get('code');
    const state = params.get('state');

    if (status === 'success' && code && state) {
      void handleBrowserCallback({
        type: 'OAUTH_CALLBACK',
        providerKey: 'messenger',
        status: 'success',
        code,
        state,
      }).finally(clearOAuthReturnParams);
      return;
    }

    const message =
      params.get('error') ?? 'Facebook Messenger authorization failed.';
    toast.error(message);
    onError(message);
    clearOAuthReturnParams();
  }, [clearOAuthReturnParams, handleBrowserCallback, location.search, onError]);

  const { loading, startAuth } = useChannelOAuth({
    provider: 'messenger',
    workspaceId,
    onSuccess,
    onError,
    onBrowserCallback: handleBrowserCallback,
  });

  const togglePage = (pageId: string, checked: boolean) => {
    setSelectedPageIds((current) => {
      if (!checked) {
        return current.filter((id) => id !== pageId);
      }

      return current.includes(pageId) ? current : [...current, pageId];
    });
  };

  const toggleAllPages = (checked: boolean) => {
    setSelectedPageIds(checked ? pages.map((page) => page.id) : []);
  };

  const connectSelectedPages = async () => {
    if (!selectionId || !selectedPageIds.length) {
      return;
    }

    setConnecting(true);
    onError('');

    try {
      const result = await ChannelApi.connectSelectedPages({
        selectionId,
        selectedPageIds,
      });
      const connectedChannels = result.channels;
      if (!connectedChannels.length) {
        throw new Error('No Facebook Pages were connected.');
      }

      toast.success(
        `Connected ${connectedChannels.length} Facebook Page${connectedChannels.length === 1 ? '' : 's'}`,
      );
      onSuccess(connectedChannels[0] as unknown as Channel);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Failed to connect selected Facebook Pages.',
      );
      toast.error(message);
      onError(message);
    } finally {
      setConnecting(false);
    }
  };

  if (pages.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">
            Choose Facebook Pages
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {selectedPageIds.length}/{pages.length} selected
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto p-4">
          <CheckboxInput
            checked={allPagesSelected}
            onChange={toggleAllPages}
            label="Select all Pages"
            size="sm"
            className="mb-3 w-full rounded-lg border border-gray-100 bg-gray-50 p-3"
          />

          <div className="space-y-2">
            {pages.map((page) => (
              <CheckboxInput
                key={page.id}
                checked={selectedIdSet.has(page.id)}
                onChange={(checked) => togglePage(page.id, checked)}
                label={<MessengerPageLabel page={page} />}
                description={page.category ?? 'Facebook Page'}
                size="sm"
                className="w-full rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={13} />}
            onClick={resetSelection}
            disabled={connecting}
          >
            Start over
          </Button>
          <Button
            onClick={() => void connectSelectedPages()}
            disabled={!selectedPageIds.length || connecting}
            loading={connecting}
            loadingMode="inline"
            loadingLabel="Connecting..."
            size="sm"
          >
            Connect selected Pages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ChannelConnectActionButton
      onClick={() => {
        void startAuth();
      }}
      disabled={disabled || loading || pagesLoading}
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
      loading={loading || pagesLoading}
      loadingMode="inline"
      loadingLabel={pagesLoading ? "Loading Pages..." : "Waiting for Facebook..."}
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
