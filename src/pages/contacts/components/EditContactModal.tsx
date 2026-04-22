import { Check, X } from "lucide-react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
import { useIsMobile } from "../../../hooks/useIsMobile";
import type { LifecycleStage } from "../../workspace/types";
import type {
  Contact,
  ContactTagOption,
  EditContactFormState,
  WorkspaceUser,
} from "../types";
import { ContactFormFields } from "./ContactFormFields";

interface EditContactModalProps {
  contact: Contact | null;
  stages: LifecycleStage[];
  availableTags: ContactTagOption[];
  workspaceUsers: WorkspaceUser[] | null;
  value: EditContactFormState;
  onChange: (value: EditContactFormState) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export function EditContactModal({
  contact,
  stages,
  availableTags,
  workspaceUsers,
  value,
  onChange,
  onClose,
  onSubmit,
}: EditContactModalProps) {
  const isMobile = useIsMobile();
  if (!contact) {
    return null;
  }

  const avatarTone =
    typeof contact.lifecycle === "string" && contact.lifecycle === "Hot Lead" ? "bg-red-500" : "bg-gray-700";

  if (isMobile) {
    return (
      <MobileSheet
        open
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarTone}`}>
              {value.firstName[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Edit Contact</h2>
              <p className="text-xs text-slate-500">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => void onSubmit()}
              disabled={!value.firstName.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={14} />
              Save Changes
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
            workspaceUsers={workspaceUsers}
            includeAssignee
          />
        </div>
      </MobileSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarTone}`}>
              {value.firstName[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Contact Details</h2>
              <p className="text-xs text-gray-500">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <ContactFormFields
            value={value}
            onChange={onChange}
            stages={stages}
            availableTags={availableTags}
            workspaceUsers={workspaceUsers}
            includeAssignee
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void onSubmit()}
            disabled={!value.firstName.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
