import { AlertTriangle } from "lucide-react";
import { ChannelApi } from "../../../lib/channelApi";
import { ConnectedChannel, EditableField, ReadonlyField, SaveButton, useSave } from "../../channels/ManageChannelPage";
import { useState } from "react";

export const GmailConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {

  const { saving, saved, error, save } = useSave();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // load from API config
  const [emailAddress, setEmailAddress] = useState(channel?.config?.emailAddress || '');
  const [clientId, setClientId] = useState(channel?.config?.clientId || '');
  const [clientSecret, setClientSecret] = useState(channel?.config?.clientSecret || '');
  const [accessToken, setAccessToken] = useState(channel?.config?.accessToken || '');
  const [refreshToken, setRefreshToken] = useState(channel?.config?.refreshToken || '');
  const [tokenExpiry, setTokenExpiry] = useState(channel?.config?.tokenExpiry || '');

  const handleSave = () =>
    save(() =>
      ChannelApi.updateGmailChannel(String(channel?.id), {
        emailAddress,
        clientId,
        clientSecret,
        accessToken,
        refreshToken,
        tokenExpiry,
      })
    );

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Configure Gmail
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          OAuth2 credentials for Gmail send/receive.
        </p>
      </div>

      <div className="space-y-5">

        <EditableField
          label="Email Address"
          value={emailAddress}
          onChange={setEmailAddress}
          placeholder="support@gmail.com"
        />

        <EditableField
          label="OAuth Client ID"
          value={clientId}
          onChange={setClientId}
          placeholder="123456789-xxxx.apps.googleusercontent.com"
          hint="From Google Cloud Console → Credentials"
        />

        <EditableField
          label="Client Secret"
          value={clientSecret}
          onChange={setClientSecret}
          placeholder="GOCSPX-XXXXXXXXXXXX"
        />

        <EditableField
          label="Access Token"
          value={accessToken}
          onChange={setAccessToken}
          placeholder="ya29.xxxxx"
        />

        <EditableField
          label="Refresh Token"
          value={refreshToken}
          onChange={setRefreshToken}
          placeholder="1//0gxxxxxxxx"
          hint="Used to refresh expired access tokens automatically"
        />

        <EditableField
          label="Token Expiry"
          value={tokenExpiry}
          onChange={setTokenExpiry}
          placeholder="2025-12-31T00:00:00Z"
        />

        <ReadonlyField
          label="Redirect URI"
          value="https://app.yourplatform.com/oauth/gmail/callback"
          hint="Add this URI in Google Cloud Console → OAuth credentials"
        />

      </div>

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={handleSave}
      />

      {/* Danger Zone */}

      <div className="border border-red-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              Danger Zone
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Disconnect this Gmail channel.
            </p>
          </div>

          {!confirmDisconnect ? (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="flex-shrink-0 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex items-center gap-2">

              <button
                onClick={() => setConfirmDisconnect(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>

              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
              >
                Confirm
              </button>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};