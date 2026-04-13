import {
  Blocks,
  Bot,
  BriefcaseBusiness,
  Factory,
  Facebook,
  Globe,
  Headphones,
  Instagram,
  LayoutDashboard,
  Mail,
  MessageCircleMore,
  MonitorSmartphone,
  ShoppingBag,
  Siren,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type {
  OnboardingOption,
  OnboardingStepDefinition,
} from "./onboarding.types";

export const BUSINESS_TYPE_OPTIONS: OnboardingOption[] = [
  {
    value: "ecommerce",
    label: "Ecommerce",
    description: "Sell products and manage customer orders across channels.",
    icon: ShoppingBag,
  },
  {
    value: "saas",
    label: "SaaS",
    description: "Support, onboard, and retain users in one shared inbox.",
    icon: Sparkles,
  },
  {
    value: "agency",
    label: "Agency",
    description: "Coordinate conversations for multiple clients and teams.",
    icon: BriefcaseBusiness,
  },
  {
    value: "service",
    label: "Service",
    description: "Handle bookings, requests, and ongoing customer support.",
    icon: Wrench,
  },
  {
    value: "other",
    label: "Other",
    description: "A custom setup we can tailor as your workflows grow.",
    icon: Blocks,
  },
];

export const INDUSTRY_OPTIONS: OnboardingOption[] = [
  {
    value: "tiles-manufacturing",
    label: "Tiles & Manufacturing",
    description: "Designed for quote-heavy, dealer-led customer journeys.",
    icon: Factory,
  },
  {
    value: "retail",
    label: "Retail",
    description: "Support shoppers across stores, catalogs, and live inquiries.",
    icon: Store,
  },
  {
    value: "d2c",
    label: "D2C",
    description: "Own the end-to-end conversation from marketing to repeat sales.",
    icon: TrendingUp,
  },
  {
    value: "tech",
    label: "Tech",
    description: "Keep product questions, support, and success aligned.",
    icon: MonitorSmartphone,
  },
  {
    value: "other",
    label: "Other",
    description: "We will keep the workspace flexible while you get started.",
    icon: Blocks,
  },
];

export const TEAM_SIZE_OPTIONS: OnboardingOption[] = [
  {
    value: "1-5",
    label: "1-5",
    description: "A compact team moving fast.",
    icon: Users,
  },
  {
    value: "5-20",
    label: "5-20",
    description: "Growing collaboration and shared ownership.",
    icon: Users,
  },
  {
    value: "20-50",
    label: "20-50",
    description: "Multiple teams, more routing, more visibility.",
    icon: Users,
  },
  {
    value: "50+",
    label: "50+",
    description: "Larger operations that need structure at scale.",
    icon: Users,
  },
];

export const MONTHLY_CONVERSATION_OPTIONS: OnboardingOption[] = [
  {
    value: "<100",
    label: "<100",
    description: "A lighter flow with room to grow.",
    icon: MessageCircleMore,
  },
  {
    value: "100-1k",
    label: "100-1k",
    description: "A steady stream of customer conversations.",
    icon: MessageCircleMore,
  },
  {
    value: "1k-10k",
    label: "1k-10k",
    description: "Higher volume that benefits from smarter routing.",
    icon: MessageCircleMore,
  },
  {
    value: "10k+",
    label: "10k+",
    description: "Serious scale that needs fast team coordination.",
    icon: MessageCircleMore,
  },
];

export const CHANNEL_OPTIONS: OnboardingOption[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    description: "Handle the conversations your customers expect first.",
    icon: MessageCircleMore,
    iconUrl: "https://cdn.simpleicons.org/whatsapp/25D366",
  },
  {
    value: "instagram",
    label: "Instagram",
    description: "Capture DMs, stories, and social leads in one place.",
    icon: Instagram,
    iconUrl: "https://cdn.simpleicons.org/instagram/E4405F",
  },
  {
    value: "email",
    label: "Email",
    description: "Keep slower, higher-context threads alongside chat.",
    icon: Mail,
    iconUrl: "https://cdn.simpleicons.org/gmail/EA4335",
  },
  {
    value: "website-chat",
    label: "Website Chat",
    description: "Convert visitors the moment they land on your site.",
    icon: Globe,
    iconUrl: "https://cdn.simpleicons.org/livechat/FF5100",
  },
  {
    value: "facebook",
    label: "Facebook",
    description: "Support your page audience without tab-switching.",
    icon: Facebook,
    iconUrl: "https://cdn.simpleicons.org/facebook/1877F2",
  },
];

