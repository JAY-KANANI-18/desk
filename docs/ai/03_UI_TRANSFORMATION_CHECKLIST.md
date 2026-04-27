# UI Transformation Checklist

Use this file as the page-by-page verification tracker for the shared UI transformation.

This file is intentionally stricter than `01_SHARED_UI_TRANSFORMATION_STATUS.md`:

- Status can say a surface was migrated.
- This checklist stays unchecked until the route surface has been explicitly re-verified against the standards below.
- When this checklist was introduced, every item started unchecked on purpose.

## How To Use This File

1. Start every migration batch by opening this file and choosing unchecked route items.
2. Read the route page and its listed child surfaces before editing.
3. Check a box only after the full completion criteria below are satisfied.
4. Update this file in the same change set as the UI work. Do not defer checklist updates.
5. If only some children are complete, keep the parent route unchecked.

## Completion Criteria For Every Checkbox

Mark a route or child surface checked only when all applicable items are true:

- Shared UI primitives are used where applicable for buttons, icon buttons, inputs, textareas, password fields, selects, multiselects, dropdowns, tags/chips, avatars, tooltips, truncated text, toggles, checkboxes, color inputs, token entry, modal shells, and desktop layout wrappers.
- Workspace-tag areas that both manage selection and display selected tags use the shared high-level tag-management component instead of page-local header, dropdown, and tag-list compositions.
- Raw HTML controls are removed unless the control is genuinely native-only or still intentionally mobile-specific.
- Tables, pagination, bulk selection, action menus, filter chips, and selection menus are standardized through shared patterns instead of page-local one-offs.
- Shared components are not being force-shaped with page-specific `className` or inline `style` unless there is a real exception and the shared API could not reasonably absorb it.
- Shared config and content sources are reused where applicable, especially `channelRegistry.tsx`, `settingsNavigation.tsx`, `onboarding.config.ts`, and `backend-new/backend/channelConfig.txt`.
- Shared types/interfaces are reused instead of redefining equivalent shapes locally.
- Desktop layout uses the shared shell and mobile behavior stays intact unless a mobile fix was explicitly part of the task.
- Tooltips remain desktop-only.
- Routing, permissions, and product behavior still work.
- `npm run build` passes after meaningful frontend changes.

## Route Shells And Navigation

- [x] `Layout`
  - Re-verified 2026-04-25: the app shell keeps the existing desktop sidebar, mobile drawer, topbar, mobile route header, bottom nav, notification, and call-window composition while routing the shell-level mobile back action, registered mobile header actions, desktop settings toggle/backdrop, and mobile bottom-nav More/backdrop controls through shared `IconButton` and `Button` primitives. The shell still derives mobile route headers from route state, preserves inbox-conversation mobile topbar hiding, leaves mobile behavior intact, and `npm run build` passes with only the standing Vite chunk-size warning.
- [x] `ProtectedRoute`
  - Re-verified 2026-04-25: `ProtectedRoute` remains a non-visual permission gate with typed org/workspace permission props, preserves unauthenticated redirect to `/login`, denied permission redirects to the supplied fallback or `/inbox`, and has no page-local UI controls to migrate.
- [x] `SettingsIndexRedirect`
  - Re-verified 2026-04-24: the shared settings index redirect remains config-driven, permission-filtered through `filterSettingsSections`, preserves the mobile selection-screen behavior, and uses the shared settings navigation list instead of page-local route buttons.
- [x] `components/settings/navigation.tsx`
  - Re-verified 2026-04-24: the settings navigation helpers own permission filtering, active-route matching, persisted redirect paths, and mobile index rendering; the visible settings nav list now renders badges through the shared `Tag` primitive and has a clean raw-control scan.
- [x] `config/settingsNavigation.tsx`
  - Re-verified 2026-04-24: workspace, organization, user, and report settings navigation all come from the shared settings config source with route paths, permissions, labels, and icons centralized for shell/sidebar/index routing.
- [x] `WorkspaceSettings`
  - Re-verified 2026-04-24: the workspace settings shell stays a thin `SettingsLayout` wrapper around the routed outlet and shared `workspaceSettingsConfig`, with no page-local controls in the shell.
- [x] `UserSettingsLayout`
  - Re-verified 2026-04-24: the personal-settings shell stays config-driven through `userSettingsConfig`, keeps the shared desktop `PageLayout`, and now uses shared `IconButton` semantics for the mobile back action.
- [x] `Organization`
  - Re-verified 2026-04-24: the organization shell was reduced to the live shared `SettingsLayout` plus `organizationSettingsConfig` outlet, removing legacy commented local section implementations and keeping navigation/permission behavior delegated to the shared settings shell.
- [x] `ReportsLayout`
  - Re-verified 2026-04-24: the live reports shell stays config-driven through `reportsSettingsConfig`, keeps the shared settings/page shell, and now routes the date-range toolbar through shared `BaseInput` date fields plus shared `IconButton` picker actions.
