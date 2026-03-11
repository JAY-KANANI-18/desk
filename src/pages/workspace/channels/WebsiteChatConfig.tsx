import { AlertTriangle, ChevronDown, QrCode } from "lucide-react";
import { ChannelApi } from "../../../lib/channelApi";
import { ConnectedChannel, EditableField, ReadonlyField, SaveButton, useSave } from "../../channels/ManageChannelPage";
import { useState } from "react";


// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE CHAT CONFIGURATION  →  PUT /channels/website-chat/:channelId
// ─────────────────────────────────────────────────────────────────────────────
export const WebsiteChatConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  const { saving, saved, error, save } = useSave();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const [widgetToken,    setWidgetToken]    = useState('wc_live_xxxxxxxxxxxxxxxxxxxxxxxx');
  const [apiKey,         setApiKey]         = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [webhookSecret,  setWebhookSecret]  = useState('');

  const handleSave = () =>
    save(() =>
      ChannelApi.updateWebsiteChatChannel(String(channel.id), {
        widgetToken, apiKey, allowedDomains, webhookSecret,
      })
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Configure Website Chat</h2>
        <p className="text-sm text-gray-500 mt-0.5">Widget and API settings.</p>
      </div>

      <div className="space-y-5">
        <ReadonlyField label="Widget Token (public)" value={widgetToken} hint="Use in your website embed script" />
        <EditableField label="API Secret Key"   value={apiKey}         onChange={setApiKey}         placeholder="sk_live_xxxxxxxx" hint="Server-side only — never expose in frontend" />
        <EditableField label="Allowed Domains"  value={allowedDomains} onChange={setAllowedDomains} placeholder="yoursite.com, shop.yoursite.com" hint="Comma-separated. Leave blank to allow all." />
        <EditableField label="Webhook Secret"   value={webhookSecret}  onChange={setWebhookSecret}  placeholder="whsec_xxxxxxxx" hint="HMAC secret to verify incoming webhook payloads" />
        <ReadonlyField label="Webhook Endpoint" value="https://app.yourplatform.com/webhooks/website-chat" />
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />

      <div className="border border-red-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" /> Danger Zone
            </p>
            <p className="text-xs text-gray-500 mt-1">Disconnect this website chat channel.</p>
          </div>
          {!confirmDisconnect ? (
            <button onClick={() => setConfirmDisconnect(true)} className="flex-shrink-0 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">Disconnect</button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmDisconnect(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium">Cancel</button>
              <button onClick={onDisconnect} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Confirm</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

