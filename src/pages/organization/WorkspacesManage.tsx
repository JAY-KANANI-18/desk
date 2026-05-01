import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { OrgGuard, useAuthorization } from "../../context/AuthorizationContext";
import { ConfirmDeleteModal, MobileSheet } from "../../components/ui/modal";
import { useWorkspace, type Workspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/button/Button";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { IconButton } from "../../components/ui/button/IconButton";
import { BaseInput } from "../../components/ui/inputs";
import { CenterModal } from "../../components/ui/Modal";

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
  const isMobile = useIsMobile();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName || "");
    }
  }, [initialName, open]);

  const trimmedName = name.trim();

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        title={<h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>

            <Button
              onClick={() => onSubmit(trimmedName)}
              disabled={!trimmedName}
              fullWidth
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="p-4">
          <BaseInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Workspace name"
            label="Workspace name"
          />
        </div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="sm"
      width={420}
      secondaryAction={
        <Button onClick={onClose} variant="secondary" >
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          onClick={() => onSubmit(trimmedName)}
          disabled={!trimmedName}
        >
          Save
        </Button>
      }
    >
      <BaseInput
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Workspace name"
        label="Workspace name"
      />
    </CenterModal>
  );
};

export const WorkspacesManage = () => {
  const { workspaces, createWorkspace, deleteWorkspace } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { canOrg } = useAuthorization();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteWs, setDeleteWs] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const canManageWorkspaces = canOrg("org:workspaces:manage");

  const handleCreate = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName || !activeOrganization?.id) {
      return;
    }

    createWorkspace({ name: trimmedName, organizationId: activeOrganization.id });
    setCreateOpen(false);
  };

  const closeDeleteWorkspace = () => {
    if (deleting) {
      return;
    }

    setDeleteWs(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deleteWs || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkspace(deleteWs);
      setDeleteWs(null);
    } catch {
      setDeleteError("Failed to delete workspace.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 hidden items-center justify-between pb-4 md:flex">
        <OrgGuard permission="org:workspaces:manage">
          <Button
            onClick={() => setCreateOpen(true)}
            leftIcon={<Plus size={15} />}
          >
            New workspace
          </Button>
        </OrgGuard>
      </div>

      <div className="max-w-2xl space-y-3">
        {workspaces?.map((ws) => {
          const memberCount =
            "members" in ws && Array.isArray(ws.members) ? ws.members.length : 0;

          return (
            <div
              key={ws.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar name={ws.name} shape="square" size="md" />

                <div>
                  <p className="text-sm font-medium text-gray-800">{ws.name}</p>

                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={11} />
                    {memberCount} members
                  </p>
                </div>
              </div>

              <OrgGuard permission="org:workspaces:manage">
                <IconButton
                  icon={<Trash2 size={14} />}
                  aria-label={`Delete ${ws.name}`}
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteWs(ws);
                    setDeleteError(null);
                  }}
                />
              </OrgGuard>
            </div>
          );
        })}
      </div>

      <WorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Create workspace"
      />

      {canManageWorkspaces ? (
        <FloatingActionButton
          label="New workspace"
          icon={<Plus size={24} />}
          onClick={() => setCreateOpen(true)}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteWs)}
        entityName={deleteWs?.name ?? "this workspace"}
        entityType="workspace"
        title="Delete workspace"
        body={
          <div className="space-y-2">
            <p>
              Deleting a workspace removes its settings, members, channels, and
              workspace data from this organization.
            </p>
            {deleteError ? (
              <p className="font-medium text-red-600">{deleteError}</p>
            ) : null}
          </div>
        }
        confirmLabel="Delete workspace"
        isDeleting={deleting}
        onCancel={closeDeleteWorkspace}
        onConfirm={handleDelete}
      />
    </div>
  );
};
