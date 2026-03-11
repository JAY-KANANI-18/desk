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

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  timezone: string;
  language: string;
  dateFormat: string;

}
interface WorkspaceCreate {
  name: string;
  organizationId: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[] | null;
  activeWorkspace: Workspace | null;
  workspaceUsers: User[] | null;
  createWorkspace: (ws: WorkspaceCreate) => void;
  deleteWorkspace: (ws: Workspace) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  setActiveWorkspaceFunc: (ws: Workspace) => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: string;
  activityStatus?: string;
}


// ─── Context ──────────────────────────────────────────────────────────────────
const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[] | null>(null);

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
  let { organizations, activeOrganization, refreshOrganizations, setActiveOrganizationFunc } =
    useOrganization();

  const fetchWorkspaces = () => {
    setWorkspaceLoading(true);
    workspaceApi.me().then((res) => {
      setWorkspaces(res);
      setWorkspaceLoading(false);
    });

  };
  useEffect(() => {
    if (!organizations) return;

    const loadUsers = async () => {
      try {
        const users = await workspaceApi.users();
        const activityStatus = await workspaceApi.getAvailability();
        console.log({users,activityStatus});
        
        // create lookup map for faster access
        const statusMap = new Map(
          activityStatus.map((s: any) => [s.userId, s.activityStatus])
        );

        const usersWithStatus = users.map((u: User) => ({
          ...u,
          activityStatus: statusMap.get(u.id) ,
        }));

        setWorkspaceUsers(usersWithStatus);
      } catch (err) {
        console.error("Failed to load workspace users", err);
      }
    };

    loadUsers();
  }, [activeOrganization, activeWorkspace]);

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
        workspaceUsers,
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
