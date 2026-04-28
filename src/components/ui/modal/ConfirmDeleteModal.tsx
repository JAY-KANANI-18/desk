import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { Button } from "../button/Button";
import { CenterModal } from "./CenterModal";
import { MobileSheet } from "./MobileSheet";

export interface ConfirmDeleteModalProps {
  open: boolean;
  entityName: string;
  entityType: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isDeleting?: boolean;
  title?: ReactNode;
  heading?: ReactNode;
  body?: ReactNode;
  confirmLabel?: ReactNode;
}

export function ConfirmDeleteModal({
  open,
  entityName,
  entityType,
  onConfirm,
  onCancel,
  isDeleting = false,
  title,
  heading,
  body,
  confirmLabel,
}: ConfirmDeleteModalProps) {
  const isMobile = useIsMobile();

  if (!open) {
    return null;
  }

  const resolvedTitle = title ?? `Delete ${entityType}`;
  const resolvedHeading = heading ?? `Delete ${entityName}?`;
  const resolvedBody = body ?? "This action cannot be undone once confirmed.";
  const resolvedConfirmLabel = confirmLabel ?? `Delete ${entityType}`;
  const confirmAction = () => {
    void onConfirm();
  };

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={open}
        onClose={onCancel}
        borderless
        title={<h3 className="text-base font-semibold text-slate-900">{resolvedTitle}</h3>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <Button onClick={onCancel} disabled={isDeleting} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isDeleting}
              variant="danger"
              fullWidth
              loading={isDeleting}
              loadingMode="inline"
            >
              {resolvedConfirmLabel}
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
              <p className="text-sm font-semibold text-red-900">{resolvedHeading}</p>
              <div className="mt-1 text-sm text-red-800">{resolvedBody}</div>
            </div>
          </div>
        </div>
      </MobileSheet>
    );
  }

  return (
    <CenterModal
      isOpen={open}
      onClose={onCancel}
      title={resolvedTitle}
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
        <Button onClick={onCancel} disabled={isDeleting} variant="secondary">
          Cancel
        </Button>
      }
      primaryAction={
        <Button
          onClick={confirmAction}
          disabled={isDeleting}
          loading={isDeleting}
          variant="danger"
          loadingMode="inline"
        >
          {resolvedConfirmLabel}
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">{resolvedHeading}</p>
        <div className="text-sm text-gray-600">{resolvedBody}</div>
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-800">This action cannot be undone.</p>
        </div>
      </div>
    </CenterModal>
  );
}
