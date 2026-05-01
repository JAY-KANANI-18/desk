import type {
  WorkspaceInfo, UserProfile, NotificationPrefs, AvailabilityStatus,
  TeamMember, Team, Channel, Integration, WidgetConfig, ContactField,
  LifecycleStage, ClosingNoteSettings, ClosingNoteTemplate,
  Snippet, ConversationTag, AISettings, AIPrompt, CallSettings,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY MODE — flip to false when your real API is ready
// ─────────────────────────────────────────────────────────────────────────────
export const DUMMY_MODE = false;

/** Simulates network latency in dummy mode */
export const delay = (ms = 350) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_DATA = {
  workspaceInfo: {
    organizationId: 'org_123456',
    name: 'My New Workspace',
    id: 'ws_368530',
    timezone: 'UTC+0',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
  } as WorkspaceInfo,

  userProfile: {
    name: 'Alex Johnson',
    email: 'alex@company.com',
    phone: '+1 555 0100',
    role: 'Admin',
  } as UserProfile,

  notificationPrefs: {
    email: true,
    browser: true,
    mobile: false,
    mentions: true,
    assignments: true,
    newConversations: false,
  } as NotificationPrefs,

  availability: 'online' as AvailabilityStatus,

  teamMembers: [
    { id: 1, name: 'Sarah Miller', email: 'sarah@company.com', role: 'Admin', status: 'Active', avatar: 'SM' },
    { id: 2, name: 'Mike Johnson', email: 'mike@company.com', role: 'Agent', status: 'Active', avatar: 'MJ' },
    { id: 3, name: 'Emma Wilson', email: 'emma@company.com', role: 'Agent', status: 'Active', avatar: 'EW' },
    { id: 4, name: 'Alex Kim', email: 'alex@company.com', role: 'Manager', status: 'Invited', avatar: 'AK' },
  ] as TeamMember[],

  channels: [
    { id: 1, name: 'WhatsApp Cloud API', identifier: '+1 555 0100', status: 'Connected', icon: '💬', color: 'bg-green-500', msgs: 1243, channelType: 'whatsapp' },
    { id: 2, name: 'Instagram', identifier: '@mycompany', status: 'Connected', icon: '📸', color: 'bg-pink-500', msgs: 432, channelType: 'instagram' },
    { id: 3, name: 'Facebook Messenger', identifier: 'My Company Page', status: 'Connected', icon: '💙', color: 'bg-blue-600', msgs: 287, channelType: 'messenger' },
    { id: 4, name: 'Gmail', identifier: 'support@company.com', status: 'Connected', icon: '📧', color: 'bg-red-500', msgs: 891, channelType: 'gmail' },
    { id: 5, name: 'Email (SMTP)', identifier: 'hello@company.com', status: 'Error', icon: '✉️', color: 'bg-indigo-500', msgs: 0, channelType: 'email' },
  ] as Channel[],

  integrations: [
    { id: 'zapier', name: 'Zapier', desc: 'Automate workflows with 5,000+ apps', icon: '⚡', category: 'Automation', connected: false },
    { id: 'slack', name: 'Slack', desc: 'Get conversation notifications in Slack', icon: '💬', category: 'Communication', connected: true },
    { id: 'hubspot', name: 'HubSpot', desc: 'Sync contacts and deals with HubSpot CRM', icon: '🟠', category: 'CRM', connected: false },
    { id: 'salesforce', name: 'Salesforce', desc: 'Bi-directional sync with Salesforce CRM', icon: '☁️', category: 'CRM', connected: false },
    { id: 'shopify', name: 'Shopify', desc: 'View order info and customer data from Shopify', icon: '🛍️', category: 'E-commerce', connected: false },
    { id: 'google-sheets', name: 'Google Sheets', desc: 'Export contacts and conversations to Sheets', icon: '📊', category: 'Productivity', connected: false },
    { id: 'webhooks', name: 'Webhooks', desc: 'Send real-time events to any URL', icon: '🔗', category: 'Developer', connected: false },
    { id: 'api', name: 'REST API', desc: 'Build custom integrations with our API', icon: '🔧', category: 'Developer', connected: false },
  ] as Integration[],

  widgetConfig: {
    color: '#4f46e5',
    position: 'bottom-right',
    greeting: 'Hi! How can we help you today? 👋',
    showOnMobile: true,
    autoOpen: false,
    delay: '3',
  } as WidgetConfig,

  contactFields: [
    { id: 1, name: 'First name', type: 'Text', required: true, system: true },
    { id: 2, name: 'Last name', type: 'Text', required: false, system: true },
    { id: 3, name: 'Email', type: 'Email', required: false, system: true },
    { id: 4, name: 'Phone', type: 'Phone', required: false, system: true },
    { id: 5, name: 'Company', type: 'Text', required: false, system: false },
    { id: 6, name: 'Customer tier', type: 'Dropdown', required: false, system: false },
    { id: 7, name: 'Birthday', type: 'Date', required: false, system: false },
  ] as ContactField[],

  lifecycleStages: [
    { id: 1, name: 'New lead', color: '#6366f1', count: 142 },
    { id: 2, name: 'Contacted', color: '#3b82f6', count: 87 },
    { id: 3, name: 'Qualified', color: '#f59e0b', count: 54 },
    { id: 4, name: 'Proposal sent', color: '#8b5cf6', count: 31 },
    { id: 5, name: 'Negotiation', color: '#ec4899', count: 18 },
    { id: 6, name: 'Won', color: '#10b981', count: 203 },
    { id: 7, name: 'Lost', color: '#ef4444', count: 67 },
  ] as LifecycleStage[],

  closingNoteSettings: {
    required: true,
    templates: [
      { id: 1, title: 'Issue resolved', text: "The customer's issue has been resolved successfully." },
      { id: 2, title: 'Follow-up needed', text: 'Customer requires a follow-up within 24 hours.' },
      { id: 3, title: 'Escalated', text: 'Conversation escalated to the technical team.' },
    ],
  } as ClosingNoteSettings,

  snippets: [
    { id: 1, shortcut: '/greeting', title: 'Greeting', content: 'Hi {{contact.firstName}}! Thanks for reaching out. How can I help you today?' },
    { id: 2, shortcut: '/thanks', title: 'Thank you', content: 'Thank you for contacting us! Is there anything else I can help you with?' },
    { id: 3, shortcut: '/hours', title: 'Business hours', content: 'Our support team is available Monday–Friday, 9am–6pm EST.' },
    { id: 4, shortcut: '/escalate', title: 'Escalation', content: "I'm going to escalate this to our specialist team. You'll hear back within 2 business hours." },
  ] as Snippet[],

  tags: [
    { id: 1, name: 'VIP', color: '#f59e0b', count: 23 },
    { id: 2, name: 'Support', color: '#3b82f6', count: 145 },
    { id: 3, name: 'Sales', color: '#10b981', count: 67 },
    { id: 4, name: 'Bug report', color: '#ef4444', count: 12 },
    { id: 5, name: 'Feature request', color: '#8b5cf6', count: 34 },
    { id: 6, name: 'Onboarding', color: '#06b6d4', count: 89 },
  ] as ConversationTag[],

  aiSettings: {
    enabled: true,
    autoSuggest: true,
    provider: 'cohere',
    model: 'command-a-03-2025',
    defaultLanguage: 'auto',
    summarize: true,
    sentiment: true,
    translate: false,
    smartReply: true,
  } as AISettings,

  aiPrompts: [
    { id: '1', key: 'change-tone', name: 'Change tone', description: 'Adjust draft tone', kind: 'rewrite', prompt: 'Tone prompt', options: [{ label: 'Professional', value: 'professional' }], isDefault: true, isEnabled: true, isActive: false, sortOrder: 10 },
    { id: '2', key: 'assist-reply', name: 'AI Assist Reply', description: 'Draft from history', kind: 'assist', prompt: 'Assist prompt', options: null, isDefault: true, isEnabled: true, isActive: true, sortOrder: 20 },
    { id: '3', key: 'summarize-conversation', name: 'Conversation Summary', description: 'Summary to note', kind: 'summarize', prompt: 'Summary prompt', options: null, isDefault: true, isEnabled: true, isActive: true, sortOrder: 30 },
  ] as AIPrompt[],

  teams: [
    { id: 1, name: 'Support', description: 'Handles all customer support conversations', memberIds: [1, 2, 3] },
    { id: 2, name: 'Sales', description: 'Sales and growth team', memberIds: [1, 4] },
    { id: 3, name: 'Technical', description: 'Technical escalations and bug reports', memberIds: [2, 3] },
  ] as Team[],

  callSettings: {
    enabled: true,
    recording: true,
    voicemail: true,
    transcription: false,
    holdMusic: true,
    callerId: '+1 555 0100',
    maxDuration: '60',
    voicemailGreeting: "Hi, you've reached our support team. Please leave a message and we'll get back to you shortly.",
  } as CallSettings,
};
