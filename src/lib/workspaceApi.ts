import { api } from "../lib/api";

interface Workspace {
    name: string;
    organizationId: string;

}

export const workspaceApi = {
    me: () => api.get("/workspaces/me"),
    create: (workspace: Workspace) => api.post("/workspaces", workspace),
    update: (id: string, workspace: Workspace) => api.put(`/workspaces/${id}`, workspace),
    delete: (id: string) => api.delete(`/workspaces/${id}`),
};