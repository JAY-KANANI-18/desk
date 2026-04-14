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
    <aside className="flex h-full w-72 flex-col bg-white">
      {headerContent ? (
        <div className="border-b border-slate-100 px-4 py-5">{headerContent}</div>
      ) : null}

      <nav
        ref={navRef}
        aria-label={title}
        className="flex-1 overflow-y-auto px-4 py-6"
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
