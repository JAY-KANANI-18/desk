# AxoDesk Code Standards And Patterns

This document was generated from the live `frontend_new` codebase. Update it in the same commit whenever conventions, tooling, API-layer paths, or shared UI rules change.

Sources used: `package.json`, `tsconfig*.json`, `vite.config.ts`, `src/components/ui/`, `src/hooks/`, `src/context/`, `src/lib/`, `src/pages/`, `src/modules/`, router files, and existing workspace notes.

## Component Authoring Rules

### Naming And File Structure

- Component files use PascalCase: `ContactsHeader.tsx`, `WorkspaceSwitcher.tsx`, `Button.tsx`, `CenterModal.tsx`.
- Hook files use `use` + PascalCase: `useDisclosure.ts`, `useIsMobile.ts`, `useBroadcastPage.ts`.
- Utility, API, config, and type files use camelCase or lower-case names: `apiClient.ts`, `tagAppearance.ts`, `channelRegistry.tsx`, `settingsNavigation.tsx`, `types.ts`.
- Directories are generally lower-case by feature/domain: `components/ui/button`, `pages/contacts/components`, `pages/workflow/panels`, `modules/ai-agents/components`. Existing hyphenated directories such as `modules/ai-agents` and `components/ui/truncated-text` are valid.
- Barrel files are named `index.ts` and should re-export public component APIs from a folder.

### Where New Components Go

- Shared UI primitives go in `src/components/ui/`.
- Shared UI subfamilies go in the matching folder: `button`, `inputs`, `select`, `tag`, `avatar`, `tooltip`, `modal`, `layout`, `toggle`, or `truncated-text`.
- App shell or cross-page components go in `src/components/` or an existing subfolder such as `src/components/topbar/` or `src/components/settings/`.
- Page-specific components go in `src/pages/[page]/components/` when that folder exists.
- Module-specific components go in `src/modules/[module]/components/`.
- Domain hooks that are only used by one page family can stay co-located, such as `src/pages/broadcast/useBroadcastPage.ts`.

### Component Rules

- Every new component must define a TypeScript props interface above the component function.
- Props interfaces must be named `[ComponentName]Props`.
- Components that accept `children` must explicitly type `children: React.ReactNode`.
- Default props must be set through destructuring defaults, not `defaultProps`.
- Prefer named exports. This is the dominant pattern in shared UI and page modules.
- Keep component behavior and visual migration separate unless the task explicitly asks for both.
- Keep visual identity stable. Do not redesign colors, spacing, radius, shadows, layout density, or mobile flows while refactoring.
- Use `Button`, `IconButton`, `BaseInput`, `TextareaInput`, `Select`/select primitives, `Tag`, `Avatar`, `Tooltip`, `CenterModal`, `SideModal`, `MobileSheet`, `PageLayout`, and related shared UI before writing local markup.
- Do not use raw `button`, `input`, `select`, or `textarea` in application code. Native file picker inputs are the exception. Raw native elements are allowed inside shared primitive implementations.
- Do not use native `title=`. Use `Tooltip` or `RichTooltip`, and remember tooltip components render nothing on mobile/touch devices.
- Do not create a second shared UI library. There should be no `components/common` or duplicate shared component folder.
- Do not fork a shared primitive to solve a local styling need. Extend the shared primitive with a default-preserving prop instead.

### Styling Rules

- New or changed UI must use documented design tokens from `docs/brand-guidelines.md`.
- Do not hardcode colors, spacing, radius, shadows, or font values in new application code.
- Existing legacy hardcoded values still exist in some shared components; do not copy them into new surfaces unless preserving an existing shared component API requires it.
- Prefer CSS variables and Tailwind token utilities already used by the component being edited.
- Inline styles are allowed only for dynamic values or existing shared component internals that calculate styles from props.
- For dynamic strings in constrained spaces, use `TruncatedText`.
- For user/contact avatars, use `Avatar`; use `AvatarWithBadge` when a channel indicator is needed.
- For tags, chips, pills, and labels, use `Tag`; use `CountBadge` for compact numeric counts.
- For desktop pages, use `PageLayout` unless the route is intentionally mobile-only or a shell already wraps it.

## Hook Authoring Rules

- Shared hooks go in `src/hooks/`.
- Component-specific hooks should be co-located with the component or page family that owns them.
- Module-specific hooks go under `src/modules/[module]/hooks/`.
- Hook names must start with `use` and continue in PascalCase.
- Every new shared hook must export its return type interface. Example: `UseDisclosureReturn`.
- Hooks should not import from page-level components. Shared hooks may import from `src/components/ui/`, `src/hooks/`, `src/lib/`, `src/context/`, `src/socket/`, or stable type/config modules.
- Hooks that coordinate async actions should expose typed state and actions rather than leaking implementation details.
- Use `useDisclosure(initialOpen = false)` for dropdown, menu, modal, sheet, popover, and other open/close/toggle state.

