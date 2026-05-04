import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Plus } from "@/components/ui/icons";
import { useOrganization } from "../../context/OrganizationContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { MobileSheet } from "../ui/modal";
import type { WorkspaceGroup, WorkspaceOption } from "./types";

const classDrivenButtonStyle = {
  padding: undefined,
  borderRadius: undefined,
  borderWidth: undefined,
  color: undefined,
  boxShadow: undefined,
  fontSize: undefined,
} satisfies CSSProperties;

export function WorkspaceSwitcher({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const organizationContext = useOrganization();
  const workspaceContext = useWorkspace();

  const organizations = (organizationContext.organizations ?? []) as WorkspaceGroup[];
  const activeWorkspace = (workspaceContext.activeWorkspace ?? null) as WorkspaceOption | null;

  const selectWorkspace = (workspace: WorkspaceOption) => {
    workspaceContext.setActiveWorkspaceFunc(workspace as any);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="unstyled"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 max-w-[160px] items-center gap-2 rounded-2xl px-2.5 transition-colors sm:max-w-none ${
          open ? "bg-[var(--appearance-subtle)]" : "hover:bg-[var(--appearance-subtle)]"
        }`}
        style={classDrivenButtonStyle}
        preserveChildLayout
      >
        <Avatar
          name={
            activeWorkspace?.initial ||
            activeWorkspace?.name?.slice(0, 1) ||
            "Workspace"
          }
          size="xs"
          shape="square"
          fallbackTone="primary"
          alt={activeWorkspace?.name ?? "Workspace"}
        />

        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-[var(--appearance-text)] sm:block">
          {activeWorkspace?.name}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-[var(--appearance-faint)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isMobile && (
        <MobileSheet
          isOpen={open}
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--appearance-faint)]">
                Workspace
              </p>
              <h2 className="mt-1 text-base font-semibold text-[var(--appearance-text)]">
                Switch workspace
              </h2>
            </div>
          }
          onClose={() => setOpen(false)}
          footer={
            <Button
              type="button"
              variant="unstyled"
              onClick={() => {
                navigate("/organization/workspaces");
                setOpen(false);
              }}
              className="flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              style={classDrivenButtonStyle}
              fullWidth
              preserveChildLayout
            >
              Add workspace
            </Button>
          }
        >
          <div className="p-3">
            {organizations.map((org) => (
              <div key={org.id} className="mb-4 last:mb-0">
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--appearance-faint)]">
                  {org.name}
                </div>
                <div className="space-y-2">
                  {org.workspaces?.map((workspace) => (
                    <Button
                      key={workspace.id}
                      type="button"
                      variant="unstyled"
                      onClick={() => selectWorkspace(workspace)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                        activeWorkspace?.id === workspace.id
                          ? "border-[var(--color-primary-light)] bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                          : "border-[var(--appearance-border)] bg-[var(--appearance-surface-raised)] text-[var(--appearance-text)] hover:border-[var(--color-primary-light)] hover:bg-[var(--appearance-subtle)]"
                      }`}
                      style={classDrivenButtonStyle}
                      fullWidth
                      preserveChildLayout
                    >
                      <span className="flex w-full items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {workspace.name}
                          </div>
                          <div className="mt-1 text-xs text-[var(--appearance-muted)]">
                            {activeWorkspace?.id === workspace.id
                              ? "Current workspace"
                              : "Tap to switch"}
                          </div>
                        </div>
                        {activeWorkspace?.id === workspace.id && (
                          <Check size={16} className="flex-shrink-0" />
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MobileSheet>
      )}

      {open && !isMobile && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--appearance-border)] bg-[var(--appearance-surface)] shadow-[var(--appearance-shadow)]">
            <div className="border-b border-[var(--appearance-border)] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--appearance-faint)]">
                Workspaces
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {organizations.map((org) => (
                <div key={org.id} className="mb-3">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--appearance-faint)]">
                    {org.name}
                  </div>

                  {org.workspaces?.map((workspace) => (
                    <Button
                      key={workspace.id}
                      type="button"
                      variant="unstyled"
                      onClick={() => selectWorkspace(workspace)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--appearance-subtle)]"
                      style={classDrivenButtonStyle}
                      fullWidth
                      preserveChildLayout
                    >
                      <span className="flex w-full items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--appearance-text)]">
                            {workspace.name}
                          </div>
                        </div>

                        {activeWorkspace?.id === workspace.id && (
                          <Check size={14} className="text-[var(--color-primary)]" />
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--appearance-border)] p-1.5">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => {
                  navigate("/organization/workspaces");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--appearance-subtle)]"
                style={classDrivenButtonStyle}
                fullWidth
                contentAlign="start"
                preserveChildLayout
              >
                <span className="flex w-full items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[var(--appearance-border)]">
                    <Plus size={14} className="text-[var(--appearance-faint)]" />
                  </div>
                  <span className="text-sm font-medium text-[var(--appearance-muted)]">
                    Add workspace
                  </span>
                </span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
