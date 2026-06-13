"use client";

import dynamic from "next/dynamic";
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

type StatCard = {
  label: string;
  value: string;
  trend: string;
};

type UserRole = "Admin" | "Employer" | "Jobseeker";
type UserStatus = "Active" | "Pending" | "Suspended";

type UserRow = {
  name: string;
  email: string;
  role: UserRole;
  joined: string;
  status: UserStatus;
};

const stats: StatCard[] = [
  { label: "Total Users", value: "1,240", trend: "+12%" },
  { label: "Total Employers", value: "186", trend: "+5%" },
  { label: "Total Jobseekers", value: "1,054", trend: "+8%" },
  { label: "Jobs Posted", value: "342", trend: "+15%" },
  { label: "Applications Today", value: "48", trend: "+3%" },
  { label: "Hired This Month", value: "24", trend: "+2%" },
];

const userDistribution = [
  { name: "Employers", value: 15, color: "#2563eb" },
  { name: "Jobseekers", value: 85, color: "#10b981" },
];

const growthData = [
  { month: "Dec", newUsers: 120, newJobs: 28, applications: 210 },
  { month: "Jan", newUsers: 145, newJobs: 36, applications: 260 },
  { month: "Feb", newUsers: 168, newJobs: 44, applications: 310 },
  { month: "Mar", newUsers: 190, newJobs: 52, applications: 355 },
  { month: "Apr", newUsers: 225, newJobs: 61, applications: 430 },
  { month: "May", newUsers: 260, newJobs: 74, applications: 510 },
];

const activities = [
  { title: "New employer registered: TechCorp", time: "2m ago" },
  { title: "Job posted: Senior Developer at AIS", time: "5m ago" },
  { title: "Application submitted", time: "8m ago" },
  { title: "New jobseeker: Jane D.", time: "15m ago" },
];

const latestUsers: UserRow[] = [
  {
    name: "Ananda Srisuk",
    email: "ananda.s@jobboard.com",
    role: "Jobseeker",
    joined: "Today",
    status: "Active",
  },
  {
    name: "TechCorp Thailand",
    email: "hr@techcorp.co.th",
    role: "Employer",
    joined: "Today",
    status: "Active",
  },
  {
    name: "Jane Decha",
    email: "jane.d@example.com",
    role: "Jobseeker",
    joined: "15m ago",
    status: "Pending",
  },
  {
    name: "Krit Wong",
    email: "krit.w@example.com",
    role: "Jobseeker",
    joined: "1h ago",
    status: "Active",
  },
  {
    name: "Bright Retail Group",
    email: "people@brightretail.co.th",
    role: "Employer",
    joined: "2h ago",
    status: "Active",
  },
];

function statusClassName(status: UserStatus): string {
  if (status === "Active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "Pending") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
}

function roleClassName(role: UserRole): string {
  if (role === "Employer") {
    return "bg-blue-50 text-blue-700";
  }

  if (role === "Admin") {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function PlatformGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={growthData} margin={{ top: 10, right: 18, bottom: 0, left: -12 }}>
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
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgb(15 23 42 / 0.08)",
          }}
        />
        <Area type="monotone" dataKey="applications" stroke="#f97316" strokeWidth={3} fill="url(#applicationsGradient)" name="Applications" />
        <Area type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={3} fill="url(#usersGradient)" name="New Users" />
        <Area type="monotone" dataKey="newJobs" stroke="#2563eb" strokeWidth={3} fill="url(#jobsGradient)" name="New Jobs" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function UserDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={userDistribution} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={3} stroke="none">
          {userDistribution.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgb(15 23 42 / 0.08)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const GrowthChart = dynamic(() => Promise.resolve(PlatformGrowthChart), {
  ssr: false,
});

const DistributionChart = dynamic(() => Promise.resolve(UserDistributionChart), {
  ssr: false,
});

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-slate-950 px-5 py-7 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Admin Analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold">Platform dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor users, employers, jobs, applications, and hiring movement
              across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              Review Reports
            </button>
            <button className="rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400">
              Export Data
            </button>
          </div>
        </div>
      </header>

      <section className="px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  {stat.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl font-bold text-slate-950">
                    {stat.value}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    >
                      <path d="m5 12 5-5 4 4 5-6" />
                      <path d="M19 5v6h-6" />
                    </svg>
                    {stat.trend}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Platform growth
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Last 6 months</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <span className="text-emerald-700">New Users</span>
                    <span className="text-blue-700">New Jobs</span>
                    <span className="text-orange-600">Applications</span>
                  </div>
                </div>

                <div className="mt-6 h-80">
                  <GrowthChart />
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-bold text-slate-950">
                    Latest registered users
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Newest accounts across all roles.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Joined</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {latestUsers.map((user) => (
                        <tr key={user.email} className="transition hover:bg-slate-50">
                          <td className="px-5 py-4 font-bold text-slate-950">
                            {user.name}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {user.email}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleClassName(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {user.joined}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="grid gap-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    User distribution
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Employers vs jobseekers
                  </p>
                </div>

                <div className="relative mt-6 h-64">
                  <DistributionChart />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-950">1,240</p>
                      <p className="text-sm font-semibold text-slate-500">
                        Users
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  {userDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-bold text-slate-950">
                        {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">
                  Recent activity
                </h2>
                <div className="mt-5 space-y-4">
                  {activities.map((activity) => (
                    <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
                      <span className="mt-1 size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(209_250_229)]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
