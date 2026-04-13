import axios, { AxiosInstance } from 'axios';
import { api } from './api';
import { buildEmailChannelPayload, type EmailChannelFormValues } from './emailChannel';

interface Channel {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CreateChannelPayload {
    name: string;
    type: string;
}

export const ChannelApi = {
    whatsappManualConnect: (accessToken: string, phoneNumberId
        : string, wabaId: string, webhookSecret: string) =>
        api.post("/channels/whatsapp/connect-manual", {
            accessToken,
            phoneNumberId,
            wabaId,
            webhookSecret
        }),
    exchangeWhatsAppCode: (code: string, workspaceId: string, redirectUri: string) =>
        api.post("/channels/whatsapp/auth/callback", { code, workspaceId, redirectUri }),
    exchangeInstagramCode: (code: string, workspaceId: string, redirectUri: string) =>
        api.post("/channels/instagram/auth/callback", { code, workspaceId, redirectUri }),
    exchangeMessengerCode: (code: string, workspaceId: string, redirectUri: string) =>
        api.post("/channels/messenger/auth/callback", { code, workspaceId, redirectUri }),
    getWhatsAppAuthUrl: (workspaceId: string,redirectUri: string) =>
        api.get(`/channels/whatsapp/auth/url?workspaceId=${workspaceId}&redirectUri=${redirectUri}`),
    getInstagramAuthUrl: (workspaceId: string, redirectUri: string) =>
        api.get(`/channels/instagram/auth/url?workspaceId=${workspaceId}&redirectUri=${redirectUri}`),
    getMessengerAuthUrl: (workspaceId: string, redirectUri: string) =>
        api.get(`/channels/messenger/auth/url?workspaceId=${workspaceId}&redirectUri=${redirectUri}`),
// Add these to your ChannelApi

// Get pages after OAuth without connecting
getMessengerPages: async (code: string, workspaceId: string, redirectUri: string) => 
   api.post('/channels/messenger/auth/pages', {
    code,
    workspaceId,
    redirectUri,
  })
 
,

// Connect only selected pages
connectSelectedPages: async (payload: {
  workspaceId: string;
  selectedPageIds: string[];
  pages: any[];
}) => 
  api.post('/channels/messenger/auth/callback', payload)

,
    getChannels: () => api.get('/channels'),
    listChannels: (params?: { search?: string; page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.search?.trim()) searchParams.set('search', params.search.trim());
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        const query = searchParams.toString();
        return api.get(`/channels${query ? `?${query}` : ''}`);
    },
    createChannel: (payload: CreateChannelPayload, workspaceId: string) =>
        api.post(`/channels?workspaceId=${workspaceId}`, payload),
    deleteChannel: (channelId: string) => api.delete(`/channels/${channelId}`),

    startOauthWhatsapp: (workspaceId: string) =>
        api.get(`/channels/whatsapp/oauth?workspaceId=${workspaceId}`),
    updateWhatsAppChannel: (channelId: string, data: any) =>
        api.put(`/channels/whatsapp/${channelId}`, data),
    updateInstagramChannel: (channelId: string, data: any) =>
        api.put(`/channels/instagram/${channelId}`, data),
    updateMessengerChannel: (channelId: string, data: any) =>
        api.put(`/channels/messenger/${channelId}`, data),
    updateEmailChannel: (channelId: string, data: any) =>
        api.put(`/channels/email/${channelId}`, data),
    connectEmailChannel: (workspaceId: string, values: EmailChannelFormValues) =>
        api.post(`/channels/email/smtp/connect`, {
            workspaceId,
            ...buildEmailChannelPayload(values),
        }),
    testEmailConnection: (channelId: string) =>
        api.post(`/channels/email/${channelId}/test`),
    updateGmailChannel: (channelId: string, data: any) =>
        api.put(`/channels/gmail/${channelId}`, data),

    connectWhatsAppViaFB: (auth: any) =>
        api.post("/channels/whatsapp/connect-fb", {
            accessToken: auth.accessToken,
            userID: auth.userID,
            email: auth.email,
            name: auth.name,
        }),
    listWhatsAppTemplates: (channelId: string) =>
        api.get(`/channels/${channelId}/whatsapp/templates`),
    listMessengerMenu: (channelId: string) =>
        api.get(`/channels/${channelId}/messenger/menu`),
    syncMessengerMenu: (channelId: string, workspaceId: string) =>
        api.post(`/channels/${channelId}/messenger/menu/sync?workspaceId=${workspaceId}`),
    previewTemplate: (channelId: string, templateName: string, language: string) =>
        api.get(`/channels/whatsapp/${channelId}/templates/preview?name=${templateName}&language=${language}`),
    syncWhatsAppTemplates: (channelId: string) =>
        api.post(`/channels/${channelId}/whatsapp/templates/sync`),
    listIceBreakers: (channelId: string, workspaceId: string) =>
        api.get(`/channels/${channelId}/instagram/icebreakers?workspaceId=${workspaceId}`),
    syncIceBreakers: (channelId: string, workspaceId: string) =>
        api.post(`/channels/${channelId}/instagram/icebreakers/sync?workspaceId=${workspaceId}`),


    // Add inside ChannelApi object:

createWebchatChannel: (workspaceId: string, data: {
    name: string;
    welcomeMessage?: string;
    primaryColor?: string;
    agentName?: string;
    allowedOrigins?: string[];
}) =>
    api.post(`/channels/webchat`, data),

rotateWebchatToken: (workspaceId: string, channelId: string) =>
    api.post(`/channels/webchat/${channelId}/rotate-token`),

// updateWebsiteChatChannel already exists in your file — just fix the URL to match your BE:
// Change: api.put(`/channels/website-chat/${channelId}`, data)
// To:
updateWebsiteChatChannel: ( channelId: string, data: any) =>
    api.patch(`/channels/webchat/${channelId}`, data),

connectMsg91: (payload: {
  workspaceId: string;
  name?: string;
  senderId: string;
  authKey: string;
  route?: string;
  dltTemplateId?: string;
  apiUrl?: string;
}) => api.post('/channels/sms/msg91/connect', payload),

connectExotel: (payload: {
  workspaceId: string;
  name?: string;
  callerId: string;
  sid: string;
  apiKey: string;
  apiToken: string;
  apiUrl?: string;
}) => api.post('/channels/calling/exotel/connect', payload),

}

