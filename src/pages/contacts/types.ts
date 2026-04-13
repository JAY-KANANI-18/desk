import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  RefObject,
  SetStateAction,
} from "react";
import type { NavigateFunction } from "react-router-dom";
import type { LifecycleStage } from "../workspace/types";

export interface Contact {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lifecycle?: string | { id?: string; name?: string; emoji?: string } | null;
  lifecycleStage?: string | null;
  lifecycleId?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    email?: string;
  };
  avatarUrl?: string;
  company?: string | null;
  status?: string | null;
  contactChannels?: Array<{
    channelType?: string;
    channelId?: string | number;
    identifier?: string;
  }>;
  channel?: string;
  tags?: string[];
}

export type SortField = "name" | "email" | "lifecycle" | "phone";
export type SortDir = "asc" | "desc";

export interface SortOption {
  label: string;
  field: SortField;
  dir: SortDir;
}

export interface ContactsToast {
  type: "success" | "error";
  msg: string;
}

export interface ContactFormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lifecycle: string;
  tags: string[];
}

export interface EditContactFormState
  extends Omit<Contact, "id"> {
  id: number;
}

export interface WorkspaceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: string;
  activityStatus?: string;
}

export interface ContactsPageContentProps {
  navigate: NavigateFunction;
  contacts: Contact[];
  totalContacts: number;
  loading: boolean;
  workspaceUsers: WorkspaceUser[] | null;
  stages: LifecycleStage[];
  toast: ContactsToast | null;
  setToast: Dispatch<SetStateAction<ContactsToast | null>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  showActionsMenu: boolean;
  setShowActionsMenu: Dispatch<SetStateAction<boolean>>;
  selectedLifecycle: string | null;
  setSelectedLifecycle: Dispatch<SetStateAction<string | null>>;
  sortOption: SortOption | null;
  setSortOption: Dispatch<SetStateAction<SortOption | null>>;
  someSelected: boolean;
  selectedIds: Set<number | string>;
  setSelectedIds: Dispatch<SetStateAction<Set<number | string>>>;
  handleDeleteSelected: () => Promise<void>;
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  handleColSort: (field: SortField) => void;
  paginatedContacts: Contact[];
  toggleSelectOne: (id: number | string) => void;
  openEditModal: (contact: Contact) => void;
  handleDeleteOne: (id: number | string) => Promise<void>;
  safePage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  showNewContact: boolean;
  setShowNewContact: Dispatch<SetStateAction<boolean>>;
  newContact: ContactFormState;
  setNewContact: Dispatch<SetStateAction<ContactFormState>>;
  handleCreateContact: () => Promise<void>;
  handleExport: () => Promise<void>;
  showImportModal: boolean;
  setShowImportModal: Dispatch<SetStateAction<boolean>>;
  handleDownloadSample: () => void;
  importParsed: Omit<Contact, "id">[] | null;
  importDragging: boolean;
  setImportDragging: Dispatch<SetStateAction<boolean>>;
  handleDrop: (event: DragEvent) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  importFileName: string | null;
  setImportParsed: Dispatch<SetStateAction<Omit<Contact, "id">[] | null>>;
  setImportFileName: Dispatch<SetStateAction<string | null>>;
  importFileError: string | null;
  handleConfirmImport: () => Promise<void>;
  editingContact: Contact | null;
  setEditingContact: Dispatch<SetStateAction<Contact | null>>;
  editForm: EditContactFormState;
  setEditForm: Dispatch<SetStateAction<EditContactFormState>>;
  handleUpdateContact: () => Promise<void>;
}
