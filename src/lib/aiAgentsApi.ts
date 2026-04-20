import { api } from "./api";
import type {
  AiAgentDetail,
  AiAgentListItem,
  AiAnalyticsSummary,
  AiApproval,
  AiConversationStatus,
  AiKnowledgeSource,
  AiRunDetail,
  AiSandboxRun,
} from "../modules/ai-agents/types";

export const aiAgentsApi = {
  features: (): Promise<{ aiAgents: boolean }> => api.get("/features"),

  list: (): Promise<AiAgentListItem[]> => api.get("/ai-agents"),

  create: (payload: Record<string, any>): Promise<{ agent: AiAgentListItem; draftVersion: any }> =>
    api.post("/ai-agents", payload),

  get: (agentId: string): Promise<AiAgentDetail> => api.get(`/ai-agents/${agentId}`),

  updateDraft: (agentId: string, payload: Record<string, any>) =>
    api.patch(`/ai-agents/${agentId}/draft`, payload),

  publish: (agentId: string) => api.post(`/ai-agents/${agentId}/publish`),

  pause: (agentId: string) => api.post(`/ai-agents/${agentId}/pause`),

  rollback: (agentId: string, versionId: string) =>
    api.post(`/ai-agents/${agentId}/versions/${versionId}/rollback`),

  archive: (agentId: string) => api.delete(`/ai-agents/${agentId}`),

  tools: () => api.get("/ai-agents/tools"),

  knowledgeSources: (): Promise<AiKnowledgeSource[]> => api.get("/ai-agents/knowledge-sources"),

  createKnowledgeSource: (payload: Record<string, any>): Promise<AiKnowledgeSource> =>
    api.post("/ai-agents/knowledge-sources", payload),

  sandboxRun: (agentId: string, payload: { conversationId: string; message: string }): Promise<AiSandboxRun> =>
    api.post(`/ai-agents/${agentId}/test-runs`, payload),

  enqueueConversationRun: (conversationId: string, messageId?: string) =>
    api.post(`/ai-agents/conversations/${conversationId}/enqueue`, { messageId }),

  conversationStatus: (conversationId: string): Promise<AiConversationStatus> =>
    api.get(`/ai-agents/conversations/${conversationId}/status`),

  pauseConversation: (conversationId: string) =>
    api.post(`/ai-agents/conversations/${conversationId}/pause`),

  resumeConversation: (conversationId: string) =>
    api.post(`/ai-agents/conversations/${conversationId}/resume`),

  approvals: (): Promise<AiApproval[]> => api.get("/ai-agents/approvals"),

  approveAction: (actionId: string, input?: Record<string, any>) =>
    api.post(`/ai-agents/approvals/${actionId}/approve`, { input }),

  rejectAction: (actionId: string, reason?: string) =>
    api.post(`/ai-agents/approvals/${actionId}/reject`, { reason }),

  run: (runId: string): Promise<AiRunDetail> => api.get(`/ai-agents/runs/${runId}`),

  feedback: (payload: Record<string, any>) => api.post("/ai-agents/feedback", payload),

  analytics: (params?: { from?: string; to?: string }): Promise<AiAnalyticsSummary> => {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    const query = search.toString();
    return api.get(`/ai-agents/analytics${query ? `?${query}` : ""}`);
  },
};
