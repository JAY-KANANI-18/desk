import type { LucideIcon } from "lucide-react";
import {
  ChartColumnBig,
  ContactRound,
  LayoutDashboard,
  Megaphone,
  MessageCircleMore,
  Plug,
  Workflow,
} from "lucide-react";
import type { WorkspacePermission } from "../context/AuthorizationContext";

export type AppNavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  ws?: WorkspacePermission;
  mobile?: boolean;
};

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
  },
  {
    icon: Workflow,
    label: "Workflows",
    path: "/workflows",
    ws: "ws:workflows:view",
  },
  {
    icon: ChartColumnBig,
    label: "Reports",
    path: "/reports",
    ws: "ws:reports:view",
    mobile: true,
  },
  {
    icon: Plug,
    label: "Channels",
    path: "/channels",
    ws: "ws:settings:view",
    mobile: true,
  },
];
