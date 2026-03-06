import { useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Bell,
  HelpCircle,
  MessageCircle,
  UserCheck,
  AtSign,
  Volume2,
  VolumeX,
  X,
  Trash2,
  User,
  LogOut,
  Settings,
  ExternalLink,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Phone,
  ChevronDown,
  Building2,
  Check,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useCall } from "../context/CallContext";
import type {
  AppNotification,
  NotificationEventType,
} from "../context/NotificationContext";
import { useOrganization } from "../context/OrganizationContext";
import { useWorkspace } from "../context/WorkspaceContext";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Switcher
// ─────────────────────────────────────────────────────────────────────────────
interface Workspace {
  id: string;
  name: string;
  plan: string;
  initial: string;
  color: string;
}

interface Organization {
  id: string;
  name: string;
  workspaces: Workspace[];
}

const MOCK_ORGS: Organization[] = [
  {
    id: "org1",
    name: "Nirmala’s",
    workspaces: [
      {
        id: "ws1",
        name: "India Ops",
        plan: "Growth",
        initial: "AC",
        color: "from-blue-500 to-indigo-600",
      },
      {
        id: "ws2",
        name: "US Ops",
        plan: "Pro",
        initial: "AC",
        color: "from-blue-500 to-indigo-600",
      },
    ],
  },
  {
    id: "org2",
    name: "NA",
    workspaces: [
      {
        id: "ws3",
        name: "Main Workspace",
        plan: "Starter",
        initial: "AC",
        color: "from-blue-500 to-indigo-600",
      },
    ],
  },
];

const WorkspaceSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { organizations } = useOrganization();
  const { workspace, setActiveWorkspaceFunc, activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  // const [activeOrg, setActiveOrg] = useState<Organization>(MOCK_ORGS[0]);
  // const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(
  //   MOCK_ORGS[0].workspaces[0]
  // );
  console.log({ INNNN: organizations });
  console.log({ activeWorkspace });

  const select = (ws: Workspace) => {
    setActiveWorkspaceFunc(ws);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 h-9 px-2.5 rounded-lg transition-colors ${
          open ? "bg-gray-100" : "hover:bg-gray-100"
        }`}
      >
        {/* Workspace avatar */}
        <div
          className={`w-6 h-6 rounded-md bg-gradient-to-br  ${activeWorkspace?.color || "from-blue-500 to-indigo-600"} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}
        >
          {activeWorkspace?.initial || activeWorkspace?.name?.slice(0, 2)}
        </div>
        <span className="text-sm font-semibold text-gray-800 max-w-[140px] truncate hidden sm:block">
          {activeWorkspace?.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Workspaces
              </p>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {organizations?.map((org) => (
                <div key={org.id} className="mb-3">
                  {/* Organization name */}
                  <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {org.name}
                  </div>

                  {/* Workspaces under org */}
                  {org.workspaces?.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        // setActiveOrg(org);
                        setActiveWorkspaceFunc(ws);
                        setOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {ws.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {ws.plan} plan
                        </div>
                      </div>

                      {activeWorkspace.id === ws.id && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div
              className="border-t border-gray-100 p-1.5"
              onClick={() => {
                navigate("/organization");
                setOpen(false);
              }}
            >
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                  <Plus size={14} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  Add workspace
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification panel helpers
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationEventType,
  { icon: React.ReactNode; iconBg: string; iconColor: string }
> = {
  new_message: {
    icon: <MessageCircle size={14} />,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  assign: {
    icon: <UserCheck size={14} />,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  mention: {
    icon: <AtSign size={14} />,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
};

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Panel (drops down from TopBar)
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationPanelProps {
  onClose: () => void;
  onNavigateToInbox: () => void;
}

const NotificationPanel = ({
  onClose,
  onNavigateToInbox,
}: NotificationPanelProps) => {
  const {
    history,
    dismissFromHistory,
    clearHistory,
    soundEnabled,
    toggleSound,
  } = useNotifications();

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 flex flex-col overflow-hidden"
        style={{ maxHeight: "480px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-700" />
            <span className="text-sm font-semibold text-gray-800">
              Notifications
            </span>
            {history.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                {history.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                title="Clear all"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                No notifications yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                New messages, assignments and mentions will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((n: AppNotification) => {
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (n.conversationId != null) {
                        onNavigateToInbox();
                        onClose();
                      }
                    }}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${cfg.iconBg} ${cfg.iconColor}`}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {relativeTime(n.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissFromHistory(n.id);
                      }}
                      className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {soundEnabled ? "Sound on" : "Sound off"}
          </span>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Help Panel
// ─────────────────────────────────────────────────────────────────────────────
const HelpPanel = ({ onClose }: { onClose: () => void }) => (
  <>
    <div className="fixed inset-0 z-10" onClick={onClose} />
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          Help & Resources
        </span>
      </div>
      <div className="p-2">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
        >
          <BookOpen size={16} className="text-gray-400" />
          Documentation
          <ExternalLink size={12} className="ml-auto text-gray-300" />
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
        >
          <MessageSquare size={16} className="text-gray-400" />
          Chat with support
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
        >
          <CheckSquare size={16} className="text-gray-400" />
          Onboarding checklist
        </a>
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100">
        <p className="text-xs text-gray-400">Version 1.0.0</p>
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────────────────────────────────────
export const TopBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();

  const { simulateIncomingCall } = useCall();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/auth/login");
  };

  const openNotifications = useCallback(() => {
    setShowNotifications(true);
    setShowHelp(false);
    setShowUserMenu(false);
    markAllRead();
  }, [markAllRead]);

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left — workspace switcher */}
      <WorkspaceSwitcher />

      {/* Right — action icons */}
      <div className="flex items-center gap-1">
        {/* Simulate incoming call (demo) */}
        <button
          onClick={() => simulateIncomingCall()}
          title="Simulate incoming call (demo)"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors relative"
        >
          <Phone size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
        </button>

        {/* Help */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelp(!showHelp);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              showHelp
                ? "bg-gray-100 text-gray-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Help"
          >
            <HelpCircle size={20} />
          </button>
          {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotifications}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors relative ${
              showNotifications
                ? "bg-gray-100 text-gray-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onNavigateToInbox={() => navigate("/inbox")}
            />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowHelp(false);
            }}
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={user?.name ?? "User"}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user?.avatar ?? "U"}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[120px] truncate">
              {user?.name ?? "User"}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20">
                <div className="p-4 border-b border-gray-100">
                  <div className="font-semibold text-gray-800">
                    {user?.name?.toUpperCase() ?? "USER"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user?.email ?? ""}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/workspace-settings");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/workspace-settings");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg text-sm text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
