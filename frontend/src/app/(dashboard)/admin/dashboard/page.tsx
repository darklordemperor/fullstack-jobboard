"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminDashboard,
  listAdminUsers,
  updateAdminUser,
} from "@/features/admin/composition/adminDependencies";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import type {
  AdminActivityType,
  AdminDashboard,
  AdminGrowthPoint,
  AdminMetric,
  AdminUserPage,
  AdminUserRole,
  AdminUserStatus,
} from "@/features/admin/domain/entities/AdminDashboard";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

interface DistributionEntry {
  name: string;
  value: number;
  color: string;
}

interface GrowthChartProps {
  data: AdminGrowthPoint[];
}

interface DistributionChartProps {
  data: DistributionEntry[];
}

function statusClassName(status: AdminUserStatus): string {
  if (status === "suspended") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return status === "verified"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-amber-50 text-amber-700 ring-amber-200";
}

function roleClassName(role: AdminUserRole): string {
  if (role === "employer") return "bg-blue-50 text-blue-700";
  if (role === "admin") return "bg-slate-100 text-slate-700";
  return "bg-emerald-50 text-emerald-700";
}

function activityClassName(type: AdminActivityType): string {
  const colors: Record<AdminActivityType, string> = {
    user_registered: "bg-emerald-500 shadow-[0_0_0_4px_rgb(209_250_229)]",
    job_published: "bg-blue-500 shadow-[0_0_0_4px_rgb(219_234_254)]",
    application_submitted: "bg-orange-500 shadow-[0_0_0_4px_rgb(255_237_213)]",
    candidate_hired: "bg-violet-500 shadow-[0_0_0_4px_rgb(237_233_254)]",
  };

  return colors[type];
}

function formatRole(role: AdminUserRole): string {
  return role === "jobseeker" ? "Jobseeker" : role.charAt(0).toUpperCase() + role.slice(1);
}

function formatRelativeTime(occurredAt: string, generatedAt: string): string {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.parse(generatedAt) - Date.parse(occurredAt)) / 1000),
  );

  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86_400)}d ago`;
}

function trendPresentation(changePercent: number | null): {
  className: string;
  label: string;
  direction: "up" | "down" | "flat";
} {
  if (changePercent === null) {
    return { className: "bg-blue-50 text-blue-700", label: "New", direction: "up" };
  }
  if (changePercent > 0) {
    return {
      className: "bg-emerald-50 text-emerald-700",
      label: `+${changePercent}%`,
      direction: "up",
    };
  }
  if (changePercent < 0) {
    return {
      className: "bg-red-50 text-red-700",
      label: `${changePercent}%`,
      direction: "down",
    };
  }
  return { className: "bg-slate-100 text-slate-600", label: "0%", direction: "flat" };
}

function PlatformGrowthChart({ data }: GrowthChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    month: monthFormatter.format(new Date(`${point.month}-01T00:00:00Z`)),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 18, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="usersGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="jobsGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="applicationsGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
          contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 25px rgb(15 23 42 / 0.08)" }}
        />
        <Area type="monotone" dataKey="applications" stroke="#f97316" strokeWidth={3} fill="url(#applicationsGradient)" name="Applications" />
        <Area type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={3} fill="url(#usersGradient)" name="New users" />
        <Area type="monotone" dataKey="newJobListings" stroke="#2563eb" strokeWidth={3} fill="url(#jobsGradient)" name="New jobs" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function UserDistributionChart({ data }: DistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={3} stroke="none">
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip
          formatter={(value, name) => [numberFormatter.format(Number(value ?? 0)), String(name)]}
          contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 25px rgb(15 23 42 / 0.08)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const GrowthChart = dynamic<GrowthChartProps>(() => Promise.resolve(PlatformGrowthChart), { ssr: false });
const DistributionChart = dynamic<DistributionChartProps>(() => Promise.resolve(UserDistributionChart), { ssr: false });

function MetricCard({ label, metric }: { label: string; metric: AdminMetric }) {
  const trend = trendPresentation(metric.changePercent);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold text-slate-950">{numberFormatter.format(metric.value)}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${trend.className}`}>
          {trend.direction === "up" && <span aria-hidden="true">↗</span>}
          {trend.direction === "down" && <span aria-hidden="true">↘</span>}
          {trend.direction === "flat" && <span aria-hidden="true">→</span>}
          {trend.label}
        </span>
      </div>
    </article>
  );
}

