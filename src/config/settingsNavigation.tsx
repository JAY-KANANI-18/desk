import {
  BarChart3,
  Bell,
  Building,
  Building2,
  CircleUserRound,
  GitBranch,
  MessageSquareText,
  RadioTower,
  
  RefreshCw,
  Settings,
  Sparkles,
  Tag,
  Users,
  Users2,
  UsersRound,
  Wand2,
} from "lucide-react";
import type { SettingsModuleConfig } from "../components/settings/navigation";

export const workspaceSettingsConfig: SettingsModuleConfig = {
  basePath: "/workspace/settings",
  title: "Workspace settings",
  storageKey: "settings-nav:workspace",
  sections: [
    {
      id: "workspace-foundation",
      label: "General",
      items: [
        {
          id: "workspace-general-info",
          label: "General info",
          icon: <Settings size={18} />,
          permission: { ws: "ws:settings:view" },
          to: "/workspace/settings/general-info",
        },
        {
          id: "workspace-users",
          label: "Workspace users",
          icon: <Users size={18} />,
          permission: { org: "org:workspaces:view" },
          to: "/workspace/settings/users",
        },
      ],
    },
    {
      id: "workspace-operations",
      label: "Configuration",
      items: [
        {
          id: "workspace-lifecycle",
          label: "Lifecycle",
          icon: <RefreshCw size={18} />,
          permission: { ws: "ws:settings:view" },
          to: "/workspace/settings/lifecycle",
        },
        {
          id: "workspace-tags",
          label: "Tags",
          icon: <Tag size={18} />,
          permission: { ws: "ws:settings:view" },
          to: "/workspace/settings/tags",
        },
        {
          id: "workspace-integrations",
          label: "Integrations",
          icon: <RadioTower size={18} />,
          permission: { ws: "ws:channels:manage" },
          to: "/workspace/settings/integrations",
        },
      ],
    },
    {
      id: "workspace-ai",
      label: "AI",
      items: [
        {
          id: "workspace-ai-assist",
          label: "AI assist",
          icon: <Wand2 size={18} />,
          permission: { ws: "ws:settings:view" },
          to: "/workspace/settings/ai-assist",
        },
        {
          id: "workspace-ai-prompts",
          label: "AI prompts",
          icon: <Sparkles size={18} />,
          permission: { ws: "ws:settings:view" },
          to: "/workspace/settings/ai-prompts",
        },
      ],
    },
  ],
};

export const organizationSettingsConfig: SettingsModuleConfig = {
  basePath: "/organization",
  title: "Organization settings",
  storageKey: "settings-nav:organization",
  sections: [
    {
      id: "organization-account",
      label: "Account",
      items: [
        {
          id: "organization-account-info",
          label: "Account info",
          icon: <Building2 size={18} />,
          permission: { org: "org:settings:view" },
          to: "/organization/account-info",
        },
        {
          id: "organization-users",
          label: "Organization users",
          icon: <Users2 size={18} />,
          permission: { org: "org:users:view" },
          to: "/organization/users-settings",
        },
        {
          id: "organization-workspaces",
          label: "Workspaces",
          icon: <Building size={18} />,
          permission: { org: "org:workspaces:view" },
          to: "/organization/workspaces",
        },
      ],
    },
    {
      id: "organization-billing",
      label: "Billing",
      items: [
        {
          id: "organization-whatsapp-fees",
          label: "WhatsApp fees",
          icon: <MessageSquareText size={18} />,
          permission: { org: "org:settings:view" },
          to: "/organization/whatsapp-fees",
        },
        {
          id: "organization-billing-usage",
          label: "Billing & usage",
          icon: <BarChart3 size={18} />,
          permission: { org: "org:billing:view" },
          to: "/organization/billing-usage",
        },
      ],
    },
  ],
};

export const userSettingsConfig: SettingsModuleConfig = {
  basePath: "/user/settings",
  title: "Personal settings",
  storageKey: "settings-nav:user",
  sections: [
    {
      id: "user-preferences",
      label: "Preferences",
      items: [
        {
          id: "user-profile",
          label: "Profile",
          icon: <CircleUserRound size={18} />,
          permission: { ws: "ws:profile:manage" },
          to: "/user/settings/profile",
        },
        {
          id: "user-notifications",
          label: "Notifications",
          icon: <Bell size={18} />,
          permission: { ws: "ws:notifications:manage" },
          to: "/user/settings/notifications",
        },
      ],
    },
  ],
};

export const reportsSettingsConfig: SettingsModuleConfig = {
  basePath: "/reports",
  title: "Reports",
  storageKey: "settings-nav:reports",
  sections: [
    {
      id: "reports-overview",
      label: "Analytics",
      items: [
        {
          id: "reports-messages",
          label: "Messages",
          icon: <MessageSquareText size={18} />,
          permission: { ws: "ws:reports:view" },
          to: "/reports/messages",
        },
        {
          id: "reports-conversations",
          label: "Conversations",
          icon: <UsersRound size={18} />,
          permission: { ws: "ws:reports:view" },
          to: "/reports/conversations",
        },
        {
          id: "reports-contacts",
          label: "Contacts",
          icon: <Users size={18} />,
          permission: { ws: "ws:reports:view" },
          to: "/reports/contacts",
        },
        {
          id: "reports-lifecycle",
          label: "Lifecycle",
          icon: <GitBranch size={18} />,
          permission: { ws: "ws:reports:view" },
          to: "/reports/lifecycle",
        },
      ],
    },
  ],
};
