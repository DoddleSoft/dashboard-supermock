import { CentreProvider } from "@/context/CentreContext";
import { ModuleProvider } from "@/context/ModuleContext";
import { AccessProvider } from "@/context/AccessContext";
import DashboardLayoutContent from "../../../components/dashboard/DashboardLayoutContent";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CentreProvider>
      <AccessProvider>
        <ModuleProvider>
          <DashboardLayoutContent initialSidebarCollapsed={false}>
            {children}
          </DashboardLayoutContent>
        </ModuleProvider>
      </AccessProvider>
    </CentreProvider>
  );
}
