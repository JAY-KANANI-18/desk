import { Check, X } from "lucide-react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
import { useIsMobile } from "../../../hooks/useIsMobile";
import type { LifecycleStage } from "../../workspace/types";
import type { Contact, EditContactFormState } from "../types";

interface EditContactModalProps {
  contact: Contact | null;
  stages: LifecycleStage[];
  value: EditContactFormState;
  onChange: (value: EditContactFormState) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export function EditContactModal({
  contact,
  stages,
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
              disabled={!value.firstName || !value.email}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={14} />
              Save Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={value.firstName}
                onChange={(event) => onChange({ ...value, firstName: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">Last Name</span>
              <input
                type="text"
                value={value.lastName}
                onChange={(event) => onChange({ ...value, lastName: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              value={value.email}
              onChange={(event) => onChange({ ...value, email: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Phone Number</span>
            <input
              type="tel"
              value={value.phone}
              onChange={(event) => onChange({ ...value, phone: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Lifecycle</span>
            <select
              value={typeof value.lifecycle === "string" ? value.lifecycle : ""}
              onChange={(event) => onChange({ ...value, lifecycle: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Lifecycle</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {[stage.emoji, stage.name].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Channel</span>
            <select
              value={value.channel ?? "email"}
              onChange={(event) => onChange({ ...value, channel: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="messenger">Messenger</option>
              <option value="webchat">Website Chat</option>
            </select>
          </label>
        </div>
      </MobileSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarTone}`}>
              {value.firstName[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit Contact</h2>
              <p className="text-xs text-gray-500">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={value.firstName}
                onChange={(event) => onChange({ ...value, firstName: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">Last Name</span>
              <input
                type="text"
                value={value.lastName}
                onChange={(event) => onChange({ ...value, lastName: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              value={value.email}
              onChange={(event) => onChange({ ...value, email: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Phone Number</span>
            <input
              type="tel"
              value={value.phone}
              onChange={(event) => onChange({ ...value, phone: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Lifecycle</span>
            <select
              value={typeof value.lifecycle === "string" ? value.lifecycle : ""}
              onChange={(event) => onChange({ ...value, lifecycle: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Lifecycle</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {[stage.emoji, stage.name].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Channel</span>
            <select
              value={value.channel ?? "email"}
              onChange={(event) => onChange({ ...value, channel: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="messenger">Messenger</option>
              <option value="webchat">Website Chat</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void onSubmit()}
            disabled={!value.firstName || !value.email}
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
