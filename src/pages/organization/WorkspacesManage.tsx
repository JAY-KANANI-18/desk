import { X } from "lucide-react";
import { useState, useEffect } from "react";

import { Users, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";

interface WorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  title: string;
}

export const WorkspaceModal = ({
  open,
  onClose,
  onSubmit,
  initialName,
  title,
}: WorkspaceModalProps) => {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(initialName || "");
  }, [initialName]);

  useEffect(() => {
    setName("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>

          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-lg border"
            >
              Cancel
            </button>

            <button
              onClick={() => onSubmit(name)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName?: string;
}

export const DeleteWorkspaceModal = ({
  open,
  onClose,
  onConfirm,
  workspaceName,
}: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Delete workspace</h3>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium">{workspaceName}</span>? This action
          cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const WorkspacesManage = () => {
  const { workspaces, createWorkspace, deleteWorkspace } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteWs, setDeleteWs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
   useEffect(() => {
     if (workspaces) setLoading(false);
   }, [workspaces]);

  const handleCreate = (name: string) => {
    console.log("create workspace", name);
    createWorkspace({ name, organizationId: activeOrganization?.id });
    setCreateOpen(false);
  };

  const handleDelete = () => {
    console.log("delete workspace", deleteWs.id);
    deleteWorkspace(deleteWs);
    setDeleteWs(null);
  };

  return (
    <div>
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Workspaces</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all workspaces under your organization.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          <Plus size={15} />
          New workspace
        </button>
      </div>

      <div className="space-y-3 max-w-2xl">
        {workspaces?.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {ws.name[0]}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800">{ws.name}</p>

                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={11} />
                  {ws?.members?.length} members
                </p>
              </div>
            </div>

            <button
              onClick={() => setDeleteWs(ws)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <WorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Create workspace"
      />

      <DeleteWorkspaceModal
        open={!!deleteWs}
        workspaceName={deleteWs?.name}
        onClose={() => setDeleteWs(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
