import type { User } from "../../context/AuthContext";

export interface ActivityStatusOption {
  key: string;
  label: string;
  color: string;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  organizationId?: string;
  initial?: string;
}

export interface WorkspaceGroup {
  id: string;
  name: string;
  workspaces?: WorkspaceOption[];
}

export type TopBarUser = User | null;
