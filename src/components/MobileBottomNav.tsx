import { BookCheck, Settings } from "lucide-react";
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
import { useGetStarted } from "../context/GetStartedContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { useSettingsLinks } from "./settingsLinks";

type TabElement = HTMLAnchorElement | HTMLButtonElement | null;

export function MobileBottomNav() {
  const location = useLocation();
  const { canWs } = useAuthorization();
  const { dismissed, isComplete } = useGetStarted();
  const { flags } = useFeatureFlags();
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

  const showGetStartedTab = !dismissed && !isComplete;

  const isPathActive = (paths: string[]) =>
    paths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`),
    );

  const baseItems = useMemo(
    () =>
      APP_NAV_ITEMS.filter(
        (item) => item.mobile && (!item.ws || canWs(item.ws)) && (!item.feature || flags[item.feature]),
      ),
    [canWs, flags],
  );

  const items = useMemo(() => {
    if (!showGetStartedTab) {
      return baseItems;
    }

    const getStartedItem = {
      icon: BookCheck,
      label: "Get Started",
      path: "/get-started",
      activePaths: ["/get-started"],
    };

    const dashboardIndex = baseItems.findIndex(
      (item) => item.path === "/dashboard",
    );

    if (dashboardIndex === -1) {
      return [getStartedItem, ...baseItems];
    }

    return baseItems.map((item, index) =>
      index === dashboardIndex ? { ...item, ...getStartedItem } : item,
    );
  }, [baseItems, showGetStartedTab]);

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

  const isSettingsTabActive = isSettingsRouteActive;
  const shouldHideForGetStarted =
    location.pathname.startsWith("/get-started") && !showGetStartedTab;

  const activeIndex = navItems.findIndex((item) => {
    if ("isSettings" in item && item.isSettings) {
      return isSettingsTabActive;
    }

    const paths = "activePaths" in item ? item.activePaths : [item.path];
    return isPathActive(paths);
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
    shouldHideForGetStarted ||
    isInboxConversationView ||
    navItems.length === 0
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white pt-1 md:hidden">
    <nav className="relative mx-auto flex w-full max-w-xl items-stretch rounded-t-[28px] border border-b-0 bg-white px-2 pt-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
  <div
    className="pointer-events-none absolute top-2 bottom-0 z-0 transition-all duration-300 ease-out"
    style={{
      left: indicatorStyle.left,
      width: indicatorStyle.width,
    }}
  >
    <div className=" h-full rounded-t-[20px] bg-indigo-600 shadow-[0_8px_24px_rgba(79,70,229,0.22)]" />
  </div>

  {navItems.map((item, index) => {
    const isActive =
      "isSettings" in item && item.isSettings
        ? isSettingsTabActive
        : isPathActive(
            "activePaths" in item ? item.activePaths : [item.path],
          );

    const iconClassName = `relative z-10 transition-colors duration-300 ${
      isActive ? "text-white" : "text-slate-500"
    }`;

    const labelClassName = `relative z-10 text-[11px] leading-none whitespace-nowrap transition-colors duration-300 ${
      isActive ? "text-white" : "text-slate-500"
    }`;

    const content = (
      <div className="flex h-[64px] flex-col items-center justify-center gap-1.5">
        <item.icon size={22} className={iconClassName} />
        <span className={labelClassName}>
          {"isSettings" in item && item.isSettings ? "Settings" : item.label}
        </span>
      </div>
    );

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
          className="relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-t-[20px] px-2"
        >
          {content}
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
        className="relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-t-[20px] px-2"
      >
        {content}
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
