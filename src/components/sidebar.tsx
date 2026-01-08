import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/UseAuth";
import {
  LayoutDashboard,
  Send,
  Users,
  Megaphone,
  BarChart3,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/send-sms", label: "Send SMS", icon: Send },
    { to: "/dashboard/contacts", label: "Contacts", icon: Users },
    { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          ${isCollapsed ? "w-20" : "w-72"}
          bg-slate-50 border-r border-slate-200
          transition-all duration-300
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
          flex flex-col
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              SMS
            </div>

            {!isCollapsed && (
              <div>
                <p className="text-sm font-bold text-slate-800">BulkSMS</p>
                <p className="text-xs text-slate-500">Messaging Platform</p>
              </div>
            )}
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* User */}
        {!isCollapsed && (
          <div className="px-6 py-4 border-b hidden md:block">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user?.email}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}   
              className={({ isActive }) =>
                `
                group relative flex items-center gap-3
                ${isCollapsed ? "justify-center px-2" : "px-4"}
                py-3 rounded-xl text-sm font-medium transition
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                }
              `
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-indigo-600" />
                  )}

                  <Icon size={18} />

                  {!isCollapsed && <span>{label}</span>}

                  {/* Tooltip (collapsed) */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-3 px-3 py-1.5 text-xs rounded-md bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
