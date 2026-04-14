import { X } from "lucide-react";
import { ContactSidebarHybrid } from "./ContactSidebarHybrid";
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
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[80] md:hidden">
        <div className="flex max-h-[88vh] min-h-[55vh] flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-4">
            <div className="h-1.5 w-14 rounded-full bg-slate-200" />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Close contact details"
            >
              <X size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <ContactSidebarHybrid
              selectedConversation={selectedConversation}
              contactDetails={contactDetails}
              mode="mobile"
            />
          </div>
        </div>
      </div>
    </>
  );
}
