import { Workspace } from "../context/WorkspaceContext";
import toast from "react-hot-toast";
import { authApi } from "./authApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const CONTACT_CHANNEL_IDENTIFIER_CONFLICT = "CONTACT_CHANNEL_IDENTIFIER_CONFLICT";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractApiErrorBody(json: unknown) {
  if (!isRecord(json)) return null;
  return isRecord(json.error) ? json.error : json;
}

function extractApiErrorMessage(json: unknown, fallback: string) {
  const body = extractApiErrorBody(json);
  const rootMessage = isRecord(json) ? json.message : undefined;
  const rootError = isRecord(json) ? json.error : undefined;
  const message = body?.message ?? rootMessage ?? (typeof rootError === "string" ? rootError : undefined);
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message.trim() ? message : fallback;
}

export class ApiError<TData = unknown> extends Error {
  readonly status: number;
  readonly data: TData | null;
  readonly code?: string;

  constructor(message: string, status: number, data: TData | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = isRecord(data) && typeof data.code === "string" ? data.code : undefined;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function createApiError(response: Response, json: unknown, fallback: string) {
  const body = extractApiErrorBody(json);
  return new ApiError(extractApiErrorMessage(json, fallback), response.status, body);
}

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

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  switch (response.status) {
    case 400:
      throw createApiError(response, json, "Bad request");
    case 401:
      await authApi.logout();
      toast.error("Session expired");
      throw createApiError(response, json, "Session expired");
    case 403:
      toast.error("You do not have permission");
      throw createApiError(response, json, "You do not have permission");
    case 404:
      toast.error("Resource not found");
      throw createApiError(response, json, "Resource not found");
    case 409:
      {
        const error = createApiError(response, json, "Conflict");
        if (error.code !== CONTACT_CHANNEL_IDENTIFIER_CONFLICT) {
          toast.error(error.message);
        }
        throw error;
      }
    case 500:
      toast.error("Internal server error");
      throw createApiError(response, json, "Internal server error");
    case 503:
      toast.error("Service unavailable");
      throw createApiError(response, json, "Service unavailable");
  }

  if (isRecord(json) && json.success === false) {
    throw createApiError(response, json, "API error");
  }

  return isRecord(json) && "data" in json ? json.data : json;
}
