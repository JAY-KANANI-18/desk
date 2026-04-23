import type { ComponentProps } from "react";
import { MobileSheet } from "../../../components/topbar/MobileSheet";
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
}

export function EditContactModal({
  contact,
  stages,
  workspaceUsers,
  onClose,
  onDelete,
  onContactChange,
}: EditContactModalProps) {
  const isMobile = useIsMobile();

  if (!contact) {
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
    contactDetails: contact,
    workspaceUsers,
    lifecycleStages: stages,
    onDelete,
    onContactChange: (nextContact: unknown) =>
      onContactChange?.(nextContact as Contact),
    showAiPanel: false,
  } satisfies Omit<
    ComponentProps<typeof ContactSidebarHybrid>,
    "mode" | "desktopVariant" | "desktopEyebrow" | "desktopTitle" | "onDesktopClose"
  >;

  if (isMobile) {
    return (
      <MobileSheet open onClose={onClose} borderless title={title}>
        <ContactSidebarHybrid {...sharedProps} mode="mobile" />
      </MobileSheet>
    );
  }

  return (
    <ContactSidebarHybrid
      {...sharedProps}
      mode="desktop"
      desktopVariant="floating"
      desktopTitle="Contact details"
      onDesktopClose={onClose}
    />
  );
}
