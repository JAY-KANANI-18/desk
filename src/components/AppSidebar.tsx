import { NavLink } from "react-router-dom";
import { useState } from "react";
import { BookCheck, Settings } from "lucide-react";
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
  const compactItemClass =
    "flex h-[3.35rem] w-[3.6rem] flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-center transition-all";
  const desktopIconButtonClass = `${compactItemClass} text-slate-500 hover:bg-slate-100 hover:text-slate-900`;
  const activeNavClass = isExpanded
    ? "relative bg-transparent text-indigo-600 before:absolute before:left-[-0.6rem] before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-indigo-500"
    : "relative bg-transparent text-indigo-600 before:absolute before:left-[-0.55rem] before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-indigo-500";

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
          `group rounded-2xl transition-all ${
            isExpanded
              ? "flex w-full items-center justify-start gap-1 px-3 py-3"
              : `${compactItemClass}`
          } ${
            isActive
              ? activeNavClass
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`
        }
      >
        <Icon size={17} className="flex-shrink-0" />
        {isExpanded ? (
          <span className="truncate text-sm font-semibold">{label}</span>
        ) : (
          <span className="line-clamp-2 text-[9.5px] font-semibold leading-tight">
            {label}
          </span>
        )}
      </NavLink>
    );

    return (
      <div
        key={path}
        className={isExpanded ? "w-full" : "flex w-full justify-center"}
      >
        {navLink}
      </div>
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
            : "justify-center py-2"
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
            isExpanded ? "px-4 py-4" : "items-center gap-0 px-2 py-1"
          }`}
        >
          {showOnboarding &&
            renderPrimaryLink("/get-started", "Quick Setup", BookCheck)}

          {visibleNavItems.map((item) =>
            renderPrimaryLink(item.path, item.label, item.icon),
          )}

          {!isExpanded && (
            <div className="relative flex w-full justify-center">
              <button
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className={`${desktopIconButtonClass} ${
                  showSettingsMenu
                    ? "relative bg-transparent text-indigo-600 before:absolute before:left-[-0.55rem] before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-indigo-500"
                    : ""
                }`}
              >
                <Settings size={17} />
                <span className="line-clamp-2 text-[9.5px] font-semibold leading-tight">
                  Settings
                </span>
              </button>

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
                    `relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-transparent text-indigo-600 before:absolute before:left-[-0.6rem] before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-indigo-500"
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
