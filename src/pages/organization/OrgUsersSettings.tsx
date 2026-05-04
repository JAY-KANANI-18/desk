import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, UserRoundPlus } from "@/components/ui/icons";

import { ConfirmDeleteModal, MobileSheet } from "../../components/ui/modal";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { organizationApi } from "../../lib/organizationApi";
import { DataLoader } from "../Loader";
import { ListPagination } from "../../components/ui/ListPagination";
import { Avatar } from "../../components/ui/Avatar";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/button/Button";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput, SearchInput } from "../../components/ui/inputs";
import { CenterModal } from "../../components/ui/Modal";
import { BaseSelect } from "../../components/ui/select/BaseSelect";
import type { SelectOption } from "../../components/ui/select/shared";
import { Tooltip } from "../../components/ui/Tooltip";

const orgRoles = [
  { id: "ORG_ADMIN", name: "ORG Admin" },
  { id: "ORG_BILLING_ADMIN", name: "ORG Billing Admin" },
  { id: "ORG_USER_ADMIN", name: "ORG User Admin" },
  { id: "ORG_MEMBER", name: "ORG Member" },
];

const workspaceRoles = [
  { id: "WS_OWNER", name: "Owner" },
  { id: "WS_MANAGER", name: "Manager" },
  { id: "WS_AGENT", name: "Agent" },
];

const orgRoleOptions: SelectOption[] = orgRoles.map((role) => ({
  value: role.id,
  label: role.name,
}));

const workspaceRoleOptions: SelectOption[] = workspaceRoles.map((role) => ({
  value: role.id,
  label: role.name,
}));

type WorkspaceAccess = {
  workspaceId: string;
  role: string;
};

type OrganizationUser = {
  id: string;
  role: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: string;
  workspaceAccess?: WorkspaceAccess[];
  workspaces?: Array<{ id: string; role: string }>;
};

const getOrgRoleLabel = (role: string) => {
  return orgRoles.find((item) => item.id === role)?.name || role;
};

const isOrganizationOwner = (user: Pick<OrganizationUser, "role">) =>
  user.role === "ORG_OWNER" || user.role === "ORG_ADMIN";

const getWorkspaceRoleLabel = (role: string) => {
  return workspaceRoles.find((item) => item.id === role)?.name || role;
};

const getOrganizationUserName = (user?: Partial<OrganizationUser> | null) => {
  if (!user) {
    return "User";
  }

  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "User"
  );
};

const normalizeWorkspaceAccess = (user: OrganizationUser) => {
  if (Array.isArray(user?.workspaceAccess)) {
    return user.workspaceAccess.map((workspace) => ({
      workspaceId: workspace.workspaceId || "",
      role: workspace.role || "WS_AGENT",
    }));
  }

  if (Array.isArray(user?.workspaces)) {
    return user.workspaces.map((workspace) => ({
      workspaceId: workspace.id,
      role: workspace.role || "WS_AGENT",
    }));
  }

  return [];
};

const getWorkspaceOptions = (
  workspaces: any[],
  selectedWorkspaceIds: string[],
  currentWorkspaceId: string,
) => {
  return [
    { value: "", label: "Select workspace" },
    ...workspaces.map((workspace) => ({
      value: workspace.id,
      label: workspace.name,
      disabled:
        selectedWorkspaceIds.includes(workspace.id) &&
        workspace.id !== currentWorkspaceId,
    })),
  ];
};

