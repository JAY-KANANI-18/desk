import { useEffect, useRef, useState, type ReactNode } from "react";
import { Smile } from "@/components/ui/icons";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { TAG_COLOR_OPTIONS } from "../../../lib/tagAppearance";
import { Button } from "../button";
import { EmojiPicker } from "../emoji";
import {
  BaseInput,
  TagColorSwatchPicker,
  TextareaInput,
} from "../inputs";
import { CenterModal, MobileSheet } from "../modal";
import { Tag } from "./Tag";

export type WorkspaceTagFormValue = {
  name: string;
  color: string;
  emoji: string;
  description: string;
};

export const INITIAL_WORKSPACE_TAG_FORM: WorkspaceTagFormValue = {
  name: "",
  color: "tag-indigo",
  emoji: "",
  description: "",
};

export interface WorkspaceTagFormModalProps {
  open: boolean;
  mode?: "create" | "edit";
  value: WorkspaceTagFormValue;
  saving?: boolean;
  error?: ReactNode;
  onChange: (value: WorkspaceTagFormValue) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  createTitle?: string;
  editTitle?: string;
  createSubmitLabel?: string;
  editSubmitLabel?: string;
  savingLabel?: string;
}

export function WorkspaceTagFormModal({
  open,
  mode = "create",
  value,
  saving = false,
  error,
  onChange,
  onClose,
  onSave,
  createTitle = "Create Tag",
  editTitle = "Edit Tag",
  createSubmitLabel = "Add tag",
  editSubmitLabel = "Save changes",
  savingLabel = "Saving...",
}: WorkspaceTagFormModalProps) {
  const isMobile = useIsMobile();
  const emojiRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const title = mode === "edit" ? editTitle : createTitle;

  useEffect(() => {
    if (!emojiOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!emojiRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [emojiOpen]);

  useEffect(() => {
    if (!open) {
      setEmojiOpen(false);
    }
  }, [open]);

  const update = (patch: Partial<WorkspaceTagFormValue>) => {
    onChange({ ...value, ...patch });
  };

  const formContent = (
    <div className="space-y-4 p-4 md:p-0">
      <Tag
        label={value.name || "New tag"}
        emoji={value.emoji || "Tag"}
        bgColor={value.color}
        maxWidth="100%"
      />

      <div className="grid grid-cols-[76px_1fr] gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Emoji
          </label>
          <div className="relative" ref={emojiRef}>
            <Button
              type="button"
              onClick={() => setEmojiOpen((current) => !current)}
              variant="secondary"
              fullWidth
              preserveChildLayout
              disabled={saving}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-lg leading-none">
                  {value.emoji || "Tag"}
                </span>
                <Smile size={16} className="text-[var(--color-primary)]" />
              </span>
            </Button>
            {emojiOpen ? (
              <EmojiPicker
                mode="tag"
                accent="indigo"
                onSelect={(emoji) => {
                  update({ emoji });
                  setEmojiOpen(false);
                }}
              />
            ) : null}
          </div>
        </div>

        <BaseInput
          label="Name"
          value={value.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="e.g. Priority"
          disabled={saving}
        />
      </div>

      <TagColorSwatchPicker
        label="Colors"
        value={value.color}
        options={TAG_COLOR_OPTIONS}
        disabled={saving}
        onChange={(color) => update({ color })}
      />

      <TextareaInput
        label="Description"
        value={value.description}
        onChange={(event) => update({ description: event.target.value })}
        rows={4}
        disabled={saving}
      />

      {error ? (
        <div className="text-sm font-medium text-red-600">{error}</div>
      ) : null}
    </div>
  );

  const formFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={saving || !value.name.trim()}
        loading={saving}
      >
        {saving ? savingLabel : mode === "edit" ? editSubmitLabel : createSubmitLabel}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        title={<h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        footer={formFooter}
      >
        {formContent}
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={formFooter}
    >
      {formContent}
    </CenterModal>
  );
}
