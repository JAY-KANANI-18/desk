import { Navigate } from "react-router-dom";
import {
  APP_NAV_ITEMS,
  PRIMARY_MOBILE_PATHS,
} from "../components/appNavigation";
import { SettingsNavList } from "../components/settings/SettingsNavList";
import type { SettingsNavSection } from "../components/settings/navigation";
import { useSettingsLinks } from "../components/settingsLinks";
import { useAuthorization } from "../context/AuthorizationContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { useIsMobile } from "../hooks/useIsMobile";

export function MorePage() {
  const isMobile = useIsMobile();
  const { canWs } = useAuthorization();
  const { flags } = useFeatureFlags();
  const settingsLinks = useSettingsLinks();

  const moreNavItems = APP_NAV_ITEMS.filter(
    (item) =>
      item.mobile &&
      !PRIMARY_MOBILE_PATHS.has(item.path) &&
      (!item.ws || canWs(item.ws)) &&
      (!item.feature || flags[item.feature]),
  );

  if (!isMobile) {
    return <Navigate to="/inbox" replace />;
  }

  const sections: SettingsNavSection[] = [
    moreNavItems.length
      ? {
          id: "more-workspace",
          // label: "Other Navigation",
          items: moreNavItems.map((item) => ({
            id: `more-${item.path}`,
            label: item.label,
            icon: <item.icon size={22} />,
            to: item.path,
          })),
        }
      : null,
    settingsLinks.length
      ? {
          id: "more-settings",
          label: "Settings",
          items: settingsLinks.map((link) => ({
            id: `settings-${link.path}`,
            label: link.title,
            description: link.subtitle,
            icon: <link.icon size={22} />,
            to: link.path,
          })),
        }
      : null,
  ].filter(Boolean) as SettingsNavSection[];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900">
              More
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 ">
        {sections.length ? (
          <SettingsNavList sections={sections} />
        ) : (
          <div className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No additional pages are available for your workspace.
          </div>
        )}
      </div>
    </div>
  );
}
