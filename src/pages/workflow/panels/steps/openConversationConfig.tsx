
// ─── 7. Open Conversation ─────────────────────────────────────────────────────

import { SP } from "../../workflow.types";
import { Section } from "../PanelShell";

export function OpenConversationConfig({ step, onChange }: SP) {
  return (
    <Section title="How It Works">
      <p className="text-sm text-gray-500">Opens a conversation with the contact. No additional configuration needed.</p>
    </Section>
  );
}