const InviteEditUserModal = ({
  open,
  onClose,
  onInvite,
  onSave,
  editUser,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (payload: {
    email: string;
    orgRole: string;
    workspaceAccess: WorkspaceAccess[];
  }) => Promise<void>;
  onSave: (payload: {
    email: string;
    orgRole: string;
    workspaceAccess: WorkspaceAccess[];
  }) => Promise<void>;
  editUser: OrganizationUser | null;
}) => {
  const { workspaces } = useWorkspace();
  const isMobile = useIsMobile();

  const [email, setEmail] = useState("");
  const [orgRole, setOrgRole] = useState("ORG_MEMBER");
  const [workspaceAccess, setWorkspaceAccess] = useState<WorkspaceAccess[]>([
    { workspaceId: "", role: "WS_AGENT" },
  ]);
  const [loading, setLoading] = useState(false);
  const [displayEditUser, setDisplayEditUser] =
    useState<OrganizationUser | null>(editUser);

  useEffect(() => {
    if (open && editUser) {
      setDisplayEditUser(editUser);
      setEmail(editUser.email || "");
      setOrgRole(editUser.role || "ORG_MEMBER");

      const normalized = normalizeWorkspaceAccess(editUser);
      setWorkspaceAccess(
        normalized.length > 0
          ? normalized
          : [{ workspaceId: "", role: "WS_AGENT" }],
      );
    } else if (open) {
      setEmail("");
      setOrgRole("ORG_MEMBER");
      setWorkspaceAccess([{ workspaceId: "", role: "WS_AGENT" }]);
    }
  }, [editUser, open]);

  const activeEditUser = editUser ?? displayEditUser;

  const addWorkspace = () => {
    setWorkspaceAccess((current) => [
      ...current,
      { workspaceId: "", role: "WS_AGENT" },
    ]);
  };

  const updateWorkspace = (
    index: number,
    key: keyof WorkspaceAccess,
    value: string,
  ) => {
    setWorkspaceAccess((current) =>
      current.map((workspace, currentIndex) =>
        currentIndex === index
          ? { ...workspace, [key]: value }
          : workspace,
      ),
    );
  };

  const removeWorkspace = (index: number) => {
    setWorkspaceAccess((current) => current.filter((_, i) => i !== index));
  };

  const selectedWorkspaceIds = workspaceAccess
    .map((workspace) => workspace.workspaceId)
    .filter(Boolean);

  const handleSubmit = async () => {
    const cleanedWorkspaceAccess = workspaceAccess.filter(
      (workspace) => workspace.workspaceId,
    );

    try {
      setLoading(true);

      if (activeEditUser) {
        await onSave({
          email,
          orgRole,
          workspaceAccess: cleanedWorkspaceAccess,
        });
      } else {
        await onInvite({
          email: email.trim(),
          orgRole,
          workspaceAccess: cleanedWorkspaceAccess,
        });
      }

      onClose();
    } catch (error) {
      console.error(activeEditUser ? "Update failed:" : "Invite failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {activeEditUser ? (
        <div className="flex items-center gap-4">
          <Avatar
            src={activeEditUser.avatarUrl}
            name={getOrganizationUserName(activeEditUser)}
            size="lg"
          />

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900">
              {getOrganizationUserName(activeEditUser)}
            </p>
            <p className="truncate text-sm text-gray-500">{activeEditUser.email}</p>
          </div>
        </div>
      ) : null}

      <p className="text-[15px] leading-7 text-gray-600">
        {activeEditUser
          ? "Update this user's organization role and workspace access."
          : "Invite a user to your organization and assign their workspace access."}
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <BaseInput
          label="Email Address"
          disabled={Boolean(activeEditUser)}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter user email"
        />

        <BaseSelect
          label="Organization Role"
          value={orgRole}
          onChange={setOrgRole}
          options={orgRoleOptions}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Workspace Access
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Assign this user to one or more workspaces and choose their role
              in each.
            </p>
          </div>

          <Button
            type="button"
            onClick={addWorkspace}
            leftIcon={<Plus size={15} />}
            variant="secondary"

          >
            Add Workspace
          </Button>
        </div>

        <div className="space-y-3">
          {workspaceAccess.map((workspace, index) => (
            <div
              key={`${workspace.workspaceId}-${index}`}
              className="grid grid-cols-1 gap-3 rounded-2xl  p-3 md:grid-cols-[minmax(0,1fr)_180px_44px]"
            >
              <BaseSelect
                value={workspace.workspaceId}
                onChange={(value) =>
                  updateWorkspace(index, "workspaceId", value)
                }
                options={getWorkspaceOptions(
                  workspaces ?? [],
                  selectedWorkspaceIds,
                  workspace.workspaceId,
                )}
              />

              <BaseSelect
                value={workspace.role}
                onChange={(value) => updateWorkspace(index, "role", value)}
                options={workspaceRoleOptions}
              />

              <div className="flex items-end">
                <IconButton
                  icon={<Trash2 size={16} />}
                  aria-label={`Remove workspace ${index + 1}`}
                  variant="danger-ghost"
                  size="sm"
                  disabled={workspaceAccess.length === 1}
                  onClick={() => removeWorkspace(index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const secondaryAction = (
    <Button onClick={onClose} variant="secondary" >
      Cancel
    </Button>
  );

  const primaryAction = (
    <Button
      onClick={handleSubmit}
      disabled={!activeEditUser && !email.trim()}
      loading={loading}
      loadingMode="inline"
      loadingLabel={activeEditUser ? "Saving..." : "Inviting..."}
    >
      {activeEditUser ? "Save" : "Invite"}
    </Button>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Organization Users
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              {activeEditUser ? "Edit User" : "Invite User"}
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!activeEditUser && !email.trim()}
              loading={loading}
              loadingMode="inline"
              loadingLabel={activeEditUser ? "Saving..." : "Inviting..."}
              fullWidth
            >
              {activeEditUser ? "Save" : "Invite"}
            </Button>
          </div>
        }
      >
        <div className="p-4">{content}</div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title={activeEditUser ? "Edit User" : "Invite User"}
      size="xl"
      width={880}
      secondaryAction={secondaryAction}
      primaryAction={primaryAction}
    >
      {content}
    </CenterModal>
  );
};

export const OrgUsersSettings = () => {
  const {
    refreshOrganizationsUsers,
    activeOrganization,
    inviteUser,
    updateUser,
  } = useOrganization();
  const { workspaces } = useWorkspace();
  const isMobile = useIsMobile();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<OrganizationUser | null>(null);
  const [mobileActionsUser, setMobileActionsUser] =
    useState<OrganizationUser | null>(null);
  const [displayMobileActionsUser, setDisplayMobileActionsUser] =
    useState<OrganizationUser | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] =
    useState<OrganizationUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const workspaceMap = useMemo(() => {
    const map = new Map<string, string>();
    workspaces?.forEach((workspace: any) => map.set(workspace.id, workspace.name));
    return map;
  }, [workspaces]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    if (mobileActionsUser) {
      setDisplayMobileActionsUser(mobileActionsUser);
    }
  }, [mobileActionsUser]);

  const loadUsers = async (nextPage = page, nextSearch = search) => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const response = await organizationApi.listUsers({
        page: nextPage,
        limit: pagination.limit,
        search: nextSearch || undefined,
      });
      setUsers(Array.isArray(response?.items) ? response.items : []);
      setPagination(
        response?.pagination ?? {
          total: Array.isArray(response?.items) ? response.items.length : 0,
          page: nextPage,
          limit: pagination.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (user: {
    email: string;
    orgRole: string;
    workspaceAccess: WorkspaceAccess[];
  }) => {
    await inviteUser(user.email, user.orgRole, user.workspaceAccess);
    await refreshOrganizationsUsers();
    await loadUsers(1, search);
  };

  const handleSave = async (user: {
    email: string;
    orgRole: string;
    workspaceAccess: WorkspaceAccess[];
  }) => {
    await updateUser(user.email, user.orgRole, user.workspaceAccess);
    await refreshOrganizationsUsers();
    await loadUsers(page, search);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteUser || isOrganizationOwner(pendingDeleteUser)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await organizationApi.deleteUser(pendingDeleteUser.id);
      await refreshOrganizationsUsers();
      await loadUsers(page, search);
      setPendingDeleteUser(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!activeOrganization) return;
    void loadUsers(1, search);
  }, [activeOrganization]);

  useEffect(() => {
    if (!activeOrganization) return;
    void loadUsers(page, search);
  }, [activeOrganization, page, search]);

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <SearchInput
              appearance="toolbar"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search organization users..."
              onClear={() => setSearchDraft("")}
              clearAriaLabel="Clear organization user search"
              aria-label="Search organization users"
            />
          ),
        }
      : {},
    [isMobile, searchDraft],
  );

  const mobileActionsDisplayUser =
    mobileActionsUser ?? displayMobileActionsUser;

  return (
    <div>
      <div className="mb-4 hidden items-center justify-between md:flex">
        <div className="w-full max-w-xs">
          <SearchInput
            appearance="toolbar"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search organization users..."
            onClear={() => setSearchDraft("")}
            clearAriaLabel="Clear organization user search"
            aria-label="Search organization users"
          />
        </div>

        <Button
          onClick={() => {
            setEditUser(null);
            setInviteOpen(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          Invite User
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <DataLoader type="users" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.length > 0 ? (
            users.map((user) => {
              const normalizedWorkspaceAccess = normalizeWorkspaceAccess(user);
              const ownerLocked = isOrganizationOwner(user);
              const userName = getOrganizationUserName(user);
              const deleteAction = (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  disabled={ownerLocked}
                  onClick={() => setPendingDeleteUser(user)}
                >
                  Delete
                </Button>
              );

              if (isMobile) {
                return (
                  <article
                    key={user.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar
                        src={user.avatarUrl}
                        name={userName}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">
                              {userName}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] text-slate-500">
                              {user.email}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Tag
                                label={getOrgRoleLabel(user.role)}
                                bgColor="primary"
                                size="sm"
                              />
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {normalizedWorkspaceAccess.length || 0} workspace
                                {normalizedWorkspaceAccess.length !== 1 ? "s" : ""}
                              </span>
                              {user.status === "PENDING" ? (
                                <Tag label="Pending" bgColor="warning" size="sm" />
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <IconButton
                              aria-label={`Open actions for ${userName}`}
                              icon={<MoreVertical size={15} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => setMobileActionsUser(user)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }

              return (
                <div
                  key={user.id}
                  className={`rounded-[24px] border border-gray-200 p-4 transition hover:bg-gray-50 ${
                    isMobile
                      ? "space-y-4"
                      : "flex items-center justify-between gap-4"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={getOrganizationUserName(user)}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {getOrganizationUserName(user)}
                        </p>

                        {user.status === "PENDING" ? (
                          <Tag label="Pending" bgColor="warning" size="sm" />
                        ) : null}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {user.email}
                      </p>

                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <Tag
                          label={getOrgRoleLabel(user.role)}
                          bgColor="primary"
                          size="sm"
                        />

                        <span className="text-xs text-gray-400">
                          {normalizedWorkspaceAccess.length || 0} workspace
                          {normalizedWorkspaceAccess.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {normalizedWorkspaceAccess.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {normalizedWorkspaceAccess.map((workspace, index) => (
                            <Tag
                              key={`${workspace.workspaceId}-${workspace.role}-${index}`}
                              label={`${
                                workspaceMap.get(workspace.workspaceId) || "Unknown"
                              } (${getWorkspaceRoleLabel(workspace.role)})`}
                              bgColor="gray"
                              size="sm"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`flex shrink-0 ${
                      isMobile
                        ? "gap-4 border-t border-slate-100 pt-3"
                        : "items-center gap-4"
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil size={14} />}
                      onClick={() => {
                        setEditUser({
                          ...user,
                          workspaceAccess: normalizedWorkspaceAccess,
                        });
                        setInviteOpen(true);
                      }}
                    >
                      Edit
                    </Button>

                    {ownerLocked ? (
                      <Tooltip content="Organization owners cannot be removed.">
                        <span>{deleteAction}</span>
                      </Tooltip>
                    ) : (
                      deleteAction
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <p className="font-medium text-gray-600">
                No organization users found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Invite users and assign them workspace access.
              </p>
            </div>
          )}
        </div>
      )}

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        itemLabel="users"
        onPageChange={setPage}
      />

      <FloatingActionButton
        label="Invite user"
        icon={<UserRoundPlus size={22} />}
        onClick={() => {
          setEditUser(null);
          setInviteOpen(true);
        }}
      />

      {mobileActionsDisplayUser ? (
        <MobileSheet
          isOpen={Boolean(mobileActionsUser)}
          onClose={() => setMobileActionsUser(null)}
          borderless
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Organization user
              </p>
              <h2 className="mt-1 truncate text-base font-semibold text-slate-900">
                {getOrganizationUserName(mobileActionsDisplayUser)}
              </h2>
            </div>
          }
        >
          <div className="p-4">
            <div className="overflow-hidden rounded-2xl bg-slate-50">
              <Button
                variant="ghost"
                fullWidth
                contentAlign="start"
                leftIcon={<Pencil size={15} />}
                onClick={() => {
                  setEditUser({
                    ...mobileActionsDisplayUser,
                    workspaceAccess: normalizeWorkspaceAccess(mobileActionsDisplayUser),
                  });
                  setMobileActionsUser(null);
                  setInviteOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger-ghost"
                fullWidth
                contentAlign="start"
                leftIcon={<Trash2 size={15} />}
                disabled={isOrganizationOwner(mobileActionsDisplayUser)}
                onClick={() => {
                  setPendingDeleteUser(mobileActionsDisplayUser);
                  setMobileActionsUser(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </MobileSheet>
      ) : null}

      <InviteEditUserModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setEditUser(null);
        }}
        onInvite={handleInvite}
        onSave={handleSave}
        editUser={editUser}
      />

      <ConfirmDeleteModal
        open={Boolean(pendingDeleteUser)}
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteLoading}
        entityName={getOrganizationUserName(pendingDeleteUser)}
        entityType="organization user"
        title="Delete organization user"
        heading={`Delete ${getOrganizationUserName(pendingDeleteUser)}?`}
        body="This removes the user from the organization and all workspace access in this organization."
        confirmLabel="Delete user"
      />
    </div>
  );
};
