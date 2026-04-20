import { Workspace } from "../context/WorkspaceContext";
import toast from "react-hot-toast";
import { authApi } from "./authApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  workspace?: Workspace | null
) {
  const token = await authApi.getAccessToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const activeWorkspace = workspace ?? null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeWorkspace ? { "X-Workspace-Id": activeWorkspace.id } : {}),
    ...(activeWorkspace?.organizationId
      ? { "x-organization-id": activeWorkspace.organizationId }
      : {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const doFetch = async () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

  let response = await doFetch();

  if (response.status === 401) {
    try {
      await authApi.refreshSession();
      const nextToken = await authApi.getAccessToken();
      if (nextToken) {
        headers.Authorization = `Bearer ${nextToken}`;
      }
      response = await doFetch();
    } catch {
      await authApi.logout();
      toast.error("Session expired");
      throw new Error("Session expired");
    }
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  switch (response.status) {
    case 400:
      throw new Error(json?.error?.message || "Bad request");
    case 401:
      await authApi.logout();
      toast.error("Session expired");
      throw new Error("Session expired");
    case 403:
      toast.error("You do not have permission");
      throw new Error("You do not have permission");
    case 404:
      toast.error("Resource not found");
      throw new Error("Resource not found");
    case 409:
      toast.error(json?.error?.message || "Conflict");
      throw new Error(json?.error?.message || "Conflict");
    case 500:
      toast.error("Internal server error");
      throw new Error("Internal server error");
    case 503:
      toast.error("Service unavailable");
      throw new Error("Service unavailable");
  }

  if (json && json.success === false) {
    throw new Error(json.error?.message || "API error");
  }

  return json?.data ?? json;
}

