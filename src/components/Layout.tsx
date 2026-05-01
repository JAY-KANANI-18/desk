import { matchPath, useLocation, useNavigate, useOutlet } from "react-router-dom";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { NotificationListWrapper } from "./NotificationList";
import { IncomingCallWindow } from "./IncomingCallWindow";
import { ActiveCallWindow } from "./ActiveCallWindow";
import { MobileBottomNav } from "./MobileBottomNav";
import {
  MobileHeaderActionButtons,
  MobileHeaderActionsContext,
  type MobileHeaderAction,
  type MobileHeaderRegistration,
} from "./mobileHeaderActions";
import { BackButton } from "./channels/BackButton";
import { useIsMobile } from "../hooks/useIsMobile";

type MobileHeaderConfig = {
  eyebrow: string;
  title: string;
  backTo?: string;
};

const MOBILE_ROUTE_HEADERS: Array<MobileHeaderConfig & { path: string }> = [
  {
    path: "/channels/connect",
    eyebrow: "Channels",
    title: "Channel catalog",
    backTo: "/channels",
  },
  {
    path: "/channels",
    eyebrow: "Workspace",
    title: "Channels",
  },
  {
    path: "/workflows/templates",
    eyebrow: "Workflows",
    title: "New workflow",
    backTo: "/workflows",
  },
  {
    path: "/workflows",
    eyebrow: "Automation",
    title: "Workflows",
    backTo: "/more",
  },
  {
    path: "/broadcast",
    eyebrow: "Messaging",
    title: "Broadcast",
    backTo: "/more",
  },
  {
    path: "/contacts",
    eyebrow: "Workspace",
    title: "Contacts",
  },
  {
    path: "/dashboard",
    eyebrow: "Overview",
    title: "Dashboard",
    backTo: "/more",
  },
  {
    path: "/ai-agents",
    eyebrow: "Automation",
    title: "AI Agents",
    backTo: "/more",
  },
];

function getMobileRouteHeader(pathname: string): MobileHeaderConfig | null {
  const match = MOBILE_ROUTE_HEADERS.find((item) =>
    matchPath({ path: item.path, end: true }, pathname),
  );

  return match ? { eyebrow: match.eyebrow, title: match.title, backTo: match.backTo } : null;
}

type MobileRouteTransitionDirection = -1 | 0 | 1;

type MobileRouteTransitionSource = "more" | "more-root" | "primary";

type MobileRouteTransitionInfo = {
  depth: number;
  source: MobileRouteTransitionSource;
  stack: string;
};

const MOBILE_MORE_CHILD_ROUTE_ROOTS = [
  "/dashboard",
  "/broadcast",
  "/workflows",
  "/ai-agents",
  "/reports",
  "/workspace/settings",
  "/organization",
  "/user/settings",
] as const;

const MOBILE_PRIMARY_STACK_ROUTE_ROOTS = ["/channels", "/contacts"] as const;

const MOBILE_ROUTE_STACK_ROOTS = [
  ...MOBILE_MORE_CHILD_ROUTE_ROOTS.map((root) => ({
    root,
    source: "more" as const,
  })),
  ...MOBILE_PRIMARY_STACK_ROUTE_ROOTS.map((root) => ({
    root,
    source: "primary" as const,
  })),
].sort((a, b) => b.root.length - a.root.length);

const MOBILE_ROUTE_SLIDE_TRANSITION = {
  duration: 0.62,
  ease: [0.4, 0, 0.2, 1] as const,
};

const MOBILE_ROUTE_INSTANT_TRANSITION = { duration: 0 };

const MOBILE_ROUTE_SLIDE_VARIANTS = {
  enter: (direction: MobileRouteTransitionDirection) => ({
    opacity: 1,
    x: direction === 0 ? 0 : direction > 0 ? "100%" : "-100%",
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: MobileRouteTransitionDirection) => ({
    opacity: 1,
    x: direction === 0 ? 0 : direction > 0 ? "-12%" : "12%",
  }),
};

const normalizePathname = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
};

const matchesRouteRoot = (pathname: string, root: string) =>
  pathname === root || pathname.startsWith(`${root}/`);

const getRouteDepth = (pathname: string, root: string) => {
  const relativePath = pathname.slice(root.length).replace(/^\/+/, "");
  const nestedSegmentCount = relativePath
    ? relativePath.split("/").filter(Boolean).length
    : 0;

  return nestedSegmentCount + 1;
};

const getMobileRouteTransitionInfo = (
  pathname: string,
): MobileRouteTransitionInfo | null => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/more") {
    return {
      depth: 0,
      source: "more-root",
      stack: "more",
    };
  }

  const stackRoot = MOBILE_ROUTE_STACK_ROOTS.find((item) =>
    matchesRouteRoot(normalizedPathname, item.root),
  );

  if (!stackRoot) {
    return null;
  }

  return {
    depth: getRouteDepth(normalizedPathname, stackRoot.root),
    source: stackRoot.source,
    stack: stackRoot.root,
  };
};

