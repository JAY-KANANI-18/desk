import { BookOpen, CheckSquare, ExternalLink, MessageSquare } from "@/components/ui/icons";
import { PanelMenu } from "../ui/menu";

export function HelpPanel({
  open,
  isMobile = false,
  onClose,
}: {
  open: boolean;
  isMobile?: boolean;
  onClose: () => void;
}) {
  const panelContent = (
    <>
      <div className="p-2">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <BookOpen size={16} className="text-gray-400" />
          Documentation
          <ExternalLink size={12} className="ml-auto text-gray-300" />
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <MessageSquare size={16} className="text-gray-400" />
          Chat with support
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <CheckSquare size={16} className="text-gray-400" />
          Onboarding checklist
        </a>
      </div>
      <div className="border-t border-gray-100 px-4 py-2.5">
        <p className="text-xs text-gray-400">Version 1.0.0</p>
      </div>
    </>
  );

  return (
    <PanelMenu
      isOpen={open}
      isMobile={isMobile}
      onClose={onClose}
      title="Help & Resources"
      mobileTitle={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Support
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Help & Resources
            </h2>
          </div>
      }
      width="md"
      align="end"
      ariaLabel="Help and resources"
      mobileBodyClassName="p-4"
      bodyClassName=""
    >
      {isMobile ? (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          {panelContent}
        </div>
      ) : (
        panelContent
      )}
    </PanelMenu>
  );
}
