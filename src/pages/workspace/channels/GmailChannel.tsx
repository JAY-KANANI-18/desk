import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { Tag } from '../../../components/ui/tag/Tag';
import { DUMMY_MODE } from '../api';
import type { Channel } from '../types';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const PERMISSIONS = ['gmail.readonly', 'gmail.send', 'gmail.modify'];

export const GmailChannel = ({
  connected,
  onConnect,
  onDisconnect,
}: Props) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  let channelApi: any;

  const handleGoogleLogin = async () => {
    setConnecting(true);
    setError(null);
    try {
      if (DUMMY_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const channel = await channelApi.connectGmail();
        onConnect(channel);
        return;
      }
      window.location.href = '/api/channels/gmail/oauth';
    } catch {
      setError('Failed to connect Gmail. Please try again.');
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">
            Mail
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Gmail</h3>
            <p className="text-xs text-gray-500">{connected.identifier}</p>
          </div>
          <div className="ml-auto">
            <Tag label="Connected" size="sm" bgColor="success" />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <CheckCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Gmail is active</p>
            <p className="mt-0.5 text-xs text-red-600">
              {connected.msgs.toLocaleString()} emails received / Connected via
              Google
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Active permissions
          </p>
          <div className="space-y-1.5">
            {PERMISSIONS.map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <CheckCircle size={12} className="shrink-0 text-green-500" />
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
                  {permission}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
          <div>
            <p className="text-sm font-medium text-red-800">Disconnect channel</p>
            <p className="mt-0.5 text-xs text-red-600">
              This will stop receiving Gmail messages.
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
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="mb-1 text-sm font-semibold text-red-800">Gmail</p>
        <p className="text-xs leading-relaxed text-red-700">
          Connect your Gmail or Google Workspace account to manage emails
          directly from your inbox. We only request the minimum permissions
          needed to read and send emails.
        </p>
      </div>

   
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      ) : null}

      <Button
        onClick={() => void handleGoogleLogin()}
        disabled={connecting}
        variant="secondary"
        fullWidth
        leftIcon={!connecting ? <GoogleIcon /> : undefined}
        loading={connecting}
        loadingMode="inline"
        loadingLabel="Connecting..."
        style={{ borderWidth: '2px' }}
      >
        Continue with Google
      </Button>

      <p className="text-center text-[11px] text-gray-400">
        You&apos;ll be redirected to Google to authorize access to your Gmail
        account.
      </p>
    </div>
  );
};
