import type { AppIcon } from "@/components/ui/icons";

export interface OnboardingOption {
  value: string;
  label: string;
  description?: string;
  helper?: string;
  emoji?: string;
  icon?: AppIcon;
  iconUrl?: string;
}

export interface OnboardingData {
  businessType: string;
  industry: string;
  teamSize: string;
  monthlyConversations: string;
  channels: string[];
  primaryGoal: string;
  painPoint: string;
  workspaceName: string;
  firstName: string;
  lastName: string;
}

export type OnboardingField = keyof OnboardingData;

export type OnboardingStepKey =
  | "welcome"
  | "businessType"
  | "industry"
  | "teamSize"
  | "monthlyConversations"
  | "channels"
  | "primaryGoal"
  | "painPoint"
  | "workspaceName"
  | "profile";

export interface OnboardingStepDefinition {
  key: OnboardingStepKey;
  label: string;
  title: string;
  description: string;
  optional?: boolean;
  autoAdvance?: boolean;
}
