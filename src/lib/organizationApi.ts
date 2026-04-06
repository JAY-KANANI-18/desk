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
    updateUser: ( email: string, role: string, workspaceAccess: any) =>
        api.put("/organizations/users", {
            email,
            role,
            workspaceAccess
        }),

    updateOrganization : (id:string,payload:any) =>
        api.put(`/organizations/${id}`, payload),

    getusers : (organizationId: string) =>
        api.get(`/organizations/users`),

    me: () => api.get("/user/organizations"),
    deleteUser: (userId: string) => api.delete(`/organizations/users/${userId}`),

};