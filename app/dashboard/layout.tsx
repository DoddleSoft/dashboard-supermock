"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  LogOut,
  Layers,
} from "lucide-react";
import {
  SidebarItem,
  type NavItem,
} from "../../components/dashboard/SidebarItem";

const navigationItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Create Test", href: "/dashboard/tests", icon: FileText },
  { label: "View Papers", href: "/dashboard/papers", icon: Layers },
  { label: "View Results", href: "/dashboard/results", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`border-r border-slate-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-24" : "w-52"
        }`}
      >
        <div className="py-3 px-4 border-b border-slate-200">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
            {!isCollapsed && (
              <>
                Super<span className="text-red-600">Mock</span>
              </>
            )}
            {isCollapsed && <span className="text-red-600">S</span>}
          </h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <SidebarItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-2">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">
                {navigationItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href))
                )?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">Admin</p>
                  <p className="text-xs text-slate-500">redwan@gmail.com</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
