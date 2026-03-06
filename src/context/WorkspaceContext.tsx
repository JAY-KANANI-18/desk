import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { workspaceApi } from "../lib/workspaceApi";
import { useOrganization } from "./OrganizationContext";
import { useSocket } from "../socket/socket-provider";

interface Workspace {
  id: string;
  name: string;
  organizationId: string;
}
interface WorkspaceCreate {
  name: string;
  organizationId: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[] | null;
  activeWorkspace: Workspace | null;
  createWorkspace: (ws: WorkspaceCreate) => void;
  deleteWorkspace: (ws: Workspace) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  setActiveWorkspaceFunc: (ws: Workspace) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );

  const [workspaceLoading, setWorkspaceLoading] = useState(false);
const socket = useSocket();

useEffect(() => {
  if (!socket || !activeWorkspace) return;

  socket.emit("workspace:join", {
    workspaceId: activeWorkspace.id,
  });

}, [socket, activeWorkspace]);
  let { organizations, activeOrganization,refreshOrganizations, setActiveOrganizationFunc } =
    useOrganization();

  const fetchWorkspaces = () => {
    setWorkspaceLoading(true);
    workspaceApi.me().then((res) => {
      setWorkspaces(res);
      setWorkspaceLoading(false);
    });

  };

  useEffect(() => {
    if (!activeWorkspace && organizations?.length) {
      setActiveWorkspaceFunc(organizations[0].workspaces[0]);
    }
    setWorkspaces(organizations?.map((org) => org.workspaces).flat());
  }, [organizations]);

  const setActiveWorkspaceFunc = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setActiveOrganizationFunc(
      organizations?.find((org) => org.id === ws.organizationId)
    );
    localStorage.setItem("active_workspace", JSON.stringify(ws));
  };

  const createWorkspace = (ws: WorkspaceCreate) => {
    workspaceApi.create(ws).then(async () => {
     await fetchWorkspaces();
     await refreshOrganizations();
    });
  };

  const deleteWorkspace = (ws: Workspace) => {
    workspaceApi.delete(ws.id).then(() => {
      fetchWorkspaces();
    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        setActiveWorkspaceFunc,
        activeWorkspace,
        setWorkspaces,
        createWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};
