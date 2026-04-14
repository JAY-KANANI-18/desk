import { Outlet, matchPath, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { NotificationListWrapper } from './NotificationList';
import { IncomingCallWindow } from './IncomingCallWindow';
import { ActiveCallWindow } from './ActiveCallWindow';
import { MobileBottomNav } from './MobileBottomNav';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const hideTopBarOnMobile = Boolean(
    matchPath('/inbox/:conversationId', location.pathname),
  );

  return (
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
            ? 'translate-x-0 opacity-100'
            : '-translate-x-[calc(100%+1.5rem)] opacity-0'
        }`}
      >
        <AppSidebar variant="mobile" onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className={hideTopBarOnMobile ? 'hidden md:block' : 'block'}>
          <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        </div>
     <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
  <div className="flex min-h-0 flex-1 flex-col pb-[4.5rem] md:pb-0">
    <Outlet />
  </div>
</main>
        <MobileBottomNav />
      </div>

      <NotificationListWrapper />
      <IncomingCallWindow />
      <ActiveCallWindow />
    </div>
  );
};
