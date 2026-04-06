import { useEffect, useState } from "react";
import { Building2, Globe, Clock, Languages } from "lucide-react";
import { useOrganization } from "../../context/OrganizationContext";

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
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
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-base font-semibold text-gray-900">Account info</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your organization details and preferences.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Org name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Building2 size={14} className="inline mr-1.5 text-gray-400" />
            Organization name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter organization name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Globe size={14} className="inline mr-1.5 text-gray-400" />
            Website
          </label>
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

  

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg text-sm text-white transition ${
              !hasChanges || saving
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            onClick={handleCancel}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 border rounded-lg text-sm transition ${
              !hasChanges || saving
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};