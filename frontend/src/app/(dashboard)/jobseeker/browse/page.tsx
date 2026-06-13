"use client";

import { useMemo, useState } from "react";

type JobType = "Full-time" | "Part-time" | "Contract" | "Remote";

type JobListing = {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: JobType;
  category: string;
  salaryMin: number;
  salaryMax: number;
  postedDaysAgo: number;
  accent: string;
};

const locations = [
  "All locations",
  "Bangkok",
  "Chiang Mai",
  "Remote",
  "Nonthaburi",
  "Pathum Thani",
];
const jobTypes: JobType[] = ["Full-time", "Part-time", "Contract", "Remote"];
const categories = [
  "All categories",
  "IT",
  "Marketing",
  "Finance",
  "Design",
  "Operations",
];

const jobs: JobListing[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "LINE Thailand",
    location: "Bangkok",
    jobType: "Full-time",
    category: "IT",
    salaryMin: 90000,
    salaryMax: 150000,
    postedDaysAgo: 1,
    accent: "bg-emerald-500",
  },
  {
    id: 2,
    title: "Product Marketing Manager",
    company: "Grab Thailand",
    location: "Bangkok",
    jobType: "Full-time",
    category: "Marketing",
    salaryMin: 75000,
    salaryMax: 120000,
    postedDaysAgo: 2,
    accent: "bg-green-600",
  },
  {
    id: 3,
    title: "Cloud Solutions Architect",
    company: "TechCorp Thailand",
    location: "Remote",
    jobType: "Remote",
    category: "IT",
    salaryMin: 130000,
    salaryMax: 200000,
    postedDaysAgo: 3,
    accent: "bg-cyan-600",
  },
  {
    id: 4,
    title: "Corporate Finance Analyst",
    company: "SCB",
    location: "Bangkok",
    jobType: "Full-time",
    category: "Finance",
    salaryMin: 55000,
    salaryMax: 85000,
    postedDaysAgo: 4,
    accent: "bg-violet-600",
  },
  {
    id: 5,
    title: "UX/UI Designer",
    company: "AIS",
    location: "Bangkok",
    jobType: "Contract",
    category: "Design",
    salaryMin: 60000,
    salaryMax: 100000,
    postedDaysAgo: 5,
    accent: "bg-amber-500",
  },
  {
    id: 6,
    title: "Performance Marketing Specialist",
    company: "Shopee Thailand",
    location: "Bangkok",
    jobType: "Full-time",
    category: "Marketing",
    salaryMin: 45000,
    salaryMax: 75000,
    postedDaysAgo: 6,
    accent: "bg-orange-500",
  },
  {
    id: 7,
    title: "Backend Engineer, Payments",
    company: "Ascend Money",
    location: "Remote",
    jobType: "Remote",
    category: "IT",
    salaryMin: 85000,
    salaryMax: 145000,
    postedDaysAgo: 7,
    accent: "bg-sky-600",
  },
  {
    id: 8,
    title: "Financial Planning Manager",
    company: "Kasikorn Business Technology Group",
    location: "Pathum Thani",
    jobType: "Full-time",
    category: "Finance",
    salaryMin: 95000,
    salaryMax: 160000,
    postedDaysAgo: 8,
    accent: "bg-lime-600",
  },
  {
    id: 9,
    title: "Digital Campaign Coordinator",
    company: "Central Retail",
    location: "Chiang Mai",
    jobType: "Part-time",
    category: "Marketing",
    salaryMin: 25000,
    salaryMax: 42000,
    postedDaysAgo: 9,
    accent: "bg-rose-500",
  },
  {
    id: 10,
    title: "IT Operations Lead",
    company: "True Digital Group",
    location: "Nonthaburi",
    jobType: "Full-time",
    category: "Operations",
    salaryMin: 70000,
    salaryMax: 115000,
    postedDaysAgo: 10,
    accent: "bg-red-600",
  },
];

function formatSalary(amount: number): string {
  return `\u0e3f${amount.toLocaleString("en-US")}`;
}

