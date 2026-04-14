import { type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge } from "../ui/Badge";
import type { SettingsNavItem, SettingsNavSection } from "./navigation";

const navLinkClassName = (isActive: boolean, depth: number) =>
  `group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
    depth > 0 ? "pl-10" : ""
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
        <div className="mb-2 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {section.label}
          </p>
        </div>

        <div className="space-y-0.5">
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
      <div className="space-y-0.5">
        <div
          className={`px-3 py-2 text-sm font-medium text-slate-800 ${
            depth > 0 ? "pl-10" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <span className="flex h-5 w-5 items-center justify-center text-slate-500">
                {item.icon}
              </span>
            )}
            <p className="truncate">{item.label}</p>
          </div>
        </div>

        <div className="space-y-0.5">
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
              <span className={isActive ? "text-slate-900" : "text-slate-500"}>
                {item.icon}
              </span>
            )}

            <p className="truncate font-medium">{item.label}</p>
          </div>

          <div className="ml-3 flex items-center gap-2">
            {item.badge && <Badge variant="primary">{item.badge}</Badge>}
            <ChevronRight
              className={isActive ? "text-slate-500" : "text-slate-300"}
              size={14}
            />
          </div>
        </>
      )}
    </NavLink>
  );
};
