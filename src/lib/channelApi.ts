import axios, { AxiosInstance } from 'axios';
import { api } from './api';

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
    getChannels: () => api.get('/channels'),
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
    updateGmailChannel: (channelId: string, data: any) =>
        api.put(`/channels/gmail/${channelId}`, data),
    updateWebsiteChatChannel: (channelId: string, data: any) =>
        api.put(`/channels/website-chat/${channelId}`, data),

    connectWhatsAppViaFB: (auth: any) =>
        api.post("/channels/whatsapp/connect-fb", {
            accessToken: auth.accessToken,
            userID: auth.userID,
                email: auth.email,
                name: auth.name,    
        }),
    listWhatsAppTemplates : (channelId: string) =>
        api.get(`/channels/${channelId}/whatsapp/templates`),
    previewTemplate : (channelId: string, templateName: string, language: string) =>
        api.get(`/channels/whatsapp/${channelId}/templates/preview?name=${templateName}&language=${language}`),
    syncWhatsAppTemplates : (channelId: string) =>
        api.post(`/channels/${channelId}/whatsapp/templates/sync`),
    listIceBreakers : (channelId: string, workspaceId: string) =>
        api.get(`/channels/${channelId}/instagram/icebreakers?workspaceId=${workspaceId}`),
    syncIceBreakers : (channelId: string, workspaceId: string) =>
        api.post(`/channels/${channelId}/instagram/icebreakers/sync?workspaceId=${workspaceId}`),





}

