import { apiFetch } from "./apiClient";

export const api = {
    get: (url: string) => apiFetch(url),

    post: (url: string, body?: any) =>
        apiFetch(url, {
            method: "POST",
            body: JSON.stringify(body),
        }),

    put: (url: string, body?: any) =>
        apiFetch(url, {
            method: "PUT",
            body: JSON.stringify(body),
        }),
    patch: (url: string, body?: any) =>
        apiFetch(url, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    delete: (url: string) =>
        apiFetch(url, {
            method: "DELETE",
        }),
};