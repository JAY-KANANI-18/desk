import { ContactSidebarHybrid } from "./ContactSidebarHybrid";
import { useInbox } from "../../context/InboxContext";
import { MobileSheet } from "../../components/ui/modal";
import type { Contact, Conversation } from "./types";

interface MobileContactSheetProps {
  open: boolean;
  onClose: () => void;
  selectedConversation: Conversation;
  contactDetails: Contact | null;
}

export function MobileContactSheet({
  open,
  onClose,
  selectedConversation,
  contactDetails,
}: MobileContactSheetProps) {
  const { convList, refreshContact, refreshConversations, selectConversation } =
    useInbox();

  const title = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Inbox
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">
        Contact details
      </h2>
    </div>
  );

  return (
    <MobileSheet isOpen={open} onClose={onClose} title={title}>
      <ContactSidebarHybrid
        selectedConversation={selectedConversation}
        contactDetails={contactDetails}
        mode="mobile"
        refreshContact={refreshContact}
        refreshConversations={refreshConversations}
        conversationList={convList as any}
        onSelectConversation={(conversation) =>
          selectConversation(conversation as any)
        }
      />
    </MobileSheet>
  );
}
