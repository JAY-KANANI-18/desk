# System Patterns & Conventions

*This file is the single source of truth for recurring patterns, conventions, and technical standards in this project.*

## Purpose

Documents the established architecture patterns, coding conventions, and technical standards the project follows. This file exists so the agent (and future sessions) can produce consistent code without re-discovering or re-debating how things are done here.

## When to Update This File

Update this file when:
- A new architectural pattern is introduced or adopted (e.g., repository pattern, event-driven flow)
- A coding convention is established that deviates from language defaults
- A reusable approach is identified and should be applied consistently (error handling, logging, validation)
- A pattern is deprecated or replaced by a better approach
- A new integration point is added that follows (or defines) a standard interface
- File/folder structure conventions change

**Do not** document one-off implementations. Only patterns that should be **replicated** across the codebase belong here.

## Format

Organize patterns by category. Each pattern follows this structure:

```
### [Pattern Name]

**Category:** Architecture | Data Flow | Error Handling | Testing | API Design | File Structure | [Other]
**Status:** Active | Deprecated
**Description:** What the pattern is and when to apply it.
**Implementation:**
[Code example or step-by-step description]
**Rationale:** Why this pattern was chosen.
```

When a pattern is **deprecated** you can either delete it or update its status and note the replacement.

If this file gets corrupted, re-create it. 
CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

---

## Architecture

### DUMMY_MODE API Layer Pattern

**Category:** Architecture
**Status:** Active
**Description:** All data-fetching pages use a `DUMMY_MODE = true` flag at the top of the file. A `*Api` object defines all API stubs — each stub returns mock data when `DUMMY_MODE = true`, or calls real `fetch()` endpoints when `false`. Flip the flag to activate real API calls with zero other changes.
**Implementation:**
1. Define all TypeScript types/interfaces (exported) at the top
2. Define `MOCK_DATA` constants with all seed data
3. Set `DUMMY_MODE = true` and a `delay()` helper
4. Define `*Api` object with typed async stubs (JSDoc comment per endpoint)
5. Each component: `useEffect` → load, `loading`/`error` state, async handlers with optimistic updates + revert-on-error
**Rationale:** Enables full UI development without a backend; switching to real API requires only flipping one flag. Used in `InboxContext.tsx` and `WorkspaceSettings.tsx`.

## Data Flow

### Optimistic Update + Revert Pattern

**Category:** Data Flow
**Status:** Active
**Description:** For mutations (add/update/delete), update local state immediately (optimistic), call the API, and revert by re-fetching if the API call fails.
**Implementation:** `setState(optimisticValue); try { await api.mutate(); } catch { load(); }`
**Rationale:** Instant UI feedback; correctness guaranteed by revert on failure.

### Notification System Pattern

**Category:** Architecture
**Status:** Active
**Description:** Three-layer notification system: sound synthesis (Web Audio API), context state, and toast UI.
**Implementation:**
1. `src/lib/notificationSound.ts` — `playNotificationSound(type)` synthesises tones via Web Audio API (no files)
2. `src/context/NotificationContext.tsx` — `notify()`, `dismiss()`, `dismissAll()`, `soundEnabled` toggle; auto-dismiss after 5.5s
3. `src/components/NotificationList.tsx` — `NotificationListWrapper` renders slide-in toasts in `Layout.tsx`
4. Callers (e.g. `InboxContext`) use `notifyRef` pattern to call `notify()` from intervals without stale closures
5. Socket-ready: `inboxApi.subscribeToUpdates` accepts `onAssign` and `onMention` callbacks alongside existing ones
**Rationale:** Decoupled from inbox logic; any future feature can call `useNotifications().notify()` to fire a toast + sound.

### Auth API Layer Pattern

**Category:** Architecture
**Status:** Active
**Description:** All auth operations go through `src/lib/authApi.ts` which has a single `DUMMY_MODE` flag. When true, uses mock users and localStorage sessions. When false, delegates to Supabase. `AuthContext` never imports Supabase directly.
**Implementation:**
1. `DUMMY_MODE = true` at top of `authApi.ts`
2. `MOCK_USERS` array with email/password/role for each demo account
3. All methods: dummy branch first, real Supabase branch second
4. `AuthContext` calls `authApi.*` only — zero Supabase imports
5. Flip `DUMMY_MODE = false` to go live with zero other changes
**Rationale:** Same DUMMY_MODE pattern used across the whole app; consistent, easy to hand off to BE.

### Authorization Pattern

**Category:** Architecture
**Status:** Active
**Description:** Role-based access control via `AuthorizationContext`. Roles: `owner > admin > supervisor > agent`. Each role maps to a set of `Permission` strings in `ROLE_PERMISSIONS`.
**Implementation:**
1. `useAuthorization().can(permission)` — boolean check in components
2. `<RoleGuard permission="billing.manage">` — inline conditional rendering
3. `<ProtectedRoute permission="billing.view">` — route-level guard (shows Access Denied screen)
4. Role comes from `user.role` in `AuthContext` (set by authApi from mock data or Supabase user_metadata)
**Rationale:** Decoupled from auth; BE just needs to set `role` in Supabase `user_metadata`.

## Error Handling

<!-- Standard approaches to errors, validation, and recovery -->
## Error Handling

### Environment Variables in Sandpack

**Category:** Architecture
**Status:** Active
**Description:** Sandpack's bundler does not support `import.meta.env` (Vite-specific). Always use `process.env.VITE_*` for environment variables in this project.
**Rationale:** Sandpack uses a CodeSandbox-style bundler, not Vite, despite the project having a `vite.config.ts`.
