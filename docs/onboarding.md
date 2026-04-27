# AxoDesk Frontend Onboarding

This guide is for a new developer or AI session joining the AxoDesk frontend. Start here, then follow the linked source-of-truth docs before making changes.

## Project Purpose

AxoDesk is an enterprise omnichannel workspace for customer conversations, workflows, contacts, channels, broadcasts, workspace administration, and team collaboration. The frontend package is named `multichannel-inbox`; the PWA manifest names the product "Axodesk Omnichannel Workspace" and describes it as an enterprise omnichannel inbox for customer conversations, workflows, contacts, channels, and team collaboration.

## Run Locally

There is no `frontend_new/README.md` in the current codebase. These commands come from `frontend_new/package.json`.

```bash
cd frontend_new
npm install
npm run dev
```

Build the production bundle with:

```bash
cd frontend_new
npm run build
```

Available scripts:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite dev server. |
| `build` | `vite build` | Build the production bundle into `dist`. |

No test, lint, or typecheck-only script is currently defined in `package.json`.

## Folder Structure

| Path | Description |
| --- | --- |
| `.git/` | Git repository metadata for the frontend package. |
| `.vite/` | Vite cache directory configured by `vite.config.ts`. |
| `dist/` | Production build output from `npm run build`. |
| `docs/` | Durable AI, design-system, component usage, standards, decision, and onboarding documentation. |
| `node_modules/` | Installed npm dependencies. |
| `public/` | Static public assets, including PWA icons and offline assets. |
| `src/` | Application source code. |
| `tmp/` | Temporary working files. Do not treat this as a source-of-truth directory. |
| `workspace/` | Existing workspace memory and project notes. |

Important `src` directories:

| Path | Description |
| --- | --- |
| `src/components/` | Shared and app-level React components. Shared UI primitives live in `src/components/ui/`. |
| `src/config/` | Shared configuration such as settings navigation and metadata. |
| `src/context/` | React Context providers for auth, workspace, inbox, calls, notifications, organization, channels, feature flags, and onboarding state. |
| `src/hooks/` | Shared hooks such as `useDisclosure`, `useIsMobile`, and `useChannelOAuth`. |
| `src/integrations/` | External integration-specific code, currently including Meta integration types. |
| `src/lib/` | API client wrappers and domain API modules. |
| `src/modules/` | Module-level product areas such as AI agents. |
| `src/pages/` | Routed page implementations and page-local components. |
| `src/providers/` | Application provider composition. |
| `src/router/` | Router entry points and route trees. |
| `src/sections/` | Older section-level components. Treat with care and check routing before editing. |
| `src/socket/` | Socket-related code. |
| `src/styles/` | Design system CSS variables and shared styles. |

## First Five Files To Read

1. [`docs/ai-skill.md`](ai-skill.md) - master instructions for AI editors and frontend sessions.
2. [`docs/component-usage.md`](component-usage.md) - shared UI component catalog and migration guide.
3. [`docs/brand-guidelines.md`](brand-guidelines.md) - tokens, visual standards, breakpoints, motion, and component styling rules.
4. [`docs/code-standards.md`](code-standards.md) - authoring, state, API, TypeScript, and testing rules.
5. [`src/router/AppGate.tsx`](../src/router/AppGate.tsx) - top-level routing gate into auth and workspace flows.

For route-specific work, read [`src/router/AuthRouter.tsx`](../src/router/AuthRouter.tsx) and [`src/router/WorkspaceRouter.tsx`](../src/router/WorkspaceRouter.tsx) immediately after `AppGate.tsx`.

## Common Mistakes To Avoid

- Do not add raw `button`, `input`, `select`, or `textarea` elements in application code. Use shared UI primitives, except for intentional native file picker inputs.
- Do not leave native `title=` attributes. Use `Tooltip` or `RichTooltip`, and remember shared tooltip behavior is desktop-only.
- Do not hand-roll avatars, status chips, tags, dropdown triggers, or modal shells when a shared component exists.
- Do not duplicate local boolean open/close/toggle state for menus, dropdowns, sheets, modals, or popovers. Use `useDisclosure`.
- Do not create another mobile sheet implementation. Use `MobileSheet` from `src/components/ui/modal`.
- Do not create one-off composer AI prompt or variable menus. Reuse the shared select/dropdown pattern used by composer controls.
- Do not hardcode colors, spacing, font sizes, radii, or shadows. Use the design tokens documented in `brand-guidelines.md`.
- Do not call `fetch()` or axios directly from components or hooks. Use the API layer under `src/lib/` or the nearest domain API module.
- Do not edit legacy surfaces blindly. Check the active router tree before touching older auth, reports, imports, or section files.
- Do not assume `/src/api/` exists. The current API layer lives in `src/lib/` plus domain-local API files.

