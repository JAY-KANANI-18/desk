<instructions>
## 🚨 MANDATORY: CHANGELOG TRACKING 🚨

You MUST maintain this file to track your work across messages. This is NON-NEGOTIABLE.

---

## INSTRUCTIONS

- **MAX 5 lines** per entry - be concise but informative
- **Include file paths** of key files modified or discovered
- **Note patterns/conventions** found in the codebase
- **Sort entries by date** in DESCENDING order (most recent first)
- If this file gets corrupted, messy, or unsorted -> re-create it. 
- CRITICAL: Updating this file at the END of EVERY response is MANDATORY.
- CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

</instructions>

<changelog>
<!-- NEXT_ENTRY_HERE -->

### 2026-03-02 (docs)
- Created `workspace/API_INTEGRATION.md` — full frontend API integration reference
- Covers Auth API (10 methods), Inbox API (4 endpoints), Workspace API (40+ endpoints), real-time WebSocket contract
- Includes all TypeScript input/output shapes, permission matrix table, error handling convention, and DUMMY_MODE flip guide

### 2026-03-02 (feature)
- Enhanced `src/pages/Billing.tsx` — Update Payment Method button now opens a full modal with live card preview, card number/expiry/CVC fields, and save flow
- Added `BillingAddressSection` component: view mode shows formatted address, edit mode has full form (name, address, city, state, zip, country dropdown)
- Added `UsageSection` with 4 progress bars (Conversations, Team Members, Storage, API Calls) — red warning when ≥80%
- Payment card state persists in component; card brand auto-detected from number prefix (Visa/Mastercard)

### 2026-03-02 (feature)
- Added edit option to `src/pages/Contacts.tsx` — pencil icon button next to delete in Actions column
- `openEditModal` pre-fills `editForm` state with contact data; `handleUpdateContact` saves changes
- Edit modal: first/last name, email, phone, lifecycle dropdown, channel dropdown, tags (comma-separated)
- Optimistic update in DUMMY_MODE; calls `contactsApi.updateContact` in live mode

### 2026-03-02 (feature)
- Created `src/pages/AppSitemap.tsx` — full app overview page at `/sitemap`
- 30+ page cards organized in 6 categories (Core, Channels, Team & Org, Billing, Settings, Auth)
- Each card: colored top border, icon, URL badge, description, feature list (expandable), "Open Page" button
- Sticky search + category filter tabs; hero section with stats (pages, features, categories, auth flows)
- Added `Map` icon + Sitemap nav item to `Sidebar.tsx`; route added to `App.tsx`

### 2026-03-02 (fix)
- Fixed syntax error in `src/pages/BillingPlans.tsx` — unescaped apostrophe in FAQ string on line 108

### 2026-03-02 (feature)
- `WebsiteChatChannel.tsx` rewritten as 2-step flow: Step 1 = config (websites tag-input, theme color picker, icon selector), Step 2 = script copy + checkboxes
- Step 1 matches design: website multi-tag dropdown, hex color swatch input, 5 SVG chat icon options + upload button
- "Next" button on step 1 (currently disabled until website added); "Back" button on step 2 returns to config

### 2026-03-02 (feature)
- Added "Private Replies" nav item (with "New" badge) to Instagram manage page in `ManageChannelPage.tsx`
- `PrivateRepliesSection`: track mode radio (all posts vs specific), info banner, post list with delete
- `AddPostModal`: post URL, label, all-comments vs keyword filter, reply message textarea
- Nav items type extended with optional `badge?: string`; badge rendered as orange pill in sidebar

### 2026-03-02 (fix)
- Manage route updated to `/channel/manage/:channelType/:channelId` (was `:channelType` only)
- `Channels.tsx` `handleManage` now includes `ch.id` in the URL path
- `ManageChannelPage.tsx` reads `channelId` from `useParams` and displays it in the sidebar

