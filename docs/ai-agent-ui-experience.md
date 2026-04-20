# Axodesk AI Agents Frontend Experience

This is the frontend product specification for Axodesk AI Agents. It describes what customers see, how they move through the feature, how state updates, and how the UI behaves when the backend feature flag disables AI Agents.

## 1. Full Information Architecture

Primary navigation:

```text
AI Agents
  List
  Create Agent Wizard
  Agent Detail
    Overview
    Prompt & Behavior
    Knowledge Base
    Tools / Actions
    Guardrails
    Versions
    Test Playground
    Analytics
  Approval Queue
  Usage

Inbox
  Conversation header AI badges
  AI message styling
  AI sidebar panel
    summary
    intent
    confidence
    memory facts
    pending approvals
    pause/resume/regenerate/takeover

Billing
  AI usage entry point
```

Feature disabled behavior:

- If `AI_AGENTS_ENABLED=false` or `FEATURE_AI_AGENTS_ENABLED=false` in the backend environment, the frontend receives `aiAgents: false`.
- AI Agents navigation is hidden.
- AI Agent routes redirect to `/inbox`.
- Inbox AI badges and AI sidebar panel do not render.
- Direct API calls to `/api/ai-agents/*` are blocked by the backend feature guard.

## 2. Route / Page Structure

Implemented routes:

```text
/ai-agents
  AI Agents list page

/ai-agents/new
  Create Agent wizard

/ai-agents/:agentId
  Agent detail shell with tabs

/ai-agents/:agentId?tab=behavior
/ai-agents/:agentId?tab=knowledge
/ai-agents/:agentId?tab=tools
/ai-agents/:agentId?tab=guardrails
/ai-agents/:agentId?tab=versions
/ai-agents/:agentId?tab=playground
/ai-agents/:agentId?tab=analytics

/ai-agents/approvals
  Manager approval queue

/ai-agents/usage
  Billing and usage page
```

Route protection:

```text
ws:ai-agents:view
  list, detail, usage, analytics, inbox AI panels

ws:ai-agents:manage
  create, publish, pause, rollback, approvals, pause/resume AI in inbox
```

## 3. React Component Hierarchy

```text
FeatureFlagsProvider
  Layout
    AppSidebar
    MobileBottomNav
    WorkspaceRouter
      AiAgentsFeatureRoute
        AiAgentsListPage
        CreateAgentWizardPage
        AgentDetailPage
          OverviewTab
          BehaviorTab
          KnowledgeTab
          ToolsTab
          GuardrailsTab
          VersionsTab
          PlaygroundTab
          AnalyticsTab
        ApprovalQueuePage
        AiUsagePage

InboxPage
  ChatHeader
    AiConversationBadges
  MessageArea
    TimelineItemRow
      MessageBubble with AI source styling
  ContactSidebarHybrid
    AiConversationPanel
```

Shared AI primitives:

```text
PageShell
PageHeader
StatusBadge
ChannelPills
MetricTile
EmptyState
SkeletonRows
```

## 4. Screen-By-Screen UX Behavior

AI Agents list:

- Shows name, type, status, enabled channels, conversations handled today, success rate, last updated, and actions.
- Filters by status, type, and channel.
- Empty state prompts managers to create the first agent.
- Row menu supports edit, duplicate, pause, publish new version, analytics, and delete/archive.

Create Agent wizard:

- Step 1: choose template: Sales, Support, Receptionist, Lead Qualifier, Custom Blank.
- Step 2: identity: name, description, tone, language.
- Step 3: channels: WhatsApp, Instagram, Messenger, Email, Website chat.
- Step 4: permissions: reply, assign, create lead, update CRM, trigger workflow, escalate.
- Step 5: save draft or publish.
- Users can go back without losing state.

Agent detail:

- Overview shows health, live status, assigned channels, and activity.
- Prompt & Behavior edits system instructions, tone, language, escalation posture, and hours.
- Knowledge Base creates sources and shows status, last sync, and re-sync action.
- Tools toggles allowed actions with risk labels.
- Guardrails controls confidence threshold, max auto replies, pricing, refunds, legal, and medical controls.
- Versions shows drafts, published versions, and rollback.
- Analytics shows handled, resolution, handoff, latency, provider usage.

Knowledge Base:

- Source types include website, file, FAQ, product catalog, and manual.
- Shows indexing state, last synced, and source metadata.
- Includes search inside sources.
- File upload UI is prepared to connect to the existing file/media upload pipeline.

Test Playground:

- Split screen.
- Left side is fake customer chat.
- Right side is debug panel with intent, confidence, response strategy, tools, actions, memory, and token/run logs.
- Supports retry, compare responses, and publish path.

Live Inbox:

- Header badges show `AI Handling`, `Waiting Approval`, or `Human Takeover`.
- AI messages are visually distinct.
- Right sidebar shows latest intent, confidence, pending approvals, memory facts, and controls.
- Managers can pause AI, resume AI, regenerate a run, or take over.

Approval Queue:

- Shows pending AI actions with agent, contact, intent, confidence, and tool payload.
- Supports approve, reject, edit then approve, and bulk approval.

Analytics:

- Shows conversations handled, auto resolution rate, handoff rate, avg response time, tokens, and cost by model.

Billing / Usage:

- Shows AI replies used, token usage, estimated cost, included quota, overage, and provider/model breakdown.

Mobile:

- AI Agents appears in mobile nav only when enabled.
- Owners/managers can approve actions and check usage.
- Inbox AI controls collapse into the contact sheet/sidebar flow.

## 5. API Integration Map

