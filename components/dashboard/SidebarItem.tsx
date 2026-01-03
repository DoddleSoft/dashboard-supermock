"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}

export function SidebarItem({ item, isCollapsed, isActive }: SidebarItemProps) {
  const { href, label, icon: Icon } = item;

  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "flex items-center rounded-md font-medium transition-all duration-200 ease-in-out",
          "px-4 py-2.5 gap-3",
          isActive
            ? "bg-red-50 text-red-600 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && (
          <span className="whitespace-nowrap text-sm">{label}</span>
        )}
      </div>
    </Link>
  );
}
