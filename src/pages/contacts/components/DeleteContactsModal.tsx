import { AlertTriangle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { CenterModal } from "../../../components/ui/Modal";
import { MobileSheet } from "../../../components/ui/modal";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface DeleteContactsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  count: number;
  contactName?: string;
}

function getDeleteCopy(count: number, contactName?: string) {
  if (count <= 1) {
    return {
      title: "Delete contact",
      heading: `Delete ${contactName || "this contact"}?`,
      body:
        "This action cannot be undone. All conversations linked to this contact will also be deleted.",
      confirmLabel: "Delete contact",
    };
  }

  return {
    title: "Delete contacts",
    heading: `Delete ${count} contacts?`,
    body:
      "This action cannot be undone. All conversations linked to these contacts will also be deleted.",
    confirmLabel: "Delete contacts",
  };
}

export function DeleteContactsModal({
  open,
  onClose,
  onConfirm,
  isDeleting,
  count,
  contactName,
}: DeleteContactsModalProps) {
  const isMobile = useIsMobile();

  if (!open) {
    return null;
  }

  const copy = getDeleteCopy(count, contactName);

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onClose}
        borderless
        title={<h3 className="text-base font-semibold text-slate-900">{copy.title}</h3>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <Button
              onClick={onClose}
              disabled={isDeleting}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={() => void onConfirm()}
              disabled={isDeleting}
              variant="danger"
              fullWidth
              loading={isDeleting}
              loadingMode="inline"
            >
              {copy.confirmLabel}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
            <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">{copy.heading}</p>
              <p className="mt-1 text-sm text-red-800">{copy.body}</p>
            </div>
          </div>
        </div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onClose}
      title={copy.title}
      headerIcon={
        <div className="rounded-full bg-red-100 p-2 text-red-600">
          <AlertTriangle size={18} />
        </div>
      }
      size="sm"
      width={480}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="lg"
      secondaryAction={
        <Button
          onClick={onClose}
          disabled={isDeleting}
          variant="secondary"
        >
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          onClick={() => void onConfirm()}
          disabled={isDeleting}
          loading={isDeleting}
          variant="danger"
          loadingMode="inline"
        >
          {copy.confirmLabel}
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">{copy.heading}</p>
        <p className="text-sm text-gray-600">{copy.body}</p>
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-800">
            This action cannot be undone.
          </p>
        </div>
      </div>
    </CenterModal>
  );
}