const getMobileRouteTransition = (
  previousPathname: string,
  nextPathname: string,
) => {
  const previousInfo = getMobileRouteTransitionInfo(previousPathname);
  const nextInfo = getMobileRouteTransitionInfo(nextPathname);

  if (!previousInfo || !nextInfo || previousPathname === nextPathname) {
    return {
      direction: 0 as MobileRouteTransitionDirection,
      enabled: false,
    };
  }

  if (previousInfo.stack === nextInfo.stack) {
    return {
      direction:
        nextInfo.depth < previousInfo.depth
          ? (-1 as MobileRouteTransitionDirection)
          : (1 as MobileRouteTransitionDirection),
      enabled: true,
    };
  }

  if (previousInfo.stack === "more" && nextInfo.source === "more") {
    return {
      direction: 1 as MobileRouteTransitionDirection,
      enabled: true,
    };
  }

  if (nextInfo.stack === "more" && previousInfo.source === "more") {
    return {
      direction: -1 as MobileRouteTransitionDirection,
      enabled: true,
    };
  }

  return {
    direction: 0 as MobileRouteTransitionDirection,
    enabled: false,
  };
};

function MobileAnimatedOutlet({
  children,
  direction,
  routeKey,
}: {
  children: ReactNode;
  direction: MobileRouteTransitionDirection;
  routeKey: string;
}) {
  return (
    <AnimatePresence custom={direction} initial={false}>
      <motion.div
        key={routeKey}
        animate="center"
        className="absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-white"
        custom={direction}
        exit="exit"
        initial="enter"
        style={{ willChange: "transform" }}
        transition={
          direction === 0
            ? MOBILE_ROUTE_INSTANT_TRANSITION
            : MOBILE_ROUTE_SLIDE_TRANSITION
        }
        variants={MOBILE_ROUTE_SLIDE_VARIANTS}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function MobileRouteHeader({
  eyebrow,
  title,
  backTo,
  actions,
  onBack,
}: MobileHeaderConfig & {
  actions?: MobileHeaderAction[];
  onBack: (path: string) => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 bg-white px-4 py-3 md:hidden">
      {backTo ? (

         <BackButton
          ariaLabel="Back"
          onClick={() => onBack(backTo)}
          size="sm"
        />
        
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {eyebrow}
        </p>
        <h1 className="truncate text-base font-semibold text-slate-900">
          {title}
        </h1>
      </div>

      <MobileHeaderActionButtons actions={actions} />
    </div>
  );
}

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileHeaderRegistration, setMobileHeaderRegistration] =
    useState<MobileHeaderRegistration>({});
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const previousPathnameRef = useRef(location.pathname);
  const mobileRouteTransition = getMobileRouteTransition(
    previousPathnameRef.current,
    location.pathname,
  );
  const shouldUseMobileRouteShell =
    isMobile &&
    !shouldReduceMotion &&
    Boolean(getMobileRouteTransitionInfo(location.pathname));
  const hideTopBarOnMobile = Boolean(
    matchPath("/inbox", location.pathname) || matchPath("/inbox/:conversationId", location.pathname),
  );
  const mobileRouteHeader = getMobileRouteHeader(location.pathname);
  const clearMobileHeaderRegistration = useCallback(
    () => setMobileHeaderRegistration({}),
    [],
  );
  const mobileHeaderActionsContextValue = useMemo(
    () => ({
      registration: mobileHeaderRegistration,
      setRegistration: setMobileHeaderRegistration,
      clearRegistration: clearMobileHeaderRegistration,
    }),
    [clearMobileHeaderRegistration, mobileHeaderRegistration],
  );

  useEffect(() => {
    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <MobileHeaderActionsContext.Provider value={mobileHeaderActionsContextValue}>
    <div className="flex h-screen min-h-0 bg-slate-50 overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <AppSidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-3 left-3 z-50 transition-all duration-300 md:hidden ${
          sidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-[calc(100%+1.5rem)] opacity-0"
        }`}
      >
        <AppSidebar variant="mobile" onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className={hideTopBarOnMobile ? "hidden md:block" : "block"}>
          <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        </div>
        {!hideTopBarOnMobile && mobileRouteHeader ? (
          <MobileRouteHeader
            {...mobileRouteHeader}
            actions={mobileHeaderRegistration.actions}
            onBack={(path) => navigate(path)}
          />
        ) : null}
        {!hideTopBarOnMobile &&
        mobileRouteHeader &&
        mobileHeaderRegistration.panel ? (
          <div className="bg-white px-4 pb-3 md:hidden">
            {mobileHeaderRegistration.panel}
          </div>
        ) : null}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${
              hideTopBarOnMobile ? "" : "pb-[4.5rem] md:pb-0" 
            }`}
          >
            {shouldUseMobileRouteShell ? (
              <MobileAnimatedOutlet
                direction={mobileRouteTransition.direction}
                routeKey={location.pathname}
              >
                {outlet}
              </MobileAnimatedOutlet>
            ) : (
              outlet
            )}
          </div>
        </main>
        <MobileBottomNav />
      </div>

      <NotificationListWrapper />
      <IncomingCallWindow />
      <ActiveCallWindow />
    </div>
    </MobileHeaderActionsContext.Provider>
  );
};
