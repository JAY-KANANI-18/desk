import { type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge } from "../ui/Badge";
import type { SettingsNavItem, SettingsNavSection } from "./navigation";

const navLinkClassName = (isActive: boolean, depth: number) =>
  `group flex min-h-[56px] w-full items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] transition-colors md:min-h-0 md:rounded-xl md:px-3 md:py-2.5 md:text-sm ${
    depth > 0 ? "pl-11 md:pl-10" : ""
  } ${
    isActive
      ? "bg-slate-100 text-slate-900"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;

export const handleSettingsListKeyNavigation = (
  event: KeyboardEvent<HTMLElement>,
  rootElement: HTMLElement | null,
) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    return;
  }

  const focusableLinks = Array.from(
    rootElement?.querySelectorAll<HTMLElement>(
      '[data-settings-nav-link="true"]',
    ) ?? [],
  );

  if (focusableLinks.length === 0) {
    return;
  }

  event.preventDefault();

  const currentIndex = Math.max(
    focusableLinks.findIndex((link) => link === document.activeElement),
    0,
  );

  if (event.key === "Home") {
    focusableLinks[0]?.focus();
    return;
  }

  if (event.key === "End") {
    focusableLinks[focusableLinks.length - 1]?.focus();
    return;
  }

  const nextIndex =
    event.key === "ArrowDown"
      ? Math.min(currentIndex + 1, focusableLinks.length - 1)
      : Math.max(currentIndex - 1, 0);

  focusableLinks[nextIndex]?.focus();
};

export const SettingsNavList = ({
  sections,
  onNavigate,
}: {
  sections: SettingsNavSection[];
  onNavigate?: () => void;
}) => (
  <div className="space-y-6">
    {sections.map((section) => (
      <div key={section.id}>
        <div className="mb-3 px-4 md:mb-2 md:px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
            {section.label}
          </p>
        </div>

        <div className="space-y-1 rounded-[22px] bg-slate-50/70 p-1.5 md:space-y-0.5 md:rounded-none md:bg-transparent md:p-0">
          {section.items.map((item) => (
            <SidebarItem
              depth={0}
              item={item}
              key={item.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SidebarItem = ({
  item,
  depth,
  onNavigate,
}: {
  item: SettingsNavItem;
  depth: number;
  onNavigate?: () => void;
}) => {
  if (item.children && item.children.length > 0) {
    return (
      <div className="space-y-1 md:space-y-0.5">
        <div
          className={`px-4 py-3 text-[15px] font-medium text-slate-800 md:px-3 md:py-2 md:text-sm ${
            depth > 0 ? "pl-11 md:pl-10" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <span className="flex h-6 w-6 items-center justify-center text-slate-500 md:h-5 md:w-5">
                {item.icon}
              </span>
            )}
            <p className="truncate">{item.label}</p>
          </div>
        </div>

        <div className="space-y-1 md:space-y-0.5">
          {item.children.map((child) => (
            <SidebarItem
              depth={depth + 1}
              item={child}
              key={child.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!item.to) {
    return null;
  }

  return (
    <NavLink
      data-settings-nav-link="true"
      end
      onClick={onNavigate}
      to={item.to}
      className={({ isActive }) => navLinkClassName(isActive, depth)}
    >
      {({ isActive }) => (
        <>
          <div className="flex min-w-0 items-center gap-3">
            {item.icon && (
              <span
                className={`flex h-6 w-6 items-center justify-center md:h-5 md:w-5 ${
                  isActive ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {item.icon}
              </span>
            )}

            <p className="truncate font-medium">{item.label}</p>
          </div>

          <div className="ml-3 flex items-center gap-2">
            {item.badge && <Badge variant="primary">{item.badge}</Badge>}
            <ChevronRight
              className={isActive ? "text-slate-500" : "text-slate-300"}
              size={16}
            />
          </div>
        </>
      )}
    </NavLink>
  );
};
