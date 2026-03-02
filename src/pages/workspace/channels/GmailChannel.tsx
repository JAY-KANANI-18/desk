import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { channelApi } from './channelApi';
import { DUMMY_MODE } from '../api';
import type { Channel } from '../types';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const PERMISSIONS = ['gmail.readonly', 'gmail.send', 'gmail.modify'];

export const GmailChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setConnecting(true);
    setError(null);
    try {
      if (DUMMY_MODE) {
        await new Promise(r => setTimeout(r, 1200));
        const channel = await channelApi.connectGmail();
        onConnect(channel);
        return;
      }
      // Real: redirect to Google OAuth endpoint
      window.location.href = '/api/channels/gmail/oauth';
    } catch {
      setError('Failed to connect Gmail. Please try again.');
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">📧</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Gmail</h3>
            <p className="text-xs text-gray-500">{connected.identifier}</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">● Connected</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Gmail is active</p>
            <p className="text-xs text-red-600 mt-0.5">
              {connected.msgs.toLocaleString()} emails received · Connected via Google
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Active permissions</p>
          <div className="space-y-1.5">
            {PERMISSIONS.map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{p}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Disconnect channel</p>
            <p className="text-xs text-red-600 mt-0.5">This will stop receiving Gmail messages.</p>
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

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-800 mb-1">Gmail</p>
        <p className="text-xs text-red-700 leading-relaxed">
          Connect your Gmail or Google Workspace account to manage emails directly from your inbox. We only request the minimum permissions needed to read and send emails.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Required permissions</p>
        <div className="space-y-1.5">
          {PERMISSIONS.map(p => (
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
        onClick={handleGoogleLogin}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2.5 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-60 shadow-sm"
      >
        {connecting
          ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Connecting…</>
          : <><GoogleIcon />Continue with Google</>}
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        You'll be redirected to Google to authorize access to your Gmail account.
      </p>
    </div>
  );
};
