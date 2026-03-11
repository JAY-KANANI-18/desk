import { Conversation } from "../pages/inbox/types";
import { Message } from "../pages/inbox/types";
import { api } from "./api";
import { apiFetch } from "./apiClient";

export interface AssignEvent {
    conversationId: number;
    contactName: string;
    assignedBy: string;
}

export interface MentionEvent {
    conversationId: number;
    contactName: string;
    mentionedBy: string;
    text: string;
}
export const inboxApi = {
    getConversations: async (): Promise<Conversation[]> => {
        const res = await apiFetch("/conversations");
        // if (!res.ok) throw new Error("Failed to fetch conversations");
        return res;
    },

    getMessages: async (conversationId: number): Promise<Message[]> => {
        const res = await apiFetch(`/conversations/${conversationId}/messages`);
        // if (!res.ok) throw new Error("Failed to fetch messages");
        return res;
    },
      sendMessage: (channelId: string, conversationId: string, message: any) =>
        api.post(`/conversations/${conversationId}/messages`, { channelId, conversationId, ...message }),
    markConversationRead: async (conversationId: number): Promise<Message[]> => {
        const res = await api.post(`/conversations/${conversationId}/messages/read`);
        // if (!res.ok) throw new Error("Failed to fetch messages");
        return res;
    },

    // sendMessage: async (
    //     msg: Omit<Message, "id" | "status">
    // ): Promise<Message> => {
    //     const res = await apiFetch("/messages", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(msg),
    //     });
    //     // if (!res.ok) throw new Error("Failed to send message");
    //     return res;
    // },

    getPresignedUploadUrl: async ({type, fileName, contentType, entityId} : { type: string; fileName: string; contentType: string; entityId: string }): Promise<{ uploadUrl: string; fileUrl: string }> => {
        const res = await apiFetch("/files/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, fileName, contentType, entityId }),
        });
        return res;
    },
  
    subscribeToUpdates: (
        onNewMessage: (msg: Message) => void,
        onNewConversation: (conv: Conversation) => void,
        onAssign: (evt: AssignEvent) => void,
        onMention: (evt: MentionEvent) => void
    ): (() => void) => {
        console.info("[InboxContext] Real-time subscription not yet implemented.");
        return () => { };
    },
};