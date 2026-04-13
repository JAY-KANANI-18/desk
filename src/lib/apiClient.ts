import { Workspace } from "../context/WorkspaceContext";
import { supabase } from "./supabase";
import toast from "react-hot-toast";


const API_BASE =  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function getAccessToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // localStorage.setItem("access_token", JSON.stringify(session?.access_token) ?? "");

    return session?.access_token ?? null;
}

export async function apiFetch(
    path: string,
    options: RequestInit = {},
    workspace?: Workspace | null  // add this

) {
     const token = await getAccessToken();
  if (!token) throw new Error("Session expired");

  // remove the localStorage read, use param instead
  const activeWorkspace = workspace ?? null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

    let json: any = null;

    try {
        json = await response.json();
    } catch {
        json = null;
    }

    /**
     * HTTP STATUS HANDLING
     */

    switch (response.status) {
        case 400:
            throw new Error(json?.error?.message || "Bad request");
            toast.error("Session expired");


        case 401:
            console.warn("Unauthorized");

            // logout user
            await supabase.auth.signOut();
            localStorage.removeItem("access_token");

            toast.error("Session expired");

            // window.location.href = "/login";

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

        // case 422:
        //     throw new Error(json?.error?.message || "Validation failed");

        // case 429:
        //     throw new Error("Too many requests");

        case 500:
            toast.error("Internal server error");

            throw new Error("Internal server error");

        case 503:
            toast.error("Service unavailable");

            throw new Error("Service unavailable");
    }

    /**
     * Enterprise API format
     */
    if (json && json.success === false) {

        throw new Error(json.error?.message || "API error");
    }

    return json?.data ?? json;
}
