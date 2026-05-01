import { BookCheck, MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import {
  APP_NAV_ITEMS,
  PRIMARY_MOBILE_PATH_ORDER,
  PRIMARY_MOBILE_PATHS,
} from "./appNavigation";
import { useAuthorization } from "../context/AuthorizationContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { useSettingsLinks } from "./settingsLinks";

type TabElement = HTMLAnchorElement | null;

export function MobileBottomNav() {
  const location = useLocation();
  const { canWs } = useAuthorization();
  const { dismissed, isComplete } = useGetStarted();
  const { flags } = useFeatureFlags();
  const settingsLinks = useSettingsLinks();

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
      visibleMobileItems
        .filter((item) => PRIMARY_MOBILE_PATHS.has(item.path))
        .sort(
          (a, b) =>
            PRIMARY_MOBILE_PATH_ORDER.indexOf(a.path) -
            PRIMARY_MOBILE_PATH_ORDER.indexOf(b.path),
        ),
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
          "/more",
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
    location.pathname === "/more" ||
    isSettingsRouteActive ||
    moreNavItems.some((item) => isPathActive([item.path]));
  const isMoreTabActive = isMoreRouteActive;
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
  }, [activeIndex, location.pathname, navItems.length]);

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
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white  md:hidden">
    <nav className="relative z-50 mx-auto flex w-full max-w-xl items-stretch rounded-t-[28px] border border-b-0 bg-white px-2 pb-3 pt-1 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
  <div
    className="pointer-events-none absolute top-0 z-0 h-1.5 transition-all duration-300 ease-out"
    style={{
      left: indicatorStyle.left,
      width: indicatorStyle.width,
    }}
  >
    {/* <div className="mx-auto h-full w-10 rounded-b-full bg-indigo-500 shadow-[0_4px_10px_rgba(79,70,229,0.18)]" /> */}
  </div>

  {navItems.map((item, index) => {
    const isActive = "isMore" in item && item.isMore
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
        <item.icon size={24} className={iconClassName} />
        <span className={labelClassName}>
          {item.label}
        </span>
      </div>
    );

    return (
      <NavLink
        key={`${item.label}-${item.path}`}
        ref={(el) => {
          tabRefs.current[index] = el;
        }}
        to={item.path}
        aria-label={item.label}
        className="relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-t-[20px] px-2"
      >
        {content}
      </NavLink>
    );
  })}
</nav>
    </div>
  );
}
