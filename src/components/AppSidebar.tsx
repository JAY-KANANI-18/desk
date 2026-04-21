import { NavLink } from "react-router-dom";
import { useState } from "react";
import { BookCheck, Settings } from "lucide-react";
import { Tooltip } from "./ui/Tooltip";
import { useAuthorization } from "../context/AuthorizationContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { APP_NAV_ITEMS } from "./appNavigation";
import { useSettingsLinks } from "./settingsLinks";

interface AppSidebarProps {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

export const AppSidebar = ({
  onNavigate,
  variant = "desktop",
}: AppSidebarProps) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const { canWs } = useAuthorization();
  const { dismissed, isComplete } = useGetStarted();
  const { flags } = useFeatureFlags();
  const settingsLinks = useSettingsLinks();

  const isMobileDrawer = variant === "mobile";
  const isExpanded = isMobileDrawer;
  const showOnboarding = !dismissed && !isComplete;
  const desktopIconButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900";

  const handleNavClick = () => {
    onNavigate?.();
    setShowSettingsMenu(false);
  };

  const visibleNavItems = APP_NAV_ITEMS.filter(
    (item) => (!item.ws || canWs(item.ws)) && (!item.feature || flags[item.feature]),
  );

  const renderPrimaryLink = (
    path: string,
    label: string,
    Icon: typeof BookCheck,
  ) => {
    const navLink = (
      <NavLink
        to={path}
        onClick={handleNavClick}
        className={({ isActive }) =>
          `group flex items-center gap-1 rounded-2xl px-3 py-3 transition-all ${
            isExpanded ? "w-full justify-start" : "h-11 w-11 justify-center"
          } ${
            isActive
              ? "bg-indigo-50 text-indigo-600 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.1)]"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`
        }
      >
        <Icon size={22} className="flex-shrink-0" />
        {isExpanded && (
          <span className="truncate text-sm font-semibold">{label}</span>
        )}
      </NavLink>
    );

    if (isExpanded) {
      return <div key={path}>{navLink}</div>;
    }

    return (
      <Tooltip key={path} content={label}>
        {navLink}
      </Tooltip>
    );
  };

  return (
    <aside
      className={`relative flex h-full flex-col  bg-white ${
        isMobileDrawer
          ? "w-[280px] max-w-[calc(100vw-1.5rem)] rounded-[30px] border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
          : "w-20 border-r border-slate-200"
      }`}
    >
      <div
        className={`flex items-center ${
          isExpanded
            ? "justify-start gap-3 border-b border-slate-100 px-5 py-5"
            : "justify-center  py-3"
        }`}
      >
        <img
          src={isExpanded ? "/axodesk-full.png" : "/axodesk-logo.png"}
          alt="Axodesk"
          className={isExpanded ? "h-11 w-auto" : "h-10 w-auto"}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav
          className={`flex min-h-0 flex-col gap-1  ${
            isExpanded ? "px-4 py-4" : "items-center px-3 py-3"
          }`}
        >
          {showOnboarding &&
            renderPrimaryLink("/get-started", "Getting started", BookCheck)}

          {visibleNavItems.map((item) =>
            renderPrimaryLink(item.path, item.label, item.icon),
          )}

          {!isExpanded && (
            <div className="relative">
              <Tooltip content="Settings">
                <button
                  onClick={() => setShowSettingsMenu((prev) => !prev)}
                  className={desktopIconButtonClass}
                >
                  <Settings size={22} />
                </button>
              </Tooltip>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <div className="absolute bottom-0 left-full z-20 ml-3 w-72 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                    {settingsLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={handleNavClick}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <link.icon size={20} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {link.title}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {link.subtitle}
                          </p>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {isMobileDrawer ? (
          <div className="border-t border-slate-100 px-4 py-4">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Settings
            </p>
            <div className="space-y-1">
              {settingsLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <link.icon size={18} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {link.title}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {link.subtitle}
                    </p>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
