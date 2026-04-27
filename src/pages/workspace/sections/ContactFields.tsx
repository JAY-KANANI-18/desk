import { useCallback, useEffect, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/button/IconButton";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { CenterModal } from "../../../components/ui/modal/CenterModal";
import { Select } from "../../../components/ui/Select";
import { Tag } from "../../../components/ui/Tag";
import { ToggleSwitch } from "../../../components/ui/toggle/ToggleSwitch";
import { workspaceApi } from "../../../lib/workspaceApi";
import { DataLoader } from "../../Loader";
import { SectionError } from "../components/SectionError";
import type { ContactField } from "../types";

const FIELD_TYPES = ["Text", "Number", "Email", "Phone", "Date", "Dropdown", "Checkbox"];

const fieldTypeColors: Record<string, string> = {
  Text: "tag-blue",
  Email: "tag-purple",
  Phone: "tag-green",
  Dropdown: "tag-orange",
  Date: "tag-pink",
  Number: "tag-indigo",
  Checkbox: "tag-green",
};

export const ContactFields = () => {
  const [fields, setFields] = useState<ContactField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    type: "Text",
    required: false,
  });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFields(await workspaceApi.getContactFields());
    } catch {
      setError("Failed to load contact fields.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const closeAddModal = () => {
    setShowAdd(false);
    setNewField({ name: "", type: "Text", required: false });
  };

  const handleAdd = async () => {
    if (!newField.name.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const created = await workspaceApi.addContactField({
        ...newField,
        name: newField.name.trim(),
        system: false,
      });
      setFields((prev) => [...prev, created]);
      closeAddModal();
    } catch {
      setError("Failed to add field.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleRequired = async (id: number, required: boolean) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, required } : field)),
    );
    try {
      await workspaceApi.updateContactField(id, { required });
    } catch {
      void load();
    }
  };

  const handleDelete = async (id: number) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    try {
      await workspaceApi.deleteContactField(id);
    } catch {
      void load();
    }
  };

  if (loading) return <DataLoader type="fields" />;
  if (error && fields.length === 0) return <SectionError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Contact fields</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Customize the data you collect for each contact
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} leftIcon={<Plus size={16} />}>
            Add field
          </Button>
        </div>

        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {["Field name", "Type", "Required", ""].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map((field) => (
              <tr key={field.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    {!field.system ? (
                      <GripVertical size={14} className="cursor-grab text-gray-300" />
                    ) : null}
                    <span className="text-sm font-medium text-gray-800">{field.name}</span>
                    {field.system ? <Tag label="System" size="sm" bgColor="gray" /> : null}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <Tag
                    label={field.type}
                    size="sm"
                    bgColor={fieldTypeColors[field.type] ?? "gray"}
                  />
                </td>
                <td className="px-6 py-3">
                  <ToggleSwitch
                    checked={field.required}
                    onChange={(value) => handleToggleRequired(field.id, value)}
                    aria-label={`Toggle ${field.name} required`}
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  {!field.system ? (
                    <IconButton
                      onClick={() => handleDelete(field.id)}
                      icon={<Trash2 size={15} />}
                      variant="danger-ghost"
                      size="xs"
                      aria-label={`Delete ${field.name}`}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <CenterModal
        isOpen={showAdd}
        onClose={closeAddModal}
        title="Add contact field"
        size="sm"
        secondaryAction={
          <Button onClick={closeAddModal} variant="secondary">
            Cancel
          </Button>
        }
        primaryAction={
          <Button
            onClick={handleAdd}
            disabled={adding || !newField.name.trim()}
            loading={adding}
            loadingMode="inline"
          >
            {adding ? "Adding..." : "Add field"}
          </Button>
        }
      >
        <div className="space-y-4">
          <BaseInput
            label="Field name"
            value={newField.name}
            onChange={(event) => setNewField({ ...newField, name: event.target.value })}
            placeholder="e.g. Customer tier"
          />
          <Select
            label="Field type"
            value={newField.type}
            onChange={(event) => setNewField({ ...newField, type: event.target.value })}
            options={FIELD_TYPES.map((type) => ({ value: type, label: type }))}
          />
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700">Required field</label>
            <ToggleSwitch
              checked={newField.required}
              onChange={(required) => setNewField({ ...newField, required })}
              aria-label="Required field"
            />
          </div>
        </div>
      </CenterModal>
    </div>
  );
};
