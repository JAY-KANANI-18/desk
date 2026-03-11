import { Workspace } from "../context/WorkspaceContext";
import { api } from "../lib/api";

/* =========================================================
   Types
========================================================= */



/* =========================================================
   Workspace API
   All workspace related endpoints in one place
========================================================= */

export const workspaceApi = {

  /* =========================================================
     Workspace
  ========================================================= */

  me: () => api.get("/workspaces/me"),

  create: (workspace: Workspace) =>
    api.post("/workspaces", workspace),

  update: (id: string, workspace: Workspace) =>
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
    api.get(`/workspaces/lifecycle-stages`),

  addLifecycleStage: (stage: any) =>
    api.post(`/workspaces/lifecycle-stages`, stage),

  updateLifecycleStage: (stageId: number, updates: any) =>
    api.put(`/workspaces/lifecycle-stages/${stageId}`, updates),

  deleteLifecycleStage: (stageId: number) =>
    api.delete(`/workspaces/lifecycle-stages/${stageId}`),


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

  addTag: (tag: any) =>
    api.post(`/workspaces/tags`, tag),

  deleteTag: (tagId: number) =>
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

  addAIPrompt: (prompt: any) =>
    api.post(`/workspaces/ai-prompts`, prompt),

  updateAIPrompt: (promptId: number, updates: any) =>
    api.put(`/workspaces/ai-prompts/${promptId}`, updates),

  deleteAIPrompt: (promptId: number) =>
    api.delete(`/workspaces/ai-prompts/${promptId}`),

  setActiveAIPrompt: (promptId: number) =>
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
    api.get(`/users/me`),

  updateUserProfile: (profile: any) =>
    api.patch(`/users/me`, profile),

  changePassword: (current: string, newPass: string) =>
    api.post(`/users/change-password`, {
      current,
      new: newPass
    }),


  /* =========================================================
     Notifications
  ========================================================= */

  getNotificationPrefs: () =>
    api.get(`/workspaces/users/notifications`),

  updateNotificationPrefs: (prefs: any) =>
    api.put(`/workspaces/users/notifications`, prefs),


  /* =========================================================
     Availability
  ========================================================= */

  getAvailability: () =>
    api.get(`/users/availability`),

  updateAvailability: (activityStatus: string) =>
    api.patch(`/users/me/availability`, { activityStatus }),

};