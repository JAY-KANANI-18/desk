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
    workspaceName: 'My New Workspace',
    workspaceId: 'ws_368530',
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
    { id: 1, name: 'Sarah Miller', email: 'sarah@company.com', role: 'Admin',   status: 'Active',  avatar: 'SM' },
    { id: 2, name: 'Mike Johnson', email: 'mike@company.com',  role: 'Agent',   status: 'Active',  avatar: 'MJ' },
    { id: 3, name: 'Emma Wilson',  email: 'emma@company.com',  role: 'Agent',   status: 'Active',  avatar: 'EW' },
    { id: 4, name: 'Alex Kim',     email: 'alex@company.com',  role: 'Manager', status: 'Invited', avatar: 'AK' },
  ] as TeamMember[],

  channels: [
    { id: 1, name: 'WhatsApp Cloud API', identifier: '+1 555 0100',         status: 'Connected', icon: '💬', color: 'bg-green-500', msgs: 1243, channelType: 'whatsapp'  },
    { id: 2, name: 'Instagram',          identifier: '@mycompany',          status: 'Connected', icon: '📸', color: 'bg-pink-500',  msgs: 432,  channelType: 'instagram' },
    { id: 3, name: 'Facebook Messenger', identifier: 'My Company Page',     status: 'Connected', icon: '💙', color: 'bg-blue-600',  msgs: 287,  channelType: 'facebook'  },
    { id: 4, name: 'Gmail',              identifier: 'support@company.com', status: 'Connected', icon: '📧', color: 'bg-red-500',   msgs: 891,  channelType: 'gmail'     },
    { id: 5, name: 'Email (SMTP/IMAP)',  identifier: 'hello@company.com',   status: 'Error',     icon: '✉️', color: 'bg-indigo-500', msgs: 0,   channelType: 'email'     },
  ] as Channel[],

  integrations: [
    { id: 'zapier',        name: 'Zapier',        desc: 'Automate workflows with 5,000+ apps',             icon: '⚡', category: 'Automation',   connected: false },
    { id: 'slack',         name: 'Slack',         desc: 'Get conversation notifications in Slack',         icon: '💬', category: 'Communication', connected: true  },
    { id: 'hubspot',       name: 'HubSpot',       desc: 'Sync contacts and deals with HubSpot CRM',        icon: '🟠', category: 'CRM',           connected: false },
    { id: 'salesforce',    name: 'Salesforce',    desc: 'Bi-directional sync with Salesforce CRM',         icon: '☁️', category: 'CRM',           connected: false },
    { id: 'shopify',       name: 'Shopify',       desc: 'View order info and customer data from Shopify',  icon: '🛍️', category: 'E-commerce',    connected: false },
    { id: 'google-sheets', name: 'Google Sheets', desc: 'Export contacts and conversations to Sheets',     icon: '📊', category: 'Productivity',  connected: false },
    { id: 'webhooks',      name: 'Webhooks',      desc: 'Send real-time events to any URL',                icon: '🔗', category: 'Developer',     connected: false },
    { id: 'api',           name: 'REST API',      desc: 'Build custom integrations with our API',          icon: '🔧', category: 'Developer',     connected: false },
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
    { id: 1, name: 'First name',    type: 'Text',     required: true,  system: true  },
    { id: 2, name: 'Last name',     type: 'Text',     required: false, system: true  },
    { id: 3, name: 'Email',         type: 'Email',    required: false, system: true  },
    { id: 4, name: 'Phone',         type: 'Phone',    required: false, system: true  },
    { id: 5, name: 'Company',       type: 'Text',     required: false, system: false },
    { id: 6, name: 'Customer tier', type: 'Dropdown', required: false, system: false },
    { id: 7, name: 'Birthday',      type: 'Date',     required: false, system: false },
  ] as ContactField[],

  lifecycleStages: [
    { id: 1, name: 'New lead',      color: '#6366f1', count: 142 },
    { id: 2, name: 'Contacted',     color: '#3b82f6', count: 87  },
    { id: 3, name: 'Qualified',     color: '#f59e0b', count: 54  },
    { id: 4, name: 'Proposal sent', color: '#8b5cf6', count: 31  },
    { id: 5, name: 'Negotiation',   color: '#ec4899', count: 18  },
    { id: 6, name: 'Won',           color: '#10b981', count: 203 },
    { id: 7, name: 'Lost',          color: '#ef4444', count: 67  },
  ] as LifecycleStage[],

  closingNoteSettings: {
    required: true,
    templates: [
      { id: 1, title: 'Issue resolved',   text: "The customer's issue has been resolved successfully." },
      { id: 2, title: 'Follow-up needed', text: 'Customer requires a follow-up within 24 hours.'       },
      { id: 3, title: 'Escalated',        text: 'Conversation escalated to the technical team.'        },
    ],
  } as ClosingNoteSettings,

  snippets: [
    { id: 1, shortcut: '/greeting', title: 'Greeting',       content: 'Hi {{contact.firstName}}! Thanks for reaching out. How can I help you today?' },
    { id: 2, shortcut: '/thanks',   title: 'Thank you',      content: 'Thank you for contacting us! Is there anything else I can help you with?'     },
    { id: 3, shortcut: '/hours',    title: 'Business hours', content: 'Our support team is available Monday–Friday, 9am–6pm EST.'                    },
    { id: 4, shortcut: '/escalate', title: 'Escalation',     content: "I'm going to escalate this to our specialist team. You'll hear back within 2 business hours." },
  ] as Snippet[],

  tags: [
    { id: 1, name: 'VIP',             color: '#f59e0b', count: 23  },
    { id: 2, name: 'Support',         color: '#3b82f6', count: 145 },
    { id: 3, name: 'Sales',           color: '#10b981', count: 67  },
    { id: 4, name: 'Bug report',      color: '#ef4444', count: 12  },
    { id: 5, name: 'Feature request', color: '#8b5cf6', count: 34  },
    { id: 6, name: 'Onboarding',      color: '#06b6d4', count: 89  },
  ] as ConversationTag[],

  aiSettings: {
    enabled: true,
    autoSuggest: true,
    tone: 'professional',
    language: 'auto',
    summarize: true,
    sentiment: true,
    translate: false,
    smartReply: true,
  } as AISettings,

  aiPrompts: [
    { id: 1, name: 'Empathetic support', prompt: 'You are a helpful customer support agent. Always be empathetic, concise, and solution-focused. Address the customer by their first name.', active: true  },
    { id: 2, name: 'Sales assistant',    prompt: 'You are a sales assistant. Help customers understand product benefits, handle objections professionally, and guide them toward a purchase decision.', active: false },
    { id: 3, name: 'Technical support',  prompt: 'You are a technical support specialist. Provide clear, step-by-step troubleshooting instructions. Ask clarifying questions when needed.', active: false },
  ] as AIPrompt[],

  teams: [
    { id: 1, name: 'Support',   description: 'Handles all customer support conversations', memberIds: [1, 2, 3] },
    { id: 2, name: 'Sales',     description: 'Sales and growth team',                      memberIds: [1, 4]    },
    { id: 3, name: 'Technical', description: 'Technical escalations and bug reports',       memberIds: [2, 3]    },
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

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// Replace fetch() stubs with your actual API client when DUMMY_MODE = false
// ─────────────────────────────────────────────────────────────────────────────
export const workspaceApi = {
  // ── General Info ──────────────────────────────────────────────────────────
  getWorkspaceInfo: async (): Promise<WorkspaceInfo> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.workspaceInfo }; }
    const res = await fetch('/api/workspace/info');
    if (!res.ok) throw new Error('Failed to fetch workspace info');
    return res.json();
  },
  updateWorkspaceInfo: async (data: WorkspaceInfo): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/workspace/info', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update workspace info');
  },

  // ── User Settings ─────────────────────────────────────────────────────────
  getUserProfile: async (): Promise<UserProfile> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.userProfile }; }
    const res = await fetch('/api/user/profile');
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },
  updateUserProfile: async (data: UserProfile): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update user profile');
  },
  getAvailability: async (): Promise<AvailabilityStatus> => {
    if (DUMMY_MODE) { await delay(); return MOCK_DATA.availability; }
    const res = await fetch('/api/user/availability');
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
  },
  updateAvailability: async (status: AvailabilityStatus): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/user/availability', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) throw new Error('Failed to update availability');
  },
  getNotificationPrefs: async (): Promise<NotificationPrefs> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.notificationPrefs }; }
    const res = await fetch('/api/user/notifications');
    if (!res.ok) throw new Error('Failed to fetch notification prefs');
    return res.json();
  },
  updateNotificationPrefs: async (prefs: NotificationPrefs): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/user/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) });
    if (!res.ok) throw new Error('Failed to update notification prefs');
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
    if (!res.ok) throw new Error('Failed to change password');
  },

  // ── Team Settings ─────────────────────────────────────────────────────────
  getTeamMembers: async (): Promise<TeamMember[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.teamMembers]; }
    const res = await fetch('/api/team/members');
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },
  inviteMember: async (email: string, role: string): Promise<TeamMember> => {
    if (DUMMY_MODE) {
      await delay();
      return { id: Date.now(), name: email.split('@')[0], email, role, status: 'Invited', avatar: email[0].toUpperCase() };
    }
    const res = await fetch('/api/team/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    if (!res.ok) throw new Error('Failed to invite member');
    return res.json();
  },
  updateMemberRole: async (id: number, role: string): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/team/members/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (!res.ok) throw new Error('Failed to update member role');
  },
  resendInvite: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/team/members/${id}/resend-invite`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resend invite');
  },
  removeMember: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove member');
  },

  // ── Channels ──────────────────────────────────────────────────────────────
  getChannels: async (): Promise<Channel[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.channels]; }
    const res = await fetch('/api/channels');
    if (!res.ok) throw new Error('Failed to fetch channels');
    return res.json();
  },
  disconnectChannel: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to disconnect channel');
  },

  // ── Integrations ──────────────────────────────────────────────────────────
  getIntegrations: async (): Promise<Integration[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.integrations]; }
    const res = await fetch('/api/integrations');
    if (!res.ok) throw new Error('Failed to fetch integrations');
    return res.json();
  },
  connectIntegration: async (id: string): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/integrations/${id}/connect`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to connect integration');
  },
  disconnectIntegration: async (id: string): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect integration');
  },

  // ── Growth Widgets ────────────────────────────────────────────────────────
  getWidgetConfig: async (): Promise<WidgetConfig> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.widgetConfig }; }
    const res = await fetch('/api/widget/config');
    if (!res.ok) throw new Error('Failed to fetch widget config');
    return res.json();
  },
  updateWidgetConfig: async (config: WidgetConfig): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/widget/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    if (!res.ok) throw new Error('Failed to update widget config');
  },

  // ── Contact Fields ────────────────────────────────────────────────────────
  getContactFields: async (): Promise<ContactField[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.contactFields]; }
    const res = await fetch('/api/contact-fields');
    if (!res.ok) throw new Error('Failed to fetch contact fields');
    return res.json();
  },
  addContactField: async (field: Omit<ContactField, 'id'>): Promise<ContactField> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), ...field }; }
    const res = await fetch('/api/contact-fields', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(field) });
    if (!res.ok) throw new Error('Failed to add contact field');
    return res.json();
  },
  updateContactField: async (id: number, data: Partial<ContactField>): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/contact-fields/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update contact field');
  },
  deleteContactField: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/contact-fields/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete contact field');
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  getLifecycleStages: async (): Promise<LifecycleStage[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.lifecycleStages]; }
    const res = await fetch('/api/lifecycle/stages');
    if (!res.ok) throw new Error('Failed to fetch lifecycle stages');
    return res.json();
  },
  addLifecycleStage: async (stage: Omit<LifecycleStage, 'id' | 'count'>): Promise<LifecycleStage> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), count: 0, ...stage }; }
    const res = await fetch('/api/lifecycle/stages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stage) });
    if (!res.ok) throw new Error('Failed to add lifecycle stage');
    return res.json();
  },
  updateLifecycleStage: async (id: number, data: Partial<LifecycleStage>): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/lifecycle/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update lifecycle stage');
  },
  deleteLifecycleStage: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/lifecycle/stages/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete lifecycle stage');
  },

  // ── Closing Notes ─────────────────────────────────────────────────────────
  getClosingNoteSettings: async (): Promise<ClosingNoteSettings> => {
    if (DUMMY_MODE) {
      await delay();
      return { ...MOCK_DATA.closingNoteSettings, templates: [...MOCK_DATA.closingNoteSettings.templates] };
    }
    const res = await fetch('/api/closing-notes/settings');
    if (!res.ok) throw new Error('Failed to fetch closing note settings');
    return res.json();
  },
  updateClosingNoteRequired: async (required: boolean): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/closing-notes/required', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ required }) });
    if (!res.ok) throw new Error('Failed to update closing note required setting');
  },
  addClosingNoteTemplate: async (template: Omit<ClosingNoteTemplate, 'id'>): Promise<ClosingNoteTemplate> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), ...template }; }
    const res = await fetch('/api/closing-notes/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) });
    if (!res.ok) throw new Error('Failed to add closing note template');
    return res.json();
  },
  deleteClosingNoteTemplate: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/closing-notes/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete closing note template');
  },

  // ── Snippets ──────────────────────────────────────────────────────────────
  getSnippets: async (): Promise<Snippet[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.snippets]; }
    const res = await fetch('/api/snippets');
    if (!res.ok) throw new Error('Failed to fetch snippets');
    return res.json();
  },
  addSnippet: async (snippet: Omit<Snippet, 'id'>): Promise<Snippet> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), ...snippet }; }
    const res = await fetch('/api/snippets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snippet) });
    if (!res.ok) throw new Error('Failed to add snippet');
    return res.json();
  },
  updateSnippet: async (id: number, data: Partial<Snippet>): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/snippets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update snippet');
  },
  deleteSnippet: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete snippet');
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  getTags: async (): Promise<ConversationTag[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.tags]; }
    const res = await fetch('/api/tags');
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },
  addTag: async (tag: Omit<ConversationTag, 'id' | 'count'>): Promise<ConversationTag> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), count: 0, ...tag }; }
    const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tag) });
    if (!res.ok) throw new Error('Failed to add tag');
    return res.json();
  },
  deleteTag: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tag');
  },

  // ── AI Assist ─────────────────────────────────────────────────────────────
  getAISettings: async (): Promise<AISettings> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.aiSettings }; }
    const res = await fetch('/api/ai/settings');
    if (!res.ok) throw new Error('Failed to fetch AI settings');
    return res.json();
  },
  updateAISettings: async (settings: AISettings): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/ai/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (!res.ok) throw new Error('Failed to update AI settings');
  },

  // ── AI Prompts ────────────────────────────────────────────────────────────
  getAIPrompts: async (): Promise<AIPrompt[]> => {
    if (DUMMY_MODE) { await delay(); return [...MOCK_DATA.aiPrompts]; }
    const res = await fetch('/api/ai/prompts');
    if (!res.ok) throw new Error('Failed to fetch AI prompts');
    return res.json();
  },
  addAIPrompt: async (prompt: Omit<AIPrompt, 'id' | 'active'>): Promise<AIPrompt> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), active: false, ...prompt }; }
    const res = await fetch('/api/ai/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prompt) });
    if (!res.ok) throw new Error('Failed to add AI prompt');
    return res.json();
  },
  updateAIPrompt: async (id: number, data: Partial<AIPrompt>): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/ai/prompts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update AI prompt');
  },
  deleteAIPrompt: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/ai/prompts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete AI prompt');
  },
  setActiveAIPrompt: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/ai/prompts/${id}/activate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to set active AI prompt');
  },

  // ── Teams ─────────────────────────────────────────────────────────────────
  getTeams: async (): Promise<Team[]> => {
    if (DUMMY_MODE) { await delay(); return MOCK_DATA.teams.map(t => ({ ...t, memberIds: [...t.memberIds] })); }
    const res = await fetch('/api/teams');
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },
  createTeam: async (data: Omit<Team, 'id'>): Promise<Team> => {
    if (DUMMY_MODE) { await delay(); return { id: Date.now(), ...data }; }
    const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },
  updateTeam: async (id: number, data: Partial<Omit<Team, 'id'>>): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/teams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update team');
  },
  deleteTeam: async (id: number): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete team');
  },

  // ── Calls ─────────────────────────────────────────────────────────────────
  getCallSettings: async (): Promise<CallSettings> => {
    if (DUMMY_MODE) { await delay(); return { ...MOCK_DATA.callSettings }; }
    const res = await fetch('/api/calls/settings');
    if (!res.ok) throw new Error('Failed to fetch call settings');
    return res.json();
  },
  updateCallSettings: async (settings: CallSettings): Promise<void> => {
    if (DUMMY_MODE) { await delay(); return; }
    const res = await fetch('/api/calls/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (!res.ok) throw new Error('Failed to update call settings');
  },
};
