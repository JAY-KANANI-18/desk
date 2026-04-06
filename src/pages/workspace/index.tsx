import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Settings,
  Users,
  Tag,
  GitBranch,
} from "lucide-react";

export const menuSections = [
  {
    title: "General",
    items: [
      {
        name: "General info",
        path: "/workspace/settings/general-info",
        icon: <Settings size={16} />,
      },
      {
        name: "User settings",
        path: "/workspace/settings/users-settings",
        icon: <Users size={16} />,
      },
      {
        name: "Workspace users",
        path: "/workspace/settings/users",
        icon: <Users size={16} />,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        name: "Lifecycle",
        path: "/workspace/settings/lifecycle",
        icon: <GitBranch size={16} />,
      },
      {
        name: "Tags",
        path: "/workspace/settings/tags",
        icon: <Tag size={16} />,
      },
    ],
  },
];
// Map route path -> title
const routeTitleMap: Record<string, string> = {
  "/workspace/settings/general-info": "General info",
  "/workspace/settings/users-settings": "User settings",
  "/workspace/settings/users": "Workspace users",
  "/workspace/settings/lifecycle": "Lifecycle",
  "/workspace/settings/tags": "Tags",
};

const SettingsSidebar = () => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          Workspace settings
        </h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs text-gray-400 font-medium px-2 mb-1">
              {section.title}
            </p>

            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={
                              isActive ? "text-indigo-600" : "text-gray-500"
                            }
                          >
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>

                        {item.badge && (
                          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
};

export const WorkspaceSettings = () => {
  const location = useLocation();

  const activeTitle =
    routeTitleMap[location.pathname] || "Workspace settings";

  return (
    <div className="h-full flex bg-white flex-col md:flex-row">
      <SettingsSidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {activeTitle}
          </h1>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

