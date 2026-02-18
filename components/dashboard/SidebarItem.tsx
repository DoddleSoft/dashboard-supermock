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
          "px-4 py-2 gap-3",
          isActive
            ? "bg-gray-700 text-red-500 shadow-sm"
            : "text-gray-50 hover:bg-gray-50 hover:text-red-700",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <span className="whitespace-nowrap text-md">{label}</span>
        )}
      </div>
    </Link>
  );
}
