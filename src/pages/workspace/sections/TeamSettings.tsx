import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, Save } from "lucide-react";

import { Toggle } from "../components/Toggle";
import { useOrganization } from "../../../context/OrganizationContext";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { organizationApi } from "../../../lib/organizationApi";

const orgRoles = [
  { id: "owner", name: "Owner" },
  { id: "admin", name: "Admin" },
  { id: "member", name: "Member" },
];

const workspaceRoles = [
  { id: "admin", name: "Admin" },
  { id: "agent", name: "Agent" },
  { id: "viewer", name: "Viewer" },
];

export const InviteUserModal = ({ open, onClose, onSave, editUser, workspaces }) => {
  const [email, setEmail] = useState(editUser?.email || "");
  const [orgRole, setOrgRole] = useState(editUser?.role || "member");
  const [workspaceAccess, setWorkspaceAccess] = useState(
    editUser?.workspaceAccess || []
  );

  if (!open) return null;

  const addWorkspace = () => {
    setWorkspaceAccess([...workspaceAccess, { workspaceId: "", role: "agent" }]);
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[520px] p-6 shadow-xl">

        <h3 className="text-base font-semibold text-gray-900 mb-5">
          {editUser ? "Edit User" : "Invite User"}
        </h3>

        {!editUser && (
          <input
            placeholder="User email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Organization Role
          </p>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={orgRole}
            onChange={(e) => setOrgRole(e.target.value)}
          >
            {orgRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>

          <div className="flex justify-between mb-3">
            <p className="text-sm font-medium text-gray-800">
              Workspace Access
            </p>

            <button
              onClick={addWorkspace}
              className="flex items-center gap-1 text-indigo-600 text-sm hover:underline"
            >
              <Plus size={14} /> Add Workspace
            </button>
          </div>

          <div className="space-y-2">

            {workspaceAccess.map((ws, index) => (
              <div key={index} className="flex gap-2 items-center border border-gray-200 rounded-lg p-2">

                <select
                  className="flex-1 border border-gray-300 rounded p-1 text-sm"
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
                  className="w-[120px] border border-gray-300 rounded p-1 text-sm"
                  value={ws.role}
                  onChange={(e) =>
                    updateWorkspace(index, "role", e.target.value)
                  }
                >
                  {workspaceRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => removeWorkspace(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            ))}

          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onSave({
                email,
                orgRole,
                workspaceAccess,
              });
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Save
          </button>

        </div>

      </div>
    </div>
  );
};

export const TeamSettings = () => {

  const {
    orgUsers,
    activeOrganization,
    inviteUser,
    refreshOrganizationsUsers,
    
  } = useOrganization();

 const {workspaces} =  useWorkspace()

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    if (activeOrganization) {
      refreshOrganizationsUsers();
    }
  }, [activeOrganization]);

  const handleInvite = async (user) => {
    await inviteUser(
      user.email,
      user.orgRole,
      user.workspaceAccess
    );

    refreshOrganizationsUsers();
  };

  const handleDelete = async (userId) => {
    await organizationApi.deleteUser(userId);
    refreshOrganizationsUsers();
  };

  return (

    <div className="space-y-6">


        <div className="flex justify-between items-center mb-6">

       

          <button
            onClick={() => {
              setEditUser(null);
              setInviteOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            <Plus size={16} />
            Invite User
          </button>

        </div>

        <div className="space-y-3">

          {orgUsers?.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center border border-gray-200 p-4 rounded-lg hover:bg-gray-50"
            >

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>

                <p className="text-xs text-gray-500">
                  {user.role} · {user.workspaceAccess?.length || 0} workspaces
                </p>
              </div>

              <div className="flex gap-4">

                <button
                  onClick={() => {
                    setEditUser(user);
                    setInviteOpen(true);
                  }}
                  className="text-indigo-600 text-sm flex items-center gap-1 hover:underline"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>


      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSave={handleInvite}
        editUser={editUser}
        workspaces={workspaces}
      />

    </div>
  );
};