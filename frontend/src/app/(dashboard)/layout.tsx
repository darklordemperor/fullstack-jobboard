import { DashboardRoleGuard } from "@/features/auth/presentation/components/DashboardRoleGuard";
import { DashboardSessionHeader } from "@/features/auth/presentation/components/DashboardSessionHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardSessionHeader />
      <div className="flex-1">
        <DashboardRoleGuard>{children}</DashboardRoleGuard>
      </div>
    </div>
  );
}
