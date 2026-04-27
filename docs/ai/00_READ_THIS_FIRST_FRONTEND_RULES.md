# Frontend Rules For AI Agents

Any AI agent touching `frontend_new` should start with the repo-local skill at `.codex/skills/axodesk-frontend-guardrails/SKILL.md` when available, then read `00_READ_THIS_FIRST_FRONTEND_RULES.md`, `01_SHARED_UI_TRANSFORMATION_STATUS.md`, `02_UI_AUDIT_BASELINE.md`, and `03_UI_TRANSFORMATION_CHECKLIST.md` before making UI changes.

## Core rules

- Extend `src/components/ui/`. Do not create a second common/shared component library.
- Preserve the current AxoDesk visual identity. Improve consistency and structure, but do not redesign components the team already likes.
- Use existing shared components first. Prefer shared `Button`, `Input`, `Textarea`, `Select`, `Tag`, `Avatar`, `Modal`, `Tooltip`, `TruncatedText`, `Breadcrumb`, and `PageLayout` before writing one-off UI.
- If a shared component needs page-level `className` or inline `style` to look correct, stop and add a shared variant/prop instead. Shared components should own their styling and variations.
- Before changing shared component defaults, variant styles, or behavior, search all existing consumers of the affected component/variant/prop and verify the blast radius. Prefer additive, default-preserving props unless every affected screen is intentionally updated.
- Mobile should remain untouched unless something is already broken. Tooltips must not render on mobile/touch devices.
- Keep routing structure and product flows intact. Do not change core behavior while refactoring UI.
- Theme is Tailwind-led. The primary theme color is `indigo-600` (`#4f46e5`). Shared tokens in `src/styles/design-system.css` should stay aligned with that theme, not invent a separate palette.
- Use existing spacing, radius, typography, and color decisions already present in the app. Be consistent with the app, not with generic design-system defaults.
- Shared modals own header and footer structure. Back button, title/subtitle, close button, cancel button, and primary CTA should come from the shared modal API so they stay in the same position across create, edit, save, and confirm flows.
- Desktop layout work should converge on shared wrappers like `PageLayout`, but only migrate live pages carefully and verify they still match the current experience.
- Keep focus, hover, disabled, loading, empty, and error states consistent across shared components.

## Working rules

- Before editing a live page, check whether the needed behavior can be solved in the shared component layer first.
- Before editing a shared component, inspect its existing route consumers so a local fix does not regress already-migrated UI.
- Before editing a routed surface, find it in `03_UI_TRANSFORMATION_CHECKLIST.md`, start from unchecked items, and update the relevant boxes in the same change set.
- Do not break mobile-only flows such as native select pickers or mobile sheets unless explicitly replacing them with a verified equivalent.
- When fixing a shared component regression, prefer central fixes over page-specific overrides.
- Keep these docs updated when the migration plan, shared API, or frontend rules change.
- If work touches AI Agents specifically, also review [ai-agent-ui-experience.md](../ai-agent-ui-experience.md).

## Verification rules

- Run `npm run build` after meaningful frontend changes.
- Manually verify the exact affected screens when shared controls change, especially auth, toolbar search, settings forms, inbox composer, and modal flows.
- Call out any remaining risky surfaces before moving to the next migration batch.
