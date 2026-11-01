"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useJobseekerApplicationsStore } from "@/features/applications/presentation/store/jobseekerApplicationsStore";
import type { User } from "@/features/auth/domain/entities/User";
import {
  getDefaultDashboardPath,
  getRoleLabel,
  getRoleNavigationItems,
  inferRoleFromPathname,
  isNavItemActive,
} from "@/features/auth/domain/navigation/roleNavigation";
import { AccountSettingsDialog } from "@/features/auth/presentation/components/AccountSettingsDialog";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";
import { useSavedJobsStore } from "@/features/jobs/presentation/store/savedJobsStore";
import { NotificationCenterDropdown } from "@/features/notifications/presentation/components/NotificationCenterDropdown";
import { useNotificationsStore } from "@/features/notifications/presentation/store/notificationsStore";

export interface SessionNavigationRouter {
  replace: (href: string) => void;
  refresh: () => void;
}

export async function performDashboardSignOut(
  logout: () => Promise<void>,
  router: SessionNavigationRouter,
  onAfterSignOut?: () => void,
): Promise<void> {
  await logout();
  onAfterSignOut?.();
  router.replace("/login");
  router.refresh();
}

export interface DashboardSessionHeaderViewProps {
  pathname: string;
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  onOpenSettings?: () => void;
  onSignOut: () => void | Promise<void>;
}

export function DashboardSessionHeaderView({
  pathname,
  user,
  isLoading,
  isLoggingOut,
  onOpenSettings,
  onSignOut,
}: DashboardSessionHeaderViewProps) {
  const activeRole =
    user?.role ?? inferRoleFromPathname(pathname) ?? "jobseeker";
  const navItems = getRoleNavigationItems(activeRole);
  const homeHref = getDefaultDashboardPath(activeRole);
  const roleLabel = getRoleLabel(activeRole);

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-4 py-3 text-white sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <Link
            href={homeHref}
            prefetch={false}
            className="inline-flex items-center gap-2.5 text-sm font-bold tracking-tight text-white transition hover:text-emerald-300"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-md bg-emerald-500 text-xs font-extrabold text-slate-950"
            >
              JB
            </span>
            <span>JobBoard</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {roleLabel}
            </span>
          </Link>

          <nav aria-label="Workspace navigation">
            <ul className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
              {navItems.map((item) => {
                const active = isNavItemActive(item, pathname);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? "bg-emerald-500 text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          {isLoading && !user ? (
            <div
              aria-label="Loading active user session"
              className="h-5 w-28 animate-pulse rounded bg-white/10"
            />
          ) : user ? (
            <>
              <div className="max-w-[200px] truncate text-right sm:max-w-xs">
                <p className="truncate font-semibold text-slate-100">
                  {user.name}
                </p>
                <p className="hidden truncate text-xs text-slate-400 sm:block">
                  {user.email}
                </p>
              </div>
              {onOpenSettings ? (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10 sm:text-sm"
                >
                  Account settings
                </button>
              ) : null}
              <NotificationCenterDropdown />
            </>
          ) : null}

          <button
            type="button"
            onClick={onSignOut}
            disabled={isLoggingOut}
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function DashboardSessionHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isLoggingOut, updateProfile, logout } = useAuth({
    autoLoad: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <DashboardSessionHeaderView
        pathname={pathname}
        user={user}
        isLoading={isLoading}
        isLoggingOut={isLoggingOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={() =>
          performDashboardSignOut(logout, router, () => {
            useSavedJobsStore.getState().resetSavedJobs();
            useJobseekerApplicationsStore
              .getState()
              .resetJobseekerApplications();
            useNotificationsStore.getState().resetNotifications();
          })
        }
      />
      {user ? (
        <AccountSettingsDialog
          key={`${user.id}-${isSettingsOpen ? "open" : "closed"}`}
          isOpen={isSettingsOpen}
          user={user}
          onUpdateProfile={updateProfile}
          onClose={() => setIsSettingsOpen(false)}
        />
      ) : null}
    </>
  );
}
