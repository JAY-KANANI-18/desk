import { UserPlus2 } from "@/components/ui/icons";
import { Button } from "../../../components/ui/Button";
import { CenterModal } from "../../../components/ui/Modal";
import { MobileSheet } from "../../../components/ui/modal";
import { useIsMobile } from "../../../hooks/useIsMobile";
import type { LifecycleStage } from "../../workspace/types";
import type { ContactFormState, ContactTagOption } from "../types";
import { ContactFormFields } from "./ContactFormFields";

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  stages: LifecycleStage[];
  availableTags: ContactTagOption[];
  value: ContactFormState;
  onChange: (value: ContactFormState) => void;
  onSubmit: () => Promise<void>;
}

export function CreateContactModal({
  open,
  onClose,
  stages,
  availableTags,
  value,
  onChange,
  onSubmit,
}: CreateContactModalProps) {
  const isMobile = useIsMobile();
  if (!open) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        borderless
        title={<h2 className="text-base font-semibold text-slate-900">New Contact</h2>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={() => void onSubmit()}
              disabled={!value.firstName.trim()}
              fullWidth
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="p-4">
          <ContactFormFields
            value={value}
            onChange={onChange}
            stages={stages}
            availableTags={availableTags}
          />
        </div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title="New Contact"
      headerIcon={<UserPlus2 size={20} className="text-[var(--color-primary)]" />}
      size="lg"
      width={768}
      closeOnOverlayClick={false}
      bodyPadding="lg"
      secondaryAction={
        <Button variant="secondary"  onClick={onClose}>
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          onClick={() => void onSubmit()}
          disabled={!value.firstName.trim()}
        >
          Create
        </Button>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <ContactFormFields
          value={value}
          onChange={onChange}
          stages={stages}
          availableTags={availableTags}
        />
      </div>
    </CenterModal>
  );
}