function LoadingDashboard() {
  return (
    <div aria-label="Loading admin analytics" className="mx-auto grid max-w-7xl animate-pulse gap-6" role="status">
      <span className="sr-only">Loading admin analytics…</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 rounded-xl bg-slate-200" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[30rem] rounded-xl bg-slate-200" />
        <div className="h-[30rem] rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);

  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<AdminUserRole | "">("");
  const [userStatus, setUserStatus] = useState<AdminUserStatus | "">("");
  const [userPageNumber, setUserPageNumber] = useState(1);
  const [userDirectory, setUserDirectory] = useState<AdminUserPage | null>(null);
  const [userDirectoryLoading, setUserDirectoryLoading] = useState(true);

  const [pendingAction, setPendingAction] = useState<{
    userId: number;
    userName: string;
    type: "suspend" | "reactivate" | "role_change";
    newRole?: AdminUserRole;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction.type === "suspend") {
        await updateAdminUser.execute(pendingAction.userId, { suspended: true });
      } else if (pendingAction.type === "reactivate") {
        await updateAdminUser.execute(pendingAction.userId, { suspended: false });
      } else if (pendingAction.type === "role_change" && pendingAction.newRole) {
        await updateAdminUser.execute(pendingAction.userId, {
          role: pendingAction.newRole,
        });
      }
      setPendingAction(null);
      setRequestVersion((v) => v + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update user.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = userSearchInput.trim();
      setUserSearch((current) => {
        if (current !== normalized) {
          setUserPageNumber(1);
          setUserDirectoryLoading(true);
        }
        return normalized;
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [userSearchInput]);

  useEffect(() => {
    let active = true;

    getAdminDashboard.execute()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load admin analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [requestVersion]);

  useEffect(() => {
    let active = true;

    listAdminUsers
      .execute({
        search: userSearch || undefined,
        role: userRole || undefined,
        status: userStatus || undefined,
        page: userPageNumber,
        perPage: 10,
      })
      .then((result) => {
        if (active) setUserDirectory(result);
      })
      .catch(() => {
        if (active) setUserDirectory(null);
      })
      .finally(() => {
        if (active) setUserDirectoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestVersion, userPageNumber, userRole, userSearch, userStatus]);

  const distribution = useMemo<DistributionEntry[]>(() => dashboard ? [
    { name: "Employers", value: dashboard.userDistribution.employers, color: "#2563eb" },
    { name: "Jobseekers", value: dashboard.userDistribution.jobseekers, color: "#10b981" },
  ] : [], [dashboard]);
  const totalDistributedUsers = distribution.reduce((total, entry) => total + entry.value, 0);

  function retry(): void {
    setError(null);
    setLoading(true);
    setUserDirectoryLoading(true);
    setRequestVersion((version) => version + 1);
  }

  function exportCsvReport(): void {
    if (!dashboard) return;
    const rows: string[][] = [
      ["Section", "Key", "Value", "Extra"],
      ["Metric", "Total users", String(dashboard.stats.totalUsers.value), String(dashboard.stats.totalUsers.changePercent ?? "")],
      ["Metric", "Employers", String(dashboard.stats.totalEmployers.value), String(dashboard.stats.totalEmployers.changePercent ?? "")],
      ["Metric", "Jobseekers", String(dashboard.stats.totalJobseekers.value), String(dashboard.stats.totalJobseekers.changePercent ?? "")],
      ["Metric", "Job listings", String(dashboard.stats.totalJobListings.value), String(dashboard.stats.totalJobListings.changePercent ?? "")],
      ["Metric", "Applications today", String(dashboard.stats.applicationsToday.value), String(dashboard.stats.applicationsToday.changePercent ?? "")],
      ["Metric", "Hires this month", String(dashboard.stats.hiresThisMonth.value), String(dashboard.stats.hiresThisMonth.changePercent ?? "")],
      ...dashboard.growth.map((point) => [
        "Growth",
        point.month,
        `users:${point.newUsers}|jobs:${point.newJobListings}|applications:${point.applications}`,
        "",
      ]),
      ...(userDirectory?.items ?? dashboard.latestUsers).map((user) => [
        "User",
        user.email,
        user.name,
        `${user.role}:${user.status}`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jobboard-admin-report-${dashboard.generatedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Admin Analytics</p>
            <h1 className="mt-2 text-3xl font-bold">Platform dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Monitor user growth, published jobs, applications, and hiring outcomes from live platform data.</p>
          </div>
          <div className="flex flex-wrap gap-3 self-start lg:self-auto">
            {dashboard ? (
              <button
                type="button"
                onClick={exportCsvReport}
                className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Export CSV report
              </button>
            ) : null}
            <button
              type="button"
              onClick={retry}
              disabled={loading}
              className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </div>
      </header>

      <section className="px-5 py-7 sm:px-8 lg:px-10">
        {loading && <LoadingDashboard />}

        {!loading && error && (
          <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm" role="alert">
            <p className="text-lg font-bold text-slate-950">Analytics could not be loaded</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={retry} className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Try again</button>
          </div>
        )}

        {!loading && !error && dashboard && (
          <div className="mx-auto grid max-w-7xl gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard label="Total users" metric={dashboard.stats.totalUsers} />
              <MetricCard label="Employers" metric={dashboard.stats.totalEmployers} />
              <MetricCard label="Jobseekers" metric={dashboard.stats.totalJobseekers} />
              <MetricCard label="Job listings" metric={dashboard.stats.totalJobListings} />
              <MetricCard label="Applications today" metric={dashboard.stats.applicationsToday} />
              <MetricCard label="Hires this month" metric={dashboard.stats.hiresThisMonth} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="grid gap-6">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-lg font-bold">Platform growth</h2>
                      <p className="mt-1 text-sm text-slate-500">Six-month activity in UTC</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold">
                      <span className="text-emerald-700">New users</span>
                      <span className="text-blue-700">New jobs</span>
                      <span className="text-orange-600">Applications</span>
                    </div>
                  </div>
                  <div className="mt-6 h-80">
                    <GrowthChart data={dashboard.growth} />
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center">
                    <div>
                      <h2 className="text-lg font-bold">Platform user directory</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Search and filter registered accounts across every platform role.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div>
                        <label htmlFor="admin-user-search" className="sr-only">
                          Search users by name or email
                        </label>
                        <input
                          id="admin-user-search"
                          name="search"
                          type="search"
                          placeholder="Search name or email…"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          value={userSearchInput}
                          onChange={(event) => setUserSearchInput(event.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 sm:w-52"
                        />
                      </div>
                      <label className="sr-only" htmlFor="admin-user-role-filter">
                        Filter users by role
                      </label>
                      <select
                        id="admin-user-role-filter"
                        aria-label="Filter users by role"
                        value={userRole}
                        onChange={(event) => {
                          setUserRole(event.target.value as AdminUserRole | "");
                          setUserPageNumber(1);
                          setUserDirectoryLoading(true);
                        }}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="">All roles</option>
                        <option value="employer">Employer</option>
                        <option value="jobseeker">Jobseeker</option>
                        <option value="admin">Admin</option>
                      </select>
                      <label className="sr-only" htmlFor="admin-user-status-filter">
                        Filter users by verification status
                      </label>
                      <select
                        id="admin-user-status-filter"
                        aria-label="Filter users by verification status"
                        value={userStatus}
                        onChange={(event) => {
                          setUserStatus(event.target.value as AdminUserStatus | "");
                          setUserPageNumber(1);
                          setUserDirectoryLoading(true);
                        }}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="">All statuses</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  {actionError && (
                    <div
                      role="alert"
                      className="mx-5 mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
                    >
                      {actionError}
                    </div>
                  )}
                  {(() => {
                    const displayedUsers = userDirectory?.items ?? dashboard.latestUsers;
                    if (userDirectoryLoading && !userDirectory) {
                      return (
                        <div className="space-y-2 p-5" aria-label="Loading user directory">
                          {[1, 2, 3].map((row) => (
                            <div key={row} className="h-10 animate-pulse rounded bg-slate-100" />
                          ))}
                        </div>
                      );
                    }
                    if (displayedUsers.length === 0) {
                      return (
                        <p className="px-5 py-12 text-center text-sm font-medium text-slate-500">
                          No users match the selected filters.
                        </p>
                      );
                    }
                    return (
                      <>
                        <div
                          tabIndex={0}
                          role="region"
                          aria-labelledby="admin-users-table-caption"
                          className="overflow-x-auto"
                        >
                          <table className="w-full min-w-[760px] text-left text-sm">
                            <caption id="admin-users-table-caption" className="sr-only">
                              Registered platform users directory
                            </caption>
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                              <tr>
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Email</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Joined</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayedUsers.map((user) => (
                                <tr key={user.id} className="transition hover:bg-slate-50">
                                  <th scope="row" className="px-5 py-4 font-bold text-slate-950">
                                    {user.name}
                                  </th>
                                  <td className="px-5 py-4 text-slate-600">{user.email}</td>
                                  <td className="px-5 py-4">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleClassName(user.role)}`}>
                                      {formatRole(user.role)}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-slate-600">
                                    {dateFormatter.format(new Date(user.createdAt))}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(user.status)}`}>
                                      {user.status === "suspended" ? "Suspended" : user.status === "verified" ? "Verified" : "Pending"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <select
                                        aria-label={`Change role for ${user.name}`}
                                        value={user.role}
                                        disabled={actionLoading}
                                        onChange={(e) => {
                                          const nextRole = e.target.value as AdminUserRole;
                                          if (nextRole !== user.role) {
                                            setPendingAction({
                                              userId: user.id,
                                              userName: user.name,
                                              type: "role_change",
                                              newRole: nextRole,
                                            });
                                          }
                                        }}
                                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                                      >
                                        <option value="jobseeker">Jobseeker</option>
                                        <option value="employer">Employer</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                      {user.status === "suspended" ? (
                                        <button
                                          type="button"
                                          disabled={actionLoading}
                                          onClick={() =>
                                            setPendingAction({
                                              userId: user.id,
                                              userName: user.name,
                                              type: "reactivate",
                                            })
                                          }
                                          className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                        >
                                          Reactivate
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={actionLoading}
                                          onClick={() =>
                                            setPendingAction({
                                              userId: user.id,
                                              userName: user.name,
                                              type: "suspend",
                                            })
                                          }
                                          className="rounded border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                        >
                                          Suspend
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {userDirectory && userDirectory.pagination.lastPage > 1 ? (
                          <nav
                            aria-label="User directory pages"
                            className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5"
                          >
                            <button
                              type="button"
                              disabled={userPageNumber <= 1}
                              onClick={() => {
                                setUserDirectoryLoading(true);
                                setUserPageNumber((current) => Math.max(1, current - 1));
                              }}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                            >
                              Previous
                            </button>
                            <span className="text-xs text-slate-600">
                              Page {userDirectory.pagination.currentPage} of {userDirectory.pagination.lastPage} ({userDirectory.pagination.total} total)
                            </span>
                            <button
                              type="button"
                              disabled={userPageNumber >= userDirectory.pagination.lastPage}
                              onClick={() => {
                                setUserDirectoryLoading(true);
                                setUserPageNumber((current) => current + 1);
                              }}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                            >
                              Next
                            </button>
                          </nav>
                        ) : null}
                      </>
                    );
                  })()}
                </section>
              </div>

              <aside className="grid content-start gap-6">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold">User distribution</h2>
                  <p className="mt-1 text-sm text-slate-500">Employers vs jobseekers</p>
                  {totalDistributedUsers === 0 ? (
                    <p className="py-16 text-center text-sm font-medium text-slate-500">No employer or jobseeker accounts yet.</p>
                  ) : (
                    <>
                      <div className="relative mt-6 h-64">
                        <DistributionChart data={distribution} />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                          <div><p className="text-2xl font-bold">{numberFormatter.format(totalDistributedUsers)}</p><p className="text-sm font-semibold text-slate-500">Users</p></div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3">
                        {distribution.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-semibold text-slate-700"><span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
                            <span className="font-bold">{numberFormatter.format(entry.value)} <span className="font-medium text-slate-500">({Math.round((entry.value / totalDistributedUsers) * 100)}%)</span></span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Recent activity</h2>
                  {dashboard.recentActivity.length === 0 ? (
                    <p className="py-10 text-center text-sm font-medium text-slate-500">No platform activity yet.</p>
                  ) : (
                    <div className="mt-5 space-y-5">
                      {dashboard.recentActivity.map((activity, index) => (
                        <div key={`${activity.type}-${activity.occurredAt}-${index}`} className="flex gap-3">
                          <span className={`mt-1 size-2.5 shrink-0 rounded-full ${activityClassName(activity.type)}`} />
                          <div><p className="text-sm font-semibold text-slate-800">{activity.description}</p><p className="mt-1 text-xs font-medium text-slate-500">{formatRelativeTime(activity.occurredAt, dashboard.generatedAt)}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <p className="px-1 text-xs text-slate-500">Generated {dateFormatter.format(new Date(dashboard.generatedAt))} (UTC)</p>
              </aside>
            </div>
          </div>
        )}
      </section>

      {pendingAction && (
        <ConfirmActionDialog
          isOpen={true}
          tone={pendingAction.type === "suspend" ? "danger" : "primary"}
          title={
            pendingAction.type === "suspend"
              ? `Suspend ${pendingAction.userName}`
              : pendingAction.type === "reactivate"
              ? `Reactivate ${pendingAction.userName}`
              : `Change Role for ${pendingAction.userName}`
          }
          description={
            pendingAction.type === "suspend"
              ? "Are you sure you want to suspend this user? They will be blocked from logging in and accessing their dashboard."
              : pendingAction.type === "reactivate"
              ? "Are you sure you want to reactivate this user? Their account access will be restored immediately."
              : `Are you sure you want to change this user's role to ${formatRole(pendingAction.newRole!)}?`
          }
          confirmLabel={
            actionLoading
              ? "Processing…"
              : pendingAction.type === "suspend"
              ? "Suspend Account"
              : pendingAction.type === "reactivate"
              ? "Reactivate Account"
              : "Confirm Role Change"
          }
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setPendingAction(null);
            setActionError(null);
          }}
        />
      )}
    </main>
  );
}
