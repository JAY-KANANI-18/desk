import { useState } from "react";
import { Check, Copy, Key, Webhook } from "@/components/ui/icons";
import { ChannelApi } from "../../../lib/channelApi";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput, type BaseInputProps } from "../../../components/ui/inputs/BaseInput";
import { PasswordInput } from "../../../components/ui/inputs/PasswordInput";
import {
  ConnectedChannel,
  DangerZone,
  SaveButton,
  useSave,
} from "../../channels/ManageChannelPage";

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return { copied, copy };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  sensitive = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  sensitive?: boolean;
  type?: BaseInputProps["type"];
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

export const MessengerConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const [accessToken, setAccessToken] = useState(
    channel?.config?.accessToken ?? channel?.credentials?.accessToken ?? "",
  );
  const [pageId, setPageId] = useState(
    channel?.config?.pageId ?? channel?.identifier ?? "",
  );
  const [name, setName] = useState(channel?.name ?? "");

  const callbackUrl = `${window.location.origin}/webhooks/messenger`;
  const verifyToken = `rb_ms_webhook_${channel?.id}`;
  const { copied: callbackCopied, copy: copyCallbackUrl } = useCopy(callbackUrl);
  const { copied: tokenCopied, copy: copyVerifyToken } = useCopy(verifyToken);

  void setAccessToken;
  void setPageId;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-slate-800">
            Configuration
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Page ID
            </span>
            <span className="text-sm font-mono text-slate-700">
              {pageId || "-"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Page Name
            </span>
            <span className="text-sm font-medium text-slate-700">
              {channel?.config?.pageName ?? "-"}
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
        onClick={() =>
          save(() =>
            ChannelApi.updateMessengerChannel(String(channel.id), {
              accessToken,
              pageId,
              name,
            }),
          )
        }
      />
      <DangerZone
        channelLabel="Messenger"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
