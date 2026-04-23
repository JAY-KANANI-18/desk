import { UserPlus2, X } from "lucide-react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
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
        open={open}
        onClose={onClose}
        borderless
        title={<h2 className="text-base font-semibold text-slate-900">New Contact</h2>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
              Cancel
            </button>
            <button
              onClick={() => void onSubmit()}
              disabled={!value.firstName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full">
              <UserPlus2 size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold">New Contact</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <ContactFormFields
            value={value}
            onChange={onChange}
            stages={stages}
            availableTags={availableTags}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void onSubmit()}
            disabled={!value.firstName.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
