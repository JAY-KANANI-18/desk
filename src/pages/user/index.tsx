import { Bell, CircleUserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const items = [
  {
    label: "Profile",
    path: "/user/settings/profile",
    icon: <CircleUserRound size={16} />,
  },
  {
    label: "Notifications",
    path: "/user/settings/notifications",
    icon: <Bell size={16} />,
  },
];

const titleMap: Record<string, string> = {
  "/user/settings/profile": "Profile",
  "/user/settings/notifications": "Notification Preferences",
};

export const UserSettingsLayout = () => {
  const location = useLocation();

  return (
    <div className="h-full flex bg-white flex-col md:flex-row">
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">User settings</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            {titleMap[location.pathname] || "User settings"}
          </h1>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
