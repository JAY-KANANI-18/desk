import { useEffect, useState } from "react";
import {
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
} from "@/components/ui/icons";

import { ConfirmDeleteModal, MobileSheet } from "../../../components/ui/modal";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { organizationApi } from "../../../lib/organizationApi";
import {
  useAuthorization,
  WsGuard,
} from "../../../context/AuthorizationContext";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { workspaceApi } from "../../../lib/workspaceApi";
import { ListPagination } from "../../../components/ui/ListPagination";
import { useMobileHeaderActions } from "../../../components/mobileHeaderActions";
import { Avatar } from "../../../components/ui/Avatar";
import { Tag } from "../../../components/ui/Tag";
import { Button } from "../../../components/ui/button/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { FloatingActionButton } from "../../../components/ui/FloatingActionButton";
import { BaseInput } from "../../../components/ui/inputs";
import { CenterModal } from "../../../components/ui/Modal";
import { BaseSelect } from "../../../components/ui/select/BaseSelect";
import type { SelectOption } from "../../../components/ui/select/shared";

const workspaceRoles = [
  { id: "WS_OWNER", name: "Owner" },
  { id: "WS_MANAGER", name: "Manager" },
  { id: "WS_AGENT", name: "Agent" },
];

const workspaceRoleOptions: SelectOption[] = workspaceRoles.map((role) => ({
  value: role.id,
  label: role.name,
}));

type WorkspaceRestrictions = {
  restrictContactVisibility: boolean;
  contactVisibilityScope: string;
  restrictCalls: boolean;
  restrictWorkflowButton: boolean;
  maskPhoneAndEmail: boolean;
};

type WorkspaceUser = {
  id: string;
  role: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: string;
  restrictions?: Partial<WorkspaceRestrictions>;
};

const defaultRestrictions: WorkspaceRestrictions = {
  restrictContactVisibility: false,
  contactVisibilityScope: "TEAM",
  restrictCalls: false,
  restrictWorkflowButton: false,
  maskPhoneAndEmail: false,
};

const getWorkspaceRoleLabel = (role: string) => {
  return workspaceRoles.find((item) => item.id === role)?.name || role;
};

const getWorkspaceUserName = (user?: Partial<WorkspaceUser> | null) => {
  if (!user) {
    return "User";
  }

  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "User"
  );
};

