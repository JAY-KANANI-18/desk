import { CheckCircle, Mail, RefreshCw } from '@/components/ui/icons';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';

export const GmailConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const email = channel?.config?.email ?? channel?.identifier ?? '';
  const connected = channel?.status === 'Connected';
  const reconnectUrl = `/auth/gmail/connect?channelId=${channel.id}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`}
          />
          <span className="text-sm font-semibold text-slate-800">
            Gmail Configuration
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:ml-auto">
            <Mail size={13} className="text-red-500" />
            <span className="break-all">{email || '-'}</span>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Connected Account
            </span>
            <span className="text-sm font-medium text-slate-700">
              {email || 'Not connected'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-l border-[var(--color-primary-light)] pl-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0 text-[var(--color-primary)]" />
          <p className="text-sm font-medium text-slate-800">
            Connected via Google OAuth
          </p>
        </div>
        <p className="text-sm text-slate-500 sm:pl-6">
          Gmail channels use OAuth 2.0. To reconnect or change the account, use
          the action below to re-authenticate with Google.
        </p>
        <div className="pt-1 sm:pl-6">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => window.location.assign(reconnectUrl)}
          >
            Reconnect Gmail account
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-slate-800">
          Display Settings
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Control how this channel appears to contacts.
        </p>
        <BaseInput
          label="Channel Label"
          value={channel.name ?? ''}
          readOnly
          hint="Change the label in the Channels list page."
        />
      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={() =>
          save(() => ChannelApi.updateGmailChannel(String(channel.id), { email }))
        }
        label="Save Settings"
      />
      <DangerZone
        channelLabel="Gmail"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