### 2026-03-02 (feature)
- Created `src/pages/channels/ManageChannelPage.tsx` — full-page manage view with left sidebar + main content
- Sidebar: channel icon/name/ID, status badge, nav items (Configuration, Templates, Profile, Troubleshoot, Meta Product Catalog), Migrate button, Connected by, Additional Resources
- WhatsApp Cloud API config form: Chat Link (copy + QR), Channel Name (editable), Phone Number, WABA Name, Verified Name, Callback URL, Verify Token, Save Changes, Danger Zone (confirm disconnect)
- `CHANNEL_TYPE_TO_SLUG` map exported from `ManageChannelPage.tsx`; `Channels.tsx` Manage button navigates to `/channel/manage/:channelType` with channel data in location state
- `App.tsx` route added: `/channel/manage/:channelType`; disconnect navigates back with `disconnectedId` state


### 2026-03-02 (refactor)
- Replaced channel connect modals with dedicated pages at `/channel/connect/:channelId`
- Created `src/pages/channels/ConnectChannelPage.tsx` — full-page layout with breadcrumb, gradient bg, card wrapper
- `CHANNEL_CONNECT_SLUGS` map in `Channels.tsx` routes catalog IDs to URL slugs (whatsapp_cloud, facebook, instagram, email, gmail)
- After connecting, `navigate('/channels', { state: { newChannel } })` passes data back; `Channels` picks it up via `useEffect`
- Catalog cards with dedicated pages show a filled blue "Connect →" button with ExternalLink icon

### 2026-03-02 (fix)
- `Channels.tsx` catalog "Connect" button now opens a `SetupModal` overlay for channels with dedicated setup components (WhatsApp Cloud API, Facebook, Instagram, Email)
- `SETUP_COMPONENTS` map links catalog IDs to their setup components; channels without a map entry still simulate
- State lifted to `Channels` root: `channels` array shared between `ConnectedChannelsView` and `ChannelCatalogView`
- After connecting via modal, user is returned to the channels list with the new channel added

### 2026-03-02 (refactor)
- Redesigned `ChannelsSettings.tsx`: replaced two-panel layout with a channel card grid + modal flow
- Each channel card shows name, description, status badge, and Connect/Manage button
- Clicking Connect or Manage opens a `ChannelModal` overlay with the per-channel setup component
- After connecting, card updates to Connected state; Disconnect closes the modal automatically
- Added `__ANIMA_DBG__` log in `handleConnect` for debugging

### 2026-03-02 (feature)
- Created `src/pages/workspace/channels/` directory with 5 per-channel files + shared `types.ts` + `channelApi.ts`
- `WhatsAppCloudChannel.tsx`: credentials tab + "Connect via Meta" tab (FB.login); connected state shows YouTube video embed + 5-step setup guide; exports `WhatsAppSidebarInfo` for sub-sidebar
- `FacebookChannel.tsx`, `InstagramChannel.tsx`: FB.login with `declare const FB: any`; DUMMY_MODE simulates response
- `GmailChannel.tsx`: Google OAuth button; `EmailChannel.tsx`: SMTP/IMAP grid form
- `ChannelsSettings.tsx` rewritten as two-panel layout: left sub-sidebar (channel list + WhatsApp description when connected), right main content renders per-channel component

### 2026-03-02 (feature)
- Updated supported channels: WhatsApp Cloud API, Instagram, Facebook Messenger, Gmail, Email (SMTP/IMAP)
- `data.tsx`: updated `channelConfig` with proper icons (lucide Instagram/Facebook), added `gmail` channel type
- `api.ts`: updated `MOCK_DATA.channels` to reflect all 5 real channel types
- `ChannelsSettings.tsx`: rewrote with full "Add Channel" modal — channel picker + per-type setup form (OAuth or credentials)
- `InputArea.tsx`: email input now shown for both `email` and `gmail` channels

### 2026-03-02 (feature)
- Rewrote `src/pages/Organization.tsx` — sidebar nav layout matching design (Account + Billing groups)
- Sections: Account info, Admin settings, Security, Workspaces, WhatsApp fees (empty state), Billing & usage
- Default active section is "WhatsApp fees" with empty state (no channel connected + connect button)
- Each section is a standalone component; active section highlighted in blue in sidebar

