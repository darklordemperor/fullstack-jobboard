import type { UserRole } from "../entities/User";

export interface DashboardNavItem {
  label: string;
  href: string;
  matchPrefixes: readonly string[];
}

const DEFAULT_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  employer: "/employer/jobs",
  jobseeker: "/jobseeker/browse",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  employer: "Employer",
  jobseeker: "Jobseeker",
};

const ROLE_ALLOWED_PREFIXES: Record<UserRole, string> = {
  admin: "/admin",
  employer: "/employer",
  jobseeker: "/jobseeker",
};

const ROLE_NAVIGATION_ITEMS: Record<UserRole, readonly DashboardNavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      matchPrefixes: ["/admin/dashboard"],
    },
  ],
  employer: [
    {
      label: "Job listings",
      href: "/employer/jobs",
      matchPrefixes: ["/employer/jobs"],
    },
    {
      label: "Interviews",
      href: "/employer/interviews",
      matchPrefixes: ["/employer/interviews"],
    },
  ],
  jobseeker: [
    {
      label: "Browse jobs",
      href: "/jobseeker/browse",
      matchPrefixes: ["/jobseeker/browse"],
    },
    {
      label: "My applications",
      href: "/jobseeker/applications",
      matchPrefixes: ["/jobseeker/applications"],
    },
    {
      label: "My interviews",
      href: "/jobseeker/interviews",
      matchPrefixes: ["/jobseeker/interviews"],
    },
  ],
};

export function getDefaultDashboardPath(role: UserRole): string {
  return DEFAULT_DASHBOARD_PATHS[role];
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleNavigationItems(
  role: UserRole,
): readonly DashboardNavItem[] {
  return ROLE_NAVIGATION_ITEMS[role];
}

export function inferRoleFromPathname(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }
  if (pathname === "/employer" || pathname.startsWith("/employer/")) {
    return "employer";
  }
  if (pathname === "/jobseeker" || pathname.startsWith("/jobseeker/")) {
    return "jobseeker";
  }
  return null;
}

export function canAccessDashboardPath(
  role: UserRole,
  pathname: string,
): boolean {
  const allowedPrefix = ROLE_ALLOWED_PREFIXES[role];
  return (
    pathname === allowedPrefix || pathname.startsWith(`${allowedPrefix}/`)
  );
}

export function isNavItemActive(
  item: DashboardNavItem,
  pathname: string,
): boolean {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolvePostAuthRedirect(
  role: UserRole,
  nextParam?: string | null,
): string {
  if (
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    canAccessDashboardPath(role, nextParam)
  ) {
    return nextParam;
  }

  return getDefaultDashboardPath(role);
}