```text
GET    /api/features
  FeatureFlagsProvider

GET    /api/ai-agents
  AiAgentsListPage

POST   /api/ai-agents
  CreateAgentWizardPage, duplicate action

GET    /api/ai-agents/:agentId
  AgentDetailPage

PATCH  /api/ai-agents/:agentId/draft
  Behavior, Tools, Guardrails

POST   /api/ai-agents/:agentId/publish
  Wizard publish, Detail publish

POST   /api/ai-agents/:agentId/pause
  List action

POST   /api/ai-agents/:agentId/versions/:versionId/rollback
  Versions tab

DELETE /api/ai-agents/:agentId
  List delete/archive

GET    /api/ai-agents/tools
  Tools tab, wizard permissions

GET    /api/ai-agents/knowledge-sources
  Knowledge tab

POST   /api/ai-agents/knowledge-sources
  Knowledge add source

POST   /api/ai-agents/:agentId/test-runs
  Playground simulation

GET    /api/ai-agents/runs/:runId
  Playground debug panel

GET    /api/ai-agents/analytics
  Detail analytics, Usage

GET    /api/ai-agents/approvals
  Approval Queue

POST   /api/ai-agents/approvals/:actionId/approve
  Approval Queue

POST   /api/ai-agents/approvals/:actionId/reject
  Approval Queue

GET    /api/ai-agents/conversations/:conversationId/status
  Inbox header badges, AI sidebar panel

POST   /api/ai-agents/conversations/:conversationId/enqueue
  Regenerate reply

POST   /api/ai-agents/conversations/:conversationId/pause
  Pause AI, human takeover

POST   /api/ai-agents/conversations/:conversationId/resume
  Resume AI
```

## 6. Realtime Websocket Events

Frontend listeners are prepared for:

```text
ai_agent.updated
  Refresh list/detail.

ai_run.started
  Show AI Handling badge.

ai_run.completed
  Refresh inbox AI panel, list metrics, analytics.

ai_run.escalated
  Show Human Takeover badge and handoff summary.

ai_action.waiting_approval
  Show Waiting Approval badge, refresh approval queue, toast managers.

ai_action.updated
  Refresh approval queue and inbox panel.

ai_usage.updated
  Refresh usage page.
```

Current UI also works with polling/manual reload through API calls when events are not emitted yet.

## 7. State Management Approach

Current implementation:

- Uses existing Axodesk `api` wrapper.
- Uses local page state for loading, filters, drafts, and optimistic actions.
- Uses `FeatureFlagsProvider` for deployment-level feature gates.
- Uses Socket.IO listeners for cache-like refresh triggers.
- Uses toast notifications for publish, approval, rejection, pause/resume, and source indexing.

TanStack Query target:

```text
query keys
  ["features"]
  ["ai-agents", workspaceId]
  ["ai-agent", workspaceId, agentId]
  ["ai-tools", workspaceId]
  ["ai-knowledge", workspaceId]
  ["ai-approvals", workspaceId]
  ["ai-run", workspaceId, runId]
  ["ai-conversation-status", workspaceId, conversationId]
  ["ai-analytics", workspaceId, dateRange]

mutations
  createAgent
  updateDraft
  publishAgent
  pauseAgent
  rollbackVersion
  createKnowledgeSource
  sandboxRun
  approveAction
  rejectAction
  pauseConversationAi
  resumeConversationAi
```

Cache invalidation:

- Publish/update invalidates list and detail.
- Approval mutations invalidate approvals and conversation status.
- Sandbox run invalidates run detail.
- Socket events invalidate the matching query keys.

Autosave:

- Prompt & Behavior can autosave with a 1-2s debounce.
- Version publish stays explicit.
- Guardrail and tool changes stay explicit to avoid accidental production changes.

## 8. UI Permissions Model

```text
WS_OWNER
  View and manage everything.

WS_MANAGER
  Create, configure, publish, approve, pause/resume, view analytics and usage.

WS_AGENT
  View AI status, summaries, and AI-generated context in inbox.
  Cannot publish, approve, pause/resume, or edit agent configuration.
```

Feature flag precedence:

- If backend says AI Agents are disabled, no role can see or use the UI.
- Direct routes redirect even if the user has permissions.

## 9. Best Enterprise UX Patterns

- Keep AI supervision visible but not noisy.
- Use explicit publish, rollback, and approval flows.
- Separate draft and production states.
- Make high-risk actions editable before approval.
- Put agent debug information in the playground, not in the live customer UI.
- Show confidence and handoff reason where a manager needs to decide.
- Use optimistic feedback for approvals, then refresh from the server.
- Keep knowledge indexing states visible.
- Keep mobile focused on approvals, status, takeover, and usage.
- Never show feature entry points when the backend has disabled the feature.

## 10. Respond.io-Inspired Flows Adapted For Axodesk

Agent creation:

```text
AI Agents -> Create Agent -> Template -> Identity -> Channels -> Permissions -> Save draft or Publish
```

Agent tuning:

```text
Agent Detail -> Prompt & Behavior -> Knowledge -> Tools -> Guardrails -> Playground -> Publish
```

Knowledge operations:

```text
Agent Detail -> Knowledge Base -> Add source -> Indexing status -> Search -> Re-sync
```

Human supervision:

```text
Inbox -> AI Handling badge -> Sidebar summary -> Pause AI / Take over / Regenerate
```

Approval workflow:

```text
Approval Queue -> Review pending action -> Approve / Reject / Edit then approve -> Inbox updates
```

Continuous improvement:

```text
Analytics -> Find high-handoff intents -> Update knowledge/prompt/guardrails -> Test Playground -> Publish version
```
