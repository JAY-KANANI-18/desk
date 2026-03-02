# API Integration Reference

> **Frontend → Backend contract for all API endpoints.**
> All endpoints are currently stubbed behind `DUMMY_MODE = true` flags.
> To go live: set `DUMMY_MODE = false` in the relevant file and ensure the backend implements the contracts below.

---

## Table of Contents

1. [Environment & Configuration](#1-environment--configuration)
2. [Shared Types](#2-shared-types)
3. [Auth API](#3-auth-api) — `src/lib/authApi.ts`
4. [Inbox API](#4-inbox-api) — `src/context/InboxContext.tsx`
5. [Workspace API](#5-workspace-api) — `src/pages/workspace/api.ts`
6. [Authorization & Roles](#6-authorization--roles)
7. [Real-Time / WebSocket](#7-real-time--websocket)
8. [Error Handling Convention](#8-error-handling-convention)

---

## 1. Environment & Configuration

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key |

> ⚠️ **Sandpack note:** Use `process.env.VITE_*` (not `import.meta.env`) in this environment.

**DUMMY_MODE flags (flip to `false` to go live):**

| File | Controls |
|---|---|
| `src/lib/authApi.ts` | All authentication flows |
| `src/context/InboxContext.tsx` | Conversations, messages, real-time |
| `src/pages/workspace/api.ts` | All workspace settings |

---

## 2. Shared Types

### `AuthUser`
```ts
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'supervisor' | 'agent';
}
```

### `Conversation`
```ts
type Conversation = {
  id: number;
  name: string;          // Contact display name
  message: string;       // Last message preview
  time: string;          // Display time string (e.g. "2:30 PM")
  unreadCount: number;
  tag: string;           // e.g. "New Lead", "Customer"
  avatar: string;        // 2-letter initials
  channel: string;       // "whatsapp" | "email" | "instagram" | "facebook" | "websitechat"
  direction: 'incoming' | 'outgoing';
};
```

### `Message`
```ts
type Message = {
  id: number;
  conversationId: number;
  type: 'reply' | 'comment';
  text: string;
  author: string;
  initials: string;
  time: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  channel?: string;
  attachments?: MediaAttachment[];
};

type MediaAttachment = {
  type: 'image' | 'audio' | 'video' | 'doc';
  name: string;
  url: string;
  mimeType?: string;
  size?: number;         // bytes
};
```

### `Contact`
```ts
interface Contact {
  id: number;
  conversationId: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  lifecycleStage: string;
  tags: string[];
  avatar: string;
  channel: string;
}
```

---

## 3. Auth API

**File:** `src/lib/authApi.ts`
**Base path (Supabase):** Handled by `@supabase/supabase-js` SDK — no manual REST calls needed.

---

### `authApi.getSession()`

Returns the currently authenticated user, or `null`.

**Input:** none

**Output:**
```ts
AuthUser | null
```

---

### `authApi.onAuthStateChange(callback)`

Subscribe to auth state changes. Returns an unsubscribe function.

**Input:**
```ts
callback: (user: AuthUser | null) => void
```

**Output:**
```ts
() => void   // call to unsubscribe
```

---

### `authApi.login(email, password)`

Email + password sign-in.

**Input:**
```ts
email: string
password: string
```

**Output:**
```ts
{
  success: boolean;
  error?: string;    // human-readable error message
  user?: AuthUser;
}
```

**Demo credentials (DUMMY_MODE):**

| Email | Password | Role |
|---|---|---|
| `owner@demo.com` | `demo123` | owner |
| `admin@demo.com` | `demo123` | admin |
| `supervisor@demo.com` | `demo123` | supervisor |
| `agent@demo.com` | `demo123` | agent |

---

### `authApi.signup(name, email, password, orgData?)`

Create a new account. Triggers email OTP verification.

**Input:**
```ts
name: string
email: string
password: string
orgData?: {
  orgName?: string;
  role?: string;
  companySize?: string;
  industry?: string;
  website?: string;
}
```

**Output:**
```ts
{
  success: boolean;
  error?: string;
}
```

> After success, user must verify OTP via `authApi.verifyCode()` before session is created.

---

### `authApi.loginWithGoogle()`

Initiate Google OAuth redirect.

**Input:** none

**Output:** `void` (redirects to `/inbox` on success)

> Requires Google OAuth provider enabled in Supabase dashboard.

---

### `authApi.forgotPassword(email)`

Send a password-reset OTP / link to the given email.

**Input:**
```ts
email: string
```

**Output:**
```ts
{
  success: boolean;
  error?: string;
}
```

---

### `authApi.verifyCode(code, email, flow)`

Verify the 6-digit OTP sent to the user's email.

**Input:**
```ts
code: string                                    // 6-digit OTP
email: string
flow: 'signup' | 'forgot-password' | null
```

**Output:**
```ts
{
  success: boolean;
  error?: string;
  user?: AuthUser;   // populated on successful signup verification
}
```

> **Demo OTP:** `123456` (DUMMY_MODE only)

---

### `authApi.resendCode(email, flow)`

Re-send the OTP email.

**Input:**
```ts
email: string
flow: 'signup' | 'forgot-password' | null
```

**Output:** `void`

---

### `authApi.resetPassword(newPassword)`

Set a new password (called after OTP verification in forgot-password flow).

**Input:**
```ts
newPassword: string
```

**Output:**
```ts
{
  success: boolean;
  error?: string;
}
```

---

### `authApi.logout()`

Sign out the current user.

**Input:** none

**Output:** `void`

---

## 4. Inbox API

**File:** `src/context/InboxContext.tsx`
**Base path:** `/api`

---

### `GET /api/conversations`

Fetch all conversations for the current workspace.

**Input:** none (auth via session cookie / Bearer token)

**Output:**
```ts
Conversation[]
```

---

### `GET /api/messages?conversationId={id}`

Fetch all messages for a conversation.

**Input (query param):**
```
conversationId: number
```

**Output:**
```ts
Message[]
```

---

### `POST /api/messages`

Send a new message.

**Input (request body):**
```ts
{
  conversationId: number;
  type: 'reply' | 'comment';
  text: string;
  author: string;
  initials: string;
  time: string;
  channel?: string;
  attachments?: MediaAttachment[];
}
```

**Output:**
```ts
Message   // saved message with server-assigned id and status
```

---

### `POST /api/conversations/{id}/read`

Mark a conversation as read (clears unread count).

**Input (path param):**
```
id: number
```

**Output:** `204 No Content`

---

## 5. Workspace API

**File:** `src/pages/workspace/api.ts`
**Base path:** `/api`

---

### General Info

#### `GET /api/workspace/info`

**Output:**
```ts
{
  workspaceName: string;
  workspaceId: string;
  timezone: string;
  language: string;
  dateFormat: string;
}
```

#### `PUT /api/workspace/info`

**Input (body):**
```ts
{
  workspaceName: string;
  workspaceId: string;
  timezone: string;
  language: string;
  dateFormat: string;
}
```

**Output:** `204 No Content`

---

### User Profile

#### `GET /api/user/profile`

**Output:**
```ts
{
  name: string;
  email: string;
  phone: string;
  role: string;
}
```

#### `PUT /api/user/profile`

**Input (body):**
```ts
{
  name: string;
  email: string;
  phone: string;
  role: string;
}
```

**Output:** `204 No Content`

---

### Availability

#### `GET /api/user/availability`

**Output:**
```ts
'online' | 'busy' | 'offline'
```

#### `PUT /api/user/availability`

**Input (body):**
```ts
{ status: 'online' | 'busy' | 'offline' }
```

**Output:** `204 No Content`

---

### Notification Preferences

#### `GET /api/user/notifications`

**Output:**
```ts
{
  email: boolean;
  browser: boolean;
  mobile: boolean;
  mentions: boolean;
  assignments: boolean;
  newConversations: boolean;
}
```

#### `PUT /api/user/notifications`

**Input (body):** Same shape as GET output.

**Output:** `204 No Content`

---

### Password

#### `POST /api/user/change-password`

**Input (body):**
```ts
{
  currentPassword: string;
  newPassword: string;
}
```

**Output:** `204 No Content` or `{ error: string }` on failure

---

### Team Members

#### `GET /api/team/members`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited';
  avatar: string;   // 2-letter initials
}>
```

#### `POST /api/team/invite`

**Input (body):**
```ts
{
  email: string;
  role: string;   // 'Admin' | 'Agent' | 'Manager' | 'Supervisor'
}
```

**Output:**
```ts
{
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Invited';
  avatar: string;
}
```

#### `PUT /api/team/members/{id}/role`

**Input (body):**
```ts
{ role: string }
```

**Output:** `204 No Content`

#### `POST /api/team/members/{id}/resend-invite`

**Output:** `204 No Content`

#### `DELETE /api/team/members/{id}`

**Output:** `204 No Content`

---

### Teams (Groups)

#### `GET /api/teams`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  description: string;
  memberIds: number[];   // references TeamMember.id
}>
```

#### `POST /api/teams`

**Input (body):**
```ts
{
  name: string;
  description: string;
  memberIds: number[];
}
```

**Output:** `Team` object with server-assigned `id`

#### `PUT /api/teams/{id}`

**Input (body):** Partial `Team` (any subset of `name`, `description`, `memberIds`)

**Output:** `204 No Content`

#### `DELETE /api/teams/{id}`

**Output:** `204 No Content`

---

### Channels

#### `GET /api/channels`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  identifier: string;   // phone number, username, or email
  status: 'Connected' | 'Error';
  icon: string;
  color: string;        // Tailwind bg class
  msgs: number;
  channelType?: 'whatsapp' | 'instagram' | 'facebook' | 'gmail' | 'email';
}>
```

#### `DELETE /api/channels/{id}`

Disconnect a channel.

**Output:** `204 No Content`

---

### Integrations

#### `GET /api/integrations`

**Output:**
```ts
Array<{
  id: string;           // e.g. 'zapier', 'slack', 'hubspot'
  name: string;
  desc: string;
  icon: string;
  category: string;
  connected: boolean;
}>
```

#### `POST /api/integrations/{id}/connect`

**Output:** `204 No Content`

#### `POST /api/integrations/{id}/disconnect`

**Output:** `204 No Content`

---

### Growth Widget

#### `GET /api/widget/config`

**Output:**
```ts
{
  color: string;          // hex color e.g. "#4f46e5"
  position: string;       // 'bottom-right' | 'bottom-left'
  greeting: string;
  showOnMobile: boolean;
  autoOpen: boolean;
  delay: string;          // seconds as string e.g. "3"
}
```

#### `PUT /api/widget/config`

**Input (body):** Same shape as GET output.

**Output:** `204 No Content`

---

### Contact Fields

#### `GET /api/contact-fields`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  type: 'Text' | 'Email' | 'Phone' | 'Dropdown' | 'Date' | 'Number';
  required: boolean;
  system: boolean;   // system fields cannot be deleted
}>
```

#### `POST /api/contact-fields`

**Input (body):**
```ts
{
  name: string;
  type: string;
  required: boolean;
  system: boolean;
}
```

**Output:** `ContactField` with server-assigned `id`

#### `PUT /api/contact-fields/{id}`

**Input (body):** Partial `ContactField`

**Output:** `204 No Content`

#### `DELETE /api/contact-fields/{id}`

**Output:** `204 No Content`

---

### Lifecycle Stages

#### `GET /api/lifecycle/stages`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  color: string;   // hex color
  count: number;   // number of contacts in this stage (read-only)
}>
```

#### `POST /api/lifecycle/stages`

**Input (body):**
```ts
{
  name: string;
  color: string;
}
```

**Output:** `LifecycleStage` with `id` and `count: 0`

#### `PUT /api/lifecycle/stages/{id}`

**Input (body):** Partial `LifecycleStage`

**Output:** `204 No Content`

#### `DELETE /api/lifecycle/stages/{id}`

**Output:** `204 No Content`

---

### Closing Notes

#### `GET /api/closing-notes/settings`

**Output:**
```ts
{
  required: boolean;
  templates: Array<{
    id: number;
    title: string;
    text: string;
  }>;
}
```

#### `PUT /api/closing-notes/required`

**Input (body):**
```ts
{ required: boolean }
```

**Output:** `204 No Content`

#### `POST /api/closing-notes/templates`

**Input (body):**
```ts
{
  title: string;
  text: string;
}
```

**Output:** `ClosingNoteTemplate` with server-assigned `id`

#### `DELETE /api/closing-notes/templates/{id}`

**Output:** `204 No Content`

---

### Snippets

#### `GET /api/snippets`

**Output:**
```ts
Array<{
  id: number;
  shortcut: string;   // e.g. "/greeting"
  title: string;
  content: string;    // supports {{contact.firstName}} variables
}>
```

#### `POST /api/snippets`

**Input (body):**
```ts
{
  shortcut: string;
  title: string;
  content: string;
}
```

**Output:** `Snippet` with server-assigned `id`

#### `PUT /api/snippets/{id}`

**Input (body):** Partial `Snippet`

**Output:** `204 No Content`

#### `DELETE /api/snippets/{id}`

**Output:** `204 No Content`

---

### Conversation Tags

#### `GET /api/tags`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  color: string;   // hex color
  count: number;   // number of conversations with this tag (read-only)
}>
```

#### `POST /api/tags`

**Input (body):**
```ts
{
  name: string;
  color: string;
}
```

**Output:** `ConversationTag` with `id` and `count: 0`

#### `DELETE /api/tags/{id}`

**Output:** `204 No Content`

---

### AI Settings

#### `GET /api/ai/settings`

**Output:**
```ts
{
  enabled: boolean;
  autoSuggest: boolean;
  tone: 'professional' | 'friendly' | 'formal';
  language: 'auto' | string;   // ISO language code
  summarize: boolean;
  sentiment: boolean;
  translate: boolean;
  smartReply: boolean;
}
```

#### `PUT /api/ai/settings`

**Input (body):** Same shape as GET output.

**Output:** `204 No Content`

---

### AI Prompts

#### `GET /api/ai/prompts`

**Output:**
```ts
Array<{
  id: number;
  name: string;
  prompt: string;
  active: boolean;   // only one prompt can be active at a time
}>
```

#### `POST /api/ai/prompts`

**Input (body):**
```ts
{
  name: string;
  prompt: string;
}
```

**Output:** `AIPrompt` with `id` and `active: false`

#### `PUT /api/ai/prompts/{id}`

**Input (body):** Partial `AIPrompt`

**Output:** `204 No Content`

#### `DELETE /api/ai/prompts/{id}`

**Output:** `204 No Content`

#### `POST /api/ai/prompts/{id}/activate`

Set a prompt as the active one (deactivates all others).

**Output:** `204 No Content`

---

### Call Settings

#### `GET /api/calls/settings`

**Output:**
```ts
{
  enabled: boolean;
  recording: boolean;
  voicemail: boolean;
  transcription: boolean;
  holdMusic: boolean;
  callerId: string;          // E.164 phone number
  maxDuration: string;       // minutes as string e.g. "60"
  voicemailGreeting: string;
}
```

#### `PUT /api/calls/settings`

**Input (body):** Same shape as GET output.

**Output:** `204 No Content`

---

## 6. Authorization & Roles

Role comes from `user.role` in `AuthUser` (set by `authApi` from mock data or Supabase `user_metadata.role`).

### Role Hierarchy

```
owner > admin > supervisor > agent
```

### Permission Matrix

| Permission | owner | admin | supervisor | agent |
|---|:---:|:---:|:---:|:---:|
| `inbox.view` | ✅ | ✅ | ✅ | ✅ |
| `inbox.assign` | ✅ | ✅ | ✅ | ❌ |
| `inbox.resolve` | ✅ | ✅ | ✅ | ✅ |
| `inbox.delete` | ✅ | ✅ | ❌ | ❌ |
| `contacts.view` | ✅ | ✅ | ✅ | ✅ |
| `contacts.edit` | ✅ | ✅ | ✅ | ❌ |
| `contacts.delete` | ✅ | ✅ | ❌ | ❌ |
| `contacts.import` | ✅ | ✅ | ❌ | ❌ |
| `broadcast.view` | ✅ | ✅ | ✅ | ✅ |
| `broadcast.send` | ✅ | ✅ | ✅ | ❌ |
| `workflows.view` | ✅ | ✅ | ✅ | ✅ |
| `workflows.manage` | ✅ | ✅ | ❌ | ❌ |
| `reports.view` | ✅ | ✅ | ✅ | ✅ |
| `reports.export` | ✅ | ✅ | ❌ | ❌ |
| `channels.view` | ✅ | ✅ | ✅ | ✅ |
| `channels.manage` | ✅ | ✅ | ❌ | ❌ |
| `team.view` | ✅ | ✅ | ✅ | ✅ |
| `team.manage` | ✅ | ✅ | ❌ | ❌ |
| `billing.view` | ✅ | ✅ | ❌ | ❌ |
| `billing.manage` | ✅ | ❌ | ❌ | ❌ |
| `workspace.settings` | ✅ | ✅ | ❌ | ❌ |

### Frontend Usage

```tsx
// Hook
const { can, hasRole } = useAuthorization();
if (can('billing.manage')) { /* show billing controls */ }

// Component guard
<RoleGuard permission="team.manage">
  <InviteMemberButton />
</RoleGuard>

// Route guard
<ProtectedRoute permission="workspace.settings" />
```

---

## 7. Real-Time / WebSocket

**File:** `src/context/InboxContext.tsx` → `inboxApi.subscribeToUpdates()`

The frontend expects a single subscription function that fires callbacks for four event types:

```ts
inboxApi.subscribeToUpdates(
  onNewMessage:      (msg:  Message)      => void,
  onNewConversation: (conv: Conversation) => void,
  onAssign:          (evt:  AssignEvent)  => void,
  onMention:         (evt:  MentionEvent) => void,
): () => void   // returns unsubscribe function
```

### Event Shapes

#### `AssignEvent`
```ts
{
  conversationId: number;
  contactName: string;
  assignedBy: string;   // agent name who made the assignment
}
```

#### `MentionEvent`
```ts
{
  conversationId: number;
  contactName: string;
  mentionedBy: string;  // agent name who mentioned
  text: string;         // the mention message text
}
```

### Implementation Notes

- Replace the stub in `inboxApi.subscribeToUpdates` with a WebSocket or Supabase Realtime subscription
- The `onAssign` and `onMention` callbacks are already wired to `notify()` in `NotificationContext`
- Unsubscribe function must clean up all listeners to prevent memory leaks

---

## 8. Error Handling Convention

All API methods throw on non-2xx responses:

```ts
if (!res.ok) throw new Error('Human-readable error message');
```

The frontend uses the **optimistic update + revert** pattern for all mutations:

```ts
// 1. Apply optimistic update
setState(optimisticValue);

// 2. Call API
try {
  await api.mutate(data);
} catch (err) {
  // 3. Revert by re-fetching on failure
  load();
}
```

### Auth API Error Shape

Auth methods return structured errors instead of throwing:

```ts
{ success: false, error: 'Human-readable message' }
```

### HTTP Status Codes Expected

| Status | Meaning |
|---|---|
| `200 OK` | GET with body |
| `201 Created` | POST that creates a resource |
| `204 No Content` | PUT / DELETE success |
| `400 Bad Request` | Validation error — body: `{ error: string }` |
| `401 Unauthorized` | Missing or invalid session |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unexpected server failure |
