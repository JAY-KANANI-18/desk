import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { workspaceApi } from "../../lib/workspaceApi";
import { JobProgressModal } from "./components/JobProgressModal";
import { ImportConfigPanel } from "./components/ImportConfigPanel";
import { MappingStep } from "./components/MappingStep";
import { ReviewStep } from "./components/ReviewStep";
import { UploadStep } from "./components/UploadStep";
import { useImportWizard } from "./hooks/useImportWizard";

type TagOption = {
  id: string;
  name: string;
  emoji?: string | null;
};

export default function ImportContactsPage() {
  const navigate = useNavigate();
  const wizard = useImportWizard();
  const [search, setSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  useEffect(() => {
    workspaceApi.getTags().then(setAvailableTags).catch(() => setAvailableTags([]));
  }, []);

  const selectedTagNames = useMemo(
    () =>
      availableTags
        .filter((tag) => wizard.state.tags.includes(tag.id))
        .map((tag) => `${tag.emoji ? `${tag.emoji} ` : ""}${tag.name}`),
    [availableTags, wizard.state.tags],
  );

  const stepPills = [
    { index: 1, label: "Upload CSV file" },
    { index: 2, label: "Mapping" },
    { index: 3, label: "Review" },
  ] as const;

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-7xl flex-col overflow-hidden px-6 py-6">
      <button
        type="button"
        onClick={() => navigate("/contacts")}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
<h1 className="text-2xl font-semibold text-gray-900">Import Contacts</h1>
          <p className="mt-2 text-sm text-gray-500">
            Upload once, map carefully, review the outcome, then start a background import job.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/contacts/import-jobs")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BriefcaseBusiness size={15} />
            View import jobs
          </button>
          {wizard.savedTemplateName ? (
            <button
              type="button"
              onClick={wizard.applySavedTemplate}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Use saved template
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => wizard.saveTemplate()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Save size={15} />
            Save mapping template
          </button>
        </div>
      </div>

<div className="mt-4 flex flex-wrap gap-2">
        {stepPills.map((step) => {
          const isActive = wizard.step === step.index;
          const isComplete = wizard.step > step.index;
          return (
            <button
              key={step.index}
              type="button"
              onClick={() => {
                if (step.index === 1 || (step.index === 2 && wizard.state.fileId) || (step.index === 3 && wizard.preview)) {
                  wizard.setStep(step.index);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : isComplete
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                isActive ? "bg-white/20" : isComplete ? "bg-green-500 text-white" : "bg-gray-400 text-white"
              }`}>
                {step.index}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>

<div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {wizard.step === 1 ? (
          <UploadStep
            fileName={wizard.state.fileName}
            fileSize={wizard.state.file?.size}
            rowCountEstimate={wizard.state.rowCountEstimate}
            uploading={wizard.uploading}
            onSelectFile={wizard.uploadFile}
            configPanel={
              <ImportConfigPanel
                matchBy={wizard.state.matchBy}
                importMode={wizard.state.importMode}
                tags={wizard.state.tags}
                autoGenerateBatchTag={wizard.state.autoGenerateBatchTag}
                availableTags={availableTags}
                onChange={(patch) => wizard.setState((prev) => ({ ...prev, ...patch }))}
              />
            }
          />
        ) : null}

        {wizard.step === 2 ? (
          <MappingStep
            headers={wizard.state.headers}
            sampleRows={wizard.state.sampleRows}
            mapping={wizard.state.mapping}
            search={search}
            validation={wizard.validation}
            onSearchChange={setSearch}
            onMappingChange={(header, value) => {
              wizard.setState((prev) => ({
                ...prev,
                mapping: {
                  ...prev.mapping,
                  [header]: value,
                },
              }));
            }}
          />
        ) : null}

        {wizard.step === 3 ? (
          <ReviewStep
            fileName={wizard.state.fileName}
            importMode={wizard.state.importMode}
            matchBy={wizard.state.matchBy}
            selectedTagNames={selectedTagNames}
            preview={wizard.preview}
            onReupload={wizard.resetWizard}
          />
        ) : null}
      </div>

<div className="mt-3 rounded-2xl border border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (wizard.step === 1) {
                navigate("/contacts");
                return;
              }
              wizard.setStep((wizard.step - 1) as 1 | 2 | 3);
            }}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          {wizard.step === 1 ? (
            <button
              type="button"
              disabled={!wizard.state.fileId || wizard.uploading}
              onClick={() => wizard.setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : null}

          {wizard.step === 2 ? (
            <button
              type="button"
              disabled={!wizard.validation.canGoToReview || wizard.previewing}
              onClick={wizard.runPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {wizard.previewing ? <Loader2 size={16} className="animate-spin" /> : null}
              Next
            </button>
          ) : null}

          {wizard.step === 3 ? (
            <button
              type="button"
              disabled={wizard.starting}
              onClick={wizard.startImport}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {wizard.starting ? <Loader2 size={16} className="animate-spin" /> : null}
              Import
            </button>
          ) : null}
        </div>
      </div>

      <JobProgressModal jobId={wizard.activeJobId} onClose={wizard.clearActiveJob} />
    </div>
  );
}
