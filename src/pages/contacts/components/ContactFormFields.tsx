import type { LifecycleStage } from "../../workspace/types";
import {
  getTagSurfaceStyle,
  resolveTagBaseColor,
} from "../../../lib/tagAppearance";
import type {
  ContactFormState,
  ContactTagOption,
  WorkspaceUser,
} from "../types";
import { PhoneNumberField } from "./PhoneNumberField";

const defaultInputClassName =
  "w-full rounded-lg bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 md:border md:border-gray-300 md:bg-white";

const sidebarInputClassName =
  "w-full rounded-xl border border-[#e0e4ed] bg-[#fafbfc] px-3 py-2.5 text-[13px] text-[#1c2030] placeholder:text-[#c8cdd8] focus:outline-none focus:ring-2 focus:ring-[#1c2030]/10 focus:border-[#1c2030]";

const defaultLabelClassName = "mb-1 block text-sm font-medium text-gray-700";
const sidebarLabelClassName =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#b0b8c8]";

export function ContactFormFields<TForm extends ContactFormState>({
  value,
  onChange,
  stages,
  availableTags,
  workspaceUsers,
  includeAssignee = false,
  variant = "default",
}: {
  value: TForm;
  onChange: (value: TForm) => void;
  stages: LifecycleStage[];
  availableTags: ContactTagOption[];
  workspaceUsers?: WorkspaceUser[] | null;
  includeAssignee?: boolean;
  variant?: "default" | "sidebar";
}) {
  const update = (patch: Partial<ContactFormState>) =>
    onChange({ ...value, ...patch } as TForm);
  const inputClassName =
    variant === "sidebar" ? sidebarInputClassName : defaultInputClassName;
  const labelClassName =
    variant === "sidebar" ? sidebarLabelClassName : defaultLabelClassName;
  const dividerClassName = "border-t border-[#f0f2f8]";

  const toggleTag = (tagId: string) => {
    const hasTag = value.tagIds.includes(tagId);
    update({
      tagIds: hasTag
        ? value.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...value.tagIds, tagId],
    });
  };

  const renderNameFields = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className={labelClassName}>
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
        <span className={labelClassName}>Last Name</span>
        <input
          type="text"
          placeholder="Add Last Name"
          value={value.lastName}
          onChange={(event) => update({ lastName: event.target.value })}
          className={inputClassName}
        />
      </label>
    </div>
  );

  const renderContactFields = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Email Address</span>
          <input
            type="email"
            placeholder="Add Email Address"
            value={value.email}
            onChange={(event) => update({ email: event.target.value })}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Company Name</span>
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
        <span className={labelClassName}>Phone Number</span>
        <PhoneNumberField
          phoneCountryCode={value.phoneCountryCode}
          customPhoneCountryCode={value.customPhoneCountryCode}
          phoneLocalNumber={value.phoneLocalNumber}
          onChange={(patch) => update(patch)}
          variant={variant}
        />
      </div>
    </>
  );

  const renderWorkspaceFields = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className={labelClassName}>Lifecycle</span>
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
          <span className={labelClassName}>Assign Contact</span>
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
  );

  const renderTags = () => (
    <div>
      <span className={labelClassName}>Tags</span>
      {availableTags.length > 0 ? (
        <div
          className={
            variant === "sidebar"
              ? "flex max-h-44 flex-wrap gap-2 overflow-y-auto"
              : "flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg bg-slate-50 p-3 md:border md:border-gray-200 md:bg-white"
          }
        >
          {availableTags.map((tag) => {
            const active = value.tagIds.includes(tag.id);
            const tagStyle = getTagSurfaceStyle(tag.color);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border"
                    : variant === "sidebar"
                      ? "border border-[#e5e7eb] bg-white text-[#5a6280] hover:border-indigo-200 hover:bg-[#f8fafc]"
                      : "bg-slate-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 md:border md:border-gray-200 md:bg-white md:hover:border-indigo-200"
                }`}
                style={
                  active
                    ? {
                        ...tagStyle,
                        color: resolveTagBaseColor(tag.color),
                      }
                    : undefined
                }
              >
                {tag.emoji ? <span>{tag.emoji}</span> : null}
                <span>{tag.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p
          className={
            variant === "sidebar"
              ? "text-[12px] text-[#9ca3af] italic"
              : "rounded-lg bg-slate-50 px-3 py-3 text-sm text-gray-500 md:border md:border-dashed md:border-gray-200 md:bg-white"
          }
        >
          No workspace tags available yet.
        </p>
      )}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div className="space-y-4">
        <section className="space-y-3">
          <p className="text-[12px] font-semibold text-[#374151]">Identity</p>
          {renderNameFields()}
        </section>

        <div className={dividerClassName} />

        <section className="space-y-3">
          <p className="text-[12px] font-semibold text-[#374151]">Contact</p>
          {renderContactFields()}
        </section>

        <div className={dividerClassName} />

        <section className="space-y-3">
          <p className="text-[12px] font-semibold text-[#374151]">Workspace</p>
          {renderWorkspaceFields()}
        </section>

        <div className={dividerClassName} />

        <section className="space-y-3">
          <p className="text-[12px] font-semibold text-[#374151]">Tags</p>
          {renderTags()}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderNameFields()}
      {renderContactFields()}
      {renderWorkspaceFields()}
      {renderTags()}
    </div>
  );
}
