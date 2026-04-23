import { BookCheck, MoreHorizontal } from "lucide-react";
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

const PRIMARY_MOBILE_PATHS = new Set([
  "/dashboard",
  "/inbox",
  "/contacts",
  "/channels",
]);

export function MobileBottomNav() {
  const location = useLocation();
  const { canWs } = useAuthorization();
  const { dismissed, isComplete } = useGetStarted();
  const { flags } = useFeatureFlags();
  const settingsLinks = useSettingsLinks();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const visibleMobileItems = useMemo(
    () =>
      APP_NAV_ITEMS.filter(
        (item) => item.mobile && (!item.ws || canWs(item.ws)) && (!item.feature || flags[item.feature]),
      ),
    [canWs, flags],
  );

  const primaryItems = useMemo(
    () =>
      visibleMobileItems.filter((item) => PRIMARY_MOBILE_PATHS.has(item.path)),
    [visibleMobileItems],
  );

  const moreNavItems = useMemo(
    () =>
      visibleMobileItems.filter((item) => !PRIMARY_MOBILE_PATHS.has(item.path)),
    [visibleMobileItems],
  );

  const items = useMemo(() => {
    if (!showGetStartedTab) {
      return primaryItems;
    }

    const getStartedItem = {
      icon: BookCheck,
      label: "Get Started",
      path: "/get-started",
      activePaths: ["/get-started"],
    };

    const dashboardIndex = primaryItems.findIndex(
      (item) => item.path === "/dashboard",
    );

    if (dashboardIndex === -1) {
      return [getStartedItem, ...primaryItems];
    }

    return primaryItems.map((item, index) =>
      index === dashboardIndex ? { ...item, ...getStartedItem } : item,
    );
  }, [primaryItems, showGetStartedTab]);

  const navItems = useMemo(
    () => [
      ...items,
      {
        icon: MoreHorizontal,
        label: "More",
        path: "/more",
        activePaths: [
          ...moreNavItems.map((item) => item.path),
          "/workspace/settings",
          "/organization",
          "/user/settings",
        ],
        isMore: true,
      },
    ],
    [items, moreNavItems],
  );

  const isMoreRouteActive =
    isSettingsRouteActive ||
    moreNavItems.some((item) => isPathActive([item.path]));
  const isMoreTabActive = isMoreRouteActive || showMoreMenu;
  const shouldHideForGetStarted =
    location.pathname.startsWith("/get-started") && !showGetStartedTab;

  const activeIndex = isMoreTabActive
    ? navItems.findIndex((item) => "isMore" in item && item.isMore)
    : navItems.findIndex((item) => {
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
  }, [activeIndex, location.pathname, showMoreMenu, navItems.length]);

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
    <nav className="relative z-50 mx-auto flex w-full max-w-xl items-stretch rounded-t-[28px] border border-b-0 bg-white px-2 pt-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
  <div
    className="pointer-events-none absolute top-0 z-0 h-1.5 transition-all duration-300 ease-out"
    style={{
      left: indicatorStyle.left,
      width: indicatorStyle.width,
    }}
  >
    <div className="mx-auto h-full w-10 rounded-b-full bg-indigo-500 shadow-[0_4px_10px_rgba(79,70,229,0.18)]" />
  </div>

  {navItems.map((item, index) => {
    const isActive = showMoreMenu
      ? "isMore" in item && item.isMore
      : "isMore" in item && item.isMore
        ? isMoreTabActive
        : isPathActive(
            "activePaths" in item ? item.activePaths : [item.path],
          );

    const iconClassName = `relative z-10 transition-colors duration-300 ${
      isActive ? "text-indigo-600" : "text-slate-500"
    }`;

    const labelClassName = `relative z-10 text-[11px] leading-none whitespace-nowrap transition-colors duration-300 ${
      isActive ? "font-semibold text-indigo-600" : "text-slate-500"
    }`;

    const content = (
      <div className="flex h-[64px] flex-col items-center justify-center gap-1.5">
        <item.icon size={26} className={iconClassName} />
        <span className={labelClassName}>
          {item.label}
        </span>
      </div>
    );

    if ("isMore" in item && item.isMore) {
      return (
        <button
          key="mobile-more"
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          type="button"
          aria-label="More"
          onClick={() => setShowMoreMenu((prev) => !prev)}
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
        onClick={() => setShowMoreMenu(false)}
        className="relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-t-[20px] px-2"
      >
        {content}
      </NavLink>
    );
  })}
</nav>

      {showMoreMenu && (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
            onClick={() => setShowMoreMenu(false)}
          />

          <div className=" fixed inset-x-3 bottom-[5.75rem] z-50 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:hidden">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              More
            </p>

            <div className="space-y-1">
              {moreNavItems.map((item) => {
                const isActive = isPathActive([item.path]);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                      isActive
                        ? "scale-[1.01] bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon size={18} className="flex-shrink-0" />

                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold">
                        {item.label}
                      </p>
                    </div>
                  </NavLink>
                );
              })}

              {settingsLinks.length > 0 && moreNavItems.length > 0 ? (
                <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Settings
                </p>
              ) : null}

              {settingsLinks.map((link) => {
                const isActive =
                  location.pathname === link.path ||
                  location.pathname.startsWith(`${link.path}/`);

                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowMoreMenu(false)}
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