Known current gap: older hooks such as some page-level broadcast/import/channel hooks do not all export explicit return types yet. Add return type interfaces when touching or creating hooks.

## State Management Rules

### Current State Stack

- No Redux, Zustand, React Query, or SWR dependency is installed.
- Global/app state is managed through React Context providers in `src/context/`.
- Socket state is managed through `src/socket/socket-provider.tsx`.
- Mobile header action registration uses context in `src/components/mobileHeaderActions.tsx`.
- Domain state also exists in page/module contexts, such as `src/pages/workflow/WorkflowContext.tsx` and `src/pages/workspace/WorkspaceContext.tsx`.
- Local UI state uses React `useState`, `useMemo`, `useCallback`, refs, and the shared `useDisclosure` hook.

### What State Lives Where

- Authentication, workspace, organization, authorization, inbox, channels, calls, notifications, feature flags, and get-started state belong in existing context providers.
- Socket connection and socket event subscriptions belong in the socket provider or the feature component/hook that owns the subscription.
- Server-backed domain data should be loaded through the existing API/domain layer and stored in the owning context or page hook.
- Transient form drafts, filters, active tabs, and local busy flags can stay local to a page/component unless they are shared across routes.
- Dropdown/menu/modal/sheet open state must use `useDisclosure` for new work and when refactoring repeated local boolean state.

### State Anti-Patterns

- Do not duplicate server state in local component state when a context/domain hook already owns it.
- Do not keep local selected navigation state when the URL or shared navigation config already defines the active section.
- Do not create a new global context for state that is only used inside one page family.
- Do not leave repeated `const [open, setOpen] = useState(false)` menu patterns in new code; use `useDisclosure`.

## API And Data Fetching Rules

### Current API Layer

There is no `src/api/` directory in the current codebase. The existing API layer is:

- `src/lib/apiClient.ts`: central `apiFetch()` wrapper around native `fetch`, auth headers, workspace headers, refresh-on-401, status handling, and toast errors.
- `src/lib/api.ts`: convenience `api.get`, `api.post`, `api.put`, `api.delete`, `api.patch`, and `api.postForm` wrappers.
- Domain API modules in `src/lib/*Api.ts`, such as `authApi.ts`, `broadcastApi.ts`, `channelApi.ts`, `contactApi.ts`, `importApi.ts`, `inboxApi.ts`, `notificationApi.ts`, `organizationApi.ts`, `workspaceApi.ts`, and `aiAgentsApi.ts`.
- Domain-local API files such as `src/pages/workspace/api.ts` and `src/pages/workflow/workflowApi.ts`.

If a future migration introduces `src/api/`, update this document and move the API-layer rule there. Until then, use the paths above.

### Fetching Rules

- Components must not call `fetch()` or axios directly.
- New API calls must go through `src/lib/api.ts`, `src/lib/apiClient.ts`, or the nearest existing domain API module.
- Keep direct native `fetch()` inside API-layer files only. Existing upload flows in contexts use direct `fetch(uploadUrl, ...)` for pre-signed uploads; do not expand that pattern without extracting a helper.
- Do not add axios; it is not installed.
- Do not introduce React Query/SWR casually; the current app does not use those libraries.
- API payloads and responses must have explicit TypeScript interfaces or type aliases.
- Prefer `unknown` and narrowing for untrusted JSON. Existing API helpers still contain some `any`; do not add new `any`.
- `DUMMY_MODE` appears in older domain files. Preserve existing dummy/live behavior when touching those files.

### Error Handling Pattern

- `apiFetch()` handles common HTTP status codes, shows `react-hot-toast` errors for session/permission/not-found/server failures, and throws `Error`.
- Page and context loaders generally use `try/catch/finally`, `loading` flags, and optimistic updates with reload/revert on failure.
- Context hooks throw a clear provider error when used outside their provider, such as `useInbox must be used within InboxProvider`.
- User-facing mutation failures should use `toast.error()` or the existing notification context pattern; do not silently swallow errors.
- Loading state must be cleared in `finally` blocks where possible.

## Import Order Rules

There is no ESLint or Prettier config detected in `frontend_new`. Follow the local file style and this order for new files:

1. React imports first when used, including React types in the same import where practical.
2. Third-party packages next, such as `react-router-dom`, `react-hot-toast`, `lucide-react`, `framer-motion`, or `socket.io-client`.
3. Shared/internal app imports next: `components`, `components/ui`, `hooks`, `context`, `socket`, `lib`, `config`.
4. Local page/module relative imports next.
5. Type-only imports should use `import type` and may be grouped near the related value import or placed after value imports, matching the edited file.

Path notes:

- `@/*` is configured in `tsconfig.json` and Vite as an alias for `src/*`.
- Existing code often uses relative imports. Preserve a file's existing style unless you are intentionally cleaning import paths.
- Prefer folder barrels for new shared UI imports when they exist, such as `src/components/ui/button`, `src/components/ui/inputs`, `src/components/ui/select`, `src/components/ui/modal`.
- Compatibility root imports such as `src/components/ui/Button` and `src/components/ui/Select` are valid for existing files.

