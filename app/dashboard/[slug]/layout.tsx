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
import Image from "next/image";
import { getCenterUsage, type CenterUsage } from "../../../helpers/usage";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, signOut, loading } = useAuth();
  const { currentCenter } = useCentre();
  const [mounted, setMounted] = useState(false);
  const [usage, setUsage] = useState<CenterUsage | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);

  // Fetch usage whenever the center changes
  useEffect(() => {
    if (currentCenter?.center_id) {
      setUsageLoaded(false);
      getCenterUsage(currentCenter.center_id).then((result) => {
        setUsage(result);
        setUsageLoaded(true);
      });
    }
  }, [currentCenter?.center_id]);

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
    <div className="flex h-screen bg-slate-800">
      {/* Sidebar */}
      <aside
        className={`border-r border-slate-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? "w-24" : "w-52"
        }`}
      >
        <div className="flex items-center gap-2 p-4">
          <Image
            src="/supermock-logo.png"
            alt="SuperMock Logo"
            width={30}
            height={30}
          />

          <h1 className="text-xl font-bold whitespace-nowrap">
            {!isCollapsed && (
              <div>
                <span className="text-white">Super</span>
                <span className="text-red-600">Mock</span>
              </div>
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

        <div className="p-3 space-y-2 bg-slate-900 m-2 rounded-md">
          {!isCollapsed && (
            <>
              {/* Header row */}
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
                  Storage
                </p>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase tracking-wide">
                  {usage?.tier_name ?? "—"}
                </span>
              </div>

              {/* GB numbers */}
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  {!usageLoaded
                    ? "Calculating…"
                    : usage
                      ? `${usage.used_gb} GB used`
                      : "No data"}
                </span>
                <span className="text-slate-300 font-medium">
                  {usage ? `${usage.limit_gb} GB` : ""}
                </span>
              </div>
            </>
          )}

          {/* Progress bar — shown in both states */}
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            {usage ? (
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  usage.used_pct >= 90
                    ? "bg-red-500"
                    : usage.used_pct >= 70
                      ? "bg-yellow-400"
                      : "bg-green-500"
                }`}
                style={{ width: `${usage.used_pct}%` }}
              />
            ) : (
              <div className="h-1.5 w-0 bg-slate-600 rounded-full" />
            )}
          </div>
        </div>

        <div className="relative space-y-2">
          {/* Border only */}
          <div className="absolute left-3 right-3 top-0 border-t-2 border-slate-500"></div>

          {/* Content */}
          <div className="p-3 space-y-2">
            <SidebarItem
              item={supportItem}
              isCollapsed={isCollapsed}
              isActive={isSupportActive}
            />
            <button
              onClick={handleLogout}
              className="text-slate-100 hover:text-slate-300 bg-red-600 hover:bg-red-700 w-full flex items-center rounded-md font-medium transition-all duration-200 ease-in-out px-4 py-2 gap-3"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap text-md">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center w-full px-8 py-2">
            {/* LEFT: Page Title */}
            <div className="flex-1 flex justify-start items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {navigationItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== `/dashboard/${slug}` &&
                      pathname.startsWith(item.href)),
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

              <div className="bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm shadow-red-200">
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
