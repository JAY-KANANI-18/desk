import { useEffect, useState } from "react";
import { Building2, Globe } from "@/components/ui/icons";
import { useOrganization } from "../../context/OrganizationContext";
import { Button } from "../../components/ui/button/Button";
import { BaseInput } from "../../components/ui/inputs/BaseInput";

type OrgForm = {
  name: string;
  website: string;
};

const defaultForm: OrgForm = {
  name: "",
  website: "",
};

export const GeneralOrgInfo = () => {
  const { activeOrganization, updateOrganization } = useOrganization();

  const [form, setForm] = useState<OrgForm>(defaultForm);
  const [initialForm, setInitialForm] = useState<OrgForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      const orgData: OrgForm = {
        name: activeOrganization.name || "",
        website: activeOrganization.website || "",
      };

      setForm(orgData);
      setInitialForm(orgData);
    }
  }, [activeOrganization]);

  const handleFieldChange = (field: keyof OrgForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!activeOrganization?.id) return;

    try {
      setSaving(true);

      await updateOrganization(activeOrganization.id, {
        name: form.name,
        website: form.website,
      });

      setInitialForm(form);
    } catch (error) {
      console.error("Failed to update organization:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  return (
    <div>
      <div className="max-w-2xl space-y-6">
        <BaseInput
          label="Organization name"
          leftIcon={<Building2 size={14} />}
          type="text"
          value={form.name}
          onChange={(event) => handleFieldChange("name", event.target.value)}
          placeholder="Enter organization name"
        />

        <BaseInput
          label="Website"
          leftIcon={<Globe size={14} />}
          type="url"
          value={form.website}
          onChange={(event) =>
            handleFieldChange("website", event.target.value)
          }
          placeholder="https://example.com"
        />

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            loading={saving}
            loadingMode="inline"
            loadingLabel="Saving..."
          >
            Save changes
          </Button>

          <Button
            onClick={handleCancel}
            disabled={!hasChanges || saving}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
