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
  NotepadText,
  Handshake,
  UserStar,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { CentreProvider, useCentre } from "../../../context/CentreContext";
import { ModuleProvider } from "../../../context/ModuleContext";
import {
  SidebarItem,
  type NavItem,
} from "../../../components/dashboard/SidebarItem";
import { Loader } from "../../../components/ui/Loader";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, signOut, loading } = useAuth();
  const { currentCenter } = useCentre();
  const [mounted, setMounted] = useState(false);

  // Generate navigation items with proper slug
  const slug = params.slug as string;
  const supportItem = {
    label: "Support",
    href: `/dashboard/${slug}/support`,
    icon: Handshake,
  };
  const isSupportActive = pathname === supportItem.href;

  // navigation items
  const navigationItems: NavItem[] = [
    { label: "Overview", href: `/dashboard/${slug}`, icon: LayoutDashboard },
    { label: "Tests", href: `/dashboard/${slug}/tests`, icon: FileText },
    { label: "Questions", href: `/dashboard/${slug}/questions`, icon: Layers },
    { label: "Papers", href: `/dashboard/${slug}/papers`, icon: NotepadText },

    {
      label: "Reviews",
      href: `/dashboard/${slug}/reviews`,
      icon: BarChart3,
    },
    { label: "Students", href: `/dashboard/${slug}/students`, icon: Users },
    { label: "Members", href: `/dashboard/${slug}/members`, icon: UserStar },
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
    return <Loader />;
  }

  if (currentCenter && currentCenter.status === "rejected") {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-slate-50">
        <div className="w-full max-w-full bg-white shadow-xl shadow-red-100 p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 mb-8">
            Your center has been suspended. Please contact support to appeal
            this decision.
          </p>

          <div className="space-y-4 flex flex-col items-center justify-center">
            {/* Primary Action */}
            <a
              href="mailto:contact@supermock.net"
              className="flex items-center justify-center w-md px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-md shadow-red-200"
            >
              Contact Supermock
            </a>

            {/* Secondary Action */}
            <button
              onClick={handleLogout}
              className="w-md px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Auth-style Divider */}
          <div className="relative my-8 ">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full mx-72 border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">
                Or Email
              </span>
            </div>
          </div>

          {/* Link-style Contact */}
          <a
            href="mailto:contact@supermock.net"
            className="text-xl font-semibold text-slate-700 hover:text-red-600 transition-colors"
          >
            contact@supermock.net
          </a>
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
            const isCreateModuleRoute = pathname.startsWith(
              `/dashboard/${slug}/create/modules`,
            );
            const isQuestionsRoute = pathname.startsWith(
              `/dashboard/${slug}/questions`,
            );

            const isActive =
              pathname === item.href ||
              (item.href !== `/dashboard/${slug}` &&
                pathname.startsWith(item.href)) ||
              (item.label === "Questions" &&
                (isQuestionsRoute || isCreateModuleRoute));

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

        <div className="px-3 pb-2">
          <SidebarItem
            item={supportItem}
            isCollapsed={isCollapsed}
            isActive={isSupportActive}
          />
        </div>

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
            <div className="flex-1 flex justify-start items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {navigationItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== `/dashboard/${slug}` &&
                      pathname.startsWith(item.href)),
                )?.label || "Dashboard"}
              </h2>
              <div className="h-8 bg-slate-300 w-[2px]"></div>
              <p className="text-sm text-gray-700 font-semibold">
                Dashboard Portal
              </p>
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

              <div className="bg-red-50 px-5 py-1 rounded-md border border-slate-200 shadow-inner">
                <p
                  className="font-radeil text-2xl uppercase text-slate-700 tracking-tighter"
                  style={{ fontFamily: "var(--font-radeil)" }}
                >
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
      <ModuleProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </ModuleProvider>
    </CentreProvider>
  );
}
