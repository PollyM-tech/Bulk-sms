// src/layout/TopBar.tsx
import { useAuth } from "../hooks/UseAuth";

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        className="md:hidden text-2xl"
        onClick={toggleSidebar}
      >
        ☰
      </button>

      {/* Left: Title */}
      <div className="flex flex-col justify-center truncate ml-2 md:ml-0">
        <h2 className="text-lg font-semibold text-gray-800 truncate">
          Bulk SMS Dashboard
        </h2>
        <p className="text-xs text-gray-500 truncate">
          Manage messages & campaigns
        </p>
      </div>

      {/* Right: Credits + User */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap">
          💳 Credits: <span className="font-bold">1,250</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700 truncate">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
