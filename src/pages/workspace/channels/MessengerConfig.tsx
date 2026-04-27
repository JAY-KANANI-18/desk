import { useState } from "react";
import { Check, Copy, Key, Webhook } from "lucide-react";
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
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-white px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow shadow-blue-200" />
          <span className="text-sm font-semibold text-slate-800">
            Configuration
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
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
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <Webhook size={10} />
              Callback URL
            </span>
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-xs text-slate-500">
                {callbackUrl}
              </span>
              <IconButton
                aria-label="Copy callback URL"
                icon={
                  callbackCopied ? (
                    <Check size={11} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )
                }
                onClick={copyCallbackUrl}
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
                style={{
                  minHeight: "24px",
                  minWidth: "24px",
                  width: "24px",
                  color: "var(--color-gray-400)",
                }}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <Key size={10} />
              Verify Token
            </span>
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-xs text-slate-500">
                {verifyToken}
              </span>
              <IconButton
                aria-label="Copy verify token"
                icon={
                  tokenCopied ? (
                    <Check size={11} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )
                }
                onClick={copyVerifyToken}
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
                style={{
                  minHeight: "24px",
                  minWidth: "24px",
                  width: "24px",
                  color: "var(--color-gray-400)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-slate-800">
          Connection Settings
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Update your Facebook Page credentials.
        </p>
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
