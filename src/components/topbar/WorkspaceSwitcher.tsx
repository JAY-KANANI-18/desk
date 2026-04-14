import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useOrganization } from "../../context/OrganizationContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { MobileSheet } from "./MobileSheet";
import type { WorkspaceGroup, WorkspaceOption } from "./types";

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
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 max-w-[160px] items-center gap-2 rounded-2xl px-2.5 transition-colors sm:max-w-none ${
          open ? "bg-slate-100" : "hover:bg-slate-100"
        }`}
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-600">
          {activeWorkspace?.initial || activeWorkspace?.name?.slice(0, 1)}
        </div>

        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-gray-800 sm:block">
          {activeWorkspace?.name}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {isMobile && (
        <MobileSheet
          open={open}
          title={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Switch workspace
              </h2>
            </div>
          }
          onClose={() => setOpen(false)}
          footer={
            <button
              type="button"
              onClick={() => {
                navigate("/organization/workspaces");
                setOpen(false);
              }}
              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Add workspace
            </button>
          }
        >
          <div className="p-3">
            {organizations.map((org) => (
              <div key={org.id} className="mb-4 last:mb-0">
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {org.name}
                </div>
                <div className="space-y-2">
                  {org.workspaces?.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => selectWorkspace(workspace)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                        activeWorkspace?.id === workspace.id
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {workspace.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {activeWorkspace?.id === workspace.id
                            ? "Current workspace"
                            : "Tap to switch"}
                        </div>
                      </div>
                      {activeWorkspace?.id === workspace.id && (
                        <Check size={16} className="flex-shrink-0" />
                      )}
                    </button>
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
          <div className="absolute left-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Workspaces
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {organizations.map((org) => (
                <div key={org.id} className="mb-3">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {org.name}
                  </div>

                  {org.workspaces?.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => selectWorkspace(workspace)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {workspace.name}
                        </div>
                      </div>

                      {activeWorkspace?.id === workspace.id && (
                        <Check size={14} className="text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div
              className="border-t border-gray-100 p-1.5"
              onClick={() => {
                navigate("/organization/workspaces");
                setOpen(false);
              }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                  <Plus size={14} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Add workspace
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
