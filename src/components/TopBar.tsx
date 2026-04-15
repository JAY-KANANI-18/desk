import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, HelpCircle, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useNotifications } from "../context/NotificationContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { workspaceApi } from "../lib/workspaceApi";
import { HelpPanel } from "./topbar/HelpPanel";
import { NotificationPanel } from "./topbar/NotificationPanel";
import { UserMenu } from "./topbar/UserMenu";
import { WorkspaceSwitcher } from "./topbar/WorkspaceSwitcher";
import { ACTIVITY_STATUSES } from "./topbar/constants";
import type { ActivityStatusOption } from "./topbar/types";

interface TopBarProps {
  onOpenSidebar?: () => void;
}

export const TopBar = ({ onOpenSidebar }: TopBarProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspaceUsers } = useWorkspace();
  const { unreadCount, browserPermission, requestBrowserPermission } =
    useNotifications();
  const { dismissed, isComplete, completedCount, totalCount } = useGetStarted();

  const showOnboarding = !dismissed && !isComplete;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [activityStatus, setActivityStatus] =
    useState<ActivityStatusOption | null>(null);

  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspaceUsers || !user) return;

    const currentUser = workspaceUsers.find(
      (workspaceUser) => workspaceUser.id === user.id,
    );

    if (!currentUser?.activityStatus) return;

    const status = ACTIVITY_STATUSES.find(
      (item) => item.key === currentUser.activityStatus,
    );

    if (status) {
      setActivityStatus(status);
    }
  }, [workspaceUsers, user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const closeUserMenu = useCallback(() => {
    setShowStatusMenu(false);
    setShowUserMenu(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    closeUserMenu();
    navigate("/auth/login");
  }, [closeUserMenu, logout, navigate]);

  const openNotifications = useCallback(() => {
    if (browserPermission === "default") {
      void requestBrowserPermission();
    }

    setShowNotifications(true);
    setShowHelp(false);
    closeUserMenu();
  }, [browserPermission, closeUserMenu, requestBrowserPermission]);

  const handleAvailabilityChange = useCallback(
    async (status: ActivityStatusOption) => {
      const previousStatus = activityStatus;
      setActivityStatus(status);

      try {
        await workspaceApi.updateAvailability(status.key);
      } catch {
        setActivityStatus(previousStatus);
      }
    },
    [activityStatus],
  );

  const handleStatusSelect = useCallback(
    (status: ActivityStatusOption) => {
      setShowStatusMenu(false);
      void handleAvailabilityChange(status);
    },
    [handleAvailabilityChange],
  );

  const handleUserMenuNavigation = useCallback(
    (path: string) => {
      closeUserMenu();
      navigate(path);
    },
    [closeUserMenu, navigate],
  );

  return (
    <div className="flex min-h-[4rem] flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button> */}
        <WorkspaceSwitcher isMobile={isMobile} />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {showOnboarding && (
          <button
            onClick={() => navigate("/get-started")}
            className="hidden min-[390px]:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.28)] transition-transform hover:-translate-y-0.5"
            style={{ animation: "topbarPulse 2.5s ease infinite" }}
          >
            <style>{`
      @keyframes topbarPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
        50%      { box-shadow: 0 0 0 7px rgba(99,102,241,0); }
      }
      @keyframes sparkSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>

            <BadgeCheck
              size={18}
              style={{ animation: "sparkSpin 3s linear infinite" }}
            />
            <span className="hidden sm:inline">How to Start?</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
              {completedCount}/{totalCount}
            </span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setShowHelp((value) => !value);
              setShowNotifications(false);
              closeUserMenu();
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              showHelp
                ? "bg-gray-100 text-gray-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Help"
          >
            <HelpCircle size={20} />
          </button>
          {showHelp && (
            <HelpPanel
              isMobile={isMobile}
              onClose={() => setShowHelp(false)}
            />
          )}
        </div>

        <div className="relative">
          <button
            onClick={openNotifications}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              showNotifications
                ? "bg-gray-100 text-gray-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel
            open={showNotifications}
            isMobile={isMobile}
            onClose={() => setShowNotifications(false)}
            onNavigateToInbox={(path) =>
              navigate(path || "/inbox")
            }
            onOpenPreferences={() => {
              setShowNotifications(false);
              navigate("/user/settings/notifications");
            }}
          />
        </div>

        <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu((value) => {
                const nextValue = !value;
                if (!nextValue) {
                  setShowStatusMenu(false);
                }
                return nextValue;
              });
              setShowNotifications(false);
              setShowHelp(false);
            }}
            className="flex h-9 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-gray-100"
            title={user?.firstName || user?.lastName || "User"}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              )}
            </div>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 md:block">
              {user?.firstName || user?.lastName || user?.email || "User"}
            </span>
          </button>

          <UserMenu
            open={showUserMenu}
            isMobile={isMobile}
            user={user}
            activityStatus={activityStatus}
            showStatusMenu={showStatusMenu}
            statusMenuRef={statusMenuRef}
            onToggleStatusMenu={() =>
              setShowStatusMenu((value) => !value)
            }
            onSelectStatus={handleStatusSelect}
            onClose={closeUserMenu}
            onNavigate={handleUserMenuNavigation}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};
