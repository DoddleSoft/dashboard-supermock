"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Phone,
  Shield,
  HelpCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCentre, type Center } from "@/context/CentreContext";
import GeneralProfileSection from "./GeneralProfileSection";
import ContactOperationsSection from "./ContactOperationsSection";
import AccountSecuritySection from "./AccountSecuritySection";
import HelpResourcesSection from "./HelpResourcesSection";

type SectionId = "general" | "contact" | "security" | "help";

const SECTIONS: { id: SectionId; label: string; icon: typeof Building2 }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "security", label: "Account & Security", icon: Shield },
  { id: "help", label: "Help & Resources", icon: HelpCircle },
];

export default function SettingsLayoutComponent() {
  const params = useParams();
  const slug = params.slug as string;
  const { refreshCenters } = useCentre();

  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [settings, setSettings] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/settings?slug=${encodeURIComponent(slug)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchSettings();
  }, [slug, fetchSettings]);

  const handleSave = async (updates: Partial<Center>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug, ...updates }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save");
    }

    const data = await res.json();
    setSettings(data.settings);

    // Refresh CentreContext so header/sidebar pick up name changes
    refreshCenters();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500">
        <Settings className="h-12 w-12 mb-3 text-slate-300" />
        <p className="text-lg font-medium">Unable to load settings</p>
        <p className="text-sm">Please check your access permissions.</p>
      </div>
    );
  }

  return (
    <div className="flex bg-white border border-slate-200 shadow-sm">
      {/* Settings Sidebar */}
      <aside className="w-60 border-r border-slate-200">
        <nav className="p-3 space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-red-50 text-red-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-red-600" : "text-slate-400",
                  )}
                />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeSection === "general" && (
          <GeneralProfileSection settings={settings} onSave={handleSave} />
        )}
        {activeSection === "contact" && (
          <ContactOperationsSection settings={settings} onSave={handleSave} />
        )}
        {activeSection === "security" && <AccountSecuritySection />}
        {activeSection === "help" && <HelpResourcesSection />}
      </main>
    </div>
  );
}
