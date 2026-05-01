import { useState } from 'react';
import { Check, Code2, Copy, ExternalLink, MessageSquare, Palette } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { BaseInput } from '../../../components/ui/inputs/BaseInput';
import { ColorInput } from '../../../components/ui/inputs/ColorInput';
import { TextareaInput } from '../../../components/ui/inputs/TextareaInput';
import { ChannelApi } from '../../../lib/channelApi';
import { ConnectedChannel, DangerZone, SaveButton, useSave } from '../../channels/ManageChannelPage';
import {
  buildWebsiteChatEmbedCode,
  getWebsiteChatAppearance,
} from './websiteChatEmbed';

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
  const appearance = getWebsiteChatAppearance(channel);

  const [welcomeMessage, setWelcomeMessage] = useState(
    appearance.welcomeMessage ?? 'Hi there! How can we help you today?',
  );
  const [awayMessage, setAwayMessage] = useState(
    channel.config?.awayMessage ?? "We're away right now but will reply soon.",
  );
  const [primaryColor, setPrimaryColor] = useState(
    appearance.primaryColor ?? '#2563eb',
  );
  const [agentName, setAgentName] = useState(
    appearance.agentName ?? appearance.operatorName ?? '',
  );
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(
    channel.config?.position ?? 'bottom-right',
  );

  const scriptTag = buildWebsiteChatEmbedCode(channel, {
    agentName: agentName || 'Support',
    primaryColor,
    welcomeMessage,
  });
  const { copied, copy } = useCopy(scriptTag);

  const openTestWindow = () => {
    const testPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Website Chat Test</title>
   
  </head>
  <body>
    <main>
      <section>
        <h1>Website Chat Test Page</h1>
        <p>Use the launcher in the corner to verify the widget script, styling, and channel connection.</p>
      </section>
    </main>
    ${scriptTag}
  </body>
</html>`;
    const testUrl = URL.createObjectURL(
      new Blob([testPage], { type: 'text/html' }),
    );

    const popupWidth = 440;
    const popupHeight = 720;
    const left = Math.max(
      0,
      window.screenX + (window.outerWidth - popupWidth) / 2,
    );
    const top = Math.max(
      0,
      window.screenY + (window.outerHeight - popupHeight) / 2,
    );

    window.open(
      testUrl,
      'website-chat-test',
      [
        'popup=yes',
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${Math.round(left)}`,
        `top=${Math.round(top)}`,
        'resizable=yes',
        'scrollbars=yes',
      ].join(','),
    );
    window.setTimeout(() => URL.revokeObjectURL(testUrl), 30000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Code2 size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800">
            Embed Script
          </span>
        </div>
        <div>
          <p className="mb-3 text-sm text-slate-500">
            Add this script to the{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">&lt;head&gt;</code>{' '}
            of every page where you want the chat widget to appear.
          </p>
          <div className="flex flex-col gap-3 border-y border-slate-100 py-3 sm:flex-row sm:items-start">
            <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-slate-600">
              {scriptTag}
            </code>
            <div className="flex shrink-0 gap-2">
              <Button
                onClick={openTestWindow}
                size="sm"
                variant="secondary"
                leftIcon={<ExternalLink size={12} />}
              >
                Test
              </Button>
              <Button
                onClick={copy}
                size="sm"
                variant={copied ? 'success' : 'secondary'}
                leftIcon={copied ? <Check size={12} /> : <Copy size={12} />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
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
                  size="sm"
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
            label="Agent Display Name"
            value={agentName}
            onChange={(event) => setAgentName(event.target.value)}
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
              agentName,
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
