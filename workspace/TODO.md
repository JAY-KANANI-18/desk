<instructions>
This file powers chat suggestion chips. Keep it focused and actionable.

Rules:
- Each task must be wrapped in "<todo>" and "</todo>" tags.
- Inside each <todo> block:
  - First line: title (required)
  - Second line: description (optional)
- You should proactively maintain this file after each response, even if the user did not explicitly ask.
- Add tasks only when there are concrete, project-specific next steps from current progress.
- Do NOT add filler tasks. Skip adding if no meaningful next step exists.
- Keep this list high-signal and concise, usually 1-3 strong tasks.
- If there are already 3 strong open tasks, usually do not add more.
- Remove or rewrite stale tasks when they are completed, obsolete, duplicated, or clearly lower-priority than current work.
- Re-rank remaining tasks by current impact and urgency.
- Prefer specific wording tied to real project scope/files; avoid vague goals.
</instructions>

<!-- Add tasks here only when there are real next steps. -->

<todo>
Go live: flip DUMMY_MODE in authApi.ts
Set `DUMMY_MODE = false` in `src/lib/authApi.ts`, configure `.env` with real Supabase credentials, and enable Email OTP + Google OAuth in the Supabase dashboard
</todo>

<todo>
Wire real WebSocket to notification system
In `InboxContext.tsx` set `DUMMY_MODE = false` and implement `inboxApi.subscribeToUpdates` — the `onAssign` and `onMention` callbacks are already wired to `notify()`
</todo>

<todo>
Enable Email OTP in Supabase dashboard
Go to Authentication → Email → enable "Email OTP" so the 6-digit verify flow works for signup and password reset
</todo>

<todo>
Enable Google OAuth provider in Supabase
Go to Authentication → Providers → Google and add your OAuth client ID/secret to enable "Continue with Google"
</todo>
