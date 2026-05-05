import { Outlet, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft } from "@/components/ui/icons";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { NotificationListWrapper } from "./NotificationList";
import { IncomingCallWindow } from "./IncomingCallWindow";
import { ActiveCallWindow } from "./ActiveCallWindow";
import { MobileBottomNav } from "./MobileBottomNav";
import { IconButton } from "./ui/button/IconButton";
import {
  MobileHeaderActionButtons,
  MobileHeaderActionsContext,
  type MobileHeaderAction,
  type MobileHeaderRegistration,
} from "./mobileHeaderActions";
import { BackButton } from "./channels/BackButton";

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
    eyebrow: "New workflow",
    title: "Workflow templates",
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
  const workflowBuilderMatch = matchPath(
    { path: "/workflows/:workflowId", end: true },
    location.pathname,
  );
  const isWorkflowBuilderRoute = Boolean(
    workflowBuilderMatch && workflowBuilderMatch.params.workflowId !== "templates",
  );
  const isInboxRoute = Boolean(
    matchPath("/inbox", location.pathname) ||
      matchPath("/inbox/:conversationId", location.pathname),
  );
  const isInboxConversationRoute = Boolean(
    matchPath("/inbox/:conversationId", location.pathname),
  );
  const hideTopBarOnMobile = Boolean(
    isInboxRoute || isWorkflowBuilderRoute,
  );
  const hideBottomNavOnMobile = Boolean(
    isInboxConversationRoute || isWorkflowBuilderRoute,
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

  return (
    <MobileHeaderActionsContext.Provider value={mobileHeaderActionsContextValue}>
    <div className="app-shell flex h-screen min-h-0 overflow-hidden bg-slate-50">
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

      <div className="app-main-shell flex min-w-0 flex-1 flex-col overflow-hidden">
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
        <main className="app-content-shell flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              hideTopBarOnMobile ? "" : "pb-[4.5rem] md:pb-0" 
            }`}
          >
            <Outlet />
          </div>
        </main>
        {!hideBottomNavOnMobile ? <MobileBottomNav /> : null}
      </div>

      <NotificationListWrapper />
      <IncomingCallWindow />
      <ActiveCallWindow />
    </div>
    </MobileHeaderActionsContext.Provider>
  );
};