## Where To Find Things

| Need | Path |
| --- | --- |
| Shared UI components | `src/components/ui/` |
| Buttons | `src/components/ui/button/` |
| Inputs | `src/components/ui/input/` |
| Selects and dropdowns | `src/components/ui/select/` |
| Tags and badges | `src/components/ui/tag/` |
| Avatars | `src/components/ui/avatar/` |
| Tooltips | `src/components/ui/tooltip/` |
| Modals and sheets | `src/components/ui/modal/` |
| Page layout | `src/components/ui/layout/PageLayout.tsx` |
| Shared hooks | `src/hooks/` |
| Menu open/close state | `src/hooks/useDisclosure.ts` |
| Mobile breakpoint logic | `src/hooks/useIsMobile.ts` |
| Routing entry | `src/router/AppGate.tsx` |
| Auth routes | `src/router/AuthRouter.tsx` |
| Workspace routes | `src/router/WorkspaceRouter.tsx` |
| Global/app state | `src/context/` |
| API client core | `src/lib/apiClient.ts` and `src/lib/api.ts` |
| Domain API modules | `src/lib/*Api.ts`, `src/pages/workspace/api.ts`, `src/pages/workflow/workflowApi.ts` |
| Shared config | `src/config/` |
| Page-local types | `src/pages/*/types.ts`, `src/pages/*/*.types.ts` |
| Module types | `src/modules/*/types.ts` |
| Design tokens | `tailwind.config.js`, `tailwind.css`, `src/styles/design-system.css` |

## How To Add A New Page

1. Read `docs/component-usage.md`, `docs/brand-guidelines.md`, and `docs/code-standards.md`.
2. Find the correct route tree in `src/router/AuthRouter.tsx` or `src/router/WorkspaceRouter.tsx`.
3. Create the page under `src/pages/[page]/` unless an existing page folder already owns the area.
4. Use `PageLayout` for desktop page shells with `title`, `breadcrumbs`, and `actions`.
5. Build the UI from shared primitives in `src/components/ui/`.
6. Put page-specific child components under `src/pages/[page]/components/`.
7. Keep server data in the API layer and context/cache patterns already used by the page area.
8. Add or update route imports in the router file.
9. Run `npm run build` after meaningful code changes.

## How To Add A New Shared Component

1. Search `src/components/ui/` and `docs/component-usage.md` first. Extend an existing component if it already covers the pattern.
2. Add the component under the right shared UI family, such as `button`, `input`, `select`, `modal`, or `tag`.
3. Define a named TypeScript props interface above the component function: `[ComponentName]Props`.
4. Type `children` as `React.ReactNode` when the component accepts children.
5. Use destructuring defaults instead of `defaultProps`.
6. Use design tokens and existing Tailwind utilities. Do not hardcode visual values.
7. Export the component and props from the nearest `index.ts` and any root compatibility file already used by that component family.
8. Add a section to `docs/component-usage.md`.
9. Update `docs/brand-guidelines.md` if the component introduces a new documented variant or visual standard.
10. Run `npm run build`.

## How To Add A New API Call

1. Look for an existing domain API module in `src/lib/*Api.ts` or the page/module folder that owns the feature.
2. Add the call to the existing domain API module when possible. Create a new domain API module only when no owner exists.
3. Use `api` from `src/lib/api.ts` or `apiFetch` from `src/lib/apiClient.ts` inside API modules, not inside components.
4. Define request and response types near the API module or reuse existing page/module types.
5. Keep auth, workspace headers, credentials, refresh, and error handling delegated to `apiFetch`.
6. For form uploads, use `api.postForm` or an existing upload helper. Preserve native file picker inputs in UI where required.
7. Import the API function into hooks, context, or page logic rather than calling low-level request code from JSX.
8. Run `npm run build`.

## Documentation Map

- [`docs/brand-guidelines.md`](brand-guidelines.md) - design tokens, typography, spacing, radius, shadows, breakpoints, motion, icons, and component visual standards.
- [`docs/component-usage.md`](component-usage.md) - shared component reference with props, examples, and migration notes.
- [`docs/code-standards.md`](code-standards.md) - component, hook, state, API, import, TypeScript, testing, and improvement rules.
- [`docs/ai-skill.md`](ai-skill.md) - master instruction file for AI code editors.
- [`docs/decisions.md`](decisions.md) - accepted architecture decisions and ADR template.
- [`docs/onboarding.md`](onboarding.md) - this quick-start guide.

## Known Ambiguities

- No `frontend_new/README.md` exists, so project purpose is derived from `package.json`, `vite.config.ts`, and existing workspace notes.
- No test runner, lint script, or typecheck-only script is currently defined in `package.json`.
- No `/src/api/` directory exists. Existing documentation intentionally points to the live `src/lib/` API layer.
