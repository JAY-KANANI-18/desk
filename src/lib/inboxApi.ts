import { Conversation } from "../pages/inbox/types";
import { Message } from "../pages/inbox/types";
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

    sendMessage: async (
        msg: Omit<Message, "id" | "status">
    ): Promise<Message> => {
        const res = await apiFetch("/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });
        // if (!res.ok) throw new Error("Failed to send message");
        return res;
    },

    markConversationRead: async (conversationId: number): Promise<void> => {
        await apiFetch(`/conversations/${conversationId}/read`, {
            method: "POST",
        });
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