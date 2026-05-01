import { useState } from 'react';
import { ChannelApi } from '../../../lib/channelApi';
import { BaseInput, type BaseInputProps } from '../../../components/ui/inputs/BaseInput';
import { PasswordInput } from '../../../components/ui/inputs/PasswordInput';
import { ConnectedChannel, SaveButton, useSave, DangerZone } from '../../channels/ManageChannelPage';

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  sensitive = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  sensitive?: boolean;
  type?: BaseInputProps['type'];
}) {
  if (sensitive) {
    return (
      <PasswordInput
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        hint={hint}
      />
    );
  }

  return (
    <BaseInput
      type={type}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      hint={hint}
    />
  );
}

export const InstagramConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const [accessToken, setAccessToken] = useState(
    channel?.config?.accessToken ?? channel?.credentials?.accessToken ?? '',
  );
  const [igUserId, setIgUserId] = useState(
    channel?.config?.igUserId ?? channel?.identifier ?? '',
  );
  const [name, setName] = useState(channel?.name ?? '');

  const handleSave = () =>
    save(() =>
      ChannelApi.updateInstagramChannel(String(channel.id), {
        accessToken,
        igUserId,
        name,
      }),
    );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="h-2 w-2 rounded-full bg-pink-400" />
          <span className="text-sm font-semibold text-slate-800">
            Configuration
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              User ID
            </span>
            <span className="text-sm font-mono text-slate-700">
              {igUserId || '-'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Handle
            </span>
            <span className="text-sm font-medium text-slate-700">
              @{channel?.config?.userName ?? '-'}
            </span>
          </div>
        </div>
      </div>

      <div>
      
        <div className="space-y-4">
          <Field
            label="Channel Name"
            value={name}
            onChange={setName}
            placeholder="channel name"
            hint="Name of your channel"
          />
        </div>
      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={handleSave}
      />
      <DangerZone
        channelLabel="Instagram"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};

