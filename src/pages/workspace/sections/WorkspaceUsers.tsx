import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

import { useWorkspace } from "../../../context/WorkspaceContext";
import { organizationApi } from "../../../lib/organizationApi";
import { WsGuard } from "../../../context/AuthorizationContext";

const workspaceRoles = [
  { id: "WS_OWNER", name: "Owner" },
  { id: "WS_MANAGER", name: "Manager" },
  { id: "WS_AGENT", name: "Agent" },
];

const visibilityOptions = [
  { id: "TEAM", name: "Anyone in the user's team" },
  { id: "ASSIGNED_ONLY", name: "Only assigned contacts" },
];

const getWorkspaceRoleLabel = (role: string) => {
  return workspaceRoles.find((r) => r.id === role)?.name || role;
};

/* =========================
   Invite User Modal
========================= */
const InviteUserModal = ({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (payload: { email: string; role: string }) => Promise<void>;
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("WS_AGENT");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("WS_AGENT");
    }
  }, [open]);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/30 backdrop-blur-[2px] flex justify-center items-start overflow-y-auto px-4 pt-24 pb-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[22px] font-semibold text-gray-900">
            Invite User
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
          <p className="text-[15px] text-gray-600 leading-7 mb-6">
            Invite a user to this workspace by email and assign their access
            level.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter user email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Access Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {workspaceRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[15px] text-gray-500 mt-6">
            Agents only have access to Messages within the workspace.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleInvite}
            disabled={!email.trim() || loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Inviting..." : "Invite"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Edit User Modal
========================= */
const EditWorkspaceUserModal = ({
  open,
  onClose,
  editUser,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editUser: any;
  onSave: (payload: {
    userId: string;
    role: string;
    restrictions: {
      restrictContactVisibility: boolean;
      contactVisibilityScope: string;
      restrictCalls: boolean;
      restrictWorkflowButton: boolean;
      maskPhoneAndEmail: boolean;
    };
  }) => Promise<void>;
}) => {
  const [role, setRole] = useState("WS_AGENT");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const [restrictions, setRestrictions] = useState({
    restrictContactVisibility: false,
    contactVisibilityScope: "TEAM",
    restrictCalls: false,
    restrictWorkflowButton: false,
    maskPhoneAndEmail: false,
  });

  useEffect(() => {
    if (editUser && open) {
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

  if (!open || !editUser) return null;

  const updateRestriction = (key: string, value: any) => {
    setRestrictions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await onSave({
        userId: editUser.id,
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

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/30 backdrop-blur-[2px] flex justify-center items-start overflow-y-auto px-4 pt-24 pb-10">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[22px] font-semibold text-gray-900">Edit User</h2>
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
            To edit this user select a new access level and click{" "}
            <span className="font-medium text-gray-800">"Update"</span>. The
            Access Level defines what the user can do on the workspace.
          </p>

          {/* Top Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Email Address
              </label>
              <input
                disabled
                value={editUser.email || ""}
                className="w-full h-11 rounded-xl border border-gray-300 bg-gray-100 px-4 text-[15px] text-gray-500 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Access Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 bg-white px-4 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {workspaceRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[15px] text-gray-500 mb-6">
            Agents only have access to Messages within the workspace. Optionally
            you can limit the visibility on Contacts.
          </p>

          {/* Advanced Restrictions */}
          {/* <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center justify-between w-full text-left text-[15px] font-medium text-indigo-600 mb-4"
          >
            <span>Advanced Restrictions</span>
            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button> */}

          {showAdvanced && (
            <div className="">
              {/* Restrict Contact Visibility */}
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={restrictions.restrictContactVisibility}
                  onChange={(e) =>
                    updateRestriction(
                      "restrictContactVisibility",
                      e.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />

                <div className="flex-1">
                  <p className="text-[16px] font-medium text-gray-800">
                    Restrict Contact Visibility
                  </p>
                  <p className="text-[15px] text-gray-600 mt-1">
                    This user can only view contacts assigned to
                  </p>
                </div>

                <select
                  disabled={!restrictions.restrictContactVisibility}
                  value={restrictions.contactVisibilityScope}
                  onChange={(e) =>
                    updateRestriction("contactVisibilityScope", e.target.value)
                  }
                  className={`w-[280px] h-11 rounded-xl border px-4 text-[15px] outline-none ${
                    restrictions.restrictContactVisibility
                      ? "border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-indigo-500"
                      : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Restrict Calls */}
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={restrictions.restrictCalls}
                  onChange={(e) =>
                    updateRestriction("restrictCalls", e.target.checked)
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-[16px] font-medium text-gray-800">
                    Restrict Calls Capabilities
                  </p>
                  <p className="text-[15px] text-gray-600 mt-1">
                    This user will not be able to receive or initiate calls.
                  </p>
                </div>
              </div>

              {/* Restrict Workflow */}
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={restrictions.restrictWorkflowButton}
                  onChange={(e) =>
                    updateRestriction(
                      "restrictWorkflowButton",
                      e.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-[16px] font-medium text-gray-800">
                    Restrict Workflows Button
                  </p>
                  <p className="text-[15px] text-gray-600 mt-1">
                    The Workflows button in the Messages module will be disabled
                    for this user. This includes Shortcuts and stopping a
                    Workflow for a Contact.
                  </p>
                </div>
              </div>

              {/* Mask Phone / Email */}
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={restrictions.maskPhoneAndEmail}
                  onChange={(e) =>
                    updateRestriction("maskPhoneAndEmail", e.target.checked)
                  }
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[16px] font-medium text-gray-800">
                      Mask Phone Number and Email Address
                    </p>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                      Upgrade
                    </span>
                  </div>
                  <p className="text-[15px] text-gray-600 mt-1">
                    This user will not be able to view all Contacts’ phone
                    numbers and email addresses.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
          <button className="text-indigo-600 text-sm font-medium hover:underline">
            Learn more
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Main Team Settings
========================= */
export const WorkspaceUsers = () => {
  const { refreshWorkspaceUsers, workspaceUsers, inviteUser, updateUser } =
    useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const handleInvite = async ({
    email,
    role,
  }: {
    email: string;
    role: string;
  }) => {
    await inviteUser(email, role,{});
    await refreshWorkspaceUsers();
  };

  const handleSave = async ({
    userId,
    role,
    restrictions,
  }: {
    userId: string;
    role: string;
    restrictions: {
      restrictContactVisibility: boolean;
      contactVisibilityScope: string;
      restrictCalls: boolean;
      restrictWorkflowButton: boolean;
      maskPhoneAndEmail: boolean;
    };
  }) => {
    await updateUser(userId, role, restrictions);
    await refreshWorkspaceUsers();
  };

  const handleDelete = async (userId: string) => {
    await organizationApi.deleteUser(userId);
    await refreshWorkspaceUsers();
  };

  return (
    <div className="">
      {/* Top */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage users and permissions for this workspace.
          </p>
        </div>

        <WsGuard permission="ws:settings:manage">
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            Invite User
          </button>
        </WsGuard>
      </div>

      {/* User List */}
     <div className="space-y-3">
  {workspaceUsers?.length > 0 ? (
    workspaceUsers.map((user: any) => (
      <div
        key={user.id}
        className="flex justify-between items-center border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition gap-4"
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            size="md"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900 truncate">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.email}
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

            <p className="text-xs text-gray-500 mt-1">
              {getWorkspaceRoleLabel(user.role)}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex gap-4 items-center shrink-0">
          <button
            onClick={() => {
              setEditUser(user);
              setEditOpen(true);
            }}
            className="text-indigo-600 text-sm flex items-center gap-1 hover:underline"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            onClick={() => handleDelete(user.id)}
            className="text-red-500 text-sm flex items-center gap-1 hover:underline"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    ))
  ) : (
    <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center">
      <p className="text-gray-600 font-medium">No users found</p>
      <p className="text-sm text-gray-500 mt-1">
        Invite team members to collaborate in this workspace.
      </p>
    </div>
  )}
</div>

      {/* Invite Modal */}
      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      {/* Edit Modal */}
      <EditWorkspaceUserModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditUser(null);
        }}
        editUser={editUser}
        onSave={handleSave}
      />
    </div>
  );
};
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
