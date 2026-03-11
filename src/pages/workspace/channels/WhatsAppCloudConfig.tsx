import { AlertTriangle, ChevronDown, QrCode, Copy, Check, Phone, Building2, Hash, Key, Clock, MessageSquare, Webhook, EyeOff, Eye } from "lucide-react";
import { ChannelApi } from "../../../lib/channelApi";
import { ConnectedChannel, SaveButton, useSave } from "../../channels/ManageChannelPage";
import { useEffect, useState, useCallback } from "react";

// ── tiny copy-to-clipboard hook ────────────────────────────────────────────
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return { copied, copy };
}

// ── Info pill shown inside the header card ─────────────────────────────────
function InfoPill({
  icon: Icon,
  label,
  value,
  copyable = false,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  const { copied, copy } = useCopy(value);
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <Icon size={10} />
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm text-slate-700 truncate max-w-[180px] ${
            mono ? "font-mono" : "font-medium"
          }`}
          title={value}
        >
          {value || "—"}
        </span>
        {copyable && value && (
          <button
            onClick={copy}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  sensitive = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  sensitive?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>

      <div className="relative">
        <input
          type={sensitive && !show ? "password" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
        />

        {sensitive && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Readonly URL field with copy ───────────────────────────────────────────
function UrlField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { copied, copy } = useCopy(value);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
        <span className="flex-1 text-sm text-slate-500 font-mono truncate">{value}</span>
        <button
          onClick={copy}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export const WhatsAppConfiguration = ({
  channel,
  onDisconnect,
}: {
  channel: ConnectedChannel;
  onDisconnect: () => void;
}) => {
  const { saving, saved, error, save } = useSave();
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Frequently-changed fields
  const [accessToken,     setAccessToken]     = useState(channel?.config?.accessToken || "");
  const [phoneNumberId,   setPhoneNumberId]   = useState(channel?.identifier?.replace(/\D/g, "") || "");
  const [wabaId,          setWabaId]          = useState(channel?.config?.wabaId || "");
  const [graphApiVersion, setGraphApiVersion] = useState(channel?.config?.graphApiVersion || "");
  const [tokenExpiry,     setTokenExpiry]     = useState(channel?.config?.tokenExpiry || "");
  const [convWindow,      setConvWindow]      = useState(channel?.config?.conversationwindow || "");

  // Derived / rarely changed
  const callbackUrl   = "https://app.yourplatform.com/webhooks/whatsapp/cloud";
  const verifyToken   = "rb_webhook_token_" + channel?.id;
  const chatLink      = `https://wa.me/${channel?.config?.phoneNumber}`;

  const handleSave = () =>
    save(() =>
      ChannelApi.updateWhatsAppChannel(String(channel?.id), {
        accessToken,
        phoneNumberId,
        wabaId,
        graphApiVersion,
        tokenExpiry,
        conversationwindow: convWindow,
        // pass-through unchanged fields
        waba_account_name:  channel?.config?.wabaAccountName,
        verifiedName:       channel?.name,
        veriytoken:         verifyToken,
        metaappname:        channel?.config?.metaappname,
        systemUserName:     channel?.config?.systemUserName,
      })
    );

  return (
    <div className="space-y-6 ">

      {/* ── Header info card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            {/* WhatsApp-green dot */}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-200" />
            <span className="text-sm font-semibold text-slate-800">
              Configuration 
              {/* {channel?.name || "WhatsApp Channel"} */}
            </span>
           
          </div>
          {/* Chat link quick-access */}
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <QrCode size={13} /> Open chat link
          </a>
        </div>

        {/* Info pills grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 px-5 py-4">
          <InfoPill icon={Phone}      label="Phone Number"   value={channel?.config?.phoneNumber} copyable mono />
          <InfoPill icon={Hash}       label="Phone Number ID" value={phoneNumberId}               copyable mono />
          <InfoPill icon={Building2}  label="WABA ID"         value={wabaId}                      copyable mono />
          <InfoPill icon={Building2}  label="WABA Account"    value={channel?.config?.wabaAccountName} />
          <InfoPill icon={Key}        label="Meta App"        value={channel?.config?.metaappname} />
          <InfoPill icon={Key}        label="System User"     value={channel?.config?.systemUserName} />
          <InfoPill icon={Key}        label="System User"     value={channel?.config?.systemUserName} />
        </div>

        {/* Webhook info strip */}
        <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Webhook size={10} /> Callback URL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{callbackUrl}</span>
              <CopyIconButton text={callbackUrl} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1">
              <Key size={10} /> Verify Token
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 truncate">{verifyToken}</span>
              <CopyIconButton text={verifyToken} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Frequently-changed fields ─────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Connection Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Update credentials and configuration as needed.</p>

        <div className="space-y-4">
          <Field
            label="Access Token"
            value={accessToken}
            onChange={setAccessToken}
            placeholder="EAABsbCS0r0AB…"
            hint="Permanent system-user token from Meta Business Manager"
            sensitive
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Phone Number ID"
              value={phoneNumberId}
              onChange={setPhoneNumberId}
              placeholder="15551790691"
              hint="Digits only"
              mono
            />
            <Field
              label="WABA ID"
              value={wabaId}
              onChange={setWabaId}
              placeholder="987654321098765"
              hint="From Meta Business Manager"
              mono
            />
          </div>
     
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} error={error} onClick={handleSave} />

      {/* ── Danger Zone ───────────────────────────────────────────── */}
      <div className="border border-red-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDangerZone((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">Danger Zone</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-red-400 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
          />
        </button>
        {showDangerZone && (
          <div className="px-5 py-4 bg-white border-t border-red-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Disconnect this channel</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently disconnects this WhatsApp number. Message history is preserved.
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50"
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
        )}
      </div>
    </div>
  );
};

// tiny inline copy icon button
function CopyIconButton({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button onClick={copy} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}