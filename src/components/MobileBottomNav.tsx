import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { APP_NAV_ITEMS } from "./appNavigation";
import { useAuthorization } from "../context/AuthorizationContext";
import { useSettingsLinks } from "./settingsLinks";

export function MobileBottomNav() {
  const location = useLocation();
  const { canWs } = useAuthorization();
  const settingsLinks = useSettingsLinks();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const isInboxConversationView = Boolean(
    matchPath("/inbox/:conversationId", location.pathname),
  );
  const isSettingsActive = settingsLinks.some(
    (link) =>
      location.pathname === link.path ||
      location.pathname.startsWith(`${link.path}/`),
  );

  useEffect(() => {
    setShowSettingsMenu(false);
  }, [location.pathname]);

  if (
    location.pathname.startsWith("/get-started") ||
    isInboxConversationView
  ) {
    return null;
  }

  const items = APP_NAV_ITEMS.filter(
    (item) => item.mobile && (!item.ws || canWs(item.ws)),
  );
  const navItems = [
    ...items,
    {
      icon: Settings,
      label: "Settings",
      path: "/user/settings",
      activePaths: ["/workspace/settings", "/organization", "/user/settings"],
    },
  ];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <div className=" fixed bottom-0 left-0 right-0 z-30 bg-white px-2 pt-1 md:hidden">
      <nav className="mx-auto flex w-full max-w-xl items-center justify-between gap-1 rounded-[28px] rounded-br-none rounded-bl-none border  border-indigo-600 border-b-0 bg-white px-2 pt-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        {navItems.map((item) => {
          if (item.label === "Settings") {
            return (
              <button
                key="mobile-settings"
                type="button"
                aria-label="Settings"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-3 pb-2 rounded-br-none rounded-bl-none text-[11px] font-semibold transition-all ${
                  isSettingsActive || showSettingsMenu
                    ? "bg-indigo-600 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <item.icon
                  size={24}
                  className={
                    isSettingsActive || showSettingsMenu
                      ? "text-white"
                      : "text-slate-500"
                  }
                />
              </button>
            );
          }

          const isActive = ("activePaths" in item ? item.activePaths : [item.path]).some(
            (path) =>
              location.pathname === path ||
              location.pathname.startsWith(`${path}/`),
          );

          return (
            <NavLink
              key={`${item.label}-${item.path}`}
              to={item.path}
              aria-label={item.label}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] px-3 py-3 rounded-br-none rounded-bl-none pb-2 text-[11px] font-semibold transition-all ${
                isActive
                    ? "bg-indigo-600 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <item.icon
                size={24}
                className={isActive ? "text-white" : "text-slate-500"}
              />
            </NavLink>
          );
        })}
      </nav>

      {showSettingsMenu && (
        <>
          <button
            type="button"
            aria-label="Close settings menu"
            className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
            onClick={() => setShowSettingsMenu(false)}
          />
          <div className="fixed inset-x-3 bottom-[5.75rem] z-50 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:hidden">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Settings
            </p>
            <div className="space-y-1">
              {settingsLinks.map((link) => {
                const isActive =
                  location.pathname === link.path ||
                  location.pathname.startsWith(`${link.path}/`);

                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowSettingsMenu(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <link.icon size={18} className="flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold">
                        {link.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {link.subtitle}
                      </p>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
