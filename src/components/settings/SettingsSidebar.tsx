import { type KeyboardEvent, type ReactNode, useRef } from "react";
import type { SettingsNavSection } from "./navigation";
import {
  handleSettingsListKeyNavigation,
  SettingsNavList,
} from "./SettingsNavList";

interface SettingsSidebarProps {
  title: string;
  sections: SettingsNavSection[];
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  onNavigate?: () => void;
}

export const SettingsSidebar = ({
  title,
  sections,
  headerContent,
  footerContent,
  onNavigate,
}: SettingsSidebarProps) => {
  const navRef = useRef<HTMLElement | null>(null);

  const handleKeyNavigation = (event: KeyboardEvent<HTMLElement>) => {
    handleSettingsListKeyNavigation(event, navRef.current);
  };

  return (
    <aside className="app-secondary-sidebar settings-sidebar flex h-full w-72 flex-col border-r border-gray-200 bg-white">
      {headerContent ? (
        <div className="border-b border-slate-100 px-4 py-5">{headerContent}</div>
      ) : (
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
        </div>
      )}

      <nav
        ref={navRef}
        aria-label={title}
        className="flex-1 overflow-y-auto px-3 py-4"
        onKeyDown={handleKeyNavigation}
      >
        <SettingsNavList onNavigate={onNavigate} sections={sections} />
      </nav>

      {footerContent ? (
        <div className="border-t border-slate-100 px-4 py-5">{footerContent}</div>
      ) : null}
    </aside>
  );
};