function getInitials(company: string): string {
  return company
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function BrowseJobsPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All locations");
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobType[]>([]);
  const [salaryCap, setSalaryCap] = useState(200000);
  const [category, setCategory] = useState("All categories");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]);

  const filteredJobs = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        job.title.toLowerCase().includes(normalizedKeyword) ||
        job.company.toLowerCase().includes(normalizedKeyword) ||
        job.category.toLowerCase().includes(normalizedKeyword);

      const matchesLocation =
        location === "All locations" || job.location === location;
      const matchesJobType =
        selectedJobTypes.length === 0 || selectedJobTypes.includes(job.jobType);
      const matchesSalary = job.salaryMin <= salaryCap;
      const matchesCategory =
        category === "All categories" || job.category === category;

      return (
        matchesKeyword &&
        matchesLocation &&
        matchesJobType &&
        matchesSalary &&
        matchesCategory
      );
    });
  }, [category, keyword, location, salaryCap, selectedJobTypes]);

  const toggleJobType = (jobType: JobType): void => {
    setSelectedJobTypes((currentTypes) =>
      currentTypes.includes(jobType)
        ? currentTypes.filter((currentType) => currentType !== jobType)
        : [...currentTypes, jobType],
    );
  };

  const toggleBookmark = (jobId: number): void => {
    setBookmarkedJobs((currentBookmarks) =>
      currentBookmarks.includes(jobId)
        ? currentBookmarks.filter((currentJobId) => currentJobId !== jobId)
        : [...currentBookmarks, jobId],
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
            <div>
              <span className="text-xl font-bold text-slate-950">1,240</span>{" "}
              jobs available
            </div>
            <div>
              <span className="text-xl font-bold text-emerald-600">
                Updated
              </span>{" "}
              today
            </div>
            <div>
              <span className="text-xl font-bold text-slate-950">12</span> new
              this week
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-950">Browse Jobs</h1>
              <p className="mt-1 text-sm text-slate-500">
                Find roles from leading Thai employers.
              </p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Search
                </span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, keyword, company"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="search"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Location
                </span>
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {locations.map((locationOption) => (
                    <option key={locationOption}>{locationOption}</option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-800">
                  Job type
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {jobTypes.map((jobType) => (
                    <label
                      key={jobType}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        checked={selectedJobTypes.includes(jobType)}
                        onChange={() => toggleJobType(jobType)}
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {jobType}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Salary range
                </span>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>{formatSalary(15000)}</span>
                  <span>
                    {salaryCap >= 200000
                      ? "\u0e3f200,000+"
                      : formatSalary(salaryCap)}
                  </span>
                </div>
                <input
                  value={salaryCap}
                  onChange={(event) => setSalaryCap(Number(event.target.value))}
                  min={15000}
                  max={200000}
                  step={5000}
                  type="range"
                  className="mt-3 w-full accent-emerald-600"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {categories.map((categoryOption) => (
                    <option key={categoryOption}>{categoryOption}</option>
                  ))}
                </select>
              </label>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Recommended roles
                </p>
                <h2 className="text-2xl font-bold text-slate-950">
                  {filteredJobs.length} matching jobs
                </h2>
              </div>
              <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-44">
                <option>Most relevant</option>
                <option>Newest first</option>
                <option>Highest salary</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isBookmarked = bookmarkedJobs.includes(job.id);

                return (
                  <article
                    key={job.id}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div
                        className={`${job.accent} flex size-14 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white`}
                      >
                        {getInitials(job.company)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-slate-950">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-600">
                              {job.company}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(job.id)}
                            aria-label={
                              isBookmarked ? "Remove bookmark" : "Save job"
                            }
                            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className={`size-5 ${isBookmarked ? "fill-emerald-600 stroke-emerald-600" : "fill-none stroke-current"}`}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {job.location}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {job.jobType}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {job.category}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-bold text-slate-950">
                              {formatSalary(job.salaryMin)} -{" "}
                              {formatSalary(job.salaryMax)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Posted {job.postedDaysAgo} days ago
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                  <h3 className="text-lg font-bold text-slate-950">
                    No jobs match these filters
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try a broader keyword, location, or salary range.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
