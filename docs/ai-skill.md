# AxoDesk Frontend AI Skill

Read this file at the start of every AI coding session that touches `frontend_new`. Treat it as the master instruction source for AxoDesk frontend work.

## Project Overview

AxoDesk Omnichannel Workspace is an enterprise omnichannel inbox for customer conversations, workflows, contacts, channels, reports, billing, AI agents, and team collaboration. The frontend is a Vite React application with routed auth and workspace experiences, shared UI primitives under `src/components/ui/`, React Context based app state, socket support, PWA configuration, and domain API modules under `src/lib/` plus a few page-local API modules.

Tech stack:

- Framework: React 18 with Vite 6.
- Language: TypeScript 5 with strict compiler settings.
- Routing: `react-router-dom` v6.
- Styling: Tailwind CSS 3 plus CSS variables in `src/styles/design-system.css` and `tailwind.css`.
- Shared UI: custom components in `src/components/ui/`, with some Radix dependencies available.
- Icons: `lucide-react`.
- State management: React Context, local React state, shared hooks, and socket provider. No Redux, Zustand, React Query, or SWR is installed.
- Data fetching: native `fetch` wrapped by `src/lib/apiClient.ts`, `src/lib/api.ts`, and domain API modules in `src/lib/*Api.ts`.
- Realtime: `socket.io-client` through `src/socket/socket-provider.tsx`.
- Motion/charts/flows: `framer-motion`, `reactflow`, `recharts`.
- Notifications: `react-hot-toast` plus notification context.
- Testing: no test runner or test script is currently configured.
- Build scripts: `npm run dev` and `npm run build`.

Repo structure:

- `frontend_new` is a single Vite frontend package inside the larger workspace, not a package-workspace monorepo.
- The app uses `@/*` as an alias for `src/*`.

## Before You Write Any Code - Mandatory Checks

- Check `frontend_new/docs/component-usage.md` before creating any UI element. If a shared component exists for the job, use it.
- Check `frontend_new/docs/brand-guidelines.md` before using any color, spacing, radius, font, shadow, breakpoint, icon, modal, or motion value.
- Check `frontend_new/docs/code-standards.md` before creating any new file.
- Read the file you are editing before changing it. Preserve intentional local patterns.
- Search `frontend_new/src/components/ui/` before creating a new component.
- For UI migration work, read:
  - `frontend_new/docs/ai/00_READ_THIS_FIRST_FRONTEND_RULES.md`
  - `frontend_new/docs/ai/01_SHARED_UI_TRANSFORMATION_STATUS.md`
  - `frontend_new/docs/ai/02_UI_AUDIT_BASELINE.md`
  - `frontend_new/docs/ai/03_UI_TRANSFORMATION_CHECKLIST.md`
- For AI agent surfaces, also read `frontend_new/docs/ai-agent-ui-experience.md`.
- Before editing a shared component default, variant, or behavior, search all existing consumers and choose a default-preserving change unless every affected consumer is intentionally updated.
- If a file is legacy or stale, verify router reachability before editing it.

## What You Must Never Do

- Never create another shared UI library directory such as `components/common` or `components/shared`.
- Never use raw `button`, `input`, `select`, or `textarea` in application code when a shared primitive exists. Native file picker inputs and shared primitive internals are the exception.
- Never use native `title=` attributes. Use `Tooltip` or `RichTooltip`.
- Never add tooltip-only UX on mobile. Tooltips are desktop-only; check `useIsMobile` when mobile-specific rendering matters.
- Never hardcode new color, spacing, font size, border radius, shadow, breakpoint, or z-index values in app code.
- Never change visual design, color scheme, brand identity, layout density, or mobile UX without explicit instruction.
- Never fork or duplicate a shared component just to adjust one screen.
- Never call `fetch()` or axios directly in components. Use the existing API/domain layer.
- Never add axios, React Query, SWR, Redux, or Zustand casually; they are not part of the current app stack.
- Never duplicate server state in local state when a context/domain hook already owns it.
- Never use `any` in new code. Use domain types, `unknown` with narrowing, or a properly scoped third-party boundary.
- Never suppress TypeScript errors with `@ts-ignore` or `as any`.
- Never add a route or page shell that bypasses existing permission and layout patterns.
- Never rewrite unrelated formatting or legacy code while doing a focused fix.

## What You Should Always Do

- Always prefer shared UI primitives from `src/components/ui/`.
- Always use design tokens documented in `brand-guidelines.md`.
- Always write a TypeScript props interface named `[ComponentName]Props` for new components.
- Always type `children` explicitly as `React.ReactNode` when a component accepts children.
- Always set default props through destructuring defaults.
- Always use `useDisclosure` for new dropdown, menu, modal, sheet, popover, and toggle-open state.
- Always use `TruncatedText` for dynamic strings rendered in constrained spaces.
- Always use `Avatar` for users/contacts and `AvatarWithBadge` when a channel indicator is needed.
- Always use `Tag` for chips/pills/status labels and `CountBadge` for compact numeric counts.
- Always use `PageLayout` for new desktop page views.
- Always use `CenterModal`, `SideModal`, or `MobileSheet` for modal/sheet surfaces.
- Always keep modal focus trap, Escape close, body scroll lock, and overlay behavior aligned with the shared modal system.
- Always use the existing error-handling pattern for API calls: typed domain API, loading state, `try/catch/finally`, toast/user feedback where appropriate.
- Always reuse shared registries and config for repeated labels, channel metadata, navigation, permissions, and option lists.
- Always run `npm run build` after meaningful frontend code changes.
- Always update docs when changing shared UI behavior, design tokens, or standards.

