import { useState } from 'react';
import { Check, Code2, Copy, MessageSquare, Palette } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { ColorInput } from '../../../components/ui/inputs/ColorInput';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
}

export const WebsiteChatConfiguration = ({
  channel,
  onDisconnect,
}: { channel: ConnectedChannel; onDisconnect: () => void }) => {
  const { saving, saved, error, save } = useSave();
  const cfg = channel?.config ?? {};

  const [welcomeMessage, setWelcomeMessage] = useState(
    cfg.welcomeMessage ?? 'Hi there! How can we help you today?',
  );
  const [awayMessage, setAwayMessage] = useState(
    cfg.awayMessage ?? "We're away right now but will reply soon.",
  );
  const [primaryColor, setPrimaryColor] = useState(cfg.primaryColor ?? '#2563eb');
  const [operatorName, setOperatorName] = useState(cfg.operatorName ?? '');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(
    cfg.position ?? 'bottom-right',
  );

  const scriptTag = `<script src="${window.location.origin}/widget.js" data-channel-id="${channel.id}" defer></script>`;
  const { copied, copy } = useCopy(scriptTag);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-white px-5 py-3.5">
          <Code2 size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800">
            Embed Script
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-slate-500">
            Add this script to the{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">&lt;head&gt;</code>{' '}
            of every page where you want the chat widget to appear.
          </p>
          <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 sm:flex-row sm:items-start">
            <code className="flex-1 break-all font-mono text-xs leading-relaxed text-emerald-300">
              {scriptTag}
            </code>
            <Button
              onClick={copy}
              size="sm"
              variant="secondary"
              className={
                copied
                  ? 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-600'
                  : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
              }
              leftIcon={copied ? <Check size={12} /> : <Copy size={12} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Palette size={14} className="text-slate-500" />
          Appearance
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Customize how the widget looks on your website.
        </p>
        <div className="space-y-4">
          <ColorInput
            label="Primary Color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Widget Position
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                <Button
                  key={pos}
                  type="button"
           
                  variant={position === pos ? 'primary' : 'secondary'}
                  onClick={() => setPosition(pos)}
                >
                  {pos.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MessageSquare size={14} className="text-slate-500" />
          Messages
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Set the messages visitors see in the widget.
        </p>
        <div className="space-y-4">
          <BaseInput
            label="Operator Display Name"
            value={operatorName}
            onChange={(event) => setOperatorName(event.target.value)}
            placeholder="Support Team"
            hint="Shown in the chat widget header"
          />

          <TextareaInput
            label="Welcome Message"
            value={welcomeMessage}
            onChange={(event) => setWelcomeMessage(event.target.value)}
            rows={2}
          />

          <TextareaInput
            label="Away Message"
            value={awayMessage}
            onChange={(event) => setAwayMessage(event.target.value)}
            rows={2}
            hint="Shown when no agents are online"
          />
        </div>
      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={() =>
          save(() =>
            ChannelApi.updateWebsiteChatChannel(String(channel.id), {
              welcomeMessage,
              awayMessage,
              primaryColor,
              operatorName,
              position,
            }),
          )
        }
      />
      <DangerZone
        channelLabel="Website Chat"
        channelId={String(channel.id)}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
