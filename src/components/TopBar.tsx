import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, HelpCircle, Palette } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useNotifications } from "../context/NotificationContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { workspaceApi } from "../lib/workspaceApi";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { HelpPanel } from "./topbar/HelpPanel";
import { NotificationPanel } from "./topbar/NotificationPanel";
import { UserMenu } from "./topbar/UserMenu";
import { WorkspaceSwitcher } from "./topbar/WorkspaceSwitcher";
import { ACTIVITY_STATUSES } from "./topbar/constants";
import type { ActivityStatusOption } from "./topbar/types";
import { AppearanceSettingsPanel } from "./appearance/AppearanceSettingsPanel";

interface TopBarProps {
  onOpenSidebar?: () => void;
}

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

export const TopBar = ({ onOpenSidebar: _onOpenSidebar }: TopBarProps) => {
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
  const [showAppearance, setShowAppearance] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activityStatus, setActivityStatus] =
    useState<ActivityStatusOption | null>(null);

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

  const closeUserMenu = useCallback(() => {
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
    setShowAppearance(false);
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

  const userLabel = user?.firstName + user?.lastName || user?.email || "User";

  return (
    <div className="app-topbar flex min-h-[4rem] flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur sm:px-4 md:relative md:z-40 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <WorkspaceSwitcher isMobile={isMobile} />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {showOnboarding && (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => navigate("/get-started")}
            className="hidden min-[390px]:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-3 py-2 text-[12px] font-semibold text-white shadow-[var(--appearance-shadow)] transition-transform hover:-translate-y-0.5"
            style={{
              ...classDrivenButtonStyle,
              animation: "topbarPulse 2.5s ease infinite",
            }}
            preserveChildLayout
          >
            <style>{`
      @keyframes topbarPulse {
        0%,100% { box-shadow: 0 0 0 0 var(--color-primary-light); }
        50%      { box-shadow: 0 0 0 7px transparent; }
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
          </Button>
        )}

        <div className="relative">
          <Tooltip content="Help">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => {
                setShowHelp((value) => !value);
                setShowNotifications(false);
                setShowAppearance(false);
                closeUserMenu();
              }}
              aria-label="Help"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                showHelp
                  ? "bg-gray-100 text-gray-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              style={classDrivenButtonStyle}
              preserveChildLayout
            >
              <HelpCircle size={20} />
            </Button>
          </Tooltip>
          {showHelp && (
            <HelpPanel
              isMobile={isMobile}
              onClose={() => setShowHelp(false)}
            />
          )}
        </div>

        <div className="relative">
          <Tooltip content="Appearance">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => {
                setShowAppearance((value) => !value);
                setShowNotifications(false);
                setShowHelp(false);
                closeUserMenu();
              }}
              aria-label="Appearance settings"
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                showAppearance
                  ? "bg-gray-100 text-gray-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              style={classDrivenButtonStyle}
              preserveChildLayout
            >
              <Palette size={20} />
            </Button>
          </Tooltip>
          <AppearanceSettingsPanel
            open={showAppearance}
            isMobile={isMobile}
            onClose={() => setShowAppearance(false)}
          />
        </div>

        <div className="relative">
          <Tooltip content="Notifications">
            <Button
              type="button"
              variant="unstyled"
              onClick={openNotifications}
              aria-label="Notifications"
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                showNotifications
                  ? "bg-gray-100 text-gray-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              style={classDrivenButtonStyle}
              preserveChildLayout
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </Tooltip>
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
          <Tooltip content={userLabel}>
            <Button
              type="button"
              variant="unstyled"
              onClick={() => {
                setShowUserMenu((value) => !value);
                setShowNotifications(false);
                setShowHelp(false);
                setShowAppearance(false);
              }}
              className="flex h-9 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-gray-100"
              style={classDrivenButtonStyle}
              preserveChildLayout
            >
              <Avatar
                src={user?.avatarUrl ?? undefined}
                name={userLabel}
                size="xs"
                fallbackTone="primary"
                alt={userLabel}
                style={{
                  width:
                    "calc(var(--spacing-md) + var(--spacing-sm) + var(--spacing-xs))",
                  height:
                    "calc(var(--spacing-md) + var(--spacing-sm) + var(--spacing-xs))",
                }}
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 md:block">
                {userLabel}
              </span>
            </Button>
          </Tooltip>

          <UserMenu
            open={showUserMenu}
            isMobile={isMobile}
            user={user}
            activityStatus={activityStatus}
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
