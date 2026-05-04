import { useState, type ElementType } from 'react';
import { Building2, Check, Copy, Hash, Key, Phone, Webhook } from '@/components/ui/icons';
import { IconButton } from '../../../components/ui/button/IconButton';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { TruncatedText } from '../../../components/ui/truncated-text';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return { copied, copy };
}

function CopyIconButton({ text, label }: { text: string; label: string }) {
  const { copied, copy } = useCopy(text);

  return (
    <IconButton
      icon={
        copied ? (
          <Check size={12} style={{ color: 'var(--color-success)' }} />
        ) : (
          <Copy size={12} />
        )
      }
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      variant="ghost"
      size="sm"
      onClick={copy}
      style={{ color: 'var(--color-gray-400)' }}
    />
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  copyable = false,
  mono = false,
}: {
  icon: ElementType;
  label: string;
  value?: string | null;
  copyable?: boolean;
  mono?: boolean;
}) {
  const resolvedValue = value?.trim() ? value : '-';

  return (
    <div className="min-w-0 flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <Icon size={10} />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <TruncatedText
          text={resolvedValue}
          maxLines={1}
          className={`max-w-full text-sm text-slate-700 sm:max-w-[180px] ${mono ? 'font-mono' : 'font-medium'}`}
        />
        {copyable && resolvedValue !== '-' ? (
          <CopyIconButton text={resolvedValue} label={label} />
        ) : null}
      </div>
    </div>
  );
}

export const WhatsAppConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();

  const [accessToken] = useState(
    channel?.config?.accessToken ?? channel?.credentials?.accessToken ?? '',
  );
  const [phoneNumberId] = useState(
    channel?.config?.phoneNumberId ?? channel?.credentials?.phoneNumberId ?? '',
  );
  const [wabaId] = useState(
    channel?.config?.wabaId ?? channel?.credentials?.wabaId ?? '',
  );
  const [graphApiVersion] = useState(channel?.config?.graphApiVersion ?? 'v19.0');
  const [tokenExpiry] = useState(channel?.config?.tokenExpiry ?? '');
  const [convWindow] = useState(channel?.config?.conversationwindow ?? '24');
  const [name, setName] = useState(channel?.name ?? '');

  const callbackUrl = `${window.location.origin}/webhooks/whatsapp`;
  const verifyToken = `rb_webhook_token_${channel?.id}`;

  const handleSave = () =>
    save(() =>
      ChannelApi.updateWhatsAppChannel(String(channel.id), {
        accessToken,
        phoneNumberId,
        wabaId,
        graphApiVersion,
        tokenExpiry,
        conversationwindow: convWindow,
        waba_account_name: channel?.config?.wabaAccountName,
        verifiedName: channel?.name,
        veriytoken: verifyToken,
        metaappname: channel?.config?.metaappname,
        systemUserName: channel?.config?.systemUserName,
        name,
      }),
    );

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="space-y-[var(--spacing-md)]">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-[var(--spacing-md)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-slate-800">Configuration</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-[var(--spacing-lg)] gap-y-[var(--spacing-md)] sm:grid-cols-2 xl:grid-cols-3">
          <InfoPill
            icon={Phone}
            label="Phone Number"
            value={channel?.config?.phoneNumber ?? channel?.identifier}
            copyable
            mono
          />
          <InfoPill
            icon={Hash}
            label="Phone Number ID"
            value={channel?.config?.phoneNumberId}
            copyable
            mono
          />
          <InfoPill
            icon={Building2}
            label="Verified Name"
            value={channel?.config?.verifiedName}
            copyable
            mono
          />
          <InfoPill icon={Building2} label="WABA ID" value={wabaId} copyable mono />
          <InfoPill icon={Building2} label="WABA Name" value={channel?.config?.wabaName} />
        </div>
       
      </div>

      <div>
       
        <div className="space-y-4">
          <BaseInput
            label="Channel Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="channel name"
            hint="Name of your channel"
          />
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />
      <DangerZone
        channelLabel="WhatsApp"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
