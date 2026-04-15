import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { workspaceApi } from "../lib/workspaceApi";
import { useOrganization } from "./OrganizationContext";
import { useSocket } from "../socket/socket-provider";
import { inboxApi } from "../lib/inboxApi";
import { initApi } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";

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
  workspaceLoading:boolean;
    inviteUser: (
    email: string,
    role: string,
    workspaceAccess: any
  ) => Promise<any>;
  updateUser: (
    userId: string,
    role: string,
    workspaceAccess: any
  ) => Promise<any>;
  uploadFile: (file: File, entityId: string) => Promise<string>;
  createWorkspace: (ws: WorkspaceCreate) => void;
  deleteWorkspace: (ws: Workspace) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  setActiveWorkspaceFunc: (ws: Workspace) => void;
  refreshWorkspaceUsers:() => void
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
  const workspaceRef = useRef<Workspace | null>(null);
  initApi(workspaceRef); // wire once, api always reads latest ref
  const {user} = useAuth()
  const location = useLocation();


  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const {socket} = useSocket();

  useEffect(() => {
    console.log("socket emit",socket,activeWorkspace);
  if (!socket || !activeWorkspace) return;
    
  socket.emit("workspace:join", {
      workspaceId: activeWorkspace.id,
    });
    

}, [socket, activeWorkspace?.id]);
  useEffect(() => {
    console.log("socket emit",socket,user);
  if (!socket || !user) return;
    
  socket.emit("user:join", {
        userId: user.id,
      });


}, [socket, user?.id]);
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
    if (!activeOrganization && !activeWorkspace) return;

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


    const refreshWorkspaceUsers = useCallback(async () => {
      const users = await workspaceApi.users();
      const activityStatus = await workspaceApi.getAvailability();

     const statusMap = new Map(
          activityStatus.map((s: any) => [s.userId, s.activityStatus])
        );

        const usersWithStatus = users.map((u: User) => ({
          ...u,
          activityStatus: statusMap.get(u.id) ,
        }));

        setWorkspaceUsers(usersWithStatus);
      
    }, [activeOrganization,activeWorkspace]);
  

  useEffect(() => {
    const flattenedWorkspaces = organizations?.map((org) => org.workspaces).flat() ?? [];
    setWorkspaces(flattenedWorkspaces);

    if (flattenedWorkspaces.length === 0) {
      return;
    }

    const requestedWorkspaceId =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(location.search).get("workspaceId");
    const requestedWorkspace = requestedWorkspaceId
      ? flattenedWorkspaces.find((workspace) => workspace.id === requestedWorkspaceId)
      : null;

    if (requestedWorkspace && requestedWorkspace.id !== activeWorkspace?.id) {
      setActiveWorkspaceFunc(requestedWorkspace);
      setWorkspaceLoading(false);
      return;
    }

    if (!activeWorkspace) {
      setActiveWorkspaceFunc(flattenedWorkspaces[0]);
      setWorkspaceLoading(false);
    }
  }, [activeWorkspace, location.search, organizations, user]);

  const setActiveWorkspaceFunc =  (ws: Workspace) => {
    workspaceRef.current = ws;           // sync, immediate
    localStorage.setItem("active_workspace", JSON.stringify(ws));
    setActiveWorkspace(ws);
    setActiveOrganizationFunc(
      organizations?.find((org) => org.id === ws.organizationId)
    );
  };
  const inviteUser = useCallback(
    async (email: string, role: string, workspaceAccess: any) => {
      const result = await workspaceApi.inviteUser(
        email,
        role,
        workspaceAccess,
      );

      return result;
    },
    []
  );
  const updateUser = useCallback(
    async (id: string, role: string, workspaceAccess: any) => {
      const result = await workspaceApi.updateUser(
        id,
        role,
        workspaceAccess,
      );

      return result;
    },
    []
  );

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

    const uploadFile = useCallback(
      async (file: File, entityId: string): Promise<string> => {
        if (!activeWorkspace) throw new Error("No workspace");
        const { uploadUrl, fileUrl } = await inboxApi.getPresignedUploadUrl( {
          type: "user-avatar",
          fileName: file.name,
          contentType: file.type,
          entityId,
        });
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        return fileUrl;
      },
      [activeWorkspace]
    );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        setActiveWorkspaceFunc,
        refreshWorkspaceUsers,
        inviteUser,
        updateUser,
        activeWorkspace,
        workspaceUsers,
        workspaceLoading,
        uploadFile,
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
