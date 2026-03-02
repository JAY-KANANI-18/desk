import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { channelApi } from './channelApi';
import type { Channel } from '../types';
import type { EmailConfig } from './types';

interface Props {
  connected: Channel | null;
  onConnect: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
}

const EMPTY_FORM: EmailConfig = {
  email: '',
  smtpHost: '',
  smtpPort: '587',
  imapHost: '',
  imapPort: '993',
  username: '',
  password: '',
};

export const EmailChannel = ({ connected, onConnect, onDisconnect }: Props) => {
  const [form, setForm] = useState<EmailConfig>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof EmailConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleConnect = async () => {
    if (!form.email || !form.smtpHost || !form.imapHost || !form.username || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const channel = await channelApi.connectEmail(form);
      onConnect(channel);
    } catch {
      setError('Failed to connect. Please check your credentials and try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">✉️</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Email (SMTP/IMAP)</h3>
            <p className="text-xs text-gray-500">{connected.identifier}</p>
          </div>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">● Connected</span>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">Email is active</p>
            <p className="text-xs text-indigo-600 mt-0.5">{connected.msgs.toLocaleString()} emails received</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Disconnect channel</p>
            <p className="text-xs text-red-600 mt-0.5">This will stop receiving emails from this account.</p>
          </div>
          <button
            onClick={() => onDisconnect(connected.id)}
            className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-indigo-800 mb-1">Email (SMTP / IMAP)</p>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Connect any email provider using SMTP for sending and IMAP for receiving. Works with any email service that supports these protocols.
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
        <input type="email" value={form.email} onChange={set('email')} placeholder="support@company.com" className={inputCls} />
      </div>

      {/* SMTP */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">SMTP Host</label>
          <input type="text" value={form.smtpHost} onChange={set('smtpHost')} placeholder="smtp.company.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">SMTP Port</label>
          <input type="text" value={form.smtpPort} onChange={set('smtpPort')} placeholder="587" className={inputCls} />
        </div>
      </div>

      {/* IMAP */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Host</label>
          <input type="text" value={form.imapHost} onChange={set('imapHost')} placeholder="imap.company.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Port</label>
          <input type="text" value={form.imapPort} onChange={set('imapPort')} placeholder="993" className={inputCls} />
        </div>
      </div>

      {/* Credentials */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
        <input type="text" value={form.username} onChange={set('username')} placeholder="support@company.com" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            className={`${inputCls} pr-9`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="flex-shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {connecting
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
          : <>✉️ Connect Email</>}
      </button>
    </div>
  );
};
