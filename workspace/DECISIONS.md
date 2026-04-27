# System Decisions

*This file is the single source of truth for architectural and implementation decisions in this project.*

## Purpose

Records key technical decisions, their rationale, alternatives considered, and outcomes. This file prevents the same discussions from happening twice and helps future-you (or future-sessions) understand *why* things are the way they are.

## When to Update This File

Update this file when:
- A significant technical or architectural decision is made
- A library, framework, or tool is chosen over alternatives
- A design pattern or approach is selected for a non-trivial problem
- A previous decision is revisited, changed, or reversed
- A constraint or trade-off is discovered that shaped the implementation
- A workaround is chosen due to external limitations (API quirks, library bugs, etc.)

**Do not** log trivial decisions (variable naming, minor formatting). If it wouldn't be worth explaining to a teammate joining the project, skip it.

## Format

Each entry follows this structure:

```
### [YYYY-MM-DD] — [Short Decision Title]

**Status:** Accepted | Superseded | Deprecated
**Context:** Why this decision was needed. What problem or question triggered it.
**Decision:** What was decided.
**Alternatives Considered:**
- [Alternative A] — Why it was rejected.
- [Alternative B] — Why it was rejected.
**Consequences:** What this decision enables, constrains, or risks.
```

If this file gets corrupted, re-create it. 
CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

---

## Decisions

<!-- New entries go here, newest first -->

### [2026-04-24] - Track Shared UI Completion With A Route Checklist

**Status:** Accepted
**Context:** The shared UI transformation had audit and status docs, but no stricter route-by-route verification tracker. That made it easy to say a screen was "migrated" even when some child surfaces still used raw controls or had not been re-verified against the latest standards.
**Decision:** Add `frontend_new/docs/ai/03_UI_TRANSFORMATION_CHECKLIST.md` as the required route and child-surface checklist. Every item starts unchecked until explicitly verified, and future migration batches must update the checklist alongside the status doc.
**Alternatives Considered:**
- Keep using only the status doc - Rejected because it is too high-level for page-by-page verification.
- Track progress ad hoc in prompts - Rejected because it is not durable across sessions.
**Consequences:** Migration work now has a stricter source of truth for completion, route ownership is clearer, and regressions can be reflected by unchecking specific surfaces instead of relying on narrative status updates.

### [2026-04-24] - Keep Frontend AI Guardrails As A Repo-Local Skill

**Status:** Accepted
**Context:** Frontend migration work now spans shared UI primitives, desktop layout wrappers, channel metadata, navigation config, and repeated type cleanup. Session-specific prompts were no longer enough to keep every AI edit aligned with the same enterprise-level rules.
**Decision:** Create a repo-local skill at `.codex/skills/axodesk-frontend-guardrails/` that points AI agents to the existing frontend migration docs and codifies the current rules around shared components, shared layouts, shared interfaces, shared content sources, and whole-system thinking.
**Alternatives Considered:**
- Keep relying on one-off prompts - Rejected because rules drift across sessions and repeated migration batches.
- Copy the same guardrails into multiple docs and task prompts - Rejected because it increases duplication and makes rule updates harder to keep consistent.
**Consequences:** Future AI sessions have a single entry point for frontend migration rules, shared-source reuse becomes more consistent, and the existing docs remain the source of truth instead of being replaced by page-local habits.