### 2026-03-02 (feature)
- Created `src/context/CallContext.tsx` — DUMMY_MODE call state; simulates incoming call after 8s; `acceptCall/rejectCall/endCall/toggleMute/toggleHold/toggleSpeaker/toggleRecord`
- Created `src/components/IncomingCallWindow.tsx` — full-screen overlay with pulsing rings, contact info (or "Unknown caller"), Accept/Decline buttons; auto-dismisses after 30s
- Created `src/components/ActiveCallWindow.tsx` — floating dark panel (bottom-left); live timer, mute/hold/speaker/keypad/transfer/record controls, note input, minimizable pill
- `CallProvider` added to `App.tsx`; `IncomingCallWindow` + `ActiveCallWindow` mounted in `Layout.tsx`
- TopBar gets a green phone button to manually trigger a simulated incoming call (demo)

### 2026-03-02 (feature)
- Created `src/lib/authApi.ts` — DUMMY_MODE auth API layer; flip one flag to switch between mock and Supabase
- Mock users: owner/admin/supervisor/agent (all password `demo123`, OTP `123456`); session persisted in localStorage
- Created `src/context/AuthorizationContext.tsx` — Role type, Permission type, ROLE_PERMISSIONS map, `useAuthorization()`, `RoleGuard` component
- `AuthContext.tsx` refactored to delegate all calls to `authApi`; no direct Supabase imports
- `ProtectedRoute` accepts optional `permission` prop; shows Access Denied screen instead of redirect when authed but unauthorized
- `App.tsx` wraps Router with `AuthorizationProvider`; all routes annotated with required permissions
- `Login.tsx` shows collapsible demo credentials panel (only when DUMMY_MODE=true) with one-click fill

### 2026-03-02 (feature)
- Rewrote `src/pages/auth/SignUp.tsx` as a 2-step stepper form
- Step 1: account details (name, work email, password + strength meter, confirm password) + Google SSO
- Step 2: organization setup (org name, role, company size, industry, website)
- `StepIndicator` component with animated circles + connector line; per-step validation before advancing
- Extended `AuthContext.signup()` to accept optional `orgData` stored in Supabase `user_metadata`

### 2026-03-02 (feature)
- Rewrote `src/pages/inbox/ContactSidebar.tsx` — full edit mode with inline form (name, email, phone, company, lifecycle, tags)
- Duplicate detection on email/phone blur: checks all contacts for matching value, shows orange warning banner
- `MergeModal` component: side-by-side field comparison with radio selection per field; tags support "merge both" option
- Module-level contacts store (`_contacts` + pub-sub listeners) persists edits across conversation switches
- Added `Contact` interface to `src/pages/inbox/types.ts`

### 2026-03-02 (refactor)
- Moved notifications bell (with badge+panel), profile menu, and help menu from Sidebar to TopBar
- Removed trial banner ("Growth Plan trial ends in 4 days") from TopBar
- TopBar is now a proper app header: Help | Bell | divider | User avatar with dropdowns
- Sidebar simplified: removed user avatar, notifications button, and all related state/imports

### 2026-03-02 (feature)
- Bell icon in Sidebar now shows red unread badge; clicking opens a notification management panel
- `NotificationContext` extended with `history`, `unreadCount`, `markAllRead`, `dismissFromHistory`, `clearHistory`
- `NotificationPanel` component embedded in `Sidebar.tsx` — shows full history, per-item dismiss, clear all, sound toggle
- Opening the panel calls `markAllRead()` to reset the badge count
- Floating toasts (`NotificationListWrapper`) remain for real-time pop-ups; panel is for history/management

