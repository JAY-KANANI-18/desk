import { ConfirmDeleteModal } from "../../../components/ui/modal";

interface DeleteContactsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  count: number;
  contactName?: string;
}

function getDeleteCopy(count: number, contactName?: string) {
  if (count <= 1) {
    return {
      title: "Delete contact",
      heading: `Delete ${contactName || "this contact"}?`,
      body:
        "This action cannot be undone. All conversations linked to this contact will also be deleted.",
      confirmLabel: "Delete contact",
    };
  }

  return {
    title: "Delete contacts",
    heading: `Delete ${count} contacts?`,
    body:
      "This action cannot be undone. All conversations linked to these contacts will also be deleted.",
    confirmLabel: "Delete contacts",
  };
}

export function DeleteContactsModal({
  open,
  onClose,
  onConfirm,
  isDeleting,
  count,
  contactName,
}: DeleteContactsModalProps) {
  const copy = getDeleteCopy(count, contactName);

  return (
    <ConfirmDeleteModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
      entityName={contactName || "this contact"}
      entityType={count <= 1 ? "contact" : "contacts"}
      title={copy.title}
      heading={copy.heading}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
    />
  );
}
