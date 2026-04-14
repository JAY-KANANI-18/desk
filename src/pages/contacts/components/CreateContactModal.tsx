import { UserPlus2, X } from "lucide-react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
import { useIsMobile } from "../../../hooks/useIsMobile";
import type { LifecycleStage } from "../../workspace/types";
import type { ContactFormState } from "../types";

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  stages: LifecycleStage[];
  value: ContactFormState;
  onChange: (value: ContactFormState) => void;
  onSubmit: () => Promise<void>;
}

export function CreateContactModal({
  open,
  onClose,
  stages,
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
        title={<h2 className="text-base font-semibold text-slate-900">New Contact</h2>}
        footer={
          <div className="flex flex-col-reverse gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => void onSubmit()}
              disabled={!value.firstName || !value.email}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              placeholder="Add First Name"
              value={value.firstName}
              onChange={(event) => onChange({ ...value, firstName: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Last Name</span>
            <input
              type="text"
              placeholder="Add Last Name"
              value={value.lastName}
              onChange={(event) => onChange({ ...value, lastName: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Phone Number</span>
            <div className="flex gap-2">
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option>IN +91</option>
                <option>US +1</option>
                <option>UK +44</option>
              </select>
              <input
                type="tel"
                placeholder="+91"
                value={value.phone}
                onChange={(event) => onChange({ ...value, phone: event.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              placeholder="Add Email Address"
              value={value.email}
              onChange={(event) => onChange({ ...value, email: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Lifecycle</span>
            <select
              value={value.lifecycle}
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
        </div>
      </MobileSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              placeholder="Add First Name"
              value={value.firstName}
              onChange={(event) => onChange({ ...value, firstName: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Last Name</span>
            <input
              type="text"
              placeholder="Add Last Name"
              value={value.lastName}
              onChange={(event) => onChange({ ...value, lastName: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Phone Number</span>
            <div className="flex gap-2">
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option>IN +91</option>
                <option>US +1</option>
                <option>UK +44</option>
              </select>
              <input
                type="tel"
                placeholder="+91"
                value={value.phone}
                onChange={(event) => onChange({ ...value, phone: event.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              placeholder="Add Email Address"
              value={value.email}
              onChange={(event) => onChange({ ...value, email: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Lifecycle</span>
            <select
              value={value.lifecycle}
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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void onSubmit()}
            disabled={!value.firstName || !value.email}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
