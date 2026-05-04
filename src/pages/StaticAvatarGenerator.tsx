import { useMemo, useState, type MouseEvent } from "react";
import Avatar from "boring-avatars";
import { CheckCircle2, RefreshCw, UploadCloud } from "@/components/ui/icons";
import toast from "react-hot-toast";

import { Button } from "../components/ui/Button";
import { CopyInput } from "../components/ui/inputs";
import { PageLayout } from "../components/ui/layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { uploadPresignedFile } from "../lib/inboxApi";

const SVG_MIME_TYPE = "image/svg+xml";
const AVATAR_COUNT = 24;

const AVATAR_VARIANTS = [
  "beam",
  // "marble",
  // "pixel",
  // "sunset",
  // "ring",
  // "bauhaus",
  // "geometric",
  // "abstract",
] as const;

type AvatarVariant = (typeof AVATAR_VARIANTS)[number];

const DEFAULT_AVATAR_COLORS = ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"];

interface AvatarOption {
  id: string;
  name: string;
  variant: AvatarVariant;
  colors: string[];
}

const AVATAR_PALETTES: string[][] = [
  DEFAULT_AVATAR_COLORS,
  ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
  ["#0F172A", "#38BDF8", "#A7F3D0", "#FDE68A", "#FCA5A5"],
  ["#102A43", "#486581", "#9FB3C8", "#D9E2EC", "#F0B429"],
  ["#1B4332", "#40916C", "#95D5B2", "#D8F3DC", "#FFB703"],
  ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"],
  ["#1D3557", "#457B9D", "#A8DADC", "#F1FAEE", "#E63946"],
  ["#3A0CA3", "#4361EE", "#4CC9F0", "#F72585", "#B5179E"],
];

function createRandomToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function createAvatarOptions(batchKey: string, seedBase: string): AvatarOption[] {
  return Array.from({ length: AVATAR_COUNT }, (_, index) => {
    const token = createRandomToken();
    const variant =
      AVATAR_VARIANTS[pickRandomIndex(AVATAR_VARIANTS.length)] ?? "beam";
    const colors =
      AVATAR_PALETTES[pickRandomIndex(AVATAR_PALETTES.length)] ??
      DEFAULT_AVATAR_COLORS;

    return {
      id: `${batchKey}-${index}`,
      name: `${seedBase}-${index}-${token}`,
      variant,
      colors,
    };
  });
}

function toFileSafeName(value: string) {
  const safeName = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return safeName || "avatar";
}

function serializeSvgFromButton(button: HTMLButtonElement) {
  const svg = button.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error("Avatar SVG was not found");
  }

  const clone = svg.cloneNode(true);
  if (!(clone instanceof SVGSVGElement)) {
    throw new Error("Avatar SVG could not be prepared");
  }

  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  return new XMLSerializer().serializeToString(clone);
}

