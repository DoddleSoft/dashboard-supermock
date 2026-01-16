"use client";

import { usePathname, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Layers,
  Building2,
  ArrowBigDown,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { CentreProvider, useCentre } from "../../../context/CentreContext";
import {
  SidebarItem,
  type NavItem,
} from "../../../components/dashboard/SidebarItem";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, signOut, loading } = useAuth();
  const { currentCenter } = useCentre();
  const [mounted, setMounted] = useState(false);

  // Generate navigation items with proper slug
  const slug = params.slug as string;
  const navigationItems: NavItem[] = [
    { label: "Overview", href: `/dashboard/${slug}`, icon: LayoutDashboard },
    { label: "Students", href: `/dashboard/${slug}/students`, icon: Users },
    { label: "Create Test", href: `/dashboard/${slug}/tests`, icon: FileText },
    { label: "View Papers", href: `/dashboard/${slug}/papers`, icon: Layers },
    {
      label: "View Results",
      href: `/dashboard/${slug}/results`,
      icon: BarChart3,
    },
  ];

  // Set mounted after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  // Show loading only for first 2 seconds or until user state is determined
  if (!mounted || (loading && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`border-r border-slate-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-28" : "w-56"
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
              (item.href !== `/dashboard/${slug}` &&
                pathname.startsWith(item.href));

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

        {/* Logout Button at Bottom */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 group"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center w-full px-8 py-2">
            {/* LEFT: Page Title */}
            <div className="flex-1 flex justify-start">
              <h2 className="text-xl font-semibold text-slate-900">
                {navigationItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== `/dashboard/${slug}` &&
                      pathname.startsWith(item.href))
                )?.label || "Dashboard"}
              </h2>
            </div>

            {/* RIGHT: Profile */}
            <div className="flex gap-4 justify-end">
              {/* CENTER: Center Name */}

              <div className="flex items-center gap-3 pr-4 border-r border-slate-400">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {userProfile?.full_name ||
                      user?.email?.split("@")[0] ||
                      "User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-100 px-5 py-2 rounded-md inset-shadow-sm">
                <Building2 className="w-6 h-6 text-gray-500" />
                <p className="text-md uppercase font-medium text-slate-700">
                  {currentCenter?.name}
                </p>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CentreProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </CentreProvider>
  );
}
