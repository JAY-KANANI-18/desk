import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { channelApi } from './channelApi';
import { DUMMY_MODE } from '../api';
import type { Channel } from '../types';
import type { FBAuthResponse } from './types';

declare const FB: any;

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

const FBIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const PERMISSIONS = [
  'instagram_basic',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_messaging',
];

export const InstagramChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFBLogin = () => {
    setConnecting(true);
    setError(null);

    const doConnect = async (auth: FBAuthResponse) => {
      try {
        const channel = await channelApi.connectInstagram(auth);
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
      { scope: PERMISSIONS.join(',') },
    );
  };

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">📸</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Instagram</h3>
            <p className="text-xs text-gray-500">{connected.identifier}</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">● Connected</span>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-pink-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-pink-800">Instagram is active</p>
            <p className="text-xs text-pink-600 mt-0.5">
              {connected.msgs.toLocaleString()} messages received · Connected via Meta
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
            <p className="text-xs text-red-600 mt-0.5">This will stop receiving Instagram DMs.</p>
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
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-pink-800 mb-1">Instagram</p>
        <p className="text-xs text-pink-700 leading-relaxed">
          Connect your Instagram Business account to manage DMs and story replies from your inbox. Requires an Instagram Business or Creator account linked to a Facebook Page.
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
        onClick={handleFBLogin}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#1877F2] text-white rounded-xl font-semibold text-sm hover:bg-[#166FE5] transition-colors disabled:opacity-60 shadow-sm"
      >
        {connecting
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
          : <><FBIcon />Continue with Facebook</>}
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        Instagram uses Facebook Login. Your Instagram account must be linked to a Facebook Page.
      </p>
    </div>
  );
};
