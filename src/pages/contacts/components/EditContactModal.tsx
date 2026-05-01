import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { MobileSheet } from "../../../components/ui/modal";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { ContactSidebarHybrid } from "../../inbox/ContactSidebarHybrid";
import type { LifecycleStage } from "../../workspace/types";
import type { Contact, WorkspaceUser } from "../types";

interface EditContactModalProps {
  contact: Contact | null;
  stages: LifecycleStage[];
  workspaceUsers: WorkspaceUser[] | null;
  onClose: () => void;
  onDelete?: () => void;
  onContactChange?: (contact: Contact) => void | Promise<void>;
  mobileTitle?: ReactNode;
  desktopVariant?: ComponentProps<typeof ContactSidebarHybrid>["desktopVariant"];
  desktopEyebrow?: string;
  desktopTitle?: string;
  desktopContainerClassName?: string;
}

export function EditContactModal({
  contact,
  stages,
  workspaceUsers,
  onClose,
  onDelete,
  onContactChange,
  mobileTitle,
  desktopVariant = "floating",
  desktopEyebrow,
  desktopTitle = "Contact details",
  desktopContainerClassName,
}: EditContactModalProps) {
  const isMobile = useIsMobile();
  const [displayContact, setDisplayContact] = useState<Contact | null>(contact);

  useEffect(() => {
    if (contact) {
      setDisplayContact(contact);
    }
  }, [contact]);

  const activeContact = contact ?? displayContact;

  if (!activeContact) {
    return null;
  }

  const title = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Contacts
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">
        Contact Details
      </h2>
    </div>
  );

  const sharedProps = {
    contactDetails: activeContact,
    workspaceUsers,
    lifecycleStages: stages,
    onDelete,
    onContactChange: (nextContact: unknown) =>
      onContactChange?.(nextContact as Contact),
    showAiPanel: false,
  } satisfies Omit<
    ComponentProps<typeof ContactSidebarHybrid>,
    | "mode"
    | "desktopVariant"
    | "desktopEyebrow"
    | "desktopTitle"
    | "onDesktopClose"
    | "desktopContainerClassName"
  >;

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={Boolean(contact)}
        onClose={onClose}
        borderless
        title={mobileTitle ?? title}
      >
        <ContactSidebarHybrid {...sharedProps} mode="mobile" />
      </MobileSheet>
    );
  }

  return (
    <ContactSidebarHybrid
      {...sharedProps}
      mode="desktop"
      desktopVariant={desktopVariant}
      desktopEyebrow={desktopEyebrow}
      desktopTitle={desktopTitle}
      desktopContainerClassName={desktopContainerClassName}
      onDesktopClose={onClose}
    />
  );
}