const InviteUserModal = ({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (payload: { email: string; role: string }) => Promise<void>;
}) => {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("WS_AGENT");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("WS_AGENT");
    }
  }, [open]);

  const handleInvite = async () => {
    if (!email.trim()) return;

    try {
      setLoading(true);
      await onInvite({
        email: email.trim(),
        role,
      });
      onClose();
    } catch (error) {
      console.error("Invite failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <p className="text-[15px] leading-7 text-gray-600">
        Invite a user to this workspace by email and assign their access level.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <BaseInput
          type="email"
          label="Email Address"
          placeholder="Enter user email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <BaseSelect
          label="Access Level"
          value={role}
          onChange={setRole}
          options={workspaceRoleOptions}
        />
      </div>

      <p className="text-[15px] text-gray-500">
        Agents only have access to Messages within the workspace.
      </p>
    </div>
  );

  const secondaryAction = (
    <Button onClick={onClose} variant="secondary">
      Cancel
    </Button>
  );

  const primaryAction = (
    <Button
      onClick={handleInvite}
      disabled={!email.trim()}
      loading={loading}
      loadingMode="inline"
      loadingLabel="Inviting..."
     
    >
      Invite
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
              Workspace Users
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Invite User
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-3">
            <Button onClick={onClose} variant="secondary" fullWidth >
              Cancel
            </Button>

            <Button
              onClick={handleInvite}
              disabled={!email.trim()}
              loading={loading}
              loadingMode="inline"
              loadingLabel="Inviting..."
              fullWidth
            >
              Invite
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
      title="Invite User"
      size="lg"
      width={720}
      secondaryAction={secondaryAction}
      primaryAction={primaryAction}
    >
      {content}
    </CenterModal>
  );
};

const EditWorkspaceUserModal = ({
  open,
  onClose,
  editUser,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editUser: WorkspaceUser | null;
  onSave: (payload: {
    userId: string;
    role: string;
    restrictions: WorkspaceRestrictions;
  }) => Promise<void>;
}) => {
  const isMobile = useIsMobile();
  const [role, setRole] = useState("WS_AGENT");
  const [loading, setLoading] = useState(false);
  const [restrictions, setRestrictions] =
    useState<WorkspaceRestrictions>(defaultRestrictions);
  const [displayUser, setDisplayUser] = useState<WorkspaceUser | null>(
    editUser,
  );

  useEffect(() => {
    if (editUser && open) {
      setDisplayUser(editUser);
      setRole(editUser.role || "WS_AGENT");
      setRestrictions({
        restrictContactVisibility:
          editUser?.restrictions?.restrictContactVisibility || false,
        contactVisibilityScope:
          editUser?.restrictions?.contactVisibilityScope || "TEAM",
        restrictCalls: editUser?.restrictions?.restrictCalls || false,
        restrictWorkflowButton:
          editUser?.restrictions?.restrictWorkflowButton || false,
        maskPhoneAndEmail: editUser?.restrictions?.maskPhoneAndEmail || false,
      });
    }
  }, [editUser, open]);

  const activeEditUser = editUser ?? displayUser;

  if (!activeEditUser) return null;

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await onSave({
        userId: activeEditUser.id,
        role,
        restrictions,
      });
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar
          src={activeEditUser.avatarUrl}
          name={getWorkspaceUserName(activeEditUser)}
          size="lg"
        />

        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">
            {getWorkspaceUserName(activeEditUser)}
          </p>
          <p className="truncate text-sm text-gray-500">{activeEditUser.email}</p>
        </div>
      </div>

      <p className="text-[15px] leading-7 text-gray-600">
        To edit this user select a new access level and click{" "}
        <span className="font-medium text-gray-800">Update</span>. The access
        level defines what the user can do on the workspace.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <BaseInput
          label="Email Address"
          value={activeEditUser.email || ""}
          disabled
        />

        <BaseSelect
          label="Access Level"
          value={role}
          onChange={setRole}
          options={workspaceRoleOptions}
        />
      </div>

      <p className="text-[15px] text-gray-500">
        Agents only have access to Messages within the workspace. Optionally
        you can limit the visibility on Contacts.
      </p>
    </div>
  );

  const footerMeta = (
    <Button variant="link" size="sm">
      Learn more
    </Button>
  );

  const secondaryAction = (
    <Button onClick={onClose} variant="secondary" >
      Cancel
    </Button>
  );

  const primaryAction = (
    <Button
      onClick={handleUpdate}
      loading={loading}
      loadingMode="inline"
      loadingLabel="Updating..."
     
    >
      Update
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
              Workspace Users
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Edit User
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-3">
            <Button variant="link" size="sm">
              Learn more
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              loading={loading}
              loadingMode="inline"
              loadingLabel="Updating..."
              fullWidth
              
            >
              Update
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
      title="Edit User"
      size="lg"
      width={760}
      footerMeta={footerMeta}
      secondaryAction={secondaryAction}
      primaryAction={primaryAction}
    >
      {content}
    </CenterModal>
  );
};

