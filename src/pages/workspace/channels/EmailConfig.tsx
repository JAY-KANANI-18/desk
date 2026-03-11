import { AlertTriangle } from "lucide-react";
import { ChannelApi } from "../../../lib/channelApi";
import { ConnectedChannel, EditableField, SaveButton, useSave } from "../../channels/ManageChannelPage";
import { useState } from "react";

export const EmailConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {

  const { saving, saved, error, save } = useSave();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [tab, setTab] = useState<'smtp' | 'imap'>('smtp');

  // load values from API config
  const [smtpHost, setSmtpHost] = useState(channel?.config?.smtpserver || '');
  const [smtpPort, setSmtpPort] = useState(String(channel?.config?.smtpport || 587));
  const [smtpUsername, setSmtpUsername] = useState(channel?.config?.userId || '');
  const [smtpPassword, setSmtpPassword] = useState(channel?.config?.password || '');
  const [smtpEncryption, setSmtpEncryption] = useState(channel?.config?.encryption || 'STARTTLS');

  const [fromName, setFromName] = useState(channel?.config?.displayname || '');
  const [fromEmail, setFromEmail] = useState(channel?.config?.emailaddress || '');

  const [imapHost, setImapHost] = useState(channel?.config?.imapserver || '');
  const [imapPort, setImapPort] = useState(String(channel?.config?.imapport || 993));
  const [imapUsername, setImapUsername] = useState(channel?.config?.userId || '');
  const [imapPassword, setImapPassword] = useState(channel?.config?.password || '');
  const [imapEncryption, setImapEncryption] = useState(channel?.config?.encryption || 'SSL/TLS');
  const [imapFolder, setImapFolder] = useState(channel?.config?.imapFolder || 'INBOX');

  const handleSave = () =>
    save(() =>
      ChannelApi.updateEmailChannel(String(channel?.id), {

        smtpserver: smtpHost,
        smtpport: Number(smtpPort),
        userId: smtpUsername,
        password: smtpPassword,
        encryption: smtpEncryption,

        displayname: fromName,
        emailaddress: fromEmail,

        imapserver: imapHost,
        imapport: Number(imapPort),
        imapUsername,
        imapPassword,
        imapEncryption,
        imapFolder,
      })
    );

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Configure Email
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          SMTP (send) and IMAP (receive) settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['smtp', 'imap'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              tab === t
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'smtp' ? (

        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <EditableField label="SMTP Host" value={smtpHost} onChange={setSmtpHost} />
            <EditableField label="Port" value={smtpPort} onChange={setSmtpPort} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Encryption" value={smtpEncryption} onChange={setSmtpEncryption} />
            <EditableField label="From Name" value={fromName} onChange={setFromName} />
          </div>

          <EditableField label="From Email" value={fromEmail} onChange={setFromEmail} />

          <EditableField label="Username" value={smtpUsername} onChange={setSmtpUsername} />

          <EditableField label="Password" value={smtpPassword} onChange={setSmtpPassword} />

        </div>

      ) : (

        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <EditableField label="IMAP Host" value={imapHost} onChange={setImapHost} />
            <EditableField label="Port" value={imapPort} onChange={setImapPort} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EditableField label="Encryption" value={imapEncryption} onChange={setImapEncryption} />
            <EditableField label="Folder" value={imapFolder} onChange={setImapFolder} />
          </div>

          <EditableField label="Username" value={imapUsername} onChange={setImapUsername} />

          <EditableField label="Password" value={imapPassword} onChange={setImapPassword} />

        </div>

      )}

      <SaveButton
        saving={saving}
        saved={saved}
        error={error}
        onClick={handleSave}
      />

      {/* Danger zone */}
      <div className="border border-red-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              Danger Zone
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Disconnect this email channel.
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