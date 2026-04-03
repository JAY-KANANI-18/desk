import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";
import { organizationApi } from "../../lib/organizationApi";
import { DataLoader } from "../Loader";

const mock_org_roles = [
  { id: "owner", name: "ORG O wner" },

  { id: "admin", name: "ORG Admin" },
  { id: "member", name: " ORG Member" },
];

const mock_workspace_roles = [
  { id: "admin", name: "Admin" },
  { id: "member", name: "Member" },
];

export const InviteUserModal = ({ open, onClose, onSave, editUser }) => {
  const [email, setEmail] = useState(editUser?.email || "");
  const [orgRole, setOrgRole] = useState(editUser?.orgRole || "member");

  const [workspaceAccess, setWorkspaceAccess] = useState(
    editUser?.workspaceAccess || []
  );

  const { workspaces } = useWorkspace();

  if (!open) return null;

  const addWorkspace = () => {
    setWorkspaceAccess([
      ...workspaceAccess,
      { workspaceId: "", role: "agent" },
    ]);
  };

  const updateWorkspace = (index, key, value) => {
    const updated = [...workspaceAccess];
    updated[index][key] = value;
    setWorkspaceAccess(updated);
  };

  const removeWorkspace = (index) => {
    setWorkspaceAccess(workspaceAccess.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[520px] p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-5">
          {editUser ? "Edit User" : "Invite User"}
        </h3>

        {!editUser && (
          <input
            placeholder="User email"
            className="border p-2 w-full rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <div className="mb-4">
          <p className="text-sm mb-1">Organization Role</p>

          <select
            className="border p-2 w-full rounded"
            value={orgRole}
            onChange={(e) => setOrgRole(e.target.value)}
          >
            {mock_org_roles.map((org_role) => (
              <option value={org_role.id}>{org_role.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium">Workspace Access</p>

            <button
              onClick={addWorkspace}
              className="text-indigo-600 text-sm flex items-center gap-1"
            >
              <Plus size={14} />
              Add Workspace
            </button>
          </div>

          <div className="space-y-2">
            {workspaceAccess.map((ws, index) => (
              <div
                key={index}
                className="flex gap-2 items-center border rounded p-2"
              >
                <select
                  className="flex-1 border rounded p-1"
                  value={ws.workspaceId}
                  onChange={(e) =>
                    updateWorkspace(index, "workspaceId", e.target.value)
                  }
                >
                  <option value="">Select workspace</option>

                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-[120px] border rounded p-1"
                  value={ws.role}
                  onChange={(e) =>
                    updateWorkspace(index, "role", e.target.value)
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button
                  onClick={() => removeWorkspace(index)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose}>Cancel</button>

          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={() => {
              onSave({
                email,
                orgRole,
                workspaceAccess,
              });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrgUsersSettings = () => {
  // const [users, setUsers] = useState([
  //   {
  //     id: "1",
  //     email: "admin@company.com",
  //     orgRole: "admin",
  //     workspaceAccess: [
  //       { workspaceId: "ws1", role: "admin" },
  //       { workspaceId: "ws2", role: "agent" },
  //     ],
  //   },
  // ]);
  const {refreshOrganizationsUsers, orgUsers} = useOrganization()

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);

    const { activeOrganization, inviteUser } = useOrganization();


  const handleInvite = async (user:any) => {
    console.log("test ");
    
    const result = await inviteUser(
      user.email,
      user.orgRole,
      user.workspaceAccess
    );
      
    console.log({ result });
  };
  const handleDelete = async (userId) => {
    // Call API to delete user
    await organizationApi.deleteUser(userId);
    refreshOrganizationsUsers();
  }

  useEffect(() => {
    if(activeOrganization){
      refreshOrganizationsUsers();
      setLoading(false);
    }
  }, [activeOrganization]);

  console.log({orgUsers});
  
  // const removeUser = (id) => {
  //   setUsers((prev) => prev.filter((u) => u.id !== id));
  // };


  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Organization Users
          </h2>

          <p className="text-sm text-gray-500">
            Manage users and workspace access
          </p>
        </div>

        <button
          onClick={() => {
            setEditUser(null);
            setInviteOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded"
        >
          <Plus size={15} />
          Invite User
        </button>
      </div>

    { loading ? (
      <div className="space-y-3 max-w-3xl">
        <DataLoader type="users" />
      </div>
    ) : (
      <div className="space-y-3 max-w-3xl">
        {orgUsers?.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center border p-4 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{user.email}</p>

              <p className="text-xs text-gray-500">
                {user.role} · {user?.workspaceAccess?.length} workspaces
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="text-indigo-600 text-sm flex items-center gap-1"
                onClick={() => {
                  setEditUser(user);
                  setInviteOpen(true);
                }}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                className="text-red-500 text-sm"
                onClick={() =>handleDelete  (user.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>)}

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSave={handleInvite}
        editUser={editUser}
      />
    </div>
  );
};
