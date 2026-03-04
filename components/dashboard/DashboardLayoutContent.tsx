"use client";

import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  Handshake,
  LayoutDashboard,
  Layers,
  LogOut,
  NotepadText,
  PanelLeftClose,
  PanelLeftOpen,
  UserStar,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCentre } from "@/context/CentreContext";
import { useAccess } from "@/context/AccessContext";
import { SidebarItem, type NavItem } from "@/components/dashboard/SidebarItem";
import { getCenterUsage, type CenterUsage } from "@/helpers/usage";

const SIDEBAR_COOKIE = "dashboard_sidebar_collapsed";

export default function DashboardLayoutContent({
  children,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  initialSidebarCollapsed: boolean;
}) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  const { user, userProfile, signOut } = useAuth();
  const { currentCenter } = useCentre();
  const { role, canAccess } = useAccess();

  const [usage, setUsage] = useState<CenterUsage | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);

  useEffect(() => {
    const value = initialSidebarCollapsed ? "1" : "0";
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }, [initialSidebarCollapsed]);

  useEffect(() => {
    if (!slug || (role !== "owner" && role !== "admin")) {
      setUsage(null);
      setUsageLoaded(true);
      return;
    }

    setUsageLoaded(false);
    getCenterUsage(slug)
      .then((result) => {
        setUsage(result);
      })
      .finally(() => {
        setUsageLoaded(true);
      });
  }, [slug, role]);

  const allNavigationItems: NavItem[] = useMemo(
    () => [
      { label: "Overview", href: `/dashboard/${slug}`, icon: LayoutDashboard },
      { label: "Tests", href: `/dashboard/${slug}/tests`, icon: FileText },
      {
        label: "Questions",
        href: `/dashboard/${slug}/questions`,
        icon: Layers,
      },
      { label: "Papers", href: `/dashboard/${slug}/papers`, icon: NotepadText },
      { label: "Reviews", href: `/dashboard/${slug}/reviews`, icon: BarChart3 },
      { label: "Students", href: `/dashboard/${slug}/students`, icon: Users },
      { label: "Members", href: `/dashboard/${slug}/members`, icon: UserStar },
    ],
    [slug],
  );

  const navigationItems = allNavigationItems.filter((item) =>
    canAccess(item.href),
  );

  const supportItem = {
    label: "Support",
    href: `/dashboard/${slug}/support`,
    icon: Handshake,
  };

  const isSupportActive = pathname === supportItem.href;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-slate-800">
      <aside
        className={`border-r border-slate-200 flex flex-col transition-all duration-300 ${
          initialSidebarCollapsed ? "w-24" : "w-52"
        }`}
      >
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <Image
              src="/supermock-logo.png"
              alt="SuperMock Logo"
              width={30}
              height={30}
            />

            <h1 className="text-xl font-bold whitespace-nowrap">
              {!initialSidebarCollapsed && (
                <div>
                  <span className="text-white">Super</span>
                  <span className="text-red-600">Mock</span>
                </div>
              )}
            </h1>
          </div>
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
                isCollapsed={initialSidebarCollapsed}
                isActive={isActive}
              />
            );
          })}
        </nav>

        {(role === "owner" || role === "admin") && (
          <div className="p-3 space-y-2 bg-slate-900 m-2 rounded-md">
            {!initialSidebarCollapsed && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
                    Storage
                  </p>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase tracking-wide">
                    {usage?.tier_name ?? "—"}
                  </span>
                </div>

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
        )}

        <div className="relative space-y-2">
          <div className="absolute left-3 right-3 top-0 border-t-2 border-slate-500" />

          <div className="p-3 space-y-2">
            <SidebarItem
              item={supportItem}
              isCollapsed={initialSidebarCollapsed}
              isActive={isSupportActive}
            />
            <button
              onClick={handleLogout}
              className="text-slate-100 hover:text-slate-300 bg-red-600 hover:bg-red-700 w-full flex items-center rounded-md font-medium transition-all duration-200 ease-in-out px-4 py-2 gap-3"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!initialSidebarCollapsed && (
                <span className="whitespace-nowrap text-md">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center w-full px-8 py-2">
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

            <div className="flex gap-4 items-center justify-end">
              <div className="flex items-center gap-3 pr-4 border-r border-r-[3px] border-slate-400">
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

              <div className="bg-white bg-slate-800 rounded-sm">
                <p
                  className="font-maian text-xl px-3 py-1 bg-slate-800 rounded-sm uppercase text-slate-200 tracking-tighter"
                  style={{ fontFamily: "var(--font-maian)" }}
                >
                  {currentCenter?.name}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
