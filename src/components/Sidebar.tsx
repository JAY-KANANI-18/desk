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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Nav items
// ─────────────────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Inbox", path: "/inbox" },
  { icon: Users, label: "Contacts", path: "/contacts" },
  { icon: Radio, label: "Broadcast", path: "/broadcast" },
  { icon: Workflow, label: "Workflows", path: "/workflows" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Plug, label: "Channels", path: "/channels" },
  { icon: UsersRound, label: "Team", path: "/team" },
  { icon: Building2, label: "Organization", path: "/organization" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: Map, label: "Sitemap", path: "/sitemap" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div
      className={`relative bg-white border-r border-gray-200 flex flex-col items-center py-4 h-screen transition-all duration-300 ease-in-out ${
        isExpanded ? "w-56" : "w-16"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {isExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Logo */}
      <div
        className={`flex items-center gap-3 mb-8 px-3 w-full ${isExpanded ? "justify-start" : "justify-center"}`}
      >
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        {isExpanded && (
          <span className="font-bold text-gray-800 text-lg whitespace-nowrap overflow-hidden">
            Meera
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-2 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 rounded-lg transition-colors px-3 ${
                isExpanded ? "w-full" : "w-10 justify-center"
              } ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="flex flex-col gap-1 w-full px-2 mt-auto">
        {/* Tasks */}
        <button
          title={!isExpanded ? "Tasks" : undefined}
          className={`flex items-center gap-3 h-10 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 px-3 ${
            isExpanded ? "w-full" : "w-10 justify-center"
          }`}
        >
          <CheckSquare size={20} className="flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Tasks</span>}
        </button>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title={!isExpanded ? "Settings" : undefined}
            className={`flex items-center gap-3 h-10 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 px-3 ${
              isExpanded ? "w-full" : "w-10 justify-center"
            }`}
          >
            <Settings size={20} className="flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </button>

          {showSettingsMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className="absolute left-full bottom-0 ml-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-2">
                  <NavLink
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
                  </NavLink>
                  <div className="border-t border-gray-200 my-2" />
                  <NavLink
                    to="/organization"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Building2 size={18} />
                    <div>
                      <div className="text-sm font-medium">
                        Organization settings
                      </div>
                      <div className="text-xs text-gray-500">
                        AXORA (ID: 368530)
                      </div>
                    </div>
                  </NavLink>
                  <NavLink
                    to="/workspace-settings"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg w-full"
                  >
                    <Settings size={18} />
                    <div>
                      <div className="text-sm font-medium">
                        Workspace settings
                      </div>
                      <div className="text-xs text-gray-500">
                        My New Workspace
                      </div>
                    </div>
                  </NavLink>
                  <NavLink
                    to="/workspace-settings"
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
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
