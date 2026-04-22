import { AlertTriangle, Loader2 } from "lucide-react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
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
        open={open}
        onClose={onClose}
        title={<h3 className="text-base font-semibold text-slate-900">{copy.title}</h3>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void onConfirm()}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
              {copy.confirmLabel}
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{copy.title}</h3>
            <p className="mt-2 text-sm font-medium text-gray-900">{copy.heading}</p>
            <p className="mt-2 text-sm text-gray-600">{copy.body}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
