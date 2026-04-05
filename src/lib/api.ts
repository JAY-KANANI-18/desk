import { Workspace } from "../context/WorkspaceContext";
import { apiFetch } from "./apiClient";

// lib/api.ts
let _workspaceRef: React.MutableRefObject<Workspace | null> | null = null;

export function initApi(workspaceRef: React.MutableRefObject<Workspace | null>) {
  _workspaceRef = workspaceRef;
}

export const api = {
  get: (path: string, options?: RequestInit) =>
    apiFetch(path, { method: "GET", ...options }, _workspaceRef?.current),

  post: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body), ...options }, _workspaceRef?.current),

  put: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body), ...options }, _workspaceRef?.current),

  delete: (path: string, options?: RequestInit) =>
    apiFetch(path, { method: "DELETE", ...options }, _workspaceRef?.current),
};