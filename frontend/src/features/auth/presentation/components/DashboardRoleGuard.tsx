"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/features/auth/domain/entities/User";
import {
  canAccessDashboardPath,
  getDefaultDashboardPath,
} from "@/features/auth/domain/navigation/roleNavigation";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";

export function resolveUnauthorizedDashboardRedirect(
  user: User | null,
  pathname: string,
): string | null {
  if (!user) {
    return null;
  }

  if (canAccessDashboardPath(user.role, pathname)) {
    return null;
  }

  return getDefaultDashboardPath(user.role);
}

export interface DashboardRoleGuardViewProps {
  redirectTarget: string | null;
  children: React.ReactNode;
}

export function DashboardRoleGuardView({
  redirectTarget,
  children,
}: DashboardRoleGuardViewProps) {
  if (redirectTarget === null) {
    return <>{children}</>;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 py-16 text-center text-slate-700"
    >
      <p className="text-base font-bold text-slate-950">
        Redirecting to your workspace…
      </p>
      <p className="text-sm text-slate-500">
        Your account does not have access to this dashboard section.
      </p>
      <Link
        href={redirectTarget}
        prefetch={false}
        className="mt-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
      >
        Continue to workspace
      </Link>
    </div>
  );
}

export function DashboardRoleGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth({ autoLoad: true });
  const redirectTarget = resolveUnauthorizedDashboardRedirect(user, pathname);

  useEffect(() => {
    if (redirectTarget !== null) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  return (
    <DashboardRoleGuardView redirectTarget={redirectTarget}>
      {children}
    </DashboardRoleGuardView>
  );
}
