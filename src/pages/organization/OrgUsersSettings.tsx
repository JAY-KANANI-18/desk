import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, X, ChevronDown, Search } from "lucide-react";

import { useWorkspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";
import { organizationApi } from "../../lib/organizationApi";
import { DataLoader } from "../Loader";
import { ListPagination } from "../../components/ui/ListPagination";

const UserAvatar = ({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = "md",
}: {
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim() ||
    email?.[0]?.toUpperCase() ||
    "U";

  const sizeClasses = {
    sm: "h-9 w-9 text-sm",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={firstName || email || "User"}
      className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 shrink-0`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
};

/* =========================
   Role Config
========================= */
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

const getOrgRoleLabel = (role: string) => {
  return orgRoles.find((r) => r.id === role)?.name || role;
};

const getWorkspaceRoleLabel = (role: string) => {
  return workspaceRoles.find((r) => r.id === role)?.name || role;
};

/* =========================
   Helpers
========================= */
const normalizeWorkspaceAccess = (user: any) => {
  // Preferred shape from backend
  if (Array.isArray(user?.workspaceAccess)) {
    return user.workspaceAccess.map((ws: any) => ({
      workspaceId: ws.workspaceId || ws.id || "",
      role: ws.role || "WS_AGENT",
    }));
  }

  // Fallback from your current orgUsers response: `workspaces`
  if (Array.isArray(user?.workspaces)) {
    return user.workspaces.map((ws: any) => ({
      workspaceId: ws.id,
      role: ws.role, // fallback default if backend doesn't send workspace role
    }));
  }

  return [];
};

/* =========================
   Invite/Edit Modal
========================= */
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
    workspaceAccess: { workspaceId: string; role: string }[];
  }) => Promise<void>;
  onSave: (payload: {
    email: string;
    orgRole: string;
    workspaceAccess: { workspaceId: string; role: string }[];
  }) => Promise<void>;
  editUser: any;
}) => {
  const { workspaces } = useWorkspace();

  const [email, setEmail] = useState("");
  const [orgRole, setOrgRole] = useState("ORG_MEMBER");
  const [workspaceAccess, setWorkspaceAccess] = useState<
    { workspaceId: string; role: string }[]
  >([{ workspaceId: "", role: "WS_AGENT" }]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && editUser) {
      setEmail(editUser.email || "");
      setOrgRole(editUser.role || "ORG_MEMBER");

      const normalized = normalizeWorkspaceAccess(editUser);
      setWorkspaceAccess(
        normalized.length > 0
          ? normalized
          : [{ workspaceId: "", role: "WS_AGENT" }],
      );
    } else if (open && !editUser) {
      setEmail("");
      setOrgRole("ORG_MEMBER");
      setWorkspaceAccess([{ workspaceId: "", role: "WS_AGENT" }]);
    }
  }, [open, editUser]);

  if (!open) return null;

  const addWorkspace = () => {
    setWorkspaceAccess((prev) => [
      ...prev,
      { workspaceId: "", role: "WS_AGENT" },
    ]);
  };

  const updateWorkspace = (
    index: number,
    key: "workspaceId" | "role",
    value: string,
  ) => {
    setWorkspaceAccess((prev) =>
      prev.map((ws, i) => (i === index ? { ...ws, [key]: value } : ws)),
    );
  };

  const removeWorkspace = (index: number) => {
    setWorkspaceAccess((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedWorkspaceIds = workspaceAccess
    .map((ws) => ws.workspaceId)
    .filter(Boolean);

  const handleSubmit = async () => {
    const cleanedWorkspaceAccess = workspaceAccess.filter(
      (ws) => ws.workspaceId,
    );

    try {
      setLoading(true);

      if (editUser) {
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
      console.error(editUser ? "Update failed:" : "Invite failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/30 backdrop-blur-[2px] flex justify-center items-start overflow-y-auto px-4 pt-20 pb-10">
      <div className="w-full max-w-3xl rounded-[24px] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.18)] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[22px] font-semibold text-gray-900">
            {editUser ? "Edit User" : "Invite User"}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {editUser && (
            <div className="flex items-center gap-4 mb-6">
              <UserAvatar
                avatarUrl={editUser.avatarUrl}
                firstName={editUser.firstName}
                lastName={editUser.lastName}
                email={editUser.email}
                size="lg"
              />

              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {[editUser.firstName, editUser.lastName]
                    .filter(Boolean)
                    .join(" ") || editUser.email}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {editUser.email}
                </p>
              </div>
            </div>
          )}
          <p className="text-[15px] text-gray-600 leading-7 mb-6">
            {editUser
              ? "Update this user’s organization role and workspace access."
              : "Invite a user to your organization and assign their workspace access."}
          </p>

          {/* Top Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Email Address
              </label>
              <input
                disabled={!!editUser}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email"
                className={`w-full h-11 rounded-xl border px-4 text-[15px] outline-none ${
                  editUser
                    ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-indigo-500"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Organization Role
              </label>
              <div className="relative">
                <select
                  value={orgRole}
                  onChange={(e) => setOrgRole(e.target.value)}
                  className="w-full h-11 appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {orgRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Workspace Access */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Workspace Access
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Assign this user to one or more workspaces and choose their
                  role in each.
                </p>
              </div>

              <button
                type="button"
                onClick={addWorkspace}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
              >
                <Plus size={15} />
                Add Workspace
              </button>
            </div>

            <div className="space-y-3">
              {workspaceAccess.map((ws, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_180px_48px] gap-3 items-center rounded-2xl border border-gray-200 p-3"
                >
                  {/* Workspace Select */}
                  <div className="relative">
                    <select
                      value={ws.workspaceId}
                      onChange={(e) =>
                        updateWorkspace(index, "workspaceId", e.target.value)
                      }
                      className="w-full h-11 appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select workspace</option>
                      {workspaces.map((workspace: any) => {
                        const isAlreadySelected =
                          selectedWorkspaceIds.includes(workspace.id) &&
                          workspace.id !== ws.workspaceId;

                        return (
                          <option
                            key={workspace.id}
                            value={workspace.id}
                            disabled={isAlreadySelected}
                          >
                            {workspace.name}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>

                  {/* Role Select */}
                  <div className="relative">
                    <select
                      value={ws.role}
                      onChange={(e) =>
                        updateWorkspace(index, "role", e.target.value)
                      }
                      className="w-full h-11 appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {workspaceRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeWorkspace(index)}
                    disabled={workspaceAccess.length === 1}
                    className="h-11 w-11 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || (!editUser && !email.trim())}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? editUser
                ? "Saving..."
                : "Inviting..."
              : editUser
                ? "Save"
                : "Invite"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Main Component
========================= */
export const OrgUsersSettings = () => {
  const {
    refreshOrganizationsUsers,
    orgUsers,
    activeOrganization,
    inviteUser,
    updateUser,
  } = useOrganization();
  const { workspaces } = useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
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
    const map = new Map();
    workspaces?.forEach((ws: any) => map.set(ws.id, ws.name));
    return map;
  }, [workspaces]);

  const handleInvite = async (user: {
    email: string;
    orgRole: string;
    workspaceAccess: { workspaceId: string; role: string }[];
  }) => {
    await inviteUser(user.email, user.orgRole, user.workspaceAccess);
    await refreshOrganizationsUsers();
    await loadUsers(1, search);
  };

  const handleSave = async (user: {
    email: string;
    orgRole: string;
    workspaceAccess: { workspaceId: string; role: string }[];
  }) => {
    await updateUser(user.email, user.orgRole, user.workspaceAccess);
    await refreshOrganizationsUsers();
    await loadUsers(page, search);
  };

  const handleDelete = async (userId: string) => {
    await organizationApi.deleteUser(userId);
    await refreshOrganizationsUsers();
    await loadUsers(page, search);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

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

  useEffect(() => {
    const init = async () => {
      if (activeOrganization) {
        await loadUsers(1, search);
      }
    };

    init();
  }, [activeOrganization]);

  useEffect(() => {
    if (!activeOrganization) return;
    loadUsers(page, search);
  }, [page, search]);

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Organization Users
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage organization roles and workspace access.
          </p>
        </div>

        <button
          onClick={() => {
            setEditUser(null);
            setInviteOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Invite User
        </button>
      </div>

      <div className="mb-4 flex items-center justify-end">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search organization users..."
            className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
    {loading ? (
  <div className="space-y-3 ">
    <DataLoader type="users" />
  </div>
) : (
  <div className="space-y-3 ">
    {users?.length > 0 ? (
      users.map((user: any) => {
        const normalizedWorkspaceAccess = normalizeWorkspaceAccess(user);

        return (
          <div
            key={user.id}
            className="flex justify-between items-center border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition gap-4"
          >
            {/* Left */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                email={user.email}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ") || user.email}
                  </p>

                  {user.status === "PENDING" && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user.email}
                </p>

                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[11px] font-medium">
                    {getOrgRoleLabel(user.role)}
                  </span>

                  <span className="text-xs text-gray-400">
                    {normalizedWorkspaceAccess.length || 0} workspace
                    {normalizedWorkspaceAccess.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {normalizedWorkspaceAccess.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {normalizedWorkspaceAccess.map(
                      (ws: any, index: number) => (
                        <span
                          key={`${ws.workspaceId}-${ws.role}-${index}`}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {workspaceMap.get(ws.workspaceId) || "Unknown"} (
                          {getWorkspaceRoleLabel(ws.role)})
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex gap-4 items-center shrink-0">
              <button
                className="text-indigo-600 text-sm flex items-center gap-1 hover:underline"
                onClick={() => {
                  setEditUser({
                    ...user,
                    workspaceAccess: normalizedWorkspaceAccess,
                  });
                  setInviteOpen(true);
                }}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                className="text-red-500 text-sm flex items-center gap-1 hover:underline"
                onClick={() => handleDelete(user.id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        );
      })
    ) : (
      <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center">
        <p className="text-gray-600 font-medium">
          No organization users found
        </p>
        <p className="text-sm text-gray-500 mt-1">
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

      {/* Modal */}
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
    </div>
  );
};
