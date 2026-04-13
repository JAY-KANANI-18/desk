import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { importApi, type ImportWizardState, type PreviewImportResponse } from "../../../lib/importApi";

const DEFAULT_STATE: ImportWizardState = {
  file: null,
  headers: [],
  sampleRows: [],
  mapping: {},
  matchBy: "phone",
  importMode: "upsert",
  tags: [],
  autoGenerateBatchTag: true,
};

const FIELD_ALIASES: Array<{ target: string; patterns: RegExp[] }> = [
  { target: "first_name", patterns: [/^first[\s_-]*name$/i, /^firstname$/i] },
  { target: "last_name", patterns: [/^last[\s_-]*name$/i, /^lastname$/i] },
  // { target: "full_name", patterns: [/^name$/i, /^full[\s_-]*name$/i] },
  { target: "email", patterns: [/^email/i, /^email[\s_-]*address$/i] },
  { target: "phone", patterns: [/^phone/i, /^mobile/i, /^phone[\s_-]*number$/i] },
  { target: "company", patterns: [/^company/i, /^organization/i] },
  { target: "status", patterns: [/^status$/i] },
  { target: "marketing_opt_out", patterns: [/marketing/i, /opt[\s_-]*out/i] },
];

type SavedTemplate = {
  name: string;
  mapping: Record<string, string>;
};

export function useImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, setState] = useState<ImportWizardState>(DEFAULT_STATE);
  const [preview, setPreview] = useState<PreviewImportResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [savedTemplate, setSavedTemplate] = useState<SavedTemplate | null>(null);

  const validation = useMemo(() => {
    const mappedTargets = Object.values(state.mapping).filter((v) => v && v !== "do_not_import");
    const duplicates = mappedTargets.filter((v, i) => mappedTargets.indexOf(v) !== i);
    const hasIdentifier = mappedTargets.includes(state.matchBy === "phone" ? "phone" : "email");

    return {
      hasIdentifier,
      duplicates: Array.from(new Set(duplicates)),
      canGoToReview: hasIdentifier && duplicates.length === 0,
    };
  }, [state.mapping, state.matchBy]);

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be 20 MB or smaller.");
      return false;
    }

    setUploading(true);
    try {
      const response = await importApi.uploadContactsFile(file);
      const suggested = suggestMapping(response.headers);

      setState((prev) => ({
        ...prev,
        file,
        fileId: response.fileId,
        fileName: response.fileName ?? file.name,
        headers: response.headers,
        sampleRows: response.sampleRows,
        mapping: savedTemplate
          ? mergeSuggestedMapping(suggested, savedTemplate.mapping)
          : suggested,
        rowCountEstimate: response.rowCountEstimate,
      }));
      setPreview(null);

      if ((response.rowCountEstimate ?? 0) > 200_000) {
        toast("Large import detected — processing may take longer.");
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const runPreview = async () => {
    if (!state.fileId) { toast.error("Upload a file first."); return null; }
    if (!validation.canGoToReview) { toast.error("Fix mapping errors before continuing."); return null; }

    setPreviewing(true);
    try {
      const result = await importApi.previewContactsImport({
        fileId: state.fileId,
        mapping: state.mapping,
        matchBy: state.matchBy,
        importMode: state.importMode,
        tags: state.tags,
      });
      setPreview(result);
      setStep(3);
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
      return null;
    } finally {
      setPreviewing(false);
    }
  };

  const startImport = async () => {
    if (!state.fileId) { toast.error("Upload a file first."); return null; }

    setStarting(true);
    try {
      const result = await importApi.startContactsImport({
        fileId: state.fileId,
        mapping: state.mapping,
        matchBy: state.matchBy,
        importMode: state.importMode,
        tags: state.tags,
        autoGenerateBatchTag: state.autoGenerateBatchTag,
      });
      setActiveJobId(result.jobId);
      toast.success("Import started in the background");
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start import");
      return null;
    } finally {
      setStarting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setState(DEFAULT_STATE);
    setPreview(null);
  };

  const saveTemplate = (name = "Default import mapping") => {
    setSavedTemplate({ name, mapping: state.mapping });
    toast.success("Mapping template saved");
  };

  const applySavedTemplate = () => {
    if (!savedTemplate || !Object.keys(savedTemplate.mapping).length) {
      toast.error("No saved template found");
      return;
    }
    setState((prev) => ({
      ...prev,
      mapping: mergeSuggestedMapping(prev.mapping, savedTemplate.mapping),
    }));
    toast.success("Saved mapping applied");
  };

  return {
    step,
    setStep,
    state,
    setState,
    preview,
    uploading,
    previewing,
    starting,
    activeJobId,
    clearActiveJob: () => setActiveJobId(null),
    validation,
    savedTemplateName: savedTemplate?.name ?? null,
    uploadFile,
    runPreview,
    startImport,
    resetWizard,
    saveTemplate,
    applySavedTemplate,
  };
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach((header) => {
    const normalized = normalizeHeader(header);
    const match = FIELD_ALIASES.find((item) =>
      item.patterns.some((p) => p.test(header) || p.test(normalized))
    );
    mapping[header] = match?.target ?? "do_not_import";
  });
  return mapping;
}

function mergeSuggestedMapping(
  base: Record<string, string>,
  saved: Record<string, string>
): Record<string, string> {
  const next = { ...base };
  Object.entries(saved).forEach(([header, field]) => {
    if (header in next) next[header] = field;
  });
  return next;
}