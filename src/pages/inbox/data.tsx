import { MessageCircle, Mail, Globe, Instagram, Facebook } from 'lucide-react';
import type { Conversation, CallLog, ChannelConfig } from './types';

export const conversations: Conversation[] = [
  { id: 1, name: 'Jay Kanani',   message: 'Yo, when is the meeting?',         time: '9:59 AM',   unreadCount: 0, tag: 'New Lead', avatar: 'JK', channel: 'whatsapp',  direction: 'incoming' },
  { id: 2, name: 'Sarah Miller', message: 'Thanks for the info!',             time: '9:45 AM',   unreadCount: 2, tag: 'Hot Lead', avatar: 'SM', channel: 'gmail',     direction: 'outgoing' },
  { id: 3, name: 'Mike Johnson', message: 'When can we schedule a call?',     time: '9:30 AM',   unreadCount: 0, tag: 'Customer', avatar: 'MJ', channel: 'email',     direction: 'incoming' },
  { id: 4, name: 'Priya Sharma', message: 'I saw your post, interested!',     time: '8:50 AM',   unreadCount: 3, tag: 'New Lead', avatar: 'PS', channel: 'instagram', direction: 'incoming' },
  { id: 5, name: 'Tom Bradley',  message: 'Please send the invoice again.',   time: 'Yesterday', unreadCount: 0, tag: 'Customer', avatar: 'TB', channel: 'facebook',  direction: 'outgoing' },
  { id: 6, name: 'Lena Fischer', message: 'Got your message, will reply soon', time: 'Yesterday', unreadCount: 1, tag: 'Hot Lead', avatar: 'LF', channel: 'whatsapp',  direction: 'incoming' },
];

export const channelConfig: Record<string, ChannelConfig> = {
  whatsapp:  { icon: <MessageCircle size={8} />, bg: 'bg-green-500',  label: 'WhatsApp'  },
  instagram: { icon: <Instagram size={8} />,     bg: 'bg-pink-500',   label: 'Instagram' },
  facebook:  { icon: <Facebook size={8} />,      bg: 'bg-blue-600',   label: 'Messenger' },
  gmail:     { icon: <Mail size={8} />,          bg: 'bg-red-500',    label: 'Gmail'     },
  email:     { icon: <Mail size={8} />,          bg: 'bg-blue-500',   label: 'Email'     },
  websitechat: { icon: <Globe size={8} />,       bg: 'bg-purple-500', label: 'Website Chat' },
};

export const teamMembers = [
  { id: 'u1', name: 'Alice Johnson', initials: 'AJ', online: true  },
  { id: 'u2', name: 'Bob Smith',     initials: 'BS', online: true  },
  { id: 'u3', name: 'Carol White',   initials: 'CW', online: false },
  { id: 'u4', name: 'David Lee',     initials: 'DL', online: true  },
  { id: 'u5', name: 'Eva Martinez',  initials: 'EM', online: false },
];

export const teams = [
  { id: 't1', name: 'Sales Team',   color: 'bg-blue-500'   },
  { id: 't2', name: 'Support Team', color: 'bg-purple-500' },
  { id: 't3', name: 'Tech Team',    color: 'bg-orange-500' },
];

export const callLogs: CallLog[] = [
  { id: 1, name: 'Jay Kanani',   avatar: 'JK', direction: 'incoming', duration: '3m 12s', time: '9:59 AM',   tag: 'New Lead' },
  { id: 2, name: 'Sarah Miller', avatar: 'SM', direction: 'outgoing', duration: '1m 45s', time: '9:45 AM',   tag: 'Hot Lead' },
  { id: 3, name: 'Mike Johnson', avatar: 'MJ', direction: 'missed',   duration: '',       time: '9:30 AM',   tag: 'Customer' },
  { id: 4, name: 'Jay Kanani',   avatar: 'JK', direction: 'outgoing', duration: '7m 02s', time: '8:15 AM',   tag: 'New Lead' },
  { id: 5, name: 'Sarah Miller', avatar: 'SM', direction: 'incoming', duration: '2m 30s', time: 'Yesterday', tag: 'Hot Lead' },
];

export const subSidebarItems = [
  { label: 'All',        dot: 'bg-gray-400', count: 2    },
  { label: 'Mine',       dot: 'bg-blue-600', count: null },
  { label: 'Unassigned', dot: 'bg-gray-400', count: 1    },
];

export const lifecycleItems = [
  { label: 'New Lead', bg: 'bg-blue-100',   dot: 'bg-blue-600'   },
  { label: 'Hot Lead', bg: 'bg-orange-100', dot: 'bg-orange-600' },
  { label: 'Payment',  bg: 'bg-green-100',  dot: 'bg-green-600'  },
  { label: 'Customer', bg: 'bg-purple-100', dot: 'bg-purple-600' },
];

export const WAVEFORM_BARS = [10, 20, 14, 26, 12, 22, 18, 28, 10, 16, 24, 12, 20, 26, 14, 18, 22, 10, 24, 16];

export const emojiCategories = [
  { label: 'Smileys',  emojis: ['😀','😂','😍','🥰','😎','🤔','😅','😭','😊','😢','😡','🤣','😴','🤗','😬','🙄'] },
  { label: 'Gestures', emojis: ['👍','👎','👋','🙏','💪','🤝','👏','✌️','🤞','👌','🫶','🫡'] },
  { label: 'Symbols',  emojis: ['❤️','🔥','✅','⭐','🎉','💯','🚀','💡','📌','📎','🔗','💬','📧','📞','⚡','🎯'] },
];

export const variables = [
  { key: 'contact.name',    label: 'Contact Name',    description: 'Full name of the contact',     category: 'Contact' },
  { key: 'contact.email',   label: 'Contact Email',   description: 'Email address of the contact', category: 'Contact' },
  { key: 'contact.phone',   label: 'Contact Phone',   description: 'Phone number of the contact',  category: 'Contact' },
  { key: 'contact.company', label: 'Company',         description: "Contact's company name",       category: 'Contact' },
  { key: 'agent.name',      label: 'Agent Name',      description: "Assigned agent's name",        category: 'Agent'   },
  { key: 'agent.email',     label: 'Agent Email',     description: "Assigned agent's email",       category: 'Agent'   },
  { key: 'company.name',    label: 'Company Name',    description: 'Your company name',            category: 'Company' },
  { key: 'conversation.id', label: 'Conversation ID', description: 'Unique conversation ID',       category: 'System'  },
  { key: 'today.date',      label: "Today's Date",    description: 'Current date',                 category: 'System'  },
];

export const snoozeOptions = [
  { label: '30 minutes',       value: '30m'      },
  { label: '1 hour',           value: '1h'       },
  { label: '3 hours',          value: '3h'       },
  { label: 'Tomorrow morning', value: 'tomorrow' },
  { label: 'Next week',        value: 'nextweek' },
];