export function StaticAvatarGenerator() {
  const { activeWorkspace } = useWorkspace();
  const [batchKey, setBatchKey] = useState(() => createRandomToken());
  const [selected, setSelected] = useState<AvatarOption | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const seedBase = activeWorkspace?.name ?? "AxoDesk";
  const avatars = useMemo(
    () => createAvatarOptions(batchKey, seedBase),
    [batchKey, seedBase],
  );

  const handleRegenerate = () => {
    setBatchKey(createRandomToken());
    setSelected(null);
    setUploadedUrl("");
    setError("");
  };

  const handleAvatarClick = async (
    option: AvatarOption,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (!activeWorkspace) {
      setError("Select a workspace before uploading.");
      return;
    }

    setSelected(option);
    setUploadedUrl("");
    setError("");
    setUploadingId(option.id);

    try {
      const source = serializeSvgFromButton(event.currentTarget);
      const blob = new Blob([source], { type: SVG_MIME_TYPE });
      const fileName = `${toFileSafeName(option.name)}-${option.variant}.svg`;
      const fileUrl = await uploadPresignedFile(
        {
          type: "static-avatar",
          fileName,
          contentType: SVG_MIME_TYPE,
          entityId: activeWorkspace.id,
        },
        blob,
      );

      setUploadedUrl(fileUrl);
      toast.success("Static avatar uploaded");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Failed to upload avatar";
      setError(message);
      toast.error(message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <PageLayout
      eyebrow="Temporary"
      title="Static Avatar Picker"
      subtitle="Pick a generated SVG and upload it to the static-avatar R2 folder."
      actions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={handleRegenerate}
          disabled={Boolean(uploadingId)}
        >
          New batch
        </Button>
      }
      contentClassName="min-h-0 flex-1 overflow-y-auto p-0 md:p-[var(--spacing-lg)]"
    >
      <div className="flex min-h-full flex-col bg-[var(--color-gray-50)] md:block md:bg-transparent">
        <div className="border-b border-[var(--color-gray-200)] bg-white px-[var(--spacing-md)] py-[var(--spacing-md)] md:hidden">
          <div className="flex items-start justify-between gap-[var(--spacing-md)]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
                Temporary
              </p>
              <h1 className="mt-[var(--spacing-xs)] text-xl font-semibold text-[var(--color-gray-900)]">
                Static Avatar Picker
              </h1>
            </div>
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<RefreshCw size={12} />}
              onClick={handleRegenerate}
              disabled={Boolean(uploadingId)}
            >
              New
            </Button>
          </div>
        </div>

        <div className="grid gap-[var(--spacing-lg)] p-[var(--spacing-md)] md:grid-cols-[minmax(0,1fr)_320px] md:p-0">
          <section className="min-w-0">
            <div className="grid grid-cols-2 gap-[var(--spacing-sm)] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {avatars.map((option, index) => {
                const isSelected = selected?.id === option.id;
                const isUploading = uploadingId === option.id;

                return (
                  <Button
                    key={option.id}
                    variant="select-card"
                    selected={isSelected}
                    fullWidth
                    contentAlign="start"
                    preserveChildLayout
                    className="h-full"
                    loading={isUploading}
                    disabled={Boolean(uploadingId)}
                    aria-label={`Upload ${option.variant} avatar ${index + 1}`}
                    onClick={(event) => handleAvatarClick(option, event)}
                  >
                    <span className="flex w-full flex-col items-center gap-[var(--spacing-sm)]">
                      <span className="relative flex h-24 w-24 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-50)]">
                        <Avatar
                          name={option.name}
                          variant={option.variant}
                          size={88}
                          colors={option.colors}
                        />
                        {isSelected ? (
                          <span className="absolute -right-1 -top-1 rounded-[var(--radius-full)] bg-white text-[var(--color-primary)] shadow-sm">
                            <CheckCircle2 size={18} />
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs font-medium capitalize text-[var(--color-gray-700)]">
                        {option.variant}
                      </span>
                      <span className="flex items-center gap-1" aria-hidden="true">
                        {option.colors.slice(0, 5).map((color) => (
                          <span
                            key={color}
                            className="h-2 w-2 rounded-[var(--radius-full)] border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-[var(--radius-lg)] border border-[var(--color-gray-200)] bg-white p-[var(--spacing-md)] shadow-sm">
            <div className="flex items-center gap-[var(--spacing-sm)] text-[var(--color-gray-900)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <UploadCloud size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Upload result</h2>
                <p className="truncate text-xs text-[var(--color-gray-500)]">
                  {activeWorkspace?.name ?? "No workspace selected"}
                </p>
              </div>
            </div>

            <div className="mt-[var(--spacing-md)] rounded-[var(--radius-md)] bg-[var(--color-gray-50)] p-[var(--spacing-md)]">
              {selected ? (
                <div className="flex items-center gap-[var(--spacing-md)]">
                  <Avatar
                    name={selected.name}
                    variant={selected.variant}
                    size={72}
                    colors={selected.colors}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-[var(--color-gray-900)]">
                      {selected.variant}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                      {uploadingId === selected.id ? "Uploading..." : "Selected"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-gray-500)]">
                  Select an avatar to upload.
                </p>
              )}
            </div>

            {uploadedUrl ? (
              <div className="mt-[var(--spacing-md)]">
                <CopyInput label="R2 URL" value={uploadedUrl} size="sm" />
              </div>
            ) : null}

            {error ? (
              <p className="mt-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-white px-[var(--spacing-sm)] py-[var(--spacing-sm)] text-xs text-[var(--color-error)]">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
