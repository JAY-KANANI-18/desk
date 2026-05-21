import type { VariableSuggestionOption } from "../components/ui/Select";

export type VariableContext =
  | "conversation"
  | "workflowContact"
  | "workflowCommerce"
  | "broadcast";

export interface VariableMetadata {
  key: string;
  label: string;
  group: string;
  description?: string;
}

export const VARIABLE_METADATA: VariableMetadata[] = [
  {
    key: "contact.first_name",
    label: "First name",
    group: "Contact property",
  },
  {
    key: "contact.last_name",
    label: "Last name",
    group: "Contact property",
  },
  {
    key: "contact.email",
    label: "Email",
    group: "Contact property",
  },
  {
    key: "contact.phone",
    label: "Phone number",
    group: "Contact property",
  },
  {
    key: "contact.company",
    label: "Company",
    group: "Contact property",
  },
  {
    key: "contact.language",
    label: "Language",
    group: "Contact property",
  },
  {
    key: "trigger.orderNumber",
    label: "Order number",
    group: "Order property",
  },
  {
    key: "trigger.orderTotalAmount",
    label: "Order total",
    group: "Order property",
  },
  {
    key: "trigger.currency",
    label: "Currency",
    group: "Order property",
  },
  {
    key: "trigger.checkoutUrl",
    label: "Checkout link",
    group: "Cart property",
  },
  {
    key: "trigger.customerEmail",
    label: "Customer email",
    group: "Order property",
  },
  {
    key: "trigger.customerPhone",
    label: "Customer phone",
    group: "Order property",
  },
  {
    key: "contact.name",
    label: "Contact name",
    group: "Contact property",
    description: "Full name, email, or phone",
  },
  {
    key: "agent.name",
    label: "Agent name",
    group: "Sender property",
    description: "Broadcast sender",
  },
  {
    key: "agent.email",
    label: "Agent email",
    group: "Sender property",
  },
  {
    key: "conversation.id",
    label: "Conversation ID",
    group: "Conversation property",
  },
  {
    key: "conversation.last_message",
    label: "Last message",
    group: "Conversation property",
    description: "Most recent conversation message",
  },
  {
    key: "company.name",
    label: "Workspace name",
    group: "Workspace property",
  },
  {
    key: "today.date",
    label: "Today's date",
    group: "System property",
  },
];

export const VARIABLE_METADATA_BY_KEY: Record<string, VariableMetadata> =
  Object.fromEntries(VARIABLE_METADATA.map((variable) => [variable.key, variable]));

export const VARIABLE_CONTEXT_KEYS: Record<VariableContext, string[]> = {
  conversation: [
    "contact.name",
    "contact.first_name",
    "contact.last_name",
    "contact.email",
    "contact.phone",
    "contact.company",
    "agent.name",
    "agent.email",
    "conversation.id",
    "conversation.last_message",
    "company.name",
    "today.date",
  ],
  workflowContact: [
    "contact.name",
    "contact.first_name",
    "contact.last_name",
    "contact.email",
    "contact.phone",
    "contact.language",
  ],
  workflowCommerce: [
    "trigger.orderNumber",
    "trigger.orderTotalAmount",
    "trigger.currency",
    "trigger.checkoutUrl",
    "trigger.customerEmail",
    "trigger.customerPhone",
  ],
  broadcast: [
    "contact.name",
    "contact.first_name",
    "contact.last_name",
    "contact.email",
    "contact.phone",
    "agent.name",
    "conversation.last_message",
  ],
};

export function getVariableMetadata(key: string) {
  return VARIABLE_METADATA_BY_KEY[key] ?? null;
}

export function toVariableSuggestionOption(key: string): VariableSuggestionOption {
  const metadata = getVariableMetadata(key);

  return {
    key,
    label: metadata?.label ?? key,
    description: metadata?.description,
    group: metadata?.group,
  };
}

export function getVariableOptionsForContext(
  context: VariableContext,
): VariableSuggestionOption[] {
  return VARIABLE_CONTEXT_KEYS[context].map(toVariableSuggestionOption);
}
