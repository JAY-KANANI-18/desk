import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Radio,
  Workflow,
  BarChart3,
  Plug,
  UsersRound,
  Building2,
  CreditCard,
  Settings,
  CheckSquare,
  User,
  ChevronRight,
  ChevronLeft,
  Map,
  Building,
  UserRound,
  SquareUserRound,
  ChartColumnBig,
  ContactRound,
  MessageCircleMore,
  Sparkles,
  CheckCircleIcon,
  BookCheck,
} from "lucide-react";
import { useOrganization } from "../context/OrganizationContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { Tooltip } from "./ui/Tooltip";
import {
  useAuthorization,
  WsGuard,
  OrgGuard,
  WorkspacePermission,
  OrgPermission,
} from "../context/AuthorizationContext";
import { useGetStarted } from "../context/GetStartedContext";

// ─────────────────────────────────────────────────────────────────────────────
// Nav items — each carries the ws permission needed to show it
// ─────────────────────────────────────────────────────────────────────────────
const navItems: {
  icon: React.ElementType;
  label: string;
  path: string;
  ws?: WorkspacePermission;
}[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    ws: "ws:dashboard:view",
  },
  {
    icon: MessageCircleMore,
    label: "Inbox",
    path: "/inbox",
    ws: "ws:messages:view",
  },
  {
    icon: ContactRound,
    label: "Contacts",
    path: "/contacts",
    ws: "ws:contacts:view",
  },
  // { icon: Radio, label: "Broadcast", path: "/broadcast" },

  {
    icon: Workflow,
    label: "Workflows",
    path: "/workflows",
    ws: "ws:workflows:view",
  },
  {
    icon: ChartColumnBig,
    label: "Reports",
    path: "/reports",
    ws: "ws:reports:view",
  },
  { icon: Plug, label: "Channels", path: "/channels", ws: "ws:settings:view" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeOrganization } = useOrganization();
  const { activeWorkspace } = useWorkspace();
  const { canWs, canOrg } = useAuthorization();
  const { isOpen, dismissed, isComplete, completedCount, totalCount, open } =
    useGetStarted();
  const showOnboarding = !dismissed && !isComplete;

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  // Filter nav items by workspace permission
  const visibleNavItems = navItems.filter((item) => !item.ws || canWs(item.ws));

  return (
    <div
      className={`relative bg-white border-r border-gray-200 flex flex-col items-center py-4
        transition-all duration-300 ease-in-out overflow-visible
        ${isExpanded ? "w-56" : "w-16"} h-screen`}
    >
      {/* Toggle Button */}
      {/* <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-5 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {isExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button> */}
      {/* Logo */}

      <div
        className={`flex flex-col items-center align-middle gap-1 mb-5 w-full ${
          isExpanded ? "justify-start" : "justify-center"
        }`}
      >
        <img
          src={isExpanded ? "/axodesk-full.png" : "/axodesk-logo.png"}
          alt="Organization Logo"
          className={`${isExpanded ? "w-18 h-14" : "w-16 h-9"} flex-shrink-0`}
        />
      </div>
      {/* Main Nav — only items the user can access */}
      <nav className="flex flex-col gap-1 w-full px-2 overflow-visible">
        {showOnboarding &&
          (() => {
            const navLink = (
              <NavLink
                to="/get-started"
                className={({ isActive }) =>
                  `flex items-center gap-3 h-10 rounded-lg transition-colors px-3 ${
                    isExpanded ? "w-full" : "w-10 justify-center"
                  } ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <BookCheck size={22}  className="flex-shrink-0" />

                {isExpanded && <span>Getting started</span>}
              </NavLink>
            );

            return !isExpanded ? (
              <Tooltip key="/onboarding" content="Getting started">
                {navLink}
              </Tooltip>
            ) : (
              <div key="/onboarding">{navLink}</div>
            );
          })()}
        {visibleNavItems.map((item) => {
          const navLink = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 h-10 rounded-lg transition-colors px-3 ${
                  isExpanded ? "w-full" : "w-10 justify-center"
                } ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <item.icon size={22} className="flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </NavLink>
          );

          return !isExpanded ? (
            <Tooltip key={item.path} content={item.label}>
              {navLink}
            </Tooltip>
          ) : (
            <div key={item.path}>{navLink}</div>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="flex flex-col gap-1 w-full px-2">
        {/* Settings gear */}
        {/* <button
          title={!isExpanded ? "Tasks" : undefined}
          className={`flex items-center gap-3 h-10 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 px-3 ${
            isExpanded ? "w-full" : "w-10 justify-center"
          }`}
        >
          <CheckSquare size={20} className="flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Tasks</span>}
        </button> */}

        {/* Settings */}
        <div className="relative">
          {!isExpanded ? (
            <Tooltip content="Settings">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`flex items-center gap-3 h-10 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 px-3 ${
                  isExpanded ? "w-full" : "w-10 justify-center"
                }`}
              >
                <Settings size={22} className="flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium">Settings</span>
                )}
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`flex items-center gap-3 h-10 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 px-3 ${
                isExpanded ? "w-full" : "w-10 justify-center"
              }`}
            >
              <Settings size={22} className="flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium">Settings</span>
              )}
            </button>
          )}

          {showSettingsMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className="absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-2">
                  {/* <NavLink
                    to="/channels"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Plug size={18} />
                    <span className="text-sm">Channels</span>
                  </NavLink>
                  <NavLink
                    to="/channels"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                  >
                    <Workflow size={18} />
                    <span className="text-sm">Integrations</span>
                  </NavLink> */}
                  {/* <div className="border-t border-gray-200 my-2" /> */}

                  {/* Organization settings — only org roles that can view org settings */}
                  {canOrg("org:settings:view") && (
                    <NavLink
                      to="/organization"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <Building2 size={22} />
                      <div>
                        <div className="text-sm font-medium">
                          Organization settings
                        </div>
                        <div className="text-xs text-gray-500">
                          {activeOrganization?.name}
                          {/* (ID: {activeOrganization?.id}) */}
                        </div>
                      </div>
                    </NavLink>
                  )}

                  {/* Workspace settings — managers and owners */}
                  {canWs("ws:settings:view") && (
                    <NavLink
                      to="/workspace/settings"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                    >
                      <Building size={22} />
                      <div>
                        <div className="text-sm font-medium">
                          Workspace settings
                        </div>
                        <div className="text-xs text-gray-500">
                          {activeWorkspace?.name}
                        </div>
                      </div>
                    </NavLink>
                  )}
                  {/* <NavLink
                    to="/user/settings"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                  >
                    <User size={18} />
                    <span className="text-sm">Personal settings</span>
                  </NavLink>
                  <div className="border-t border-gray-200 my-2" />
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      Quick access
                    </div>
                    <NavLink
                      to="/channels"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <Plug size={18} />
                      <span className="text-sm">Channels</span>
                    </NavLink>
                    <NavLink
                      to="/team"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                    >
                      <Users size={18} />
                      <span className="text-sm">User settings</span>
                    </NavLink>

                  {/* Billing — billing admin and org admin */}
                  {/* {canOrg("org:billing:view") && (
                    <NavLink
                      to="/billing"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <CreditCard size={18} />
                      <div>
                        <div className="text-sm font-medium">Billing</div>
                        <div className="text-xs text-gray-500">Plans & invoices</div>
                      </div>
                    </NavLink>
                  )} */}

                  {/* Personal settings — always visible */}
                  <NavLink
                    to="/user/settings"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                  >
                    <User size={22} />
                    <div>
                      <div className="text-sm font-medium">
                        Personal settings
                      </div>
                      <div className="text-xs text-gray-500">
                        Profile & notifications
                      </div>
                    </div>
                  </NavLink>
                  {/* <NavLink
                    to="/user/settings"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                  >
                    <User size={18} />
                    <span className="text-sm">Personal settings</span>
                  </NavLink>
                  <div className="border-t border-gray-200 my-2" />
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      Quick access
                    </div>
                    <NavLink
                      to="/channels"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <Plug size={18} />
                      <span className="text-sm">Channels</span>
                    </NavLink>
                    <NavLink
                      to="/team"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                    >
                      <Users size={18} />
                      <span className="text-sm">User settings</span>
                    </NavLink>
                    <NavLink
                      to="/billing"
                      onClick={() => setShowSettingsMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <CreditCard size={18} />
                      <span className="text-sm">Billing & usage</span>
                    </NavLink>
                  </div>
                  <div className="border-t border-gray-200 mt-2 pt-2 px-3 pb-2">
                    <div className="text-xs text-gray-500 mb-2">
                      Your current plan
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Growth</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Growth
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: "0.1%" }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">1 / 1,000 MACs</div>
                  </div> */}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