### 2026-03-02 (feature)
- Added full notification system: `src/lib/notificationSound.ts` (Web Audio API synth), `src/context/NotificationContext.tsx`
- Three event types: `new_message` (blue), `assign` (green), `mention` (violet) — each with distinct synthesised tones
- Dummy mode simulates all three: messages every 8s, new convs every 25s, assigns every 30s, mentions every 45s
- `InboxContext` wired to `useNotifications`; `subscribeToUpdates` API stub extended with `onAssign`/`onMention` for socket-ready future
- `NotificationListWrapper` renders slide-in toasts with progress bar, sound toggle, clear-all; placed in `Layout.tsx`

### 2026-03-02 (feature)
- Rewrote `src/pages/Workflows.tsx` — added template gallery view between list and canvas
- 18 predefined templates across 8 categories (Welcome, Leads, Support, Sales, Re-engagement, Notifications)
- Category sidebar with counts, search filter, "Start from Scratch" card at top
- Template cards show icon, name, description, popular badge; clicking opens canvas with pre-configured nodes
- Three-view state machine: list → templates → canvas; Back navigation between views

### 2026-03-02 (feature)
- Renamed "Profile Settings" → "Personal Settings" in menuConfig + index router
- Added "Teams" menu item under "User role settings" with `UsersRound` icon
- Created `src/pages/workspace/sections/Teams.tsx` — list/create/edit/delete teams with member picker
- Added `Team` interface to `types.ts`; added `getTeams/createTeam/updateTeam/deleteTeam` stubs to `api.ts`
- Teams section shows member avatar stack, member count, hover actions (edit/delete)

### 2026-03-02 (refactor)
- Renamed "User settings" → "Profile Settings" (own profile/notifications/password) in menuConfig + index
- Renamed "Team settings" → "User settings" (manage all users) in menuConfig + index
- `TeamSettings.tsx` updated: "All users" table, edit role modal (Pencil icon), resend invite (MailCheck icon for Invited status)
- Added `resendInvite` stub to `api.ts`; active/pending counts shown in section header

### 2026-03-02 (refactor)
- Destructured `src/pages/WorkspaceSettings.tsx` (~1000 lines) into 22 focused files under `src/pages/workspace/`
- `types.ts` (all interfaces), `api.ts` (DUMMY_MODE + workspaceApi), `WorkspaceContext.tsx` (activeItem context)
- `menuConfig.tsx`, `components/` (Toggle, SectionLoader, SectionError), `sections/` (14 section files)
- `WorkspaceSettings.tsx` reduced to a single re-export; `App.tsx` unchanged
- Renamed `Tag` interface → `ConversationTag` to avoid conflict with lucide-react `Tag` icon


### 2026-03-01 (refactor)
- Refactored `src/pages/WorkspaceSettings.tsx` — full API-ready restructure with `DUMMY_MODE` flag
- All 14 sections now use `useEffect` + async handlers; `workspaceApi` object with 40+ typed stubs
- All mock data extracted into `MOCK_DATA` constants; all types exported as interfaces
- Optimistic updates + revert-on-error pattern for all mutations; loading/error states per section
- `SectionLoader` + `SectionError` reusable components; password change has its own isolated form state

### 2026-03-01 (feature)
- Filled all 14 workspace settings pages in `src/pages/WorkspaceSettings.tsx` with full functional UI
- General info (logo, name, timezone, language), User settings (profile, availability, notifications, password)
- Team settings (member table, invite modal, role management), Channels (connected list + error alert)
- Integrations (8 cards with connect/disconnect toggle), Growth widgets (color picker, position, embed code)
- Contact fields (add/delete/toggle required), Lifecycle (color-coded stages, add/edit/delete), Snippets/Tags/AI/Calls

### 2026-03-01 (feature)
- Added pagination to `src/pages/Contacts.tsx` — PAGE_SIZE=10, Prev/Next + numbered page buttons
- `currentPage` resets to 1 on filter/sort/search change via `useEffect`
- Table body now renders `paginatedContacts` slice; footer bar shown only when total > PAGE_SIZE
- Fixed misaligned table columns — 7 columns: ☐ | Name | Channel | Lifecycle | Email | Phone | Actions
- Sort dropdown with Name/Email/Lifecycle A→Z/Z→A; Import/Export CSV wired; active filter chips shown

