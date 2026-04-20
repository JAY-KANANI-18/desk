export type AiAgentType = "sales" | "support" | "receptionist" | "custom";
export type AiAgentStatus = "draft" | "active" | "paused" | "archived";
export type AiApprovalMode = "off" | "first_reply" | "all_replies" | "tools_only";

export interface AiAgentListItem {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  agentType: AiAgentType;
  status: AiAgentStatus;
  activeVersionId?: string | null;
  activeVersion?: number | null;
  activeTone?: string | null;
  activeLanguage?: string | null;
  activeChannels?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  conversationsToday?: number;
  successRate?: number;
}

export interface AiAgentVersion {
  id: string;
  workspaceId: string;
  agentId: string;
  version: number;
  status: "draft" | "published" | "archived";
  name: string;
  tone: string;
  defaultLanguage: string;
  channelAllowlist: string[];
  businessHours: Record<string, any>;
  llmConfig: Record<string, any>;
  runtimeConfig: Record<string, any>;
  guardrails: Record<string, any>;
  toolsAllowed: string[];
  knowledgeSourceIds: string[];
  systemPrompt: string;
  approvalMode: AiApprovalMode;
  sandboxMode: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAgentDetail {
  agent: AiAgentListItem;
  versions: AiAgentVersion[];
}

export interface AiToolMeta {
  name: string;
  description: string;
  risk: "low" | "medium" | "high";
  requiresApprovalByDefault: boolean;
}

export interface AiKnowledgeSource {
  id: string;
  workspaceId: string;
  name: string;
  sourceType: "file" | "website" | "faq" | "product_catalog" | "manual";
  status: "pending" | "indexing" | "ready" | "failed" | "disabled";
  uri?: string | null;
  fileAssetId?: string | null;
  crawlerConfig: Record<string, any>;
  importConfig: Record<string, any>;
  lastIndexedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiSandboxRun {
  runId: string;
  status: "completed" | "waiting_approval" | "escalated" | "failed";
  reply: string | null;
  handoffReason?: string;
  decision: {
    intent: string;
    confidence: number;
    sentiment?: string;
    needsHuman: boolean;
    responseStrategy: string;
    tools: Array<{ name: string; input: Record<string, any>; reason: string }>;
    memoryUpdates: Array<{ scope: string; key: string; value: Record<string, any> }>;
  } | null;
  actions: Array<{
    toolName: string;
    status: string;
    output?: Record<string, any>;
    error?: string;
  }>;
}

export interface AiRunDetail {
  run: Record<string, any>;
  messages: Record<string, any>[];
  actions: Record<string, any>[];
  toolLogs: Record<string, any>[];
}

export interface AiApproval {
  id: string;
  runId: string;
  toolName: string;
  input: Record<string, any>;
  createdAt: string;
  conversationId?: string | null;
  contactId?: string | null;
  intent?: string | null;
  confidence?: number | null;
  agentName: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface AiConversationStatus {
  liveState: "idle" | "ai_handling" | "waiting_approval" | "human_takeover";
  latestRun: Record<string, any> | null;
  memories: Array<{ scope: string; key: string; value: Record<string, any>; confidence: number }>;
  pendingApprovals: Record<string, any>[];
  escalation: Record<string, any> | null;
}

export interface AiAnalyticsSummary {
  summary: {
    runs: number;
    completed: number;
    escalated: number;
    failed: number;
    avg_latency_ms: number | null;
    avg_confidence: number | null;
  };
  usage: Array<{
    provider: string;
    model: string;
    total_tokens: string | number;
    cost_micros: string | number;
  }>;
}
