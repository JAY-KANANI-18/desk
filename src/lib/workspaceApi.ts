import type { Workspace } from "../context/WorkspaceContext";
import { api } from "../lib/api";
import type { Workflow } from "../pages/workflow/workflow.types";

/* =========================================================
   Types
========================================================= */

export interface WorkspaceTagInput {
  name: string;
  color?: string;
  emoji?: string;
  description?: string;
}

type WorkspaceCreatePayload = Pick<Workspace, "name" | "organizationId">;
type WorkspaceUpdatePayload = Partial<Workspace> & { logoUrl?: string };
type WorkflowCreatePayload = Pick<Workflow, "name"> &
  Partial<Pick<Workflow, "description" | "config">>;
type WorkflowSavePayload = Partial<Pick<Workflow, "name" | "description">> & {
  config: Workflow["config"];
};


/* =========================================================
   Workspace API
   All workspace related endpoints in one place
========================================================= */

export const workspaceApi = {

  /* =========================================================
     Workspace
  ========================================================= */

  me: () => api.get("/workspaces/me"),

  create: (workspace: WorkspaceCreatePayload) =>
    api.post("/workspaces", workspace),

  update: (id: string, workspace: WorkspaceUpdatePayload) =>
    api.put(`/workspaces/${id}`, workspace),

  delete: (id: string) =>
    api.delete(`/workspaces/${id}`),

  uploadLogo: (id: string, file: File) => {
    return api.post(`/workspaces/${id}/logo`);
  },


  /* =========================================================
     Members / Users
  ========================================================= */

  users: () =>
    api.get(`/workspaces/users`),
  listUsers: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search?.trim()) searchParams.set('search', params.search.trim());
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api.get(`/workspaces/users${query ? `?${query}` : ''}`);
  },

  inviteMember: (email: string, role: string) =>
    api.post(`/workspaces/users/invite`, { email, role }),

  resendInvite: (userId: string) =>
    api.post(`/workspaces/users/${userId}/resend-invite`),

  removeMember: (userId: string) =>
    api.delete(`/workspaces/users/${userId}`),

  updateMemberRole: (userId: string, role: string) =>
    api.put(`/workspaces/users/${userId}/role`, { role }),

  getTeamMembers: () =>
    api.get(`/workspaces/users`),

    inviteUser: ( email: string, role: string, workspaceAccess: any) =>
        api.post("/workspaces/invite", {
            email,
            role,
            workspaceAccess
        }),
    updateUser: ( id: string, role: string, workspaceAccess: any) =>
        api.put("/workspaces/users", {
            id,
            role,
            workspaceAccess
        }),


  /* =========================================================
     Teams
  ========================================================= */

  getTeams: () =>
    api.get(`/workspaces/teams`),

  createTeam: ({
    name,
    description,
    memberIds
  }: {
    name: string
    description?: string
    memberIds: string[]
  }) =>
    api.post(`/workspaces/teams`, { name, description, memberIds }),

  updateTeam: (
    teamId: string,
    {
      name,
      description,
      memberIds
    }: {
      name: string
      description?: string
      memberIds: string[]
    }
  ) =>
    api.put(`/workspaces/teams/${teamId}`, { name }),

  deleteTeam: (teamId: string) =>
    api.delete(`/workspaces/teams/${teamId}`),


  /* =========================================================
     Channels
  ========================================================= */

  getChannels: () =>
    api.get(`/workspaces/channels`),

  disconnectChannel: (channelId: string) =>
    api.delete(`/workspaces/channels/${channelId}`),


  /* =========================================================
     Integrations
  ========================================================= */

  getIntegrations: () =>
    api.get(`/workspaces/integrations`),

  connectIntegration: (integrationId: string) =>
    api.post(`/workspaces/integrations/${integrationId}/connect`),

  disconnectIntegration: (integrationId: string) =>
    api.delete(`/workspaces/integrations/${integrationId}`),

  getMetaAdsOAuthUrl: () =>
    api.get(`/integrations/meta-ads/oauth/url`),

  exchangeMetaAdsOAuthCode: (code: string) =>
    api.post(`/integrations/meta-ads/oauth/exchange`, { code }),

  getMetaAdsStatus: () =>
    api.get(`/integrations/meta-ads/status`),

  disconnectMetaAdsIntegration: () =>
    api.delete(`/integrations/meta-ads`),


  /* =========================================================
     Widget Settings
  ========================================================= */

  getWidgetConfig: () =>
    api.get(`/workspaces/widget-settings`),

  updateWidgetConfig: (settings: any) =>
    api.put(`/workspaces/widget-settings`, settings),


  /* =========================================================
     Contact Fields
  ========================================================= */

  getContactFields: () =>
    api.get(`/workspaces/contact-fields`),

  addContactField: (field: any) =>
    api.post(`/workspaces/contact-fields`, field),

  updateContactField: (fieldId: number, updates: any) =>
    api.put(`/workspaces/contact-fields/${fieldId}`, updates),

  deleteContactField: (fieldId: number) =>
    api.delete(`/workspaces/contact-fields/${fieldId}`),


  /* =========================================================
     Lifecycle Stages
  ========================================================= */

  getLifecycleStages: () =>
    api.get(`/workspaces/lifecycle`),

  addLifecycleStage: (stage: any) =>
    api.post(`/workspaces/lifecycle`, stage),

  updateLifecycleStage: (stageId: number, updates: any) =>
    api.patch(`/workspaces/lifecycle/${stageId}`, updates),

  deleteLifecycleStage: (stageId: number) =>
    api.delete(`/workspaces/lifecycle/${stageId}`),
  updateVisibility: (enabled: boolean) =>
    api.put(`/workspaces/lifecycle/visibility`, { enabled }),
  reorderLifecycleStages: (stages: any) =>
    api.patch(`/workspaces/lifecycle/reorder`, stages),
  /* =========================================================
     Closing Notes
  ========================================================= */

  getClosingNoteSettings: () =>
    api.get(`/workspaces/closing-notes`),

  updateClosingNoteSettings: (settings: any) =>
    api.put(`/workspaces/closing-notes`, settings),

  addClosingNoteTemplate: (note: any) =>
    api.post(`/workspaces/closing-notes`, note),

  updateClosingNoteRequired: (required: boolean) =>
    api.put(`/workspaces/closing-notes/required`, { required }),

  deleteClosingNoteTemplate: (noteId: number) =>
    api.delete(`/workspaces/closing-notes/${noteId}`),


  /* =========================================================
     Snippets
  ========================================================= */

  getSnippets: () =>
    api.get(`/workspaces/snippets`),

  addSnippet: (snippet: any) =>
    api.post(`/workspaces/snippets`, snippet),

  updateSnippet: (snippetId: number, updates: any) =>
    api.put(`/workspaces/snippets/${snippetId}`, updates),

  deleteSnippet: (snippetId: number) =>
    api.delete(`/workspaces/snippets/${snippetId}`),


  /* =========================================================
     Tags
  ========================================================= */

  getTags: () =>
    api.get(`/workspaces/tags`),
  listTags: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search?.trim()) searchParams.set('search', params.search.trim());
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api.get(`/workspaces/tags${query ? `?${query}` : ''}`);
  },

  addTag: (tag: WorkspaceTagInput) =>
    api.post(`/workspaces/tags`, tag),

  updateTag: (tagId: number | string, tag: Partial<WorkspaceTagInput>) =>
    api.patch(`/workspaces/tags/${tagId}`, tag),

  deleteTag: (tagId: number | string) =>
    api.delete(`/workspaces/tags/${tagId}`),


  /* =========================================================
     AI Settings
  ========================================================= */

  getAISettings: () =>
    api.get(`/workspaces/ai-settings`),

  updateAISettings: (settings: any) =>
    api.put(`/workspaces/ai-settings`, settings),


  /* =========================================================
     AI Prompts
  ========================================================= */

  getAIPrompts: () =>
    api.get(`/workspaces/ai-prompts`),

  getAIAssistPrompt: () =>
    api.get(`/workspaces/ai-assist-prompt`),

  updateAIAssistPrompt: (prompt: any) =>
    api.put(`/workspaces/ai-assist-prompt`, prompt),

  addAIPrompt: (prompt: any) =>
    api.post(`/workspaces/ai-prompts`, prompt),

  updateAIPrompt: (promptId: string | number, updates: any) =>
    api.put(`/workspaces/ai-prompts/${promptId}`, updates),

  deleteAIPrompt: (promptId: string | number) =>
    api.delete(`/workspaces/ai-prompts/${promptId}`),

  setActiveAIPrompt: (promptId: string | number) =>
    api.post(`/workspaces/ai-prompts/${promptId}/activate`),


  /* =========================================================
     Call Settings
  ========================================================= */

  getCallSettings: () =>
    api.get(`/workspaces/call-settings`),

  updateCallSettings: (settings: any) =>
    api.put(`/workspaces/call-settings`, settings),


  /* =========================================================
     User Profile
  ========================================================= */

  getUserProfile: () =>
    api.get(`/user`),

  updateUserProfile: (profile: any) =>
    api.patch(`/user`, profile),

  changePassword: (current: string, newPass: string) =>
    api.post(`/user/change-password`, {
      current,
      new: newPass
    }),


  /* =========================================================
     Notifications
  ========================================================= */

  getNotificationPrefs: () =>
    api.get(`/notifications/preferences`),

  updateNotificationPrefs: (prefs: any) =>
    api.put(`/notifications/preferences`, prefs),


  /* =========================================================
     Availability
  ========================================================= */

  getAvailability: () =>
    api.get(`/workspaces/availability`),

  updateAvailability: (activityStatus: string) =>
    api.patch(`/user/me/availability`, { activityStatus }),

  /* =========================================================
     Workflow API (for testing, should be moved to its own file)
  ========================================================= */
  getWorkflows: () =>
    api.get(`/workflows`),
  listWorkflows: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search?.trim()) searchParams.set('search', params.search.trim());
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api.get(`/workflows${query ? `?${query}` : ''}`);
  },
  getWorkflow: (id: string): Promise<Workflow> =>
    api.get(`/workflows/${id}`),
  createWorkflow: (payload: WorkflowCreatePayload): Promise<Workflow> =>
    api.post(`/workflows`, payload),
  saveWorkflow: (id: string, payload: WorkflowSavePayload): Promise<Workflow> =>
    api.patch(`/workflows/${id}`, payload),
  publishWorkflow: (id: string) =>
    api.patch(`/workflows/${id}/publish`),
  stopWorkflow: (id: string) =>
    api.patch(`/workflows/${id}/stop`),
  cloneWorkflow: (id: string) =>
    api.post(`/workflows/${id}/clone`),
  deleteWorkflow: (id: string) =>
    api.delete(`/workflows/${id}`),
  renameWorkflow: (id: string, name: string) =>
    api.patch(`/workflows/${id}/rename`, { name }),


  getBilling: () =>
    api.get(`/billing/me`),

  createCheckout: (payload: { plan: 'starter' | 'growth' | 'pro'; provider: 'stripe' | 'razorpay' }) =>
    api.post(`/billing/checkout`, payload),

  cancelSubscription: () =>
    api.post(`/billing/cancel`),

  updateBillingDetails: (payload: {
    companyName: string;
    email: string;
    phone?: string;
    taxId?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) =>
    api.patch(`/billing/details`, payload),

  getInvoices: () =>
    api.get(`/billing/invoices`),


  payInvoice: (invoiceId: string) =>
    api.post(`/billing/invoices/${invoiceId}/pay`),

addAddon: (dto: { type: 'extra_agents' | 'extra_contacts'; quantity: number }) =>
  api.post('/billing/addon', dto),

  createPortalSession: () =>
    api.post(`/billing/portal`),

  // Dashboard
  getDashboardLifecycle: () =>
    api.get(`/analytics/dashboard/lifecycle`),

  getDashboardContacts: (params: {
    tab: 'open' | 'assigned' | 'unassigned';
    cursor?: string;
    limit?: number;
  }) =>
    api.get(`/analytics/dashboard/contacts?tab=${params.tab}&cursor=${params.cursor || ''}&limit=${params.limit || 10}`,),

  getDashboardMembers: (params: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    api.get(`/analytics/dashboard/members?page=${params.page || 1}&limit=${params.limit || 10}&status=${params.status || ''}`,),

  getDashboardMergeSuggestions: () =>
    api.get(`/analytics/dashboard/merge-suggestions`),

  mergeContacts: (primaryId: string, secondaryId: string) =>
    api.post(`/contacts/merge`, { primaryId, secondaryId }),


  getOverview: (params?: any) =>
    api.get('/analytics/overview', { params }),

  getMessages: (params?: any) =>
    api.get('/analytics/messages', { params }),

  getFailedMessages: (params?: any) =>
    api.get('/analytics/messages/failed', { params }),

  getContacts: (params?: any) =>
    api.get('/analytics/contacts', { params }),

  getConversations: (params?: any) =>
    api.get('/analytics/conversations', { params }),

  getLifecycle: (params?: any) =>
    api.get('/analytics/lifecycle', { params }),

};