### 2026-03-01 (refactor)
- Created `src/context/InboxContext.tsx` — single `DUMMY_MODE = true` flag at top
- All inbox state/logic moved from `Inbox.tsx` into `InboxProvider`; `inboxApi` object defines all API stubs
- Flip `DUMMY_MODE = false` to disable simulation and activate real API calls automatically
- `Inbox.tsx` reduced to `InboxProvider` wrapper + thin `InboxContent` that reads from `useInbox()`

### 2026-03-01 (feature)
- Structured real-time conversation handling: `convList` state replaces static import
- Two simulation intervals: new message every 8s, new conversation every 25s
- Conversations bubble to top on new message; unread count increments for non-selected convs
- `ConversationList` shows blue badge + bold text for unread; tab shows total unread count

### 2026-03-01 (feature)
- MessageArea: instant scroll-to-bottom on open/switch, smooth scroll on new message; loads 10 at a time
- ConversationList: shows first 10 conversations; scroll to bottom loads more with skeleton rows
- Both lists reset pagination when filters/search/tab change

### 2026-03-01 (fix)
- Added channel switcher dropdown to `EmailInput.tsx`; passed `selectedChannel`/`onChannelChange` from `InputArea.tsx`

### 2026-03-01 (feature)
- Added per-channel hover quick actions to `MessageArea.tsx`
- `CHANNEL_ACTIONS` map per channel; `QuickActions` floating pill on hover; Copy wired to clipboard API

### 2026-03-01 (feature)
- Added `$` variable suggestion dropdown to `ReplyInput`, `CommentInput`, and `EmailInput`
- Typing `$` triggers violet dropdown with 9 variables; keyboard nav; inserts `{{variable.key}}` at cursor

### 2026-03-01 (fix)
- Each attachment renders as its own bubble in `MessageArea.tsx` via `SingleAttachmentBubble`
- Added channel badge to contact avatar in `MessageArea.tsx`

### 2026-03-01 (feature)
- Added `MessageStatus` type (`pending | sent | delivered | read`) to `Message` in `types.ts`
- `addMessage` simulates progression via `setTimeout`; `MessageArea.tsx` renders status icons

### 2026-03-01 (feature)
- Unified `SentComment` → `Message` type; messages stored in `localStorage` (`inbox_messages_v1`)
- Wired Send button in `ReplyInput`; `MessageArea` auto-scrolls; `key={selectedConversation.id}` resets input

### 2026-03-01 (fix)
- Removed stray `</parameter>` tags from 7 inbox sub-files; rewrote `MessageArea.tsx`; created `AudioRecorder.tsx`

### 2026-03-01 (refactor)
- Decomposed `src/pages/Inbox.tsx` (~700 lines) into 13 focused files under `src/pages/inbox/`
- Sub-components: SubSidebar, ConversationList, ChatHeader, MessageArea, AudioRecorder, ReplyInput, CommentInput, InputArea, ContactSidebar, EmojiPicker

### 2026-03-01 (feature)
- Mic button triggers full audio recorder (MediaRecorder API); Comment mode with `@mention` dropdown
- Message search bar + snooze dropdown; channel badge on avatar; sub-sidebar icon strip when collapsed
- Made sidebar expandable: collapsed (w-16) ↔ expanded (w-56); chevron toggle + user info row

### 2026-03-01 (fix)
- Fixed recurring `import.meta` error in `src/lib/supabase.ts` — switched to `process.env.VITE_*`

### 2026-03-01 (latest)
- Integrated Supabase auth: login, signup, Google OAuth, OTP verify, forgot/reset password
- Created `src/lib/supabase.ts`, `.env`; rewrote `src/context/AuthContext.tsx`
- Updated `ProtectedRoute` with loading spinner; Sidebar shows real user info and wired logout

### 2026-03-01
- Fixed TopBar.tsx: replaced missing `useNavigate` import and wired "Upgrade now" button to `/billing` route
</changelog>