## Component Decision Tree

- Text input: use `BaseInput`, `PasswordInput`, `TextareaInput`, `CopyInput`, `InlineEditableInput`, `ColorInput`, `RangeInput`, `TagInput`, or `VerificationCodeInput`.
- Button: use `Button`; use `IconButton` for icon-only actions.
- Toggle: use `ToggleSwitch`; use `CheckboxInput` for checkbox semantics.
- Dropdown/select: use `BaseSelect`, `MultiSelect`, `SearchableSelect`, `CompactSelectMenu`, `SelectWithIconLabel`, `UserAssignSelect`, `TagSelect`, `WorkspaceTagSelect`, or `WorkspaceTagManager`.
- True compact selection in a toolbar/composer/header: use `CompactSelectMenu`.
- Action menu that is not a selected value: use shared `Button`/`IconButton` rows and shared modal/dropdown patterns; do not force it into `CompactSelectMenu`.
- Tag/chip/pill/status label: use `Tag`.
- Numeric count: use `CountBadge`.
- User/contact: use `Avatar`, `AvatarWithBadge`, or `AvatarGroup`.
- Tooltip: use `Tooltip` or `RichTooltip`; desktop only.
- Truncated text: use `TruncatedText`.
- Desktop centered dialog: use `CenterModal`.
- Desktop side drawer: use `SideModal`.
- Mobile bottom/fullscreen sheet: use `MobileSheet`.
- Modal content grid: use `ModalLayout`.
- Desktop page shell: use `PageLayout` and `Breadcrumb` where hierarchy is needed.
- Table/list data grid: use `DataTable` and `ListPagination` when the data is tabular/paginated.

## Response Behavior Rules

- When asked to build a new page, start by identifying which shared layout, components, hooks, configs, and API modules apply; list them before writing code if the user asked for planning, otherwise implement with those choices.
- When asked to fix a bug, read the full file first, identify the root cause in one sentence, then fix only that issue.
- When asked to refactor, preserve behavior and confirm scope when the request is ambiguous.
- When asked to add a feature, check whether it touches shared components. If yes, extend the shared component with default-preserving props instead of forking it.
- When asked for a review, lead with findings ordered by severity and cite files/lines.
- When in doubt about a design decision, ask before implementing.
- Keep updates short, specific, and grounded in files changed.
- After code changes, report changed files, verification commands, and any remaining risk.

## Codebase Map

- Router entry: `frontend_new/src/router/AppGate.tsx`
- Auth routes: `frontend_new/src/router/AuthRouter.tsx`
- Workspace routes: `frontend_new/src/router/WorkspaceRouter.tsx`
- App shell: `frontend_new/src/components/Layout.tsx`
- Route guard: `frontend_new/src/components/ProtectedRoute.tsx`
- Shared UI components: `frontend_new/src/components/ui/`
- Shared UI docs: `frontend_new/docs/component-usage.md`
- Design tokens: `frontend_new/src/styles/design-system.css`, `frontend_new/tailwind.css`, `frontend_new/tailwind.config.js`
- Design token docs: `frontend_new/docs/brand-guidelines.md`
- Code standards: `frontend_new/docs/code-standards.md`
- Shared hooks: `frontend_new/src/hooks/`
- Disclosure hook: `frontend_new/src/hooks/useDisclosure.ts`
- Mobile detection hook: `frontend_new/src/hooks/useIsMobile.ts`
- API client: `frontend_new/src/lib/apiClient.ts`
- API convenience wrapper: `frontend_new/src/lib/api.ts`
- Domain API modules: `frontend_new/src/lib/*Api.ts`
- Additional domain API files: `frontend_new/src/pages/workspace/api.ts`, `frontend_new/src/pages/workflow/workflowApi.ts`
- Store/state: `frontend_new/src/context/`, `frontend_new/src/socket/socket-provider.tsx`, `frontend_new/src/components/mobileHeaderActions.tsx`, page/module contexts.
- Pages: `frontend_new/src/pages/`
- Modules: `frontend_new/src/modules/`
- Config/navigation: `frontend_new/src/config/`
- Settings navigation: `frontend_new/src/config/settingsNavigation.tsx`
- Shared channel registry: `frontend_new/src/pages/channels/channelRegistry.tsx`
- Onboarding config: `frontend_new/src/pages/onboarding/onboarding.config.ts`
- Shared workspace types: `frontend_new/src/pages/workspace/types.ts`
- Channel types: `frontend_new/src/pages/workspace/channels/types.ts`
- AI agent types: `frontend_new/src/modules/ai-agents/types.ts`
- Existing migration docs: `frontend_new/docs/ai/`
- Durable AI/editor docs: `frontend_new/docs/`
- Codex skill gateway: `.codex/skills/axodesk-frontend-guardrails/SKILL.md`

## Verification Checklist

- For meaningful code changes, run `npm run build` from `frontend_new`.
- For UI migrations, run targeted scans for `<button`, `<input`, `<textarea`, `<select`, and `title=` in touched files.
- For shared component changes, search consumers first and mention the blast radius.
- For docs-only changes, reopen generated docs and confirm paths, names, imports, props, and assumptions against the codebase.
- Flag ambiguity instead of inventing values.