- [x] `InboxLayout`
  - Re-verified 2026-04-24: `InboxLayout` remains a non-visual provider shell around the routed inbox outlet, so it has no raw UI controls to migrate and keeps routing/context behavior unchanged.

## Auth Routes

- [x] `/auth/login` `LoginPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `LoginPremium` now keeps the Google CTA, password field, primary action, and demo-mode disclosure/list rows on shared button/input patterns while preserving the current auth copy and flow.
- [x] `/auth/signup` `SignUpPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `SignUpPremium` now keeps the Google CTA, both password fields, and submit loading state on shared auth-shell and shared input/button primitives while preserving the current password-strength guidance.
- [x] `/auth/forgot-password` `ForgotPasswordPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `ForgotPasswordPremium` continues to use the shared auth shell plus shared field/button patterns for email entry, success actions, and loading states.
- [x] `/auth/verify-email` `VerifyEmailPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `VerifyEmailPremium` now uses the shared `VerificationCodeInput` primitive for six-digit code entry and shared button patterns for verify/resend actions while preserving the current verification flow.
- [x] `/auth/reset-password` `ResetPasswordPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `ResetPasswordPremium` now routes password entry through shared auth password fields and shared button loading states while preserving the current requirement checklist and success/expired-link flows.
- [x] `/auth/set-password` `SetPasswordPremium`
  - [x] `auth/components/AuthShell.tsx`
  - Re-verified 2026-04-24: `SetPasswordPremium` now routes password entry through shared auth password fields and shared button loading states while preserving the current invite-activation flow.
- [x] `/auth/callback` `AuthCallback`
  - Re-verified 2026-04-24: `AuthCallback` remains aligned to the shared auth shell and shared primary notice/action patterns for success and failure states.

## Onboarding And Setup Routes

- [x] `/onboarding` `OnboardingMinimalFlow`
  - [x] `OnboardingOptionCard`
  - [x] `OnboardingProgress`
  - Re-verified 2026-04-24: `OnboardingMinimalFlow` continues to reuse `onboarding.config.ts`, now routes its welcome avatar, text fields, and footer actions through shared `Avatar`, `BaseInput`, and `Button` primitives, preserves the current step order plus profile/workspace submission flow, and now gives the animated step viewport enough inset space so shared focus rings and hover states are not clipped; `OnboardingOptionCard` now runs through the shared `SelectableCard` primitive plus shared `Button` child-layout preservation and start-aligned text behavior so the label stays grouped with its icon while the trailing selection indicator stays pinned to the true far-right edge, and `OnboardingProgress` remains the route-local animated progress indicator because no shared progress primitive exists yet.
- [x] `/get-started` `GetStartedChecklist`
  - Re-verified 2026-04-24: `GetStartedChecklist` now uses the shared desktop `PageLayout`, shared `Button` actions for dismiss, disclosure rows, step CTAs, and completion CTA, and the shared `Tag` pill for completed steps while preserving the existing mobile layout, progress cards, and get-started routing flow.
- [x] `/meta/ads/callback` `MetaAdsCallback`
  - Re-verified 2026-04-24: `MetaAdsCallback` now uses shared `Button` fallback action and shared app-surface styling while preserving the popup `postMessage` plus auto-close behavior for the Meta Ads OAuth flow.

## Core Workspace Routes

- [x] `/inbox` `InboxPage`
  - [x] `SubSidebar`
  - [x] `ConversationList`
  - [x] `ChatHeader`
  - [x] `MessageArea`
  - [x] `InputArea`
  - [x] `ReplyInput`
  - [x] `CommentInput`
  - [x] `EmailInputV2`
  - [x] `TemplateModal`
  - [x] `ContactSidebarHybrid`
  - [x] `InboxAddChannelPrompt`
  - [x] `MobileCategoryDrawer`
  - [x] `MobileContactSheet`
  - [x] `MessageAreaSearchBar`
  - [x] `MessageAreaDateBadge`
  - [x] `AudioRecorder`
  - [x] `EmojiPicker`
  - [x] `message-area/ActivityRow`
  - [x] `message-area/AttachmentItem`
  - [x] `message-area/LegacyEventRow`
  - [x] `message-area/MessageAreaEmailModal`
  - [x] `message-area/MessageBubble`
  - [x] `message-area/MessageStatusIcon`
  - [x] `message-area/MiniAudioPlayer`
  - [x] `message-area/QuickActions`
  - [x] `message-area/QuotedPreview`
  - [x] `message-area/TimelineItemRow`
  - [x] `message-area/WaCarouselBubble`
  - Re-verified 2026-04-25 follow-up: `ConversationList` visual regression fixed after checking the shared `Button` `list-row` blast radius across its existing consumers (`ConversationList` and dashboard contact rows). The shared `list-row` variant now top-aligns multi-line row content, restores normal row text wrapping/line-height, and allows overlapped avatar badges to render outside the button box without affecting other button variants. `ConversationList` now uses the additive shared `Avatar` `base` size to match the existing 40px row/skeleton geometry and applies one-line `TruncatedText` to contact names and message previews. `npm run build` passes with only the standing Vite chunk-size warning.
  - Re-verified 2026-04-24 follow-up: `ConversationList` now uses the shared `Button` `list-row` variant for conversation items after the stricter `unstyled` button mode removed row padding and blocked selected-row background classes. Conversation rows again keep shared-owned padding, bottom dividers, selected background, and hover behavior while retaining shared avatars, channel badges, assignee chips, and truncation.
  - Re-verified 2026-04-24 follow-up: `SubSidebar` count indicators now use the shared `CountBadge` primitive instead of its page-local helper, while preserving the compact floating badges for collapsed icon rows and the warning tone for lost lifecycle rows.
  - Re-verified 2026-04-24 follow-up: `ContactSidebarHybrid` already used the shared `Avatar` primitive, and its contact header avatar now opts into the shared neutral contact fallback tone so no-image contacts match the conversation list, message area, and chat-header contact avatars while keeping the existing `lg` sidebar profile size.
  - Re-verified 2026-04-24 follow-up: `ConversationList` status tabs now use the shared `Button` `tab` variant with selected-state bottom border styling, restoring the obvious active Open/Closed underline while preserving the compact previous tab layout.
  - Re-verified 2026-04-24 follow-up: inbox contact avatars now use the shared neutral fallback tone so no-image contacts match the prior gray-circle look, the conversation-list contact avatar now uses the shared `AvatarWithBadge` channel-image overlay at the same overlap position as the message-area badge pattern, the conversation-list assignee chip uses the new shared `2xs` avatar size to align with the unassigned icon, and the desktop chat-header contact avatar is restored to the larger shared `md` size while mobile stays on `sm`.
  - Re-verified 2026-04-24: the remaining inbox route batch is now checked. `SubSidebar` routes desktop section/lifecycle rows and collapse actions through shared `Button`, `IconButton`, and desktop-only `Tooltip`; `ConversationList` now uses shared `Button`, `IconButton`, `BaseInput`, `Select`, `Tag`, `Avatar`, `TruncatedText`, and existing shared `Toggle` patterns for header actions, filters, search, tabs, chips, list rows, avatars, and assignee display; `CommentInput` now uses shared `TextareaInput`, `Button`, `IconButton`, `Tag`, and `Avatar` patterns for note entry, mention/variable menus, file chips, emoji/mention actions, and submit; `TemplateModal` keeps the shared `CenterModal` shell and now routes tabs, template cards, preview actions, and pills through shared `Button`, `IconButton`, `BaseInput`, and `Tag`; `EmojiPicker` remains a third-party picker wrapper with required fixed positioning and no page-local raw controls. `/inbox` is checked after all listed child surfaces were verified; the hidden file input in `CommentInput` remains the native-only file picker exception.
  - Re-verified 2026-04-24: `AudioRecorder` now uses shared `Button` actions for stop, play/pause, delete, and send while preserving the existing waveform/recording flow, and `message-area/MessageAreaEmailModal` remains aligned to the shared `CenterModal` shell for the email viewer surface.
  - Re-verified 2026-04-24: `ChatHeader` now keeps lifecycle, assignee, search, status, and mobile overflow actions on shared `Button`, `IconButton`, `Input`, `Avatar`, and tooltip primitives; the lifecycle and desktop assignee pickers now run through the shared `CompactSelectMenu` with compact `inline`/`pill`/borderless `toolbar` trigger appearances, aligned header-control height, rounded trailing selected checks, selected-option-first open highlighting, and neutral non-selected hover/highlight surfaces, while the desktop search action now uses a borderless shared icon-button style; `InboxAddChannelPrompt` now uses the shared CTA button; and `MobileCategoryDrawer` now uses shared `Button`/`Tag` patterns for section and lifecycle rows while preserving the existing mobile sheet flow.
  - Re-verified 2026-04-24: `ContactSidebarHybrid` now routes contact tag creation through the shared `TagColorSwatchPicker`, keeps merge choice cards on shared `Button`/`CheckboxInput` patterns, and `MobileContactSheet` now uses shared close-button semantics while preserving the existing mobile sheet behavior.
  - Re-verified 2026-04-24: `InputArea` now keeps the live inbox composer wrapper focused on shared composer props only, still auto-switches email replies back into reply mode, and routes the active surface cleanly between `ReplyInput` and `EmailInputV2` from the selected channel/reply context without carrying unused route state.
  - Re-verified 2026-04-24: `ReplyInput` now routes the visible reply composer channel switcher through shared `CompactSelectMenu`, keeps the channel selector in the top-left composer row with the lighter shared inline trigger appearance, uses borderless shared `Button` styling for the visible AI Assist and Summarize actions, and preserves the existing textarea, mention/variable insertion menus, reply banner, template send flow, window-restriction handling, and remaining shared toolbar/send actions.
  - Re-verified 2026-04-24: `EmailInputV2` now routes the email channel picker through shared `CompactSelectMenu`, keeps that selector in the top-left composer row with the lighter shared inline trigger appearance, uses borderless shared `Button` styling for the visible AI Assist and Summarize actions, still uses the shared `Input` `composer-inline` appearance for subject/cc/bcc rows, and preserves the existing contenteditable editor, mention/variable insertion flow, and remaining shared toolbar/send actions.
  - Re-verified 2026-04-24: `message-area/AttachmentItem` now keeps audio on the existing `MiniAudioPlayer`, uses shared `TruncatedText` plus desktop-only tooltip behavior for image, video, and file attachment names, and preserves the current native image/video/file open and download behavior where raw media elements and anchors are still the appropriate surface.
  - Re-verified 2026-04-24: `TimelineItemRow` now uses shared `Avatar`, `Tag`, and tooltip primitives for live row metadata, call pills, contact/user avatars, AI badges, and failed-send hover copy; `QuickActions` now uses shared `Button` plus desktop-only shared tooltips for the hover action bar; `QuotedPreview` now uses shared `TruncatedText`; `MessageStatusIcon` now exposes status through shared desktop-only tooltips; `MiniAudioPlayer` now uses a shared `Button` for play/pause; and `ActivityRow` now routes mentioned-user chips through the shared `Tag` primitive while preserving the current note/activity rendering flow.
  - Re-verified 2026-04-24: `MessageArea` now uses shared `Button` and `Tag` primitives for snooze, loading, and conversation-boundary states while preserving the current scroll/search/timeline behavior; `LegacyEventRow` now uses shared `Tag` event pills; `MessageBubble` now routes expand toggles, email footer actions, and WhatsApp template action rows through shared `Button`, uses shared `TruncatedText` for email/template truncation, and reuses shared WhatsApp template types; `WaCarouselBubble` now uses shared `Button` navigation/action rows plus shared `TruncatedText` while preserving the current carousel/template rendering flow.
  - Re-verified 2026-04-24: `MessageAreaSearchBar` now uses shared `Input`, `Button`, `IconButton`, and `Tag` primitives for search, navigation, clear, and result-row actions while keeping sticky search-overlay behavior and restoring the no-results state for 2+ character queries; `MessageAreaDateBadge` now uses the shared `Tag` pill.
  - Re-verified 2026-04-25 follow-up: the AI inbox companion surfaces `AiConversationBadges` and `AiConversationPanel` now route live-state pills, pending-approval entry points, and manager pause/resume/regenerate/takeover actions through shared `Tag` and `Button` primitives while preserving feature-flag gating, permissions, conversation-status polling, and API actions.
- [x] `/dashboard` `Dashboard`
  - Re-verified 2026-04-24: the dashboard keeps the shared desktop `PageLayout` and now routes refresh actions, lifecycle cards, contact tabs, contact rows, pagination, the team status filter, member avatars/status, merge actions, count pills, channel/contact avatars, and truncation through shared `Button`, `IconButton`, `CompactSelectMenu`, `Tag`, `Avatar`, `AvatarWithBadge`, and `TruncatedText` primitives while preserving the existing mobile header refresh action and dashboard data flows. `npm run build` passes with only the standing Vite chunk-size warning.
  - Re-verified 2026-04-24 follow-up: contact tab counts now use the shared `CountBadge` primitive instead of oversized `Tag` pills, including the visible zero state for empty tabs, so the tab row keeps compact badge sizing without dashboard-only badge styling.
- [x] `/contacts` `ContactsPage`
  - [x] `ContactsPageContent`
  - [x] `ContactsHeader`
  - [x] `ContactsTable`
  - [x] `ContactsPagination`
  - [x] `CreateContactModal`
  - [x] `EditContactModal`
  - [x] `DeleteContactsModal`
  - [x] `ImportContactsModal`
  - [x] `ContactFormFields`
  - [x] `PhoneNumberField`
  - Re-verified 2026-04-24: create-contact tag assignment now runs on `WorkspaceTagManager`.
- [x] `/contacts/import` `ImportContactsPage`
  - [x] `ImportConfigPanel`
  - [x] `UploadStep`
  - [x] `MappingStep`
  - [x] `ReviewStep`
  - Re-verified 2026-04-24: desktop shell now runs through `PageLayout`, step navigation uses shared `Button`, and the upload/mapping/review surfaces use shared inputs, selects, tags, and actions while keeping the mobile flow intact.
- [x] `/contacts/import-jobs` `ImportJobsPageResponsive`
  - [x] `ImportJobsModal`
  - [x] `JobProgressModal`
  - Re-verified 2026-04-24: jobs page/actions and both import-job modals now use shared `PageLayout`, `Button`, `Tag`, and `CenterModal` patterns.
- [x] `/broadcast` `Broadcast`
  - [x] `BroadcastToolbar`
  - [x] `BroadcastSidebar`
  - [x] `BroadcastTableView`
  - [x] `BroadcastCalendarView`
  - [x] `BroadcastComposerModal`
  - [x] `BroadcastDetailsDrawer`
  - [x] `BroadcastTagPicker`
  - Re-verified 2026-04-24: desktop broadcasts now complete the shared `PageLayout` header flow, toolbar/sidebar/filter/view actions use shared `Button` patterns, composer/details forms use shared checkbox and status-tag primitives, and table/calendar surfaces use shared button/tag semantics while keeping the existing mobile sheet behavior.
- [x] `/workflows` `WorkflowList`
  - Re-verified 2026-04-24: `WorkflowList` keeps the shared desktop `PageLayout`, `DataTable`, and `ListPagination` flow; desktop and mobile search fields now use shared `BaseInput`, filter chips and create actions use shared `Button`, the import icon uses shared `IconButton` plus desktop-only `Tooltip`, and the inline rename editor uses the shared `BaseInput` `inline-edit` appearance while preserving existing workflow actions, sorting, pagination, and mobile load-more behavior.
- [x] `/workflows/templates` `TemplateGallery`
  - Re-verified 2026-04-24: `TemplateGallery` keeps the shared workflow page shell and mobile header actions while routing the back action, category filters, search fields, scratch actions, template cards, and template/tag pills through shared `IconButton`, `Button`, `BaseInput`, and `Tag` primitives without changing template creation/navigation behavior.
- [x] `/workflows/:workflowId` `WorkflowCanvas`
  - [x] `canvas/TopBar`
  - [x] `canvas/AddStepMenu`
  - [x] `canvas/nodes/index.tsx`
  - [x] `canvas/edges/index.tsx`
  - [x] `TriggerPanel`
  - [x] `StepPanel`
  - [x] `PanelShell`
  - [x] `panels/triggers/contactFieldUpdated.tsx`
  - [x] `panels/triggers/conversationClosed.tsx`
  - [x] `panels/triggers/conversationOpened.tsx`
  - [x] `panels/triggers/lifecycleUpdated.trigger.tsx`
  - [x] `panels/triggers/metaAutomation.trigger.tsx`
  - [x] `panels/triggers/tagUpdated.trigger.tsx`
  - [x] `panels/steps/addCommentConfig.tsx`
  - [x] `panels/steps/askQuestionConfig.tsx`
  - [x] `panels/steps/assignToConfig.tsx`
  - [x] `panels/steps/branchConfig.tsx`
  - [x] `panels/steps/CloseConversationConfig.tsx`
  - [x] `panels/steps/jumpToConfig.tsx`
  - [x] `panels/steps/openConversationConfig.tsx`
  - [x] `panels/steps/sendMessageConfig.tsx`
  - [x] `panels/steps/triggerAnotherWorkflowConfig.tsx`
  - [x] `panels/steps/updateContactFieldConfig.tsx`
  - [x] `panels/steps/updateContactTagConfig.tsx`
  - [x] `panels/steps/index.tsx` `WaitConfig`
  - [x] `panels/steps/index.tsx` `DateTimeConfig`
  - [x] `panels/steps/index.tsx` `HttpRequestConfig`
  - Re-verified 2026-04-24 follow-up: `canvas/TopBar` now keeps the workflow-name edit affordance compact through the shared `BaseInput` inline-edit auto-width API with the oversized inline focus rectangle fixed centrally, while Save and Publish remain shared `Button` actions. `panels/steps/branchConfig.tsx` now uses the shared compact select size for dense branch-condition menus, keeps select chevrons aligned at the right edge through the shared select trigger, uses a consistent control-column/action-column grid so category, field, operator, and value rows share one right edge, and restores the compact right-side Add Branch layout from the intended panel design.
  - Re-verified 2026-04-24: workflow step config verification finished for `addCommentConfig.tsx`, `askQuestionConfig.tsx`, `assignToConfig.tsx`, `branchConfig.tsx`, `CloseConversationConfig.tsx`, `jumpToConfig.tsx`, `openConversationConfig.tsx`, `sendMessageConfig.tsx`, `triggerAnotherWorkflowConfig.tsx`, `updateContactFieldConfig.tsx`, `updateContactTagConfig.tsx`, plus the live `WaitConfig`, `DateTimeConfig`, and `HttpRequestConfig` exports in `steps/index.tsx`. Step actions, segmented choices, branch condition selects/inputs, date/time fields, HTTP header/mapping rows, jump limits, and delete/clone/add actions now use shared `Button`, `IconButton`, `BaseInput`, `CheckboxInput`, `RangeInput`, `Select`/`BaseSelect`, `MultiSelect`, `WorkspaceTagManager`, `Tooltip`, and `PanelShell` primitives. The hidden file input in `sendMessageConfig.tsx` remains the native-only file-picker exception. `/workflows/:workflowId` is now checked after all listed workflow canvas, panel, trigger, and step surfaces were verified and `npm run build` passed with only the standing Vite chunk-size warning.
  - Re-verified 2026-04-24: workflow trigger config verification advanced through `contactFieldUpdated.tsx`, `conversationClosed.tsx`, `conversationOpened.tsx`, `lifecycleUpdated.trigger.tsx`, and `metaAutomation.trigger.tsx`. Contact-field and Meta automation triggers stay composed through shared panel sections/info boxes and the shared condition builder; conversation-opened/closed conditions now use shared `DisclosureButton`, `BaseSelect`, `MultiSelect`, `BaseInput`, `Button`, and `IconButton` primitives; lifecycle stage selection now uses shared `Button`, the shared compact `CheckboxInput`, and the shared `LifecycleStage` interface.
  - Re-verified 2026-04-24: workflow panel shell verification advanced through `PanelShell`, `TriggerPanel`, and `StepPanel`. `PanelShell` now routes close/back, disclosure sections, toggles, select/text/textarea fields, token chips, and duration inputs through shared `IconButton`, `DisclosureButton`, `ToggleSwitch`, `BaseSelect`, `BaseInput`, `TextareaInput`, and shared `TagInput` primitives; `TriggerPanel` now uses the shared `CompactSelectMenu` for trigger selection instead of a page-local dropdown; and `StepPanel` remains a composition wrapper over the shared panel shell.
  - Re-verified 2026-04-24: workflow canvas shell verification advanced through `TopBar`, `AddStepMenu`, `canvas/nodes/index.tsx`, and `canvas/edges/index.tsx`. The top bar now uses shared `Button`, `IconButton`, `BaseInput`, and `Tag` for back/settings/save/publish/status/name-edit controls; the add-step menu uses shared search, category, row, close, and upgrade-tag primitives while preserving the mobile sheet; node hover actions now use shared tiny icon buttons with desktop-only tooltips; and edge add controls now use the shared tiny icon button size.
- [x] `/ai-agents` `AiAgentsListPage`
  - Re-verified 2026-04-25: the AI agents list now uses the shared `PageLayout` wrapper through the AI page layout adapter, routes header actions, search, status/type/channel filters, empty-state CTAs, list-row navigation, overflow actions, status chips, and channel chips through shared `Button`, `IconButton`, `BaseInput`, `CompactSelectMenu`, and `Tag` primitives while preserving permissions, websocket refreshes, duplicate/pause/archive actions, and mobile header behavior.
- [x] `/ai-agents/new` `CreateAgentWizardPage`
  - Re-verified 2026-04-25: the create-agent wizard now uses the shared desktop page shell, shared `Button` step/template/channel cards, shared `BaseInput`, `TextareaInput`, `Select`, and `ToggleSwitch` controls for identity, permissions, approval mode, and publish actions while preserving step state, template defaults, create/publish API calls, and the mobile header fallback.
- [x] `/ai-agents/approvals` `ApprovalQueuePage`
  - Re-verified 2026-04-25: the approval queue now routes the page shell, search, bulk approval, row selection, chat/action buttons, approval labels, and edit-then-approve dialog through shared `PageLayout`, `BaseInput`, `CheckboxInput`, `Button`, `Tag`, `TextareaInput`, and `CenterModal` primitives while preserving socket refreshes, approve/reject/bulk approval behavior, and JSON edit validation.
- [x] `/ai-agents/usage` `AiUsagePage`
  - Re-verified 2026-04-25: the AI usage route now uses the shared page shell plus shared `Select` and `Button` header controls while keeping the existing usage metrics, provider/model chart, billing navigation, and analytics date-range behavior.
- [x] `/ai-agents/:agentId` `AgentDetailPage`
  - Re-verified 2026-04-25: the agent detail shell and all tabs now use the shared page layout, tab buttons, action buttons, inputs, textareas, selects, range inputs, toggles, tags, and status/channel chips across overview, behavior, knowledge, tools, guardrails, versions, playground, and analytics while preserving tab query params, publish/update/rollback/knowledge/sandbox API flows, charts, and mobile behavior.
- [x] `/channels` `Channels`
  - Re-verified 2026-04-24: connected-channel search, add-channel actions, empty-state CTA, channel cards, manage affordance, mobile header actions, and pagination now route through shared `PageLayout`, `BaseInput`, `Button`, and `ListPagination` patterns, with clickable cards moved from page-local `article role="button"` composition to the shared `Button` `select-card` variant.
- [x] `/channels/connect` `ChannelCatalogView`
  - Re-verified 2026-04-24: catalog category filters, search, badges, and connect cards now use shared `Button`, `BaseInput`, `Tag`, and `PageLayout` primitives backed by `channelRegistry.tsx`, with raw category/search controls and page-local clickable catalog cards removed.
- [x] `/channels/connect/:channelId` `ConnectChannelPage`
  - [x] `EmailChannel`
  - [x] `EmailChannelV2`
  - [x] `GmailChannel`
  - [x] `FacebookChannel`
  - [x] `InstagramChannel`
  - [x] `WebsiteChatChannel`
  - [x] `WhatsAppCloudChannel`
  - Re-verified 2026-04-24: connect routing remains registry-driven through `channelRegistry.tsx`; connect setup surfaces use shared `PageLayout`, `ChannelHeaderBackButton`, `Button`, `IconButton`, `BaseInput`, `PasswordInput`, `CheckboxInput`, `TagInput`, `Tag`, and channel action-button patterns, and a raw-control scan across the listed connect child surfaces is clean.
- [x] `/channels/manage/:channelType/:channelId`
  - [x] `ManageChannelPage`
  - [x] `EmailConfigV2`
  - [x] `GmailConfig`
  - [x] `InstagramConfig`
  - [x] `InstagramIceBreakers`
  - [x] `MessengerConfig`
  - [x] `MessengerChatMenu`
  - [x] `MessengerTemplates`
  - [x] `MetaAutomationSection`
  - [x] `WebsiteChatConfig`
  - [x] `WhatsAppCloudConfig`
  - [x] `WhatsAppTemplates`
  - Re-verified 2026-04-24: channel manage routing stays config-driven through `ManageChannelPage` and shared settings navigation; configuration/templates/automation sections use shared `Button`, `IconButton`, `DisclosureButton`, `BaseInput`, `PasswordInput`, `TextareaInput`, `CopyInput`, `CheckboxInput`, `ColorInput`, `TagInput`, `Tag`, `Tooltip`, and save/danger-zone helpers, with raw-control scans clean across listed manage child surfaces.

## Reports Routes

- [x] `/reports/messages` `MessagesReportSection`
- [x] `/reports/conversations` `ConversationsReportSection`
- [x] `/reports/contacts` `ContactsReportSection`
- [x] `/reports/lifecycle` `LifecycleReportSection`
  - Re-verified 2026-04-24: all live report sections compose through the shared reports helpers for loading/error states, stat cards, chart cards, date filtering, and chart menus; `ReportDateInput` now uses shared `BaseInput` with the central native-picker-indicator prop, `ReportChartCard` uses shared `IconButton`, and a raw-control scan across `src/pages/reports/` is clean. `npm run build` passes with only the standing Vite chunk-size warning.

## Workspace Settings Routes

- [x] `/workspace/settings/general-info` `WorkspaceGeneralInfo`
  - Re-verified 2026-04-24: workspace name, workspace ID copy, timezone selection, and save state now use shared `BaseInput`, `CopyInput`, `BaseSelect`, and `Button` primitives, with legacy commented one-off select markup removed and the existing workspace update flow preserved.
- [x] `/workspace/settings/users` `WorkspaceUsers`
  - Re-verified 2026-04-24: workspace user search, invite/edit sheets and modals, role selects, avatars, status tags, pagination, and list row actions route through shared `BaseInput`, `BaseSelect`, `Button`, `Avatar`, `Tag`, `CenterModal`, `MobileSheet`, and `ListPagination` patterns, including shared destructive action variants instead of page-level button styling.
- [x] `/workspace/settings/lifecycle` `Lifecycle`
  - Re-verified 2026-04-24: lifecycle stage rows now use shared `Button`, `IconButton`, `BaseInput`, `Tag`, `CountBadge`, and `ToggleSwitch` primitives for emoji choices, stage names/descriptions, status chips, menus, add/delete actions, retry, visibility, and panel counts; the shared `dashed` button variant now owns the add-stage action style, and the routed file has a clean raw-control scan.
- [x] `/workspace/settings/tags` `Tags`
  - Re-verified 2026-04-24: conversation tag search, add-tag modal/sheet, preview tag, emoji trigger, color choices, description field, table actions, and pagination now use shared `BaseInput`, `Button`, `Tag`, `TagColorSwatchPicker`, `TextareaInput`, `DataTable`, `CenterModal`, `MobileSheet`, and `ListPagination` primitives while preserving the existing mobile header search/add flow.
- [x] `/workspace/settings/integrations` `Integrations`
  - Re-verified 2026-04-24: Meta Ads connect, refresh, and disconnect actions now use shared `Button` loading/disabled states, including the shared `facebook` variant for the branded connect CTA, while preserving the current OAuth popup, webhook, summary, and error behavior.
- [x] `/workspace/settings/ai-assist` `AIAssist`
  - Re-verified 2026-04-24: AI Assist enablement and prompt editing now use shared `ToggleSwitch`, `TextareaInput`, and `Button` loading states while preserving the existing settings and prompt save APIs.
- [x] `/workspace/settings/ai-prompts` `AIPrompts`
  - Re-verified 2026-04-24: AI prompt creation/editing now uses shared `CenterModal`/`MobileSheet`, `BaseInput`, `TextareaInput`, `Button`, `Tag`, and `ToggleSwitch` primitives for CRUD, default/custom status, enabled state, and mobile editor behavior while preserving prompt list and update flows.

## User Settings Routes

- [x] `/user/settings/profile` `UserSettings`
- [x] `/user/settings/notifications` `NotificationPreferences`
  - Re-verified 2026-04-24: `UserSettings` keeps the original in-avatar change affordance instead of a separate secondary action button, with a hover/focus-only full-circle change overlay, while still using shared `Avatar` with the shared `2xl` size plus shared `Button`, `TruncatedText`, and `BaseInput` primitives around the profile form and save flow.
  - Re-verified 2026-04-24: `NotificationPreferences` continues to use shared `Select` and `Button` primitives for alert scopes, push setup, device actions, and save/reset controls.

## Organization Routes

- [x] `/organization/account-info` `GeneralOrgInfo`
  - Re-verified 2026-04-24: organization profile fields now use shared `BaseInput` labels/adornments plus shared `Button` save/cancel actions while preserving the existing organization update flow.
- [x] `/organization/users-settings` `OrgUsersSettings`
  - Re-verified 2026-04-24: organization user search, invite/edit modal, workspace-role selectors, avatars, role/status/workspace tags, pagination, mobile sheet actions, and destructive actions now route through shared inputs, selects, buttons, icon buttons, modals, tags, avatars, and `ListPagination` without raw controls or shared-component style overrides.
- [x] `/organization/workspaces` `WorkspacesManage`
  - Re-verified 2026-04-24: workspace create/delete modals, mobile sheets, add/delete actions, avatars, guarded controls, and workspace list rows use shared `Button`, `IconButton`, `BaseInput`, `Avatar`, and `CenterModal` patterns with a clean raw-control scan.
- [x] `/organization/whatsapp-fees` `WhatsAppFees`
  - Re-verified 2026-04-24: the WhatsApp fees empty-state CTA now uses the shared `Button` primitive while preserving the existing empty-state illustration and copy.
- [x] `/organization/billing-usage` `BillingUsage`
  - Re-verified 2026-04-24: billing usage upgrade/update/download actions now use shared `Button` primitives and invoice status uses the shared `Tag` primitive while preserving the existing static billing overview layout.

## Billing And Utility Routes

- [x] `/billing` `Billing`
  - Re-verified 2026-04-24: the billing overview now uses the shared desktop `PageLayout` shell with a mobile header fallback, routes refresh, plan-change, provider, add-on, invoice-pay, and billing-details edit actions through shared `Button`/`IconButton` primitives, moves invoice/add-on/billing-details dialogs onto `CenterModal`, replaces the billing-details form with shared `BaseInput`, standardizes status/type/count pills through shared `Tag`, and swaps native invoice action `title` text for desktop-only shared `Tooltip`. A raw-control scan for `Billing.tsx` is clean, and `npm run build` passes with only the standing Vite chunk-size warning.
- [x] `/billing/plans` `BillingPlans`
  - Re-verified 2026-04-24: the plan picker now routes back, billing-cycle, plan CTA, FAQ disclosure, and plan/discount badges through shared `Button`, `DisclosureButton`, and `Tag` primitives, backed by the new shared `inverse-primary` button variant for white CTA buttons on primary cards.
- [x] `/sitemap` `AppSitemap`
  - Re-verified 2026-04-24: sitemap search, clear-search, category filters, count pills, clear-filters action, page badges, category chips, feature expansion, and open-page CTAs now use shared `BaseInput`, `IconButton`, `Button`, `CountBadge`, and `Tag` primitives while preserving routing behavior; a raw-control scan for `AppSitemap`, `BillingPlans`, and `src/pages/reports/` is clean. `npm run build` passes with only the standing Vite chunk-size warning.

## Existing UI Surfaces Not Currently Routed

Keep these unchecked until they are either deleted, wired into routes, or fully aligned with the same shared UI standards:

- [x] `workspace/sections/Calls.tsx`
- [x] `workspace/sections/ClosingNotes.tsx`
- [x] `workspace/sections/ContactFields.tsx`
- [x] `workspace/sections/GrowthWidgets.tsx`
- [x] `workspace/sections/Snippets.tsx`
- [x] `workspace/sections/Teams.tsx`
  - Re-verified 2026-04-25: the unrouted legacy workspace section batch now aligns with the shared UI standards. Calls, Closing Notes, Contact Fields, Growth Widgets, Snippets, and Teams now route visible actions, icon actions, forms, color input, selects, textareas, toggles, checkbox membership rows, tags, avatars/avatar groups, truncation, desktop-only tooltips, and modals through shared primitives while preserving the existing card/table/list layouts and API flows. A raw-control scan across the six files is clean aside from shared `CenterModal` `title` props, and `npm run build` passes with only the standing Vite chunk-size warning.
- [x] `onboarding/OnboardingFlow.tsx`
  - Re-verified 2026-04-25: the legacy `OnboardingFlow` surface no longer carries a second onboarding UI. It now aliases the already-migrated `OnboardingMinimalFlow`, and the root `pages/Onboarding.tsx` compatibility shim also points to the same shared onboarding implementation. This removes stale raw form/button/select/modal markup while preserving backwards-compatible exports and the live `/onboarding` route behavior. Raw-control scans for the two alias files are clean, targeted TypeScript diagnostics for those files returned no matches, and `npm run build` passes with only the standing Vite chunk-size warning.

## Update Rule

Whenever a migration batch changes a routed UI surface:

- update the relevant checkboxes here
- update `01_SHARED_UI_TRANSFORMATION_STATUS.md`
- keep checked items honest; if a regression reappears, uncheck the affected item
