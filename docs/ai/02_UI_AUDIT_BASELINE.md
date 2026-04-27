# UI Audit Baseline

Any AI agent touching `frontend_new` must read `00_READ_THIS_FIRST_FRONTEND_RULES.md`, `01_SHARED_UI_TRANSFORMATION_STATUS.md`, `02_UI_AUDIT_BASELINE.md`, and `03_UI_TRANSFORMATION_CHECKLIST.md` before making UI changes.

Treat this file as the approved audit baseline unless the user explicitly asks for a fresh audit.

## Confirmed audit findings

- Raw HTML elements dominated the codebase: `757` raw `button`, `205` raw `input`, `48` raw `select`, and `25` raw `textarea`.
- `src/components/ui/` already existed with `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Tooltip`, `Badge`, and `Toggle`, but adoption was near zero when the audit began.
- Tags were implemented separately in at least five places.
- Avatars were duplicated across `ContactAvatar.tsx`, `Dashboard.tsx`, `ChatHeader.tsx`, `UserSettings`, topbar, contacts table, and inbox sidebar.
- Modal behavior was fragmented across `MobileSheet.tsx`, raw fixed overlays, inbox side panels, and an older `Modal.tsx`.
- Layout systems were split between `SettingsLayout.tsx`, AI-agent-specific shells, and many one-off page shells.
- Tooltip behavior was inconsistent. The older tooltip had no mobile-disable or auto-flip behavior, and many places used native `title=`.
- Select and dropdown logic was duplicated in inbox assignment, lifecycle menus, broadcast tag picker, contact sidebar tag picker, workflow panels, and AI filters.
- Desktop sidebar active-state handling was not fully synced with nested settings and report sub-routes.

## Router and shell baseline

Primary router entrypoints at audit time:

- `src/router/AppGate.tsx`
- `src/router/AuthRouter.tsx`
- `src/router/WorkspaceRouter.tsx`

Important route shells and wrappers at audit time:

- `Layout`
- `ProtectedRoute`
- `InboxLayout`
- `ReportsLayout`
- `WorkspaceSettings`
- `UserSettingsLayout`
- `Organization`
- `AiAgentsFeatureRoute`

Nested settings/report sections came from `src/config/settingsNavigation.tsx`.

## Why the transformation started

The app had several parallel UI systems:

- older `components/ui` primitives
- auth-specific primitives
- AI-agent-specific page shells/primitives
- many page-local button/input/select/tag/modal implementations

This caused inconsistent spacing, focus states, loading states, border radii, dropdown behavior, and modal behavior across live screens.

## Migration strategy approved by the user

- Do not re-audit from scratch unless asked.
- Extend `src/components/ui/` instead of creating a second common library.
- Build reusable shared primitives first.
- Migrate live pages gradually.
- Keep the old visual feel where it was already working well.
- Fix shared regressions centrally instead of papering them over with local overrides.
- Use `03_UI_TRANSFORMATION_CHECKLIST.md` as the live page-by-page verification tracker; do not treat status mentions alone as proof that a route is fully standardized.
