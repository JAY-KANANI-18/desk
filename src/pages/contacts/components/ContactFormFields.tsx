import type { LifecycleStage } from "../../workspace/types";
import {
  LifecycleSelectMenu,
  Select,
  WorkspaceTagManager,
} from "../../../components/ui/Select";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { PhoneField } from "../../../components/ui/phone";
import type {
  ContactFormState,
  ContactTagOption,
  WorkspaceUser,
} from "../types";

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
  const fieldAppearance = variant === "sidebar" ? "sidebar" : "default";
  const labelVariant = variant === "sidebar" ? "sidebar" : "default";
  const dividerClassName = "border-t border-[#f0f2f8]";

  const renderNameFields = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <BaseInput
        label="First Name"
        required
        appearance={fieldAppearance}
        labelVariant={labelVariant}
        type="text"
        placeholder="Add First Name"
        value={value.firstName}
        onChange={(event) => update({ firstName: event.target.value })}
      />

      <BaseInput
        label="Last Name"
        appearance={fieldAppearance}
        labelVariant={labelVariant}
        type="text"
        placeholder="Add Last Name"
        value={value.lastName}
        onChange={(event) => update({ lastName: event.target.value })}
      />
    </div>
  );

  const renderContactFields = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <BaseInput
          label="Email Address"
          appearance={fieldAppearance}
          labelVariant={labelVariant}
          type="email"
          placeholder="Add Email Address"
          value={value.email}
          onChange={(event) => update({ email: event.target.value })}
        />

        <BaseInput
          label="Company Name"
          appearance={fieldAppearance}
          labelVariant={labelVariant}
          type="text"
          placeholder="Add Company Name"
          value={value.company}
          onChange={(event) => update({ company: event.target.value })}
        />
      </div>

      <PhoneField
        label="Phone Number"
        value={value.phone}
        defaultCountry="IN"
        appearance={fieldAppearance}
        labelVariant={labelVariant}
        onChange={(phone) => update({ phone })}
      />
    </>
  );

  const renderWorkspaceFields = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <LifecycleSelectMenu
        label="Lifecycle"
        variant={variant === "sidebar" ? "sidebar" : "field"}
        value={value.lifecycle}
        stages={stages}
        onChange={(stageId) => update({ lifecycle: stageId ?? "" })}
        noneLabel="No Stage"
        placeholder="Select lifecycle"
        dropdownWidth="trigger"
      />

      {includeAssignee ? (
        <Select
          label="Assign Contact"
          appearance={fieldAppearance}
          labelVariant={labelVariant}
          value={value.assigneeId}
          onChange={(event) => update({ assigneeId: event.target.value })}
          options={[
            { value: "", label: "Unassigned" },
            ...((workspaceUsers ?? []).map((user) => ({
              value: user.id,
              label:
                [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                user.email,
            }))),
          ]}
        />
      ) : null}
    </div>
  );

  const renderTags = () => (
    <WorkspaceTagManager
      label="Tags"
      labelAppearance={variant === "sidebar" ? "sidebar" : "form"}
      options={availableTags.map((tag) => ({
        value: tag.id,
        label: tag.name,
        color: tag.color || "tag-indigo",
        emoji: tag.emoji || "\u{1F3F7}\uFE0F",
        description: tag.description ?? undefined,
      }))}
      value={value.tagIds}
      onChange={(tagIds) => update({ tagIds })}
      searchPlaceholder="Search workspace tags"
      emptyMessage="No workspace tags available yet."
      selectedAppearance="tag"
      optionAppearance="tag"
      clearActionLabel="Clear all"
      emptySelectedContent={
        <p
          className={
            variant === "sidebar"
              ? "text-[12px] text-[#9ca3af] italic"
              : "text-sm text-gray-500"
          }
        >
          No tags selected.
        </p>
      }
    />
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

        <section className="space-y-3">{renderTags()}</section>
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
