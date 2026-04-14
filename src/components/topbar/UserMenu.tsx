import type { ReactNode, RefObject } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  CircleUserRound,
  Key,
  LogOut,
} from "lucide-react";
import { ACTIVITY_STATUSES } from "./constants";
import { MobileSheet } from "./MobileSheet";
import type { ActivityStatusOption, TopBarUser } from "./types";

interface UserMenuProps {
  open: boolean;
  isMobile: boolean;
  user: TopBarUser;
  activityStatus: ActivityStatusOption | null;
  showStatusMenu: boolean;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  onToggleStatusMenu: () => void;
  onSelectStatus: (status: ActivityStatusOption) => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function ProfileAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      {icon}
      {label}
    </button>
  );
}

export function UserMenu({
  open,
  isMobile,
  user,
  activityStatus,
  showStatusMenu,
  statusMenuRef,
  onToggleStatusMenu,
  onSelectStatus,
  onClose,
  onNavigate,
  onLogout,
}: UserMenuProps) {
  if (!open && !isMobile) {
    return null;
  }

  const userDisplayName = user?.firstName || user?.lastName || "User";
  const userLabel = user?.firstName || user?.lastName || user?.email || "User";
  const userInitial = userLabel.slice(0, 1).toUpperCase();

  const profileActions = (
    <>
      <ProfileAction
        icon={<CircleUserRound size={16} className="text-gray-400" />}
        label="Profile"
        onClick={() => onNavigate("/user/settings")}
      />
      <ProfileAction
        icon={<Bell size={16} className="text-gray-400" />}
        label="Notifications"
        onClick={() => onNavigate("/user/settings/notifications")}
      />
      <ProfileAction
        icon={<Key size={16} className="text-gray-400" />}
        label="Reset Password"
        onClick={() => onNavigate("/auth/reset-password")}
      />
    </>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Account
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              {user?.firstName || user?.lastName || "Profile"}
            </h2>
          </div>
        }
        onClose={onClose}
      >
        <div className="space-y-4 p-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {userDisplayName}
                </div>
                <div className="truncate text-sm text-slate-500">
                  {user?.email ?? ""}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <button
                type="button"
                onClick={onToggleStatusMenu}
                className="flex w-full items-center gap-2 text-left"
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    activityStatus?.color ?? "bg-slate-300"
                  }`}
                />
                <span className="flex-1 text-sm font-medium text-slate-700">
                  {activityStatus?.label ?? "Availability"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${
                    showStatusMenu ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showStatusMenu && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {ACTIVITY_STATUSES.map((status) => (
                    <button
                      key={status.key}
                      type="button"
                      onClick={() => onSelectStatus(status)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
                        activityStatus?.key === status.key
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${status.color}`}
                      />
                      <span className="flex-1 text-sm">{status.label}</span>
                      {activityStatus?.key === status.key && (
                        <Check size={14} className="text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-2">
            {profileActions}
            <div className="my-2 border-t border-gray-100" />
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </MobileSheet>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 p-4">
          <div className="font-semibold text-gray-800">{userDisplayName}</div>
          <div className="truncate text-sm text-gray-500">
            {user?.email ?? ""}
          </div>
          <div className="relative" ref={statusMenuRef}>
            <button
              type="button"
              onClick={onToggleStatusMenu}
              className="group mt-2 flex items-center gap-2"
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  activityStatus?.color ?? "bg-slate-300"
                }`}
              />
              <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">
                {activityStatus?.label ?? "Availability"}
              </span>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${
                  showStatusMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg transition-all duration-200 origin-top-left sm:right-full sm:top-0 sm:mr-1.5 ${
                showStatusMenu
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              }`}
            >
              {ACTIVITY_STATUSES.map((status) => (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => onSelectStatus(status)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${status.color}`}
                  />
                  <span className="flex-1 text-left text-sm text-gray-700">
                    {status.label}
                  </span>
                  {activityStatus?.key === status.key && (
                    <Check size={13} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-2">
          {profileActions}
          <div className="my-2 border-t border-gray-100" />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
