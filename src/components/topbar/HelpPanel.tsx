import { BookOpen, CheckSquare, ExternalLink, MessageSquare } from "lucide-react";
import { MobileSheet } from "./MobileSheet";

export function HelpPanel({
  isMobile = false,
  onClose,
}: {
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

  if (isMobile) {
    return (
      <MobileSheet
        open
        title={
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Support
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Help & Resources
            </h2>
          </div>
        }
        onClose={onClose}
      >
        <div className="p-4">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            {panelContent}
          </div>
        </div>
      </MobileSheet>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-800">
            Help & Resources
          </span>
        </div>
        {panelContent}
      </div>
    </>
  );
}
