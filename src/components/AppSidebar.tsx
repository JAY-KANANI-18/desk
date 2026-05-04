import { NavLink, useLocation } from "react-router-dom";
import { BookCheck, Settings, type AppIcon } from "@/components/ui/icons";
import { useAuthorization } from "../context/AuthorizationContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { useDisclosure } from "../hooks/useDisclosure";
import { APP_NAV_ITEMS } from "./appNavigation";
import { useSettingsLinks } from "./settingsLinks";
import { Button } from "./ui/Button";

interface AppSidebarProps {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

export const AppSidebar = ({
  onNavigate,
  variant = "desktop",
}: AppSidebarProps) => {
  const settingsMenu = useDisclosure();
  const { canWs } = useAuthorization();
  const { dismissed, isComplete } = useGetStarted();
  const { flags } = useFeatureFlags();
  const settingsLinks = useSettingsLinks();
  const location = useLocation();

  const isMobileDrawer = variant === "mobile";
  const isExpanded = isMobileDrawer;
  const showOnboarding = !dismissed && !isComplete;
  const compactItemClass =
    "flex h-[3.35rem] w-[3.6rem] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] text-center transition-all";
  const inactiveNavClass = "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const activeNavClass = isExpanded
    ? "relative bg-transparent text-[var(--color-primary)] before:absolute before:left-[-0.6rem] before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[var(--color-primary)]"
    : "relative bg-transparent text-[var(--color-primary)] before:absolute before:left-[-0.55rem] before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[var(--color-primary)]";
  const isSettingsRouteActive = settingsLinks.some(
    (link) =>
      location.pathname === link.path ||
      location.pathname.startsWith(`${link.path}/`),
  );
  const isSettingsActive = settingsMenu.isOpen || isSettingsRouteActive;

  const handleNavClick = () => {
    onNavigate?.();
    settingsMenu.close();
  };

  const visibleNavItems = APP_NAV_ITEMS.filter(
    (item) => (!item.ws || canWs(item.ws)) && (!item.feature || flags[item.feature]),
  );

  const renderPrimaryLink = (
    path: string,
    label: string,
    Icon: AppIcon,
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
            isActive && !isSettingsActive
              ? activeNavClass 
              : inactiveNavClass
          }`
        }
      >
        {({ isActive }) => {
          const active = isActive && !isSettingsActive;

          return (
            <>
              <Icon
                size={22}
                weight={active ? "fill" : "regular"}
                className="flex-shrink-0"
              />
              {isExpanded ? (
                <span className="truncate text-sm font-semibold">{label}</span>
              ) : (
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                  {label}
                </span>
              )}
            </>
          );
        }}
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
      className={`app-sidebar relative flex h-full flex-col bg-white ${
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
          className={`flex min-h-0 flex-col gap-2  ${
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
                type="button"
                aria-expanded={settingsMenu.isOpen}
                aria-haspopup="menu"
                onClick={settingsMenu.toggle}
                className={`group cursor-pointer border-0 bg-transparent p-0 ${compactItemClass} ${
                  isSettingsActive ? activeNavClass : inactiveNavClass
                }`}
              >
                <span className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                  <Settings size={22} weight={isSettingsActive ? "fill" : "regular"} />
                  <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                    Settings
                  </span>
                </span>
              </button>

              {settingsMenu.isOpen && (
                <>
                  <Button
                    type="button"
                    variant="unstyled"
                    aria-label="Close settings menu"
                    className="fixed inset-0 z-10"
                    onClick={settingsMenu.close}
                  />
                  <div className="absolute bottom-0 left-full z-20 ml-3 w-72 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                    {settingsLinks.map((link) => {
                      const LinkIcon = link.icon;

                      return (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={handleNavClick}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 ${
                              isActive ? "text-[var(--color-primary)]" : "text-slate-700"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <LinkIcon
                                size={20}
                                weight={isActive ? "fill" : "regular"}
                                className="flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-normal">
                                  {link.title}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {link.subtitle}
                                </p>
                              </div>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
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
              {settingsLinks.map((link) => {
                const LinkIcon = link.icon;

                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                        isActive
                          ? "bg-transparent text-[var(--color-primary)] before:absolute before:left-[-0.6rem] before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[var(--color-primary)]"
                          : "text-slate-600 hover:bg-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <LinkIcon
                          size={18}
                          weight={isActive ? "fill" : "regular"}
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-normal">
                            {link.title}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {link.subtitle}
                          </p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