## TypeScript Rules

- `strict` mode is enabled.
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports` are enabled.
- Do not use `any` in new code. Use `unknown` and narrow it, or define the correct interface.
- Do not use `as SomeType` assertions except when interfacing with a third-party library or legacy untyped boundary where narrowing is not practical. Keep assertions as close to the boundary as possible.
- Event handler props must use the correct React event type: `React.MouseEvent`, `React.ChangeEvent`, `React.KeyboardEvent`, etc.
- Variant props must use TypeScript union string literal types, not the `enum` keyword.
- Shared interfaces and types should be reused from the nearest stable source, such as:
  - `src/pages/workspace/types.ts`
  - `src/pages/workspace/channels/types.ts`
  - `src/pages/contacts/types.ts`
  - `src/pages/broadcast/types.ts`
  - `src/pages/workflow/workflow.types.ts`
  - `src/modules/ai-agents/types.ts`
  - `src/lib/channelApi.ts`
- Keep prop interfaces above component functions.
- Keep exported type names domain-specific and readable.
- Avoid broad `Record<string, any>` in new types. Existing legacy AI-agent config types still contain it; tighten them when the API contract is known.

## Improvement Targets For Existing Code

These are known gaps in the current codebase. They are not permission to block small fixes, but any touched file should move toward these standards when it is safe and in scope.

- Normalize shared UI imports over time. Existing files mix compatibility imports such as `src/components/ui/Button` with folder-barrel imports such as `src/components/ui/button`; new code should prefer the folder barrels.
- Replace remaining active raw controls outside shared primitives. Native file picker inputs may remain raw, but active app surfaces should not introduce new raw `button`, `input`, `select`, or `textarea` elements.
- Remove remaining native `title=` attributes from active app surfaces and replace them with desktop-only `Tooltip` or `RichTooltip`.
- Consolidate repeated dropdown/menu open state with `useDisclosure`; older `useState(false)` menu toggles should be migrated when the owning file is touched.
- Tighten legacy `any` and `Record<string, any>` usage at API and third-party boundaries. Prefer domain interfaces, `unknown`, and narrowers.
- Export explicit return type interfaces from shared and domain hooks as they are touched. Existing hooks do not all follow this yet.
- Move direct upload `fetch(uploadUrl, ...)` patterns behind a helper when a shared upload abstraction is introduced.
- Keep reducing hardcoded visual values in shared components. Some legacy shared primitives still use Tailwind utility colors or hardcoded hex values for compatibility; do not copy those patterns into new work.
- Continue marking or deleting legacy routed/unrouted surfaces instead of silently maintaining parallel old implementations.
- Add test tooling before adding a large new feature. The project currently has no test runner, so high-risk new behavior should either add tests with tooling or receive explicit manual verification notes.
- Add ESLint/Prettier configuration before enforcing formatting at scale. Until then, preserve nearby formatting and avoid churn-only rewrites.
- Prefer shared registries for repeated labels, options, channel metadata, navigation entries, and permission copy. Do not add another local copy when a shared source already exists.

## Testing And Verification Rules

No test runner, test script, or test files were detected in `frontend_new`. `package.json` currently exposes:

- `npm run dev`: starts Vite.
- `npm run build`: runs `vite build`.

Current required verification:

- Run `npm run build` after meaningful frontend code changes.
- Run targeted raw-control scans when migrating UI surfaces: `<button`, `<input`, `<textarea`, `<select`, and `title=`.
- For shared component changes, search existing consumers before changing defaults or variants.
- For route or shell changes, verify the relevant router files and preserve permissions/mobile behavior.
- For docs-only changes, a build is not required unless code or config changed.

If test tooling is added later:

- Document the testing library, command, and file naming convention here.
- Prefer co-located `*.test.ts` or `*.test.tsx` files next to the unit under test unless a future test config establishes a different pattern.
- Test shared component behavior, API/domain hooks, permission gates, routing decisions, and high-risk user workflows first.

## Raw UI And Accessibility Rules

- Use semantic shared controls. Do not replace buttons with clickable `div`s or `span`s.
- Icon-only controls must have an `aria-label`.
- Tooltip triggers must remain keyboard reachable when the underlying control is interactive.
- Do not rely on color alone for destructive, selected, or disabled states.
- Modal, side drawer, and mobile sheet surfaces must keep focus trap, Escape close, body scroll lock, and overlay behavior aligned with shared modal utilities.
- Mobile tooltips are disabled; do not make critical information available only through tooltip content.

## Documentation Rules

- Shared UI behavior changes must update `docs/component-usage.md`.
- Design token changes must update `docs/brand-guidelines.md`.
- Architecture/pattern decisions must update `docs/decisions.md` after that file exists.
- Frontend migration rules and checklist updates should stay aligned with `docs/ai/`.
