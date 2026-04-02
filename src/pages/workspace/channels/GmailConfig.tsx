// src/pages/workspace/channels/GmailConfig.tsx
import { useState } from 'react';
import { Mail, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, SaveButton, useSave, DangerZone } from '../../channels/ManageChannelPage';

export const GmailConfiguration = ({
  channel, onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const [email, setEmail] = useState(channel?.config?.email ?? channel?.identifier ?? '');

  const connected = channel?.status === 'Connected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-white">
          <span className={`w-2.5 h-2.5 rounded-full shadow ${connected ? 'bg-green-400 shadow-green-200' : 'bg-gray-300'}`} />
          <span className="text-sm font-semibold text-slate-800">Gmail Configuration</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Mail size={13} className="text-red-500" />
            <span>{email || '—'}</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Connected Account</span>
            <span className="text-sm font-medium text-slate-700">{email || 'Not connected'}</span>
          </div>
        </div>
      </div>

      {/* OAuth info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-indigo-600 flex-shrink-0" />
          <p className="text-sm font-medium text-indigo-900">Connected via Google OAuth</p>
        </div>
        <p className="text-xs text-indigo-700 pl-6">
          Gmail channels use OAuth 2.0. To reconnect or change the account, click the button below to re-authenticate with Google.
        </p>
        <div className="pl-6 pt-1">
          <a
            href={`/auth/gmail/connect?channelId=${channel.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            <RefreshCw size={14} />
            Reconnect Gmail account
          </a>
        </div>
      </div>

      {/* Display label */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Display Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Control how this channel appears to contacts.</p>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Channel Label</label>
          <input value={channel.name} readOnly
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
          <p className="text-xs text-slate-400">Change the label in the Channels list page.</p>
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error}
        onClick={() => save(() => ChannelApi.updateGmailChannel(String(channel.id), { email }))}
        label="Save Settings" />
      <DangerZone channelLabel="Gmail" onDisconnect={onDisconnect} />
    </div>
  );
};