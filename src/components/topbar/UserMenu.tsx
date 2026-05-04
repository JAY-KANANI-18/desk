import type { CSSProperties, ReactNode } from "react";
import {
  Bell,
  CircleUserRound,
  Key,
  LogOut,
} from "@/components/ui/icons";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { CompactSelectMenu } from "../ui/select/CompactSelectMenu";
import { ACTIVITY_STATUSES } from "./constants";
import { MobileSheet } from "../ui/modal";
import type { ActivityStatusOption, TopBarUser } from "./types";

interface UserMenuProps {
  open: boolean;
  isMobile: boolean;
  user: TopBarUser;
  activityStatus: ActivityStatusOption | null;
  onSelectStatus: (status: ActivityStatusOption) => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

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
    <Button
      type="button"
      variant="unstyled"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
      style={classDrivenButtonStyle}
      fullWidth
      contentAlign="start"
      preserveChildLayout
    >
      <span className="flex w-full items-center gap-3">
        {icon}
        {label}
      </span>
    </Button>
  );
}

export function UserMenu({
  open,
  isMobile,
  user,
  activityStatus,
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
  const statusGroups = [
    {
      options: ACTIVITY_STATUSES.map((status) => ({
        value: status.key,
        label: status.label,
        leading: (
          <span
            aria-hidden="true"
            className={`block h-2.5 w-2.5 rounded-full ${status.color}`}
          />
        ),
      })),
    },
  ];
  const handleStatusChange = (statusKey: string) => {
    const status = ACTIVITY_STATUSES.find((item) => item.key === statusKey);
    if (status) {
      onSelectStatus(status);
    }
  };

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
        isOpen={open}
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
              <Avatar
                src={user?.avatarUrl ?? undefined}
                name={userLabel}
                size="md"
                fallbackTone="primary"
                alt={userLabel}
              />
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
              <CompactSelectMenu
                value={activityStatus?.key}
                groups={statusGroups}
                onChange={handleStatusChange}
                triggerAppearance="inline"
                fullWidth
                dropdownWidth="trigger"
                triggerClassName="w-full !text-slate-700 hover:!text-slate-700"
                triggerContent={
                  <span className="flex w-full items-center gap-2 text-left">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${
                        activityStatus?.color ?? "bg-slate-300"
                      }`}
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700">
                      {activityStatus?.label ?? "Availability"}
                    </span>
                  </span>
                }
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-2">
            {profileActions}
            <div className="my-2 border-t border-gray-100" />
            <Button
              type="button"
              variant="unstyled"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
              style={classDrivenButtonStyle}
              fullWidth
              contentAlign="start"
              preserveChildLayout
            >
              <span className="flex w-full items-center gap-3">
                <LogOut size={16} />
                Sign out
              </span>
            </Button>
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
          <CompactSelectMenu
            value={activityStatus?.key}
            groups={statusGroups}
            onChange={handleStatusChange}
            triggerAppearance="inline"
            dropdownWidth="sm"
            dropdownAlign="end"
            triggerClassName="group mt-2 !text-gray-600 hover:!text-gray-900"
            triggerContent={
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    activityStatus?.color ?? "bg-slate-300"
                  }`}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-gray-900">
                  {activityStatus?.label ?? "Availability"}
                </span>
              </span>
            }
          />
        </div>
        <div className="p-2">
          {profileActions}
          <div className="my-2 border-t border-gray-100" />
          <Button
            type="button"
            variant="unstyled"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
            style={classDrivenButtonStyle}
            fullWidth
            contentAlign="start"
            preserveChildLayout
          >
            <span className="flex w-full items-center gap-3">
              <LogOut size={16} />
              Sign out
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
