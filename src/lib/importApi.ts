import { api } from "./api";

export type ImportWizardState = {
  file: File | null;
  fileId?: string;
  fileName?: string;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  mapping: Record<string, string>;
  matchBy: "phone" | "email";
  importMode: "create" | "update" | "upsert" | "overwrite";
  tags: string[];
  autoGenerateBatchTag: boolean;
  rowCountEstimate?: number;
};

export type UploadImportResponse = {
  fileId: string;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  rowCountEstimate?: number;
  fileName?: string;
  size?: number;
};

export type PreviewImportResponse = {
  total: number;
  new: number;
  update: number;
  errors: number;
  errorFileUrl?: string | null;
};

export type ImportJobRecord = {
  id: string;
  type: string;
  entity: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileUrl?: string | null;
  resultUrl?: string | null;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export const importApi = {
  uploadContactsFile: async (file: File): Promise<UploadImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm("/import/upload", formData);
  },

  previewContactsImport: async (payload: {
    fileId: string;
    mapping: Record<string, string>;
    matchBy: "phone" | "email";
    importMode: "create" | "update" | "upsert" | "overwrite";
    tags?: string[];
  }): Promise<PreviewImportResponse> => {
    return api.post("/import/preview", payload);
  },

  startContactsImport: async (payload: {
    fileId: string;
    mapping: Record<string, string>;
    matchBy: "phone" | "email";
    importMode: "create" | "update" | "upsert" | "overwrite";
    tags?: string[];
    autoGenerateBatchTag?: boolean;
  }): Promise<{ jobId: string; batchTagId?: string | null; batchTagName?: string | null }> => {
    return api.post("/import/start", payload);
  },

  listImportJobs: async (): Promise<ImportJobRecord[]> => {
    return api.get("/jobs?entity=contact&type=CONTACT_IMPORT");
  },

  getJob: async (jobId: string): Promise<ImportJobRecord> => {
    return api.get(`/jobs/${jobId}`);
  },

  getDownload: async (jobId: string): Promise<{ downloadUrl: string }> => {
    return api.get(`/jobs/${jobId}/download`);
  },
};
