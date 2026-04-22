import type { LifecycleStage } from "../../workspace/types";
import type {
  ContactFormState,
  ContactTagOption,
  WorkspaceUser,
} from "../types";
import { PhoneNumberField } from "./PhoneNumberField";

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function ContactFormFields<TForm extends ContactFormState>({
  value,
  onChange,
  stages,
  availableTags,
  workspaceUsers,
  includeAssignee = false,
}: {
  value: TForm;
  onChange: (value: TForm) => void;
  stages: LifecycleStage[];
  availableTags: ContactTagOption[];
  workspaceUsers?: WorkspaceUser[] | null;
  includeAssignee?: boolean;
}) {
  const update = (patch: Partial<ContactFormState>) =>
    onChange({ ...value, ...patch } as TForm);

  const toggleTag = (tagId: string) => {
    const hasTag = value.tagIds.includes(tagId);
    update({
      tagIds: hasTag
        ? value.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...value.tagIds, tagId],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            placeholder="Add First Name"
            value={value.firstName}
            onChange={(event) => update({ firstName: event.target.value })}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Last Name
          </span>
          <input
            type="text"
            placeholder="Add Last Name"
            value={value.lastName}
            onChange={(event) => update({ lastName: event.target.value })}
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Email Address
          </span>
          <input
            type="email"
            placeholder="Add Email Address"
            value={value.email}
            onChange={(event) => update({ email: event.target.value })}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Company Name
          </span>
          <input
            type="text"
            placeholder="Add Company Name"
            value={value.company}
            onChange={(event) => update({ company: event.target.value })}
            className={inputClassName}
          />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Phone Number
        </span>
        <PhoneNumberField
          phoneCountryCode={value.phoneCountryCode}
          customPhoneCountryCode={value.customPhoneCountryCode}
          phoneLocalNumber={value.phoneLocalNumber}
          onChange={(patch) => update(patch)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Lifecycle
          </span>
          <select
            value={value.lifecycle}
            onChange={(event) => update({ lifecycle: event.target.value })}
            className={inputClassName}
          >
            <option value="">Select Lifecycle</option>
            {stages.map((stage) => (
              <option key={stage.id} value={String(stage.id)}>
                {[stage.emoji, stage.name].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </label>

        {includeAssignee ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Assign Contact
            </span>
            <select
              value={value.assigneeId}
              onChange={(event) => update({ assigneeId: event.target.value })}
              className={inputClassName}
            >
              <option value="">Unassigned</option>
              {(workspaceUsers ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                    user.email}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">
          Tags
        </span>
        {availableTags.length > 0 ? (
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {availableTags.map((tag) => {
              const active = value.tagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {tag.emoji ? <span>{tag.emoji}</span> : null}
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500">
            No workspace tags available yet.
          </p>
        )}
      </div>
    </div>
  );
}
