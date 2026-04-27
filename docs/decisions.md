# AxoDesk Decision Log

This file is the durable architecture decision record for the AxoDesk frontend. When a decision changes, add a new ADR that supersedes the earlier one instead of silently editing history.

## ADR-001: Single Shared UI Library Location

Status: Accepted

Date: 2026-04-25

Context: Shared UI primitives were being adopted across the app, and future work needs one obvious place to look before creating new controls.

Decision: All shared UI components live in `/src/components/ui/` -- no second component library directory.

Consequences: New shared primitives, wrappers, and component variants must be added under `frontend_new/src/components/ui/`. Page-specific composition can stay near the page, but reusable controls do not belong in page folders, feature folders, or a separate common library.

## ADR-002: No Raw HTML Form Elements In Application Code

Status: Accepted

Date: 2026-04-25

Context: The UI cleanup found duplicated raw `button`, `input`, `select`, and `textarea` implementations with inconsistent styling, tooltip behavior, disabled states, and accessibility handling.

Decision: All `button`, `input`, `select`, and `textarea` elements must use the shared component equivalents -- raw HTML elements are only permitted in the shared component implementations themselves and in documented browser-native exceptions such as file picker inputs.

Consequences: Application surfaces must use `Button`, `IconButton`, `BaseInput`, `PasswordInput`, `TextareaInput`, `BaseSelect`, `MultiSelect`, `SearchableSelect`, or another documented shared primitive. Existing raw controls are migration debt unless they are inside shared UI internals or intentionally preserved native file inputs.

## ADR-003: Tooltip Disabled On Mobile

Status: Accepted

Date: 2026-04-25

Context: Native `title=` attributes create inconsistent desktop behavior and poor mobile behavior. The shared tooltip system already centralizes hover/focus interactions and checks mobile viewport state.

Decision: `Tooltip` and `RichTooltip` components check `useIsMobile` and render no tooltip behavior on mobile -- use of the native `title=` attribute is banned, no exceptions.

Consequences: New tooltip usage must import the shared tooltip components from `src/components/ui`. Mobile affordances should be visible in the UI itself, not hidden in hover-only text. Remaining native `title=` attributes outside shared component internals are migration debt.

## ADR-004: Design Token Only Styling

Status: Accepted

Date: 2026-04-25

Context: The visual system is defined by Tailwind configuration and CSS variables in `tailwind.config.js`, `tailwind.css`, and `src/styles/design-system.css`. Hardcoded values make the UI harder to theme and harder to keep visually consistent.

Decision: No hardcoded color, spacing, radius, shadow, or font values anywhere in application code -- all values come from CSS variables or Tailwind config tokens.

Consequences: New and touched code must use documented tokens, Tailwind utilities backed by the config, or shared component variants. Existing hardcoded values are tracked as improvement work in `docs/code-standards.md` and should be removed when the owning surface is migrated.

## ADR-005: useDisclosure For All Open/Close State

Status: Accepted

Date: 2026-04-25

Context: Menus, dropdowns, modals, sheets, and popovers repeatedly used local boolean state with hand-written `open`, `close`, and `toggle` handlers.

Decision: All dropdown, menu, modal, sheet, and popover open/close/toggle state uses the shared `useDisclosure` hook -- no duplicated boolean state for this pattern.

Consequences: Use `useDisclosure` from `src/hooks/useDisclosure.ts`, which exports `UseDisclosureReturn` and `useDisclosure(initialOpen = false): { isOpen, open, close, toggle }`. Existing local state for the same pattern is migration debt and should be replaced when the file is touched.

## ADR-006: PageLayout Wraps All Desktop Pages

Status: Accepted

Date: 2026-04-25

Context: Desktop page shells need consistent title, breadcrumb, actions, spacing, and mobile handoff behavior.

Decision: Every desktop page view uses `PageLayout` with `title`, `breadcrumbs`, and `actions` props -- no one-off page shells.

Consequences: New desktop pages must start from `PageLayout` in `src/components/ui/layout/PageLayout.tsx` or the existing compatibility export at `src/components/ui/PageLayout.tsx`. Existing one-off page shells should be migrated to `PageLayout` during page cleanup, while mobile-specific flows can keep their dedicated mobile layouts.

## ADR-007: MobileSheet Is The Single Mobile Overlay System

Status: Accepted

Date: 2026-04-25

Context: Mobile workflows use a distinct bottom-sheet and fullscreen-sheet pattern that is not covered by desktop-oriented `CenterModal` or `SideModal` behavior.

Decision: `MobileSheet` in `/src/components/ui/modal/MobileSheet.tsx` is the only bottom sheet implementation -- all previous inline mobile overlay patterns are removed.

Consequences: Mobile bottom sheets must import `MobileSheet` from `src/components/ui/modal` or the existing compatibility export at `src/components/ui/Modal.tsx`. The shared implementation owns portal mounting, body scroll lock, Escape close, focus trap behavior, overlay behavior, bottom-sheet animation, fullscreen mode, and footer/header slots.

## ADR-008: API Calls Go Through The API Layer Only

Status: Accepted

Date: 2026-04-25

Context: Components and hooks should not own low-level request details, auth headers, base URLs, or error normalization.

Decision: No `fetch()` or axios calls in components or hooks directly -- all data fetching goes through the established API layer.

Consequences: The live frontend currently has no `src/api/` directory. Use the existing API layer in `src/lib/apiClient.ts`, `src/lib/api.ts`, `src/lib/*Api.ts`, and domain-local API modules such as `src/pages/workspace/api.ts` or `src/pages/workflow/workflowApi.ts`. If the project later creates `/src/api/`, update this ADR and the code standards in the same commit.

## ADR-00X: [Title]

Status: [Proposed | Accepted | Deprecated | Superseded]

Date:

Context: [Why was this decision needed]

Decision: [What was decided]

Consequences: [What does this mean for the codebase going forward]
