import { Settings } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import { APP_NAV_ITEMS } from "./appNavigation";
import { useAuthorization } from "../context/AuthorizationContext";
import { useSettingsLinks } from "./settingsLinks";

type TabElement = HTMLAnchorElement | HTMLButtonElement | null;

export function MobileBottomNav() {
  const location = useLocation();
  const { canWs } = useAuthorization();
  const settingsLinks = useSettingsLinks();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const tabRefs = useRef<TabElement[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  const isInboxConversationView = Boolean(
    matchPath("/inbox/:conversationId", location.pathname),
  );

  const isSettingsRouteActive = settingsLinks.some(
    (link) =>
      location.pathname === link.path ||
      location.pathname.startsWith(`${link.path}/`),
  );

  const items = useMemo(
    () =>
      APP_NAV_ITEMS.filter(
        (item) => item.mobile && (!item.ws || canWs(item.ws)),
      ),
    [canWs],
  );

  const navItems = useMemo(
    () => [
      ...items,
      {
        icon: Settings,
        label: "Settings",
        path: "/user/settings",
        activePaths: ["/workspace/settings", "/organization", "/user/settings"],
        isSettings: true,
      },
    ],
    [items],
  );

  const isSettingsTabActive = isSettingsRouteActive ;

  const activeIndex = navItems.findIndex((item) => {
    if ("isSettings" in item && item.isSettings) {
      return isSettingsTabActive;
    }

    const paths = "activePaths" in item ? item.activePaths : [item.path];
    return paths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`),
    );
  });

  const updateIndicator = () => {
    const activeEl = tabRefs.current[activeIndex];
    if (!activeEl) return;

    setIndicatorStyle({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeIndex, location.pathname, showSettingsMenu, navItems.length]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  if (
    location.pathname.startsWith("/get-started") ||
    isInboxConversationView ||
    navItems.length === 0
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white px-2 pt-1 md:hidden">
      <nav className="relative mx-auto flex w-full max-w-xl items-center rounded-[28px] rounded-br-none rounded-bl-none border border-indigo-600 border-b-0 bg-white px-2 pt-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div
          className="pointer-events-none absolute bottom-0 top-2 z-0 transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        >
          <div className="mx-1 h-full rounded-[20px] rounded-br-none rounded-bl-none bg-indigo-600 shadow-[0_8px_24px_rgba(79,70,229,0.28)]" />
        </div>

        {navItems.map((item, index) => {
          const isActive =
            "isSettings" in item && item.isSettings
              ? isSettingsTabActive
              : ("activePaths" in item ? item.activePaths : [item.path]).some(
                  (path) =>
                    location.pathname === path ||
                    location.pathname.startsWith(`${path}/`),
                );

          const iconClassName = `relative z-10 transition-all duration-300 ${
            isActive
              ? " scale-110 text-white"
              : "text-slate-500"
          }`;

          if ("isSettings" in item && item.isSettings) {
            return (
              <button
                key="mobile-settings"
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                aria-label="Settings"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className="relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-[20px] rounded-br-none rounded-bl-none px-3 py-3"
              >
                <item.icon size={30} className={iconClassName} />
              </button>
            );
          }

          return (
            <NavLink
              key={`${item.label}-${item.path}`}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              to={item.path}
              aria-label={item.label}
              onClick={() => setShowSettingsMenu(false)}
              className=" relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-[20px] rounded-br-none rounded-bl-none px-3 py-3"
            >
              <item.icon size={30} className={iconClassName} />
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

          <div className=" fixed inset-x-3 bottom-[5.75rem] z-50 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:hidden">
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
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                      isActive
                        ? "scale-[1.01] bg-slate-100 text-slate-900"
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