import { type ReactNode, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  type OrgPermission,
  type WorkspacePermission,
  useAuthorization,
} from "../../context/AuthorizationContext";
import { useAuth } from "../../context/AuthContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SettingsNavList } from "./SettingsNavList";

export type SettingsPermission = {
  org?: OrgPermission | OrgPermission[];
  ws?: WorkspacePermission | WorkspacePermission[];
};

export interface SettingsNavItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  to?: string;
  badge?: string;
  children?: SettingsNavItem[];
  permission?: SettingsPermission;
}

export interface SettingsNavSection {
  id: string;
  label: string;
  description?: string;
  items: SettingsNavItem[];
}

export interface SettingsModuleConfig {
  basePath: string;
  title: string;
  storageKey: string;
  sections: SettingsNavSection[];
}

export interface SettingsActiveMatch {
  item: SettingsNavItem;
  parents: SettingsNavItem[];
  section: SettingsNavSection;
}

const toArray = <T,>(value?: T | T[]) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const matchesSettingsPath = (pathname: string, target?: string) => {
  if (!target) {
    return false;
  }

  return pathname === target || pathname.startsWith(`${target}/`);
};

const isItemVisible = (
  item: SettingsNavItem,
  canOrg: (...permissions: OrgPermission[]) => boolean,
  canWs: (...permissions: WorkspacePermission[]) => boolean,
) => {
  const orgPermissions = toArray(item.permission?.org);
  const workspacePermissions = toArray(item.permission?.ws);

  if (orgPermissions.length > 0 && !canOrg(...orgPermissions)) {
    return false;
  }

  if (workspacePermissions.length > 0 && !canWs(...workspacePermissions)) {
    return false;
  }

  return true;
};

const filterSettingsItems = (
  items: SettingsNavItem[],
  canOrg: (...permissions: OrgPermission[]) => boolean,
  canWs: (...permissions: WorkspacePermission[]) => boolean,
): SettingsNavItem[] =>
  items.reduce<SettingsNavItem[]>((visibleItems, item) => {
    if (!isItemVisible(item, canOrg, canWs)) {
      return visibleItems;
    }

    const children = item.children
      ? filterSettingsItems(item.children, canOrg, canWs)
      : undefined;

    if (item.children && (!children || children.length === 0)) {
      return visibleItems;
    }

    visibleItems.push({
      ...item,
      children,
    });

    return visibleItems;
  }, []);

export const filterSettingsSections = (
  sections: SettingsNavSection[],
  canOrg: (...permissions: OrgPermission[]) => boolean,
  canWs: (...permissions: WorkspacePermission[]) => boolean,
) =>
  sections.reduce<SettingsNavSection[]>((visibleSections, section) => {
    const items = filterSettingsItems(section.items, canOrg, canWs);

    if (items.length === 0) {
      return visibleSections;
    }

    visibleSections.push({
      ...section,
      items,
    });

    return visibleSections;
  }, []);

export const flattenSettingsLeaves = (sections: SettingsNavSection[]) =>
  sections.flatMap((section) => flattenSettingsItems(section.items));

const flattenSettingsItems = (items: SettingsNavItem[]): SettingsNavItem[] =>
  items.flatMap((item) =>
    item.children && item.children.length > 0
      ? flattenSettingsItems(item.children)
      : item.to
        ? [item]
        : [],
  );

export const findSettingsItemById = (
  items: SettingsNavItem[],
  itemId: string,
): SettingsNavItem | null => {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.children) {
      const nested = findSettingsItemById(item.children, itemId);

      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

export const findSettingsSectionById = (
  sections: SettingsNavSection[],
  sectionId: string,
) => sections.find((section) => section.id === sectionId) ?? null;

export const findActiveSettingsMatch = (
  sections: SettingsNavSection[],
  pathname: string,
): SettingsActiveMatch | null => {
  for (const section of sections) {
    const match = findActiveSettingsItem(section.items, pathname, []);

    if (match) {
      return {
        ...match,
        section,
      };
    }
  }

  return null;
};

const findActiveSettingsItem = (
  items: SettingsNavItem[],
  pathname: string,
  parents: SettingsNavItem[],
): Omit<SettingsActiveMatch, "section"> | null => {
  for (const item of items) {
    if (matchesSettingsPath(pathname, item.to)) {
      return {
        item,
        parents,
      };
    }

    if (item.children && item.children.length > 0) {
      const nested = findActiveSettingsItem(item.children, pathname, [
        ...parents,
        item,
      ]);

      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

export const buildSettingsStorageKey = (
  baseKey: string,
  userId?: string | number | null,
) => `${baseKey}:${userId ?? "anonymous"}`;

const readStoredSettingsPath = (storageKey: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const resolveRedirectPath = (
  storageKey: string,
  sections: SettingsNavSection[],
) => {
  const availablePaths = flattenSettingsLeaves(sections)
    .map((item) => item.to)
    .filter((value): value is string => Boolean(value));

  const storedPath = readStoredSettingsPath(storageKey);

  if (storedPath && availablePaths.includes(storedPath)) {
    return storedPath;
  }

  return availablePaths[0] ?? null;
};

export const SettingsIndexRedirect = ({
  config,
}: {
  config: SettingsModuleConfig;
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { canOrg, canWs } = useAuthorization();

  const visibleSections = useMemo(
    () => filterSettingsSections(config.sections, canOrg, canWs),
    [config.sections, canOrg, canWs],
  );

  const targetPath = resolveRedirectPath(
    buildSettingsStorageKey(config.storageKey, user?.id),
    visibleSections,
  );

  if (isMobile) {
    return (
      <div className="space-y-6 pt-2">
        {/* <div className="px-1">
          <h1 className="text-lg font-semibold text-slate-900">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose what you want to open.
          </p>
        </div> */}

        <div className="pb-6">
          <SettingsNavList sections={visibleSections} />
        </div>
      </div>
    );
  }

  return (
    <Navigate
      replace
      state={{ from: location }}
      to={targetPath ?? "/inbox"}
    />
  );
};
