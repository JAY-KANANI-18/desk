import type { LucideIcon } from "lucide-react";
import {
  ChartColumnBig,
  Bot,
  ContactRound,
  LayoutDashboard,
  Megaphone,
  MessageCircleMore,
  RadioTower,
  Workflow,
} from "lucide-react";
import type { WorkspacePermission } from "../context/AuthorizationContext";

export type AppNavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  ws?: WorkspacePermission;
  mobile?: boolean;
  feature?: "aiAgents";
};

export const PRIMARY_MOBILE_PATH_ORDER = [
  // "/dashboard",
  "/contacts",
  "/inbox",
  "/channels",
];

export const PRIMARY_MOBILE_PATHS = new Set(PRIMARY_MOBILE_PATH_ORDER);

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    ws: "ws:dashboard:view",
    mobile: true,
  },
  {
    icon: MessageCircleMore,
    label: "Inbox",
    path: "/inbox",
    ws: "ws:messages:view",
    mobile: true,
  },
  {
    icon: ContactRound,
    label: "Contacts",
    path: "/contacts",
    ws: "ws:contacts:view",
    mobile: true,
  },
  {
    icon: Megaphone,
    label: "Broadcast",
    path: "/broadcast",
    ws: "ws:broadcasts:view",
    mobile: true,
  },
  {
    icon: Workflow,
    label: "Workflows",
    path: "/workflows",
    ws: "ws:workflows:view",
    mobile: true,
  },
  {
    icon: Bot,
    label: "AI Agents",
    path: "/ai-agents",
    ws: "ws:ai-agents:view",
    feature: "aiAgents",
    mobile: true,
  },
  {
    icon: ChartColumnBig,
    label: "Reports",
    path: "/reports",
    ws: "ws:reports:view",
    mobile: true,
  },
  {
    icon: RadioTower,
    label: "Channels",
    path: "/channels",
    ws: "ws:settings:view",
    mobile: true,
  },
];
