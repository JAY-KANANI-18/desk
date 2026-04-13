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
    listUsers: (params?: { search?: string; page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.search?.trim()) searchParams.set("search", params.search.trim());
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        const query = searchParams.toString();
        return api.get(`/organizations/users${query ? `?${query}` : ""}`);
    },

    me: () => api.get("/user/organizations"),
    deleteUser: (userId: string) => api.delete(`/organizations/users/${userId}`),

};
