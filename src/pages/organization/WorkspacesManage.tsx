import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useMobileHeaderActions } from "../../components/mobileHeaderActions";
import { OrgGuard, useAuthorization } from "../../context/AuthorizationContext";
import { MobileSheet } from "../../components/ui/modal";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useOrganization } from "../../context/OrganizationContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/button/Button";
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
    setName(initialName || "");
  }, [initialName, open]);

  const trimmedName = name.trim();

  if (!open) return null;

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

interface DeleteWorkspaceModalProps {
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
}: DeleteWorkspaceModalProps) => {
  const isMobile = useIsMobile();

  if (!open) return null;

  const content = (
    <p className="text-sm text-gray-600">
      Are you sure you want to delete{" "}
      <span className="font-medium">{workspaceName}</span>? This action cannot
      be undone.
    </p>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        title={
          <h3 className="text-base font-semibold text-slate-900">
            Delete workspace
          </h3>
        }
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
              onClick={onConfirm}
              variant="danger"
              fullWidth
            >
              Delete
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
      title="Delete workspace"
      size="sm"
      width={420}
      secondaryAction={
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
      }
      primaryAction={
        <Button onClick={onConfirm} variant="danger" >
          Delete
        </Button>
      }
    >
      {content}
    </CenterModal>
  );
};

export const WorkspacesManage = () => {
  const { workspaces, createWorkspace, deleteWorkspace } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { canOrg } = useAuthorization();
  const isMobile = useIsMobile();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteWs, setDeleteWs] = useState<any>(null);
  const canManageWorkspaces = canOrg("org:workspaces:manage");

  const handleCreate = (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    createWorkspace({ name: trimmedName, organizationId: activeOrganization?.id });
    setCreateOpen(false);
  };

  const handleDelete = () => {
    if (!deleteWs) {
      return;
    }

    deleteWorkspace(deleteWs);
    setDeleteWs(null);
  };

  useMobileHeaderActions(
    isMobile && canManageWorkspaces
      ? {
          actions: [
            {
              id: "organization-workspaces-create",
              label: "New workspace",
              icon: <Plus size={18} />,
              onClick: () => setCreateOpen(true),
            },
          ],
        }
      : {},
    [canManageWorkspaces, isMobile],
  );

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
        {workspaces?.map((ws) => (
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
                  {ws?.members?.length} members
                </p>
              </div>
            </div>

            <OrgGuard permission="org:workspaces:manage">
              <IconButton
                icon={<Trash2 size={14} />}
                aria-label={`Delete ${ws.name}`}
                variant="danger-ghost"
                size="sm"
                onClick={() => setDeleteWs(ws)}
              />
            </OrgGuard>
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
