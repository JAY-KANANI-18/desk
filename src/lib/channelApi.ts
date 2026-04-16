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

interface ConnectWhatsAppCoexistPayload {
    code: string;
    state: string;
    wabaId: string;
    phoneNumberId: string;
    businessId?: string;
}

export interface WaTemplate {
    id: string;
    metaId?: string | null;
    name: string;
    language: string;
    category: string;
    status: string;
    components: any[];
    variables: string[];
    rejectedReason?: string | null;
    syncedAt?: string;
}

export interface IceBreakerItem {
    question: string;
    payload: string;
}

export interface MessengerMenuItem {
    type: 'postback' | 'web_url';
    title: string;
    payload?: string;
    url?: string;
    actionType?: 'payload' | 'quick_reply' | 'url';
    replyText?: string;
    actionId?: string;
}

export interface MessengerMenuLocale {
    locale: string;
    composer_input_disabled: boolean;
    call_to_actions: MessengerMenuItem[];
}

export interface MessengerMenuState {
    persistentMenu: MessengerMenuLocale[];
    getStarted: { payload: string } | null;
    greeting: Array<{ locale: string; text: string }>;
    syncedAt: string;
}

export interface MessengerTemplate {
    id: string;
    metaId?: string;
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'SERVICE';
    status: 'APPROVED';
    templateType: 'text' | 'button' | 'generic' | 'media';
    description?: string;
    components: any[];
    variables: string[];
}

export interface PrivateRepliesConfig {
    enabled: boolean;
    scope: 'all' | 'selected';
    selectedPostIds: string[];
    message: string;
    updatedAt?: string | null;
}

export interface StoryRepliesConfig {
    enabled: boolean;
    message: string;
    updatedAt?: string | null;
}

export interface AutomationTarget {
    id: string;
    title: string;
    subtitle?: string | null;
    type: string;
    permalink?: string | null;
    thumbnailUrl?: string | null;
    createdAt?: string | null;
}

const buildQuery = (params?: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
            searchParams.set(key, value);
        }
    });
    const query = searchParams.toString();
    return query ? `?${query}` : '';
};

export const ChannelApi = {
    whatsappManualConnect: (accessToken: string, phoneNumberId
        : string, wabaId: string, webhookSecret: string, workspaceId: string) =>
        api.post("/channels/whatsapp/connect-manual", {
            workspaceId,
            accessToken,
            phoneNumberId,
            wabaId,
            webhookSecret
        }),
    exchangeWhatsAppCode: (code: string, redirectUri: string) =>
        api.post("/channels/whatsapp/auth/callback", { code, redirectUri }),
    getWhatsAppCoexistState: () =>
        api.get(`/channels/whatsapp/auth/coexist/state`),
    exchangeWhatsAppCoexistCode: (payload: ConnectWhatsAppCoexistPayload) =>
        api.post("/channels/whatsapp/auth/coexist", payload),
    exchangeInstagramCode: (code: string, redirectUri: string) =>
        api.post("/channels/instagram/auth/callback", { code, redirectUri }),
    exchangeMessengerCode: (code: string, redirectUri: string) =>
        api.post("/channels/messenger/auth/callback", { code, redirectUri }),
    getWhatsAppAuthUrl: () =>
        api.get(`/channels/whatsapp/auth/url`),
    getInstagramAuthUrl: () =>
        api.get(`/channels/instagram/auth/url`),
    getMessengerAuthUrl: () =>
        api.get(`/channels/messenger/auth/url`),
// Add these to your ChannelApi

// Get pages after OAuth without connecting
getMessengerPages: async (code: string, redirectUri: string) => 
   api.post('/channels/messenger/auth/pages', {
    code,
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
    listChannels: (params?: { search?: string; page?: number; limit?: number }) =>
        api.get(`/channels${buildQuery({
            search: params?.search?.trim(),
            page: params?.page ? String(params.page) : undefined,
            limit: params?.limit ? String(params.limit) : undefined,
        })}`),
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
    listWhatsAppTemplates: (channelId: string | number | undefined, params?: Record<string, string | undefined>) =>
        api.get(`/channels/${channelId}/whatsapp/templates${buildQuery({
            status: params?.status,
            category: params?.category,
            language: params?.language,
            search: params?.search,
        })}`),
    previewTemplate: (channelId: string | number, templateId: string, variables: Record<string, string>) =>
        api.post(`/channels/${channelId}/whatsapp/templates/${templateId}/preview`, { variables }),
    syncWhatsAppTemplates: (channelId: string | number) =>
        api.post(`/channels/${channelId}/whatsapp/templates/sync`),

    listMessengerMenu: (channelId: string | number) =>
        api.get(`/channels/${channelId}/messenger/menu`),
    syncMessengerMenu: (channelId: string | number) =>
        api.post(`/channels/${channelId}/messenger/menu/sync`),
    pushMessengerMenu: (channelId: string | number, menu: MessengerMenuLocale[]) =>
        api.post(`/channels/${channelId}/messenger/menu/push`, { menu }),
    pushGetStarted: (channelId: string | number, payload: string) =>
        api.post(`/channels/${channelId}/messenger/menu/get-started`, { payload }),

    listMessengerTemplates: (channelId: string | number | undefined, params?: Record<string, string | undefined>) =>
        api.get(`/channels/${channelId}/messenger/templates${buildQuery({
            category: params?.category,
            language: params?.language,
            search: params?.search,
        })}`),
    previewMessengerTemplate: (channelId: string | number, templateId: string, variables: Record<string, string>) =>
        api.post(`/channels/${channelId}/messenger/templates/${encodeURIComponent(templateId)}/preview`, { variables }),
    syncMessengerTemplates: (channelId: string | number) =>
        api.post(`/channels/${channelId}/messenger/templates/sync`),

    listIceBreakers: (channelId: string | number) =>
        api.get(`/channels/${channelId}/instagram/icebreakers`),
    syncIceBreakers: (channelId: string | number) =>
        api.post(`/channels/${channelId}/instagram/icebreakers/sync`),
    pushIceBreakers: (channelId: string | number, items: IceBreakerItem[]) =>
        api.post(`/channels/${channelId}/instagram/icebreakers/push`, { items }),

    getPrivateRepliesConfig: (channelId: string | number) =>
        api.get(`/channels/${channelId}/meta/automation/private-replies`),
    savePrivateRepliesConfig: (channelId: string | number, payload: PrivateRepliesConfig) =>
        api.put(`/channels/${channelId}/meta/automation/private-replies`, payload),
    getStoryRepliesConfig: (channelId: string | number) =>
        api.get(`/channels/${channelId}/meta/automation/story-replies`),
    saveStoryRepliesConfig: (channelId: string | number, payload: StoryRepliesConfig) =>
        api.put(`/channels/${channelId}/meta/automation/story-replies`, payload),
    listMetaAutomationTargets: (channelId: string | number) =>
        api.get(`/channels/${channelId}/meta/automation/targets`),


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

