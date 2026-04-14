import { Building, Building2, type LucideIcon, User } from "lucide-react";
import { useAuthorization } from "../context/AuthorizationContext";
import { useOrganization } from "../context/OrganizationContext";
import { useWorkspace } from "../context/WorkspaceContext";

export interface SettingsLink {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  path: string;
}

export function useSettingsLinks(): SettingsLink[] {
  const { activeOrganization } = useOrganization();
  const { activeWorkspace } = useWorkspace();
  const { canOrg, canWs } = useAuthorization();

  return [
    canOrg("org:settings:view")
      ? {
          icon: Building2,
          title: "Organization settings",
          subtitle: activeOrganization?.name || "Organization",
          path: "/organization",
        }
      : null,
    canWs("ws:settings:view")
      ? {
          icon: Building,
          title: "Workspace settings",
          subtitle: activeWorkspace?.name || "Workspace",
          path: "/workspace/settings",
        }
      : null,
    {
      icon: User,
      title: "Personal settings",
      subtitle: "Profile & notifications",
      path: "/user/settings",
    },
  ].filter(Boolean) as SettingsLink[];
}