export const PRIMARY_GOAL_OPTIONS: OnboardingOption[] = [
  {
    value: "conversation-hub",
    label: "Manage all conversations in one place",
    description: "Bring every team and channel into one calm workspace.",
    icon: LayoutDashboard,
  },
  {
    value: "support",
    label: "Improve customer support",
    description: "Respond faster, stay accountable, and reduce drop-offs.",
    icon: Headphones,
  },
  {
    value: "sales",
    label: "Increase sales and conversions",
    description: "Turn every inquiry into a trackable revenue opportunity.",
    icon: TrendingUp,
  },
  {
    value: "automation",
    label: "Automate responses",
    description: "Save your team time with workflows and smart replies.",
    icon: Bot,
  },
];

export const PAIN_POINT_OPTIONS: OnboardingOption[] = [
  {
    value: "missing-messages",
    label: "Missing messages",
    description: "Conversations slip through the cracks too often.",
    emoji: "\uD83D\uDE35",
    icon: Siren,
  },
  {
    value: "switching-apps",
    label: "Switching between apps",
    description: "Your team wastes time chasing context everywhere.",
    emoji: "\uD83D\uDE2E\u200D\uD83D\uDCA8",
    icon: Blocks,
  },
  {
    value: "slow-replies",
    label: "Slow replies",
    description: "Customers wait longer than your team wants.",
    emoji: "\u23F3",
    icon: MessageCircleMore,
  },
  {
    value: "no-automation",
    label: "No automation",
    description: "Everything is manual, repetitive, and hard to scale.",
    emoji: "\uD83E\uDD16",
    icon: Bot,
  },
  {
    value: "no-visibility",
    label: "No team visibility",
    description: "It is hard to see ownership, workload, and progress.",
    emoji: "\uD83E\uDEE5",
    icon: Users,
  },
];

export const FULL_ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    key: "welcome",
    label: "Welcome",
    title: "Welcome to AxoDesk",
    description: "Let's set up your workspace in about 60 seconds.",
  },
  {
    key: "businessType",
    label: "Business",
    title: "What type of business are you running?",
    description: "Pick the closest fit so we can shape the right starting point.",
    autoAdvance: true,
  },
  {
    key: "industry",
    label: "Industry",
    title: "Which industry do you operate in?",
    description: "Optional, but it helps us tailor the experience you see first.",
    optional: true,
    autoAdvance: true,
  },
  {
    key: "teamSize",
    label: "Team",
    title: "How big is your team?",
    description: "We use this to tune collaboration defaults and routing ideas.",
    autoAdvance: true,
  },
  {
    key: "monthlyConversations",
    label: "Volume",
    title: "How many customer conversations do you handle monthly?",
    description: "Helps us optimize your experience from day one.",
    autoAdvance: true,
  },
  {
    key: "channels",
    label: "Channels",
    title: "Where do your customers message you?",
    description: "Choose every channel you actively use today.",
  },
  {
    key: "primaryGoal",
    label: "Goal",
    title: "What do you want to achieve with AxoDesk?",
    description: "This shapes the initial focus of your workspace.",
    autoAdvance: true,
  },
  {
    key: "painPoint",
    label: "Challenge",
    title: "What's your biggest challenge right now?",
    description: "We'll use this to prioritize the right workflow suggestions.",
    autoAdvance: true,
  },
  {
    key: "workspaceName",
    label: "Workspace",
    title: "Name your workspace",
    description: "Keep it simple. You can rename it later at any time.",
  },
  {
    key: "profile",
    label: "Profile",
    title: "Add your name",
    description: "Just enough to personalize your workspace for the team.",
  },
];

export const PROFILE_ONLY_STEPS: OnboardingStepDefinition[] = [
  {
    key: "welcome",
    label: "Welcome",
    title: "Let's finish your setup",
    description: "A few quick details and you'll be inside AxoDesk.",
  },
  {
    key: "profile",
    label: "Profile",
    title: "Add your name",
    description: "This helps teammates know who is behind each conversation.",
  },
];

export const SUMMARY_OPTIONS = {
  businessType: BUSINESS_TYPE_OPTIONS,
  industry: INDUSTRY_OPTIONS,
  teamSize: TEAM_SIZE_OPTIONS,
  monthlyConversations: MONTHLY_CONVERSATION_OPTIONS,
  channels: CHANNEL_OPTIONS,
  primaryGoal: PRIMARY_GOAL_OPTIONS,
  painPoint: PAIN_POINT_OPTIONS,
};