export const WorkspaceUsers = () => {
  const { refreshWorkspaceUsers, inviteUser, updateUser } = useWorkspace();
  const isMobile = useIsMobile();
  const { canWs } = useAuthorization();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<WorkspaceUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<WorkspaceUser | null>(null);
  const [mobileActionsUser, setMobileActionsUser] =
    useState<WorkspaceUser | null>(null);
  const [displayMobileActionsUser, setDisplayMobileActionsUser] =
    useState<WorkspaceUser | null>(null);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const response = await workspaceApi.listUsers({
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

  useEffect(() => {
    void loadUsers(page, search);
  }, [page, search]);

  const handleInvite = async ({
    email,
    role,
  }: {
    email: string;
    role: string;
  }) => {
    await inviteUser(email, role, {});
    await refreshWorkspaceUsers();
    await loadUsers(1, search);
  };

  const handleSave = async ({
    userId,
    role,
    restrictions,
  }: {
    userId: string;
    role: string;
    restrictions: WorkspaceRestrictions;
  }) => {
    await updateUser(userId, role, restrictions);
    await refreshWorkspaceUsers();
    await loadUsers(page, search);
  };

  const requestDeleteUser = (user: WorkspaceUser) => {
    setDeleteUser(user);
    setDeleteError(null);
  };

  const closeDeleteUser = () => {
    if (deletingUserId) return;
    setDeleteUser(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser || deletingUserId) return;

    setDeletingUserId(deleteUser.id);
    setDeleteError(null);
    try {
      await organizationApi.deleteUser(deleteUser.id);
      await refreshWorkspaceUsers();
      await loadUsers(page, search);
      setDeleteUser(null);
    } catch {
      setDeleteError("Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  useMobileHeaderActions(
    isMobile
      ? {
          panel: (
            <BaseInput
              type="search"
              appearance="toolbar"
              leftIcon={<Search size={15} />}
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search members..."
              aria-label="Search members"
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
          <BaseInput
            type="search"
            appearance="toolbar"
            leftIcon={<Search size={15} />}
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search members..."
            aria-label="Search members"
          />
        </div>

        <WsGuard permission="ws:settings:manage">
          <Button
            onClick={() => setInviteOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Invite User
          </Button>
        </WsGuard>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="font-medium text-gray-600">Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          users.map((user) => {
            const userName = getWorkspaceUserName(user);

            if (isMobile) {
              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar src={user.avatarUrl} name={userName} size="sm" />

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
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {getWorkspaceRoleLabel(user.role)}
                            </span>
                            {user.status === "PENDING" ? (
                              <Tag label="Pending" bgColor="warning" size="sm" />
                            ) : null}
                          </div>
                        </div>

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
                </article>
              );
            }

            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={user.avatarUrl} name={userName} size="md" />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {userName}
                      </p>

                      {user.status === "PENDING" ? (
                        <Tag label="Pending" bgColor="warning" size="sm" />
                      ) : null}
                    </div>

                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {user.email}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {getWorkspaceRoleLabel(user.role)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <Button
                    onClick={() => {
                      setEditUser(user);
                      setEditOpen(true);
                    }}
                    variant="ghost"
                    leftIcon={<Pencil size={14} />}
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => requestDeleteUser(user)}
                    variant="danger-ghost"
                    leftIcon={<Trash2 size={14} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="font-medium text-gray-600">No users found</p>
            <p className="mt-1 text-sm text-gray-500">
              Invite team members to collaborate in this workspace.
            </p>
          </div>
        )}
      </div>

      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        itemLabel="members"
        onPageChange={setPage}
      />

      {canWs("ws:settings:manage") ? (
        <FloatingActionButton
          label="Invite user"
          icon={<UserRoundPlus size={22} />}
          onClick={() => setInviteOpen(true)}
        />
      ) : null}

      {mobileActionsDisplayUser ? (
        <MobileSheet
          isOpen={Boolean(mobileActionsUser)}
          onClose={() => setMobileActionsUser(null)}
          borderless
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace user
              </p>
              <h2 className="mt-1 truncate text-base font-semibold text-slate-900">
                {getWorkspaceUserName(mobileActionsDisplayUser)}
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
                  setEditUser(mobileActionsDisplayUser);
                  setEditOpen(true);
                  setMobileActionsUser(null);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger-ghost"
                fullWidth
                contentAlign="start"
                leftIcon={<Trash2 size={15} />}
                onClick={() => {
                  requestDeleteUser(mobileActionsDisplayUser);
                  setMobileActionsUser(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </MobileSheet>
      ) : null}

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      <EditWorkspaceUserModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditUser(null);
        }}
        editUser={editUser}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteUser)}
        entityName={getWorkspaceUserName(deleteUser)}
        entityType="workspace user"
        title="Delete workspace user"
        body={
          <div className="space-y-2">
            <p>
              This removes the user from the organization and its workspace
              access.
            </p>
            {deleteError ? (
              <p className="font-medium text-red-600">{deleteError}</p>
            ) : null}
          </div>
        }
        confirmLabel="Delete user"
        isDeleting={deletingUserId === deleteUser?.id}
        onCancel={closeDeleteUser}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
