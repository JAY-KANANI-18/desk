import { DUMMY_MODE, delay } from '../api';
import type { Channel } from '../types';
import type { WhatsAppConfig, EmailConfig, FBAuthResponse } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL API — per-channel connect / disconnect stubs
// Flip DUMMY_MODE in ../api.ts to switch to real endpoints
// ─────────────────────────────────────────────────────────────────────────────
export const channelApi = {

  /** Connect WhatsApp Cloud API via manual credentials */
  connectWhatsApp: async (config: WhatsAppConfig): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1500);
      return {
        id: Date.now(),
        name: 'WhatsApp Cloud API',
        identifier: `+1 ${config.phoneNumberId.slice(0, 3)}-${config.phoneNumberId.slice(3, 6)}-${config.phoneNumberId.slice(6)}`,
        status: 'Connected',
        icon: '💬',
        color: 'bg-green-500',
        msgs: 0,
        channelType: 'whatsapp',
      };
    }
    const res = await fetch('/api/channels/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to connect WhatsApp');
    return res.json();
  },

  /** Connect WhatsApp via Meta / Facebook Login */
  connectWhatsAppViaFB: async (auth: FBAuthResponse): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1000);
      return {
        id: Date.now(),
        name: 'WhatsApp Cloud API',
        identifier: '+1 555 0199',
        status: 'Connected',
        icon: '💬',
        color: 'bg-green-500',
        msgs: 0,
        channelType: 'whatsapp',
      };
    }
    const res = await fetch('/api/channels/whatsapp-fb/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth),
    });
    if (!res.ok) throw new Error('Failed to connect WhatsApp via Facebook');
    return res.json();
  },

  /** Connect Facebook Messenger via FB.login */
  connectFacebook: async (auth: FBAuthResponse): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1000);
      return {
        id: Date.now(),
        name: 'Facebook Messenger',
        identifier: 'My Company Page',
        status: 'Connected',
        icon: '💙',
        color: 'bg-blue-600',
        msgs: 0,
        channelType: 'facebook',
      };
    }
    const res = await fetch('/api/channels/facebook/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth),
    });
    if (!res.ok) throw new Error('Failed to connect Facebook');
    return res.json();
  },

  /** Connect Instagram via FB.login (requires linked Facebook Page) */
  connectInstagram: async (auth: FBAuthResponse): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1000);
      return {
        id: Date.now(),
        name: 'Instagram',
        identifier: '@mycompany',
        status: 'Connected',
        icon: '📸',
        color: 'bg-pink-500',
        msgs: 0,
        channelType: 'instagram',
      };
    }
    const res = await fetch('/api/channels/instagram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth),
    });
    if (!res.ok) throw new Error('Failed to connect Instagram');
    return res.json();
  },

  /** Connect Gmail via Google OAuth */
  connectGmail: async (): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1200);
      return {
        id: Date.now(),
        name: 'Gmail',
        identifier: 'support@company.com',
        status: 'Connected',
        icon: '📧',
        color: 'bg-red-500',
        msgs: 0,
        channelType: 'gmail',
      };
    }
    const res = await fetch('/api/channels/gmail/connect', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to connect Gmail');
    return res.json();
  },

  /** Connect Email via SMTP / IMAP credentials */
  connectEmail: async (config: EmailConfig): Promise<Channel> => {
    if (DUMMY_MODE) {
      await delay(1500);
      return {
        id: Date.now(),
        name: 'Email (SMTP/IMAP)',
        identifier: config.email,
        status: 'Connected',
        icon: '✉️',
        color: 'bg-indigo-500',
        msgs: 0,
        channelType: 'email',
      };
    }
    const res = await fetch('/api/channels/email/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to connect Email');
    return res.json();
  },

  /** Disconnect any channel by id */
  disconnectChannel: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to disconnect channel');
  },
};
