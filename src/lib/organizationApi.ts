import { api } from "./api";

export const organizationApi = {
    setup: (organizationName: string, workspaceName: string) =>
        api.post("/organizations/setup", {
            organizationName,
            workspaceName,
        }),
    inviteUser: ( email: string, role: string, workspaceAccess: any) =>
        api.post("/organizations/invite", {
            email,
            role,
            workspaceAccess
        }),

    getusers : (organizationId: string) =>
        api.get(`/organizations/users`),

    me: () => api.get("/organizations/me"),
    deleteUser: (userId: string) => api.delete(`/organizations/users/${userId}`),

};