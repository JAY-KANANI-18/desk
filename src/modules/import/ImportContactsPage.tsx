import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PageLayout } from "../../components/ui/PageLayout";
import { useIsMobile } from "../../hooks/useIsMobile";
import { workspaceApi } from "../../lib/workspaceApi";
import { JobProgressModal } from "./components/JobProgressModal";
import { ImportConfigPanel } from "./components/ImportConfigPanel";
import { MappingStep } from "./components/MappingStep";
import { ReviewStep } from "./components/ReviewStep";
import { UploadStep } from "./components/UploadStep";
import { useImportWizard } from "./hooks/useImportWizard";
import { IconButton } from "../../components/ui/button/IconButton";
import { ChannelHeaderBackButton } from "../../components/channels/ChannelHeaderBackButton";

type TagOption = {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  description?: string | null;
};

export default function ImportContactsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const wizard = useImportWizard();
  const [search, setSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);

  useEffect(() => {
    workspaceApi
      .getTags()
      .then(setAvailableTags)
      .catch(() => setAvailableTags([]));
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

  const canGoToStep = (stepIndex: 1 | 2 | 3) => {
    if (stepIndex === 1) {
      return true;
    }

    if (stepIndex === 2) {
      return Boolean(wizard.state.fileId);
    }

    return Boolean(wizard.preview);
  };

  const renderHeaderActions = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<BriefcaseBusiness size={15} />}
        onClick={() => navigate("/contacts/import-jobs")}
      >
        View import jobs
      </Button>

      {wizard.savedTemplateName ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={wizard.applySavedTemplate}
        >
          Use saved template
        </Button>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<Save size={15} />}
        onClick={() => wizard.saveTemplate()}
      >
        Save mapping template
      </Button>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Contacts / Import"
      title="Import contacts"
      // subtitle="Upload once, map carefully, review the outcome, then start a background import job."
      leading={
        <ChannelHeaderBackButton
          ariaLabel="Back to contacts"
          onClick={() => navigate("/contacts")}
        />
      }
      actions={renderHeaderActions()}
      className="bg-white"
      contentClassName="min-h-0 flex-1 overflow-hidden bg-white px-0 py-0"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        {isMobile ? (
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <Button
              type="button"
              variant="link"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate("/contacts")}
            >
              Back
            </Button>

            <div className="mt-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Import contacts
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Upload once, map carefully, review the outcome, then start a
                background import job.
              </p>
            </div>

            <div className="mt-4">{renderHeaderActions()}</div>
          </div>
        ) : null}

        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap gap-2">
            {stepPills.map((step) => {
              const isActive = wizard.step === step.index;
              const isComplete = wizard.step > step.index;

              return (
                <Button
                  key={step.index}
                  type="button"
                  variant={
                    isActive ? "primary" : isComplete ? "success" : "secondary"
                  }
                  size="sm"
                  radius="full"
                  disabled={!canGoToStep(step.index)}
                  onClick={() => wizard.setStep(step.index)}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-white/20"
                          : isComplete
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step.index}
                    </span>
                    {step.label}
                  </span>
                </Button>
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
                onRemoveFile={wizard.resetWizard}
                configPanel={
                  <ImportConfigPanel
                    matchBy={wizard.state.matchBy}
                    importMode={wizard.state.importMode}
                    tags={wizard.state.tags}
                    autoGenerateBatchTag={wizard.state.autoGenerateBatchTag}
                    availableTags={availableTags}
                    onChange={(patch) =>
                      wizard.setState((prev) => ({ ...prev, ...patch }))
                    }
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (wizard.step === 1) {
                    navigate("/contacts");
                    return;
                  }

                  wizard.setStep((wizard.step - 1) as 1 | 2 | 3);
                }}
              >
                Back
              </Button>

              {wizard.step === 1 ? (
                <Button
                  type="button"
                  disabled={!wizard.state.fileId || wizard.uploading}
                  onClick={() => wizard.setStep(2)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Next
                </Button>
              ) : null}

              {wizard.step === 2 ? (
                <Button
                  type="button"
                  disabled={
                    !wizard.validation.canGoToReview || wizard.previewing
                  }
                  onClick={wizard.runPreview}
                  loading={wizard.previewing}
                  loadingMode="inline"
                  loadingLabel="Preparing preview"
                >
                  Next
                </Button>
              ) : null}

              {wizard.step === 3 ? (
                <Button
                  type="button"
                  disabled={wizard.starting}
                  onClick={wizard.startImport}
                  loading={wizard.starting}
                  loadingMode="inline"
                  loadingLabel="Starting import"
                >
                  Import
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <JobProgressModal
          jobId={wizard.activeJobId}
          onClose={wizard.clearActiveJob}
        />
      </div>
    </PageLayout>
  );
}
