import { useState } from "react";
import Sidebar from "../components/sidebar";
import Topbar from "./TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">
        {/* Topbar with hamburger toggle for mobile */}
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
