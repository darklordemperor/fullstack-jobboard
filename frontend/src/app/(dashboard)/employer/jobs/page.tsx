"use client";

import dynamic from "next/dynamic";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type JobStatus = "Active" | "Closed" | "Draft";

type StatCard = {
  label: string;
  value: string;
  icon: "briefcase" | "users" | "check" | "clock";
};

type JobRow = {
  id: number;
  title: string;
  applications: number;
  status: JobStatus;
  posted: string;
};

const stats: StatCard[] = [
  { label: "Total Jobs Posted", value: "12", icon: "briefcase" },
  { label: "Total Applications", value: "48", icon: "users" },
  { label: "Hired This Month", value: "3", icon: "check" },
  { label: "Active Listings", value: "8", icon: "clock" },
];

const applicationData = [
  { day: "May 21", applications: 4 },
  { day: "May 22", applications: 6 },
  { day: "May 23", applications: 3 },
  { day: "May 24", applications: 8 },
  { day: "May 25", applications: 7 },
  { day: "May 26", applications: 9 },
  { day: "May 27", applications: 5 },
  { day: "May 28", applications: 11 },
  { day: "May 29", applications: 10 },
  { day: "May 30", applications: 6 },
  { day: "May 31", applications: 12 },
  { day: "Jun 1", applications: 14 },
  { day: "Jun 2", applications: 9 },
  { day: "Jun 3", applications: 13 },
  { day: "Jun 4", applications: 7 },
  { day: "Jun 5", applications: 5 },
  { day: "Jun 6", applications: 8 },
  { day: "Jun 7", applications: 10 },
  { day: "Jun 8", applications: 15 },
  { day: "Jun 9", applications: 12 },
  { day: "Jun 10", applications: 9 },
  { day: "Jun 11", applications: 11 },
  { day: "Jun 12", applications: 6 },
  { day: "Jun 13", applications: 8 },
  { day: "Jun 14", applications: 4 },
  { day: "Jun 15", applications: 7 },
  { day: "Jun 16", applications: 13 },
  { day: "Jun 17", applications: 10 },
  { day: "Jun 18", applications: 12 },
  { day: "Jun 19", applications: 15 },
];

const jobRows: JobRow[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    applications: 14,
    status: "Active",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Product Marketing Manager",
    applications: 9,
    status: "Active",
    posted: "4 days ago",
  },
  {
    id: 3,
    title: "Finance Operations Analyst",
    applications: 7,
    status: "Draft",
    posted: "Scheduled",
  },
  {
    id: 4,
    title: "UX/UI Designer",
    applications: 11,
    status: "Active",
    posted: "1 week ago",
  },
  {
    id: 5,
    title: "Customer Success Lead",
    applications: 5,
    status: "Closed",
    posted: "3 weeks ago",
  },
  {
    id: 6,
    title: "Backend Engineer, Payments",
    applications: 2,
    status: "Active",
    posted: "Today",
  },
];

function DashboardIcon({ icon }: { icon: StatCard["icon"] }) {
  const commonProps = {
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (icon === "briefcase") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (icon === "users") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (icon === "check") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function statusClassName(status: JobStatus): string {
  if (status === "Active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "Draft") {
    return "bg-yellow-50 text-yellow-700 ring-yellow-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function ApplicationsLineChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={applicationData} margin={{ top: 10, right: 18, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} interval={5} />
        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "#10b981", strokeWidth: 1 }}
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgb(15 23 42 / 0.08)",
          }}
        />
        <Line
          type="monotone"
          dataKey="applications"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#047857", stroke: "#d1fae5", strokeWidth: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const ApplicationsChart = dynamic(() => Promise.resolve(ApplicationsLineChart), {
  ssr: false,
});

export default function EmployerJobsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-slate-950 px-6 py-7 text-white">
          <div className="border-b border-white/10 pb-6">
            <p className="text-sm font-semibold text-emerald-300">
              Employer Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold">Jobs Dashboard</h1>
          </div>

          <nav className="mt-6 space-y-2 text-sm font-medium text-slate-300">
            <a className="block rounded-md bg-emerald-500 px-3 py-2.5 text-white" href="#">
              Job listings
            </a>
            <a className="block rounded-md px-3 py-2.5 transition hover:bg-white/10 hover:text-white" href="#">
              Applicants
            </a>
            <a className="block rounded-md px-3 py-2.5 transition hover:bg-white/10 hover:text-white" href="#">
              Interviews
            </a>
            <a className="block rounded-md px-3 py-2.5 transition hover:bg-white/10 hover:text-white" href="#">
              Reports
            </a>
          </nav>

          <section className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick Actions
            </p>
            <div className="mt-4 space-y-3">
              <button className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400">
                Post New Job
              </button>
              <button className="w-full rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                View All Applicants
              </button>
              <button className="w-full rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                Download Report
              </button>
            </div>
          </section>
        </aside>

        <section className="px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Recruitment overview
                </p>
                <h2 className="mt-1 text-3xl font-bold text-slate-950">
                  Manage job posts
                </h2>
              </div>
              <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
                Export dashboard
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-slate-950">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                      <DashboardIcon icon={stat.icon} />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Applications per day
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">Last 30 days</p>
                </div>
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  +18% vs previous period
                </span>
              </div>
              <div className="mt-6 h-72">
                <ApplicationsChart />
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    Job listings
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Track openings, applicants, and publishing status.
                  </p>
                </div>
                <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
                  Filter listings
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Job Title</th>
                      <th className="px-5 py-3">Applications</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Posted</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobRows.map((job) => (
                      <tr key={job.id} className="transition hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-950">{job.title}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {job.applications}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {job.posted}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                              View Applicants
                            </button>
                            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300">
                              Edit
                            </button>
                            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:text-red-600">
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
