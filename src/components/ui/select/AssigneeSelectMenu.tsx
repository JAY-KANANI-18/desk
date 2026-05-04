import { useId, useMemo } from "react";
import { UserCircle2 } from "@/components/ui/icons";
import { Avatar } from "../Avatar";
import { FieldShell, cx } from "../inputs/shared";
import {
  CompactSelectMenu,
  type CompactSelectMenuGroup,
  type CompactSelectMenuOption,
  type CompactSelectMenuProps,
} from "./CompactSelectMenu";

export type AssigneeSelectMenuVariant = "toolbar" | "field" | "sidebar" | "icon";

export interface AssigneeSelectUser {
  id: string | number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  activityStatus?: string | null;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface AssigneeSelectMenuProps<TUser extends AssigneeSelectUser>
  extends Pick<
    CompactSelectMenuProps,
    | "disabled"
    | "dropdownAlign"
    | "dropdownPlacement"
    | "dropdownWidth"
    | "emptyMessage"
    | "mobileSheet"
    | "mobileSheetSubtitle"
    | "mobileSheetTitle"
    | "searchable"
    | "searchPlaceholder"
  > {
  users: TUser[];
  value?: string | number | null;
  selectedUser?: TUser | null;
  onChange: (userId: string | null, user: TUser | null) => void;
  variant?: AssigneeSelectMenuVariant;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  groupLabel?: string;
  allowUnassigned?: boolean;
  unassignedLabel?: string;
  unassignedDescription?: string;
  userFilter?: (user: TUser) => boolean;
  fullWidth?: boolean;
  className?: string;
  triggerClassName?: string;
}

const UNASSIGNED_VALUE = "__unassigned__";

function getUserValue(user: AssigneeSelectUser) {
  return String(user.id);
}

function getUserName(user: AssigneeSelectUser) {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.name || user.email || "User";
}

function getUserDescription(user: AssigneeSelectUser) {
  if (user.activityStatus) {
    return user.activityStatus === "online" ? "Online" : "Offline";
  }

  const name = getUserName(user);
  return user.email && user.email !== name ? user.email : undefined;
}

function getUserDescriptionTone(user: AssigneeSelectUser) {
  if (user.activityStatus === "online") {
    return "success" as const;
  }

  if (user.activityStatus) {
    return "muted" as const;
  }

  return "default" as const;
}

function renderUnassignedIcon(size = 18) {
  return <UserCircle2 size={size} className="text-gray-400" />;
}

function renderUserAvatar(user: AssigneeSelectUser, size: "xs" | "sm") {
  return (
    <Avatar
      src={user.avatarUrl ?? undefined}
      name={getUserName(user)}
      size={size}
    />
  );
}

function unassignedOption(
  label: string,
  description: string,
): CompactSelectMenuOption {
  return {
    value: UNASSIGNED_VALUE,
    label,
    description,
    leading: renderUnassignedIcon(18),
    tone: "primary",
    alwaysVisible: true,
  };
}

function userToOption(user: AssigneeSelectUser): CompactSelectMenuOption {
  const label = getUserName(user);
  const description = getUserDescription(user);

  return {
    value: getUserValue(user),
    label,
    description,
    descriptionTone: getUserDescriptionTone(user),
    leading: renderUserAvatar(user, "sm"),
    tone: "primary",
    searchText: [label, user.email, user.activityStatus].filter(Boolean).join(" "),
  };
}

function renderTriggerContent({
  selectedUser,
  isUnassigned,
  unassignedLabel,
  variant,
}: {
  selectedUser: AssigneeSelectUser | null;
  isUnassigned: boolean;
  unassignedLabel: string;
  variant: AssigneeSelectMenuVariant;
}) {
  if (!selectedUser && !isUnassigned) {
    return undefined;
  }

  if (variant === "icon") {
    return selectedUser ? renderUserAvatar(selectedUser, "xs") : renderUnassignedIcon(18);
  }

  const label = selectedUser ? getUserName(selectedUser) : unassignedLabel;

  return (
    <span
      className={cx(
        "flex min-w-0 items-center",
        variant === "toolbar" ? "gap-2.5" : "gap-2",
      )}
    >
      {selectedUser ? renderUserAvatar(selectedUser, "xs") : renderUnassignedIcon(18)}
      <span
        className={cx(
          "truncate",
          selectedUser ? "text-gray-700" : "text-gray-500",
          variant === "field" && "min-w-0 flex-1",
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function AssigneeSelectMenu<TUser extends AssigneeSelectUser>({
  users,
  value,
  selectedUser,
  onChange,
  variant = "field",
  label,
  required = false,
  hint,
  placeholder = "Select user...",
  groupLabel = "Agents",
  allowUnassigned = true,
  unassignedLabel = "Unassigned",
  unassignedDescription = "Remove the current assignee",
  userFilter,
  fullWidth,
  className,
  triggerClassName,
  disabled = false,
  dropdownAlign = "start",
  dropdownPlacement = "bottom",
  dropdownWidth,
  emptyMessage = "No agents found.",
  mobileSheet = true,
  mobileSheetTitle,
  mobileSheetSubtitle,
  searchable = false,
  searchPlaceholder = "Search agents or teams...",
}: AssigneeSelectMenuProps<TUser>) {
  const generatedId = useId();
  const fieldId = `assignee-select-menu-${generatedId}`;
  const visibleUsers = userFilter ? users.filter(userFilter) : users;
  const hasUserValue =
    value !== null && value !== undefined && String(value) !== "";
  const selectedValue = hasUserValue
    ? String(value)
    : allowUnassigned
      ? UNASSIGNED_VALUE
      : undefined;
  const resolvedSelectedUser =
    selectedUser ??
    visibleUsers.find((user) => getUserValue(user) === selectedValue) ??
    null;
  const isUnassigned = selectedValue === UNASSIGNED_VALUE;

  const menuGroups = useMemo<CompactSelectMenuGroup[]>(
    () => [
      ...(allowUnassigned
        ? [
            {
              options: [
                unassignedOption(unassignedLabel, unassignedDescription),
              ],
            },
          ]
        : []),
      {
        label: groupLabel,
        options: visibleUsers.map(userToOption),
      },
    ],
    [allowUnassigned, groupLabel, unassignedDescription, unassignedLabel, visibleUsers],
  );

  const menu = (
    <CompactSelectMenu
      id={fieldId}
      value={selectedValue}
      groups={menuGroups}
      onChange={(nextValue) => {
        if (nextValue === UNASSIGNED_VALUE) {
          onChange(null, null);
          return;
        }

        const nextUser =
          visibleUsers.find((user) => getUserValue(user) === nextValue) ?? null;
        onChange(nextValue, nextUser);
      }}
      fullWidth={fullWidth ?? (variant !== "toolbar" && variant !== "icon")}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      triggerAppearance={variant === "toolbar" || variant === "icon" ? "toolbar" : variant === "sidebar" ? "inline" : "field"}
      size="sm"
      dropdownWidth={
        dropdownWidth ?? (variant === "toolbar" ? "lg" : "trigger")
      }
      dropdownAlign={dropdownAlign}
      dropdownPlacement={dropdownPlacement}
      disabled={disabled}
      placeholder={placeholder}
      hasValue={Boolean(resolvedSelectedUser || isUnassigned)}
      hideIndicator={variant === "icon"}
      mobileSheet={mobileSheet}
      mobileSheetTitle={mobileSheetTitle ?? label ?? "Assign user"}
      mobileSheetSubtitle={mobileSheetSubtitle}
      mobileSheetListVariant="plain"
      mobileSheetOptionSize="lg"
      triggerClassName={cx(
        variant === "icon" &&
          "inline-flex h-9 w-9 min-h-0 justify-center rounded-lg border border-gray-200 bg-white px-0 py-0 shadow-sm hover:bg-gray-50",
        variant === "sidebar" && "py-0.5 text-[13px] leading-snug",
        triggerClassName,
      )}
      triggerContent={renderTriggerContent({
        selectedUser: resolvedSelectedUser,
        isUnassigned,
        unassignedLabel,
        variant,
      })}
    />
  );

  if (label || hint) {
    return (
      <div className={className}>
        <FieldShell id={fieldId} label={label} required={required} hint={hint}>
          {menu}
        </FieldShell>
      </div>
    );
  }

  if (className) {
    return <div className={className}>{menu}</div>;
  }

  return menu;
}